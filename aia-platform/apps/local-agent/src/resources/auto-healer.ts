import { existsSync, readdirSync, statSync, unlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { loadResourceConfig, type ResourceSnapshot, type ResourceLevel } from './config.js';
import { forceGC, getDirSizeMB } from './monitor.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HealingAction =
  | 'gc_triggered'
  | 'cache_pruned'
  | 'logs_compressed'
  | 'logs_purged'
  | 'temp_cleaned'
  | 'model_downgraded'
  | 'jobs_paused'
  | 'emergency_purge';

export interface HealingResult {
  action: HealingAction;
  success: boolean;
  detail: string;
  freedMB?: number;
  timestamp: number;
}

export interface HealingReport {
  trigger: ResourceLevel;
  resource: 'memory' | 'disk' | 'tokens';
  actions: HealingResult[];
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

let modelDowngradeActive = false;
let llmBlocked = false;
const healingHistory: HealingReport[] = [];
const MAX_HISTORY = 20;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_DIR        = join(homedir(), '.108ai');
const CACHE_DIR       = join(BASE_DIR, 'cache');
const LOGS_DIR        = join(BASE_DIR, 'logs');
const TEMP_DIR        = join(BASE_DIR, 'temp');

const MS_1H           = 1 * 60 * 60 * 1000;
const MS_24H          = 24 * 60 * 60 * 1000;
const MS_48H          = 48 * 60 * 60 * 1000;
const MS_3DAYS        = 3 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Elimina i file in `dir` più vecchi di `maxAgeMs` millisecondi.
 * Ogni file viene rimosso individualmente con try-catch per non bloccare
 * l'operazione se un file è protetto o in uso.
 */
function pruneOldFiles(dir: string, maxAgeMs: number): { count: number; freedMB: number } {
  if (!existsSync(dir)) return { count: 0, freedMB: 0 };

  const now = Date.now();
  let count = 0;
  let freedBytes = 0;

  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return { count: 0, freedMB: 0 };
  }

  for (const name of entries) {
    const filePath = join(dir, name);
    try {
      const st = statSync(filePath);
      if (st.isFile() && now - st.mtimeMs > maxAgeMs) {
        freedBytes += st.size;
        unlinkSync(filePath);
        count++;
      }
    } catch {
      // file in uso o già rimosso — continua
    }
  }

  return { count, freedMB: parseFloat((freedBytes / 1024 / 1024).toFixed(2)) };
}

/**
 * Svuota completamente la directory temporanea `~/.108ai/temp/`.
 * Usa rmSync con `force: true` su ogni entry per gestire anche le sottodirectory.
 */
function cleanTempDir(): { count: number; freedMB: number } {
  if (!existsSync(TEMP_DIR)) return { count: 0, freedMB: 0 };

  let entries: string[] = [];
  try {
    entries = readdirSync(TEMP_DIR);
  } catch {
    return { count: 0, freedMB: 0 };
  }

  let count = 0;
  let freedBytes = 0;

  for (const name of entries) {
    const entryPath = join(TEMP_DIR, name);
    try {
      const st = statSync(entryPath);
      freedBytes += st.isFile() ? st.size : getDirSizeMB(entryPath) * 1024 * 1024;
      rmSync(entryPath, { recursive: true, force: true });
      count++;
    } catch {
      // ignora — la directory potrebbe essere in uso
    }
  }

  return { count, freedMB: parseFloat((freedBytes / 1024 / 1024).toFixed(2)) };
}

/**
 * Registra un HealingReport nella cronologia circolare (max MAX_HISTORY).
 */
function pushHistory(report: HealingReport): void {
  healingHistory.push(report);
  if (healingHistory.length > MAX_HISTORY) {
    healingHistory.splice(0, healingHistory.length - MAX_HISTORY);
  }
}

// ---------------------------------------------------------------------------
// healMemory
// ---------------------------------------------------------------------------

/**
 * Esegue azioni di auto-guarigione per la pressione sulla memoria.
 *
 * - warning   → forza GC
 * - critical  → forza GC + elimina cache > 48h
 * - emergency → forza GC + elimina tutta la cache + segnala abort job
 */
export async function healMemory(snapshot: ResourceSnapshot): Promise<HealingReport> {
  const actions: HealingResult[] = [];
  const level = snapshot.memory.level;

  // --- GC (sempre, da warning in su) ---
  try {
    forceGC();
    actions.push({
      action: 'gc_triggered',
      success: true,
      detail: 'Garbage collection forzata con successo.',
      timestamp: Date.now(),
    });
  } catch (err) {
    actions.push({
      action: 'gc_triggered',
      success: false,
      detail: `Impossibile forzare GC: ${String(err)}`,
      timestamp: Date.now(),
    });
  }

  if (level === 'critical' || level === 'emergency') {
    // Elimina cache > 48h (critical) o tutta la cache (emergency)
    const maxAge = level === 'emergency' ? 0 : MS_48H;
    const label  = level === 'emergency' ? 'tutta la cache' : 'cache > 48h';
    try {
      const { count, freedMB } = pruneOldFiles(CACHE_DIR, maxAge);
      actions.push({
        action: 'cache_pruned',
        success: true,
        detail: `Eliminati ${count} file dalla ${label}.`,
        freedMB,
        timestamp: Date.now(),
      });
    } catch (err) {
      actions.push({
        action: 'cache_pruned',
        success: false,
        detail: `Errore durante la pulizia della cache: ${String(err)}`,
        timestamp: Date.now(),
      });
    }
  }

  if (level === 'emergency') {
    // Segnala agli scheduler di mettere in pausa i job
    actions.push({
      action: 'jobs_paused',
      success: true,
      detail: 'Emergenza memoria: i job attivi devono essere interrotti al prossimo checkpoint.',
      timestamp: Date.now(),
    });
  }

  const report: HealingReport = {
    trigger: level,
    resource: 'memory',
    actions,
    timestamp: Date.now(),
  };

  pushHistory(report);
  return report;
}

// ---------------------------------------------------------------------------
// healDisk
// ---------------------------------------------------------------------------

/**
 * Esegue azioni di auto-guarigione per la pressione sul disco.
 *
 * - warning   → elimina file cache > 24h
 * - critical  → elimina file cache > 24h + log > 3 giorni + temp
 * - emergency → elimina cache tranne < 1h + tutti i log tranne oggi + temp
 */
export async function healDisk(snapshot: ResourceSnapshot): Promise<HealingReport> {
  const actions: HealingResult[] = [];
  const level = snapshot.disk.level;

  // --- Cache ---
  try {
    const maxAge = level === 'emergency' ? MS_1H : MS_24H;
    // In emergency, vogliamo eliminare tutto TRANNE i file < 1h: eliminiamo > 1h
    const { count, freedMB } = pruneOldFiles(CACHE_DIR, maxAge);
    const label =
      level === 'emergency'
        ? 'cache più vecchia di 1 ora'
        : 'cache più vecchia di 24 ore';
    actions.push({
      action: 'cache_pruned',
      success: true,
      detail: `Eliminati ${count} file dalla ${label}.`,
      freedMB,
      timestamp: Date.now(),
    });
  } catch (err) {
    actions.push({
      action: 'cache_pruned',
      success: false,
      detail: `Errore pulizia cache: ${String(err)}`,
      timestamp: Date.now(),
    });
  }

  if (level === 'critical' || level === 'emergency') {
    // --- Log ---
    try {
      const maxLogAge = level === 'emergency'
        ? getDayStartMs()   // elimina tutto tranne i log di oggi
        : MS_3DAYS;
      const logsSizeBefore = existsSync(LOGS_DIR) ? getDirSizeMB(LOGS_DIR) : 0;
      const { count } = pruneOldFiles(LOGS_DIR, maxLogAge);
      const logsFreedMB = parseFloat(
        Math.max(0, logsSizeBefore - (existsSync(LOGS_DIR) ? getDirSizeMB(LOGS_DIR) : 0)).toFixed(2),
      );
      actions.push({
        action: level === 'emergency' ? 'logs_purged' : 'logs_purged',
        success: true,
        detail:
          level === 'emergency'
            ? `Eliminati ${count} file di log (mantenuti solo i log di oggi).`
            : `Eliminati ${count} file di log più vecchi di 3 giorni.`,
        freedMB: logsFreedMB,
        timestamp: Date.now(),
      });
    } catch (err) {
      actions.push({
        action: 'logs_purged',
        success: false,
        detail: `Errore pulizia log: ${String(err)}`,
        timestamp: Date.now(),
      });
    }

    // --- Temp ---
    try {
      const { count, freedMB } = cleanTempDir();
      actions.push({
        action: 'temp_cleaned',
        success: true,
        detail: `Pulizia temp completata: ${count} elementi rimossi.`,
        freedMB,
        timestamp: Date.now(),
      });
    } catch (err) {
      actions.push({
        action: 'temp_cleaned',
        success: false,
        detail: `Errore pulizia temp: ${String(err)}`,
        timestamp: Date.now(),
      });
    }
  }

  if (level === 'emergency') {
    actions.push({
      action: 'emergency_purge',
      success: true,
      detail: 'Pulizia di emergenza disco completata. Verificare manualmente i file critici.',
      timestamp: Date.now(),
    });
  }

  const report: HealingReport = {
    trigger: level,
    resource: 'disk',
    actions,
    timestamp: Date.now(),
  };

  pushHistory(report);
  return report;
}

/**
 * Restituisce i millisecondi trascorsi dall'inizio della giornata corrente (mezzanotte locale).
 * Usato per "tieni solo i log di oggi" = age > elapsedSinceMidnight.
 */
function getDayStartMs(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return Date.now() - midnight.getTime();
}

// ---------------------------------------------------------------------------
// healTokens
// ---------------------------------------------------------------------------

/**
 * Gestisce la pressione sui token LLM.
 *
 * - warning   → suggerimento nei log (nessuna azione automatica)
 * - critical  → attiva il flag modelDowngradeActive (solo modelli fast-cheap)
 * - emergency → attiva il flag llmBlocked (nessuna chiamata LLM consentita)
 */
export async function healTokens(snapshot: ResourceSnapshot): Promise<HealingReport> {
  const actions: HealingResult[] = [];
  const level = snapshot.tokens.level;

  if (level === 'warning') {
    actions.push({
      action: 'model_downgraded',
      success: true,
      detail:
        'Consumo token vicino alla soglia di attenzione. Valutare la riduzione del numero di chiamate LLM o il passaggio a modelli più economici.',
      timestamp: Date.now(),
    });
  }

  if (level === 'critical') {
    modelDowngradeActive = true;
    actions.push({
      action: 'model_downgraded',
      success: true,
      detail:
        'Soglia critica token raggiunta. Attivato downgrade automatico: solo il modello fast-cheap è ora consentito.',
      timestamp: Date.now(),
    });
  }

  if (level === 'emergency') {
    llmBlocked = true;
    actions.push({
      action: 'jobs_paused',
      success: true,
      detail:
        'Emergenza token: tutte le chiamate LLM sono bloccate fino a reset manuale o reset del periodo di billing.',
      timestamp: Date.now(),
    });
  }

  const report: HealingReport = {
    trigger: level,
    resource: 'tokens',
    actions,
    timestamp: Date.now(),
  };

  pushHistory(report);
  return report;
}

// ---------------------------------------------------------------------------
// runAutoHealing
// ---------------------------------------------------------------------------

/**
 * Punto di ingresso principale dell'auto-healer.
 * Controlla se l'auto-healing è abilitato in configurazione, poi esegue
 * le azioni di guarigione per ogni risorsa che supera il livello 'warning'.
 */
export async function runAutoHealing(snapshot: ResourceSnapshot): Promise<HealingReport[]> {
  const config = loadResourceConfig();

  if (!config.autoHealEnabled) {
    return [];
  }

  const reports: HealingReport[] = [];
  const relevantLevels: ResourceLevel[] = ['warning', 'critical', 'emergency'];

  if (relevantLevels.includes(snapshot.memory.level)) {
    reports.push(await healMemory(snapshot));
  }

  if (relevantLevels.includes(snapshot.disk.level)) {
    reports.push(await healDisk(snapshot));
  }

  if (relevantLevels.includes(snapshot.tokens.level)) {
    reports.push(await healTokens(snapshot));
  }

  return reports;
}

// ---------------------------------------------------------------------------
// Flag accessors
// ---------------------------------------------------------------------------

/** Restituisce true se il downgrade automatico del modello è attivo. */
export function isModelDowngraded(): boolean {
  return modelDowngradeActive;
}

/** Restituisce true se le chiamate LLM sono bloccate per emergenza token. */
export function isLLMBlocked(): boolean {
  return llmBlocked;
}

/** Ripristina manualmente il flag di downgrade modello. */
export function resetModelDowngrade(): void {
  modelDowngradeActive = false;
}

/** Ripristina manualmente il blocco LLM. */
export function resetLLMBlock(): void {
  llmBlocked = false;
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/** Restituisce gli ultimi MAX_HISTORY report di auto-healing. */
export function getHealingHistory(): HealingReport[] {
  return [...healingHistory];
}
