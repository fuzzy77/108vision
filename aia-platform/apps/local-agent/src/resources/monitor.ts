/**
 * Resource Monitor — Monitora RAM, disco e budget token dell'agente 108 AI.
 *
 * Emette callback quando i livelli di allerta cambiano.
 * Tutti i messaggi utente sono in italiano.
 */

import { readdirSync, statSync, statfsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import {
  loadResourceConfig,
  getTodayUsage,
  getMonthUsage,
  resetDailyIfNeeded,
  getLevel,
  type ResourceConfig,
  type ResourceSnapshot,
  type ResourceLevel,
} from './config.js';

// ---------------------------------------------------------------------------
// Stato modulo
// ---------------------------------------------------------------------------

let monitorInterval: ReturnType<typeof setInterval> | null = null;
let lastSnapshot: ResourceSnapshot | null = null;
let previousLevel: ResourceLevel | null = null;

// ---------------------------------------------------------------------------
// Helper: dimensione directory (MB)
// ---------------------------------------------------------------------------

/**
 * Somma ricorsivamente le dimensioni dei file in una directory.
 * Restituisce 0 se la directory non esiste o non è accessibile.
 */
export function getDirSizeMB(dirPath: string): number {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    let totalBytes = 0;

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          totalBytes += getDirSizeMB(fullPath) * 1024 * 1024;
        } else if (entry.isFile()) {
          const st = statSync(fullPath);
          totalBytes += st.size;
        }
      } catch {
        // Ignora file non accessibili
      }
    }

    return totalBytes / 1024 / 1024;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Snapshot RAM
// ---------------------------------------------------------------------------

/**
 * Acquisisce lo snapshot della memoria heap del processo.
 */
export function getMemorySnapshot(config: ResourceConfig): ResourceSnapshot['memory'] {
  const mem = process.memoryUsage();
  const usedMB = mem.heapUsed / 1024 / 1024;
  const totalMB = config.memory.maxHeapMB;
  const percent = (usedMB / totalMB) * 100;
  const level = getLevel(percent, config.memory);

  return { usedMB, totalMB, percent, level };
}

// ---------------------------------------------------------------------------
// Snapshot disco
// ---------------------------------------------------------------------------

/**
 * Acquisisce lo snapshot del disco sul percorso ~/.108ai.
 *
 * Nota: `statfsSync` è disponibile da Node.js 18.15+.
 * Su Windows versioni precedenti il fallback restituisce 999 GB liberi
 * per non bloccare il monitor.
 */
export function getDiskSnapshot(config: ResourceConfig): ResourceSnapshot['disk'] {
  const baseDir = join(homedir(), '.108ai');

  let usedMB = 0;
  let totalMB = 999 * 1024; // fallback: 999 GB

  try {
    const fs = statfsSync(baseDir);
    const blockSize = fs.bsize;
    const totalBlocks = fs.blocks;
    const freeBlocks = fs.bavail;

    totalMB = (blockSize * totalBlocks) / 1024 / 1024;
    const freeMB = (blockSize * freeBlocks) / 1024 / 1024;
    usedMB = totalMB - freeMB;
  } catch {
    // statfsSync non disponibile (Windows < 18.15) — usa placeholder
    usedMB = 0;
    totalMB = 999 * 1024;
  }

  const percent = totalMB > 0 ? (usedMB / totalMB) * 100 : 0;
  const level = getLevel(percent, config.disk);

  const cacheMB = getDirSizeMB(join(baseDir, 'cache'));
  const logsMB = getDirSizeMB(join(baseDir, 'logs'));

  return { usedMB, totalMB, percent, cacheMB, logsMB, level };
}

// ---------------------------------------------------------------------------
// Snapshot token
// ---------------------------------------------------------------------------

/**
 * Acquisisce lo snapshot del budget token (giornaliero e mensile).
 */
export function getTokenSnapshot(config: ResourceConfig): ResourceSnapshot['tokens'] {
  resetDailyIfNeeded();

  const todayUsed = getTodayUsage();
  const todayBudget = config.tokens.dailyBudget;
  const todayPercent = todayBudget > 0 ? (todayUsed / todayBudget) * 100 : 0;

  const monthUsed = getMonthUsage();
  const monthBudget = config.tokens.monthlyBudget;
  const monthPercent = monthBudget > 0 ? (monthUsed / monthBudget) * 100 : 0;

  const tokensLevel = (percent: number): ResourceLevel => {
    if (percent >= config.tokens.hardStopPercent) return 'emergency';
    if (percent >= config.tokens.criticalPercent) return 'critical';
    if (percent >= config.tokens.warningPercent) return 'warning';
    return 'normal';
  };

  const dailyLevel = tokensLevel(todayPercent);
  const monthlyLevel = tokensLevel(monthPercent);

  const levelOrder: ResourceLevel[] = ['normal', 'warning', 'critical', 'emergency'];
  const level =
    levelOrder.indexOf(monthlyLevel) >= levelOrder.indexOf(dailyLevel)
      ? monthlyLevel
      : dailyLevel;

  return {
    todayUsed,
    todayBudget,
    todayPercent,
    monthUsed,
    monthBudget,
    monthPercent,
    level,
  };
}

// ---------------------------------------------------------------------------
// Snapshot completo
// ---------------------------------------------------------------------------

/**
 * Compone uno snapshot completo di tutte le risorse monitorate.
 * Il livello complessivo è il peggiore tra i tre sottosistemi.
 */
export function takeSnapshot(): ResourceSnapshot {
  const config = loadResourceConfig();

  const memory = getMemorySnapshot(config);
  const disk = getDiskSnapshot(config);
  const tokens = getTokenSnapshot(config);

  const levelOrder: ResourceLevel[] = ['normal', 'warning', 'critical', 'emergency'];
  const worstIndex = Math.max(
    levelOrder.indexOf(memory.level),
    levelOrder.indexOf(disk.level),
    levelOrder.indexOf(tokens.level),
  );
  const overall = levelOrder[worstIndex] ?? 'normal';

  const snapshot: ResourceSnapshot = {
    timestamp: Date.now(),
    overall,
    memory,
    disk,
    tokens,
  };

  lastSnapshot = snapshot;
  return snapshot;
}

// ---------------------------------------------------------------------------
// Monitor loop
// ---------------------------------------------------------------------------

/**
 * Avvia il monitor delle risorse.
 *
 * Ad ogni intervallo acquisisce uno snapshot e invoca `onAlert` se il livello
 * complessivo è cambiato rispetto all'intervallo precedente.
 *
 * @param onAlert - Callback opzionale: riceve lo snapshot e un flag `changed`
 *                  che indica se il livello è variato dall'ultima rilevazione.
 */
export function startResourceMonitor(
  onAlert?: (snapshot: ResourceSnapshot, changed: boolean) => void,
): void {
  if (monitorInterval !== null) {
    // Monitor già in esecuzione — non avviare un secondo loop
    return;
  }

  const config = loadResourceConfig();

  // Prima acquisizione immediata
  const initial = takeSnapshot();
  previousLevel = initial.overall;
  onAlert?.(initial, false);

  monitorInterval = setInterval(() => {
    const snapshot = takeSnapshot();
    const changed = snapshot.overall !== previousLevel;

    if (changed || onAlert) {
      onAlert?.(snapshot, changed);
    }

    previousLevel = snapshot.overall;
  }, config.monitorIntervalMs);
}

/**
 * Ferma il monitor delle risorse e libera l'intervallo.
 */
export function stopResourceMonitor(): void {
  if (monitorInterval !== null) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

// ---------------------------------------------------------------------------
// Accessori
// ---------------------------------------------------------------------------

/**
 * Restituisce l'ultimo snapshot acquisito, o null se il monitor non è mai
 * stato avviato né è stato chiamato `takeSnapshot()`.
 */
export function getLastSnapshot(): ResourceSnapshot | null {
  return lastSnapshot;
}

/**
 * Forza il Garbage Collector di Node.js (se avviato con --expose-gc).
 * Restituisce i MB liberati; 0 se GC non è disponibile.
 */
export function forceGC(): { freedMB: number } {
  if (typeof global.gc !== 'function') {
    return { freedMB: 0 };
  }

  const before = process.memoryUsage().heapUsed;
  global.gc();
  const after = process.memoryUsage().heapUsed;

  const freedMB = Math.max(0, (before - after) / 1024 / 1024);
  return { freedMB };
}

/**
 * Restituisce lo stato corrente del monitor.
 */
export function getMonitorStatus(): {
  running: boolean;
  intervalMs: number;
  lastCheck: number | null;
  currentLevel: ResourceLevel | null;
} {
  const config = loadResourceConfig();

  return {
    running: monitorInterval !== null,
    intervalMs: config.monitorIntervalMs,
    lastCheck: lastSnapshot?.timestamp ?? null,
    currentLevel: lastSnapshot?.overall ?? null,
  };
}
