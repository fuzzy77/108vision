/**
 * Resource Management — Config & Token Tracking
 *
 * Gestisce la configurazione delle soglie di risorse (memoria, disco, token)
 * e il tracciamento del consumo token nel tempo.
 *
 * File di configurazione: ~/.108ai/resources.json
 * File utilizzo token: ~/.108ai/token-usage.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------------

export type ResourceLevel = 'normal' | 'warning' | 'critical' | 'emergency';

export interface MemoryThresholds {
  /** Percentuale di RAM usata oltre cui scatta warning. Default: 60 */
  warningPercent: number;
  /** Percentuale di RAM usata oltre cui scatta critical. Default: 80 */
  criticalPercent: number;
  /** Percentuale di RAM usata oltre cui scatta emergency. Default: 90 */
  emergencyPercent: number;
  /** Limite heap Node.js in MB. Default: 4096 */
  maxHeapMB: number;
}

export interface DiskThresholds {
  /** Percentuale disco usata oltre cui scatta warning. Default: 70 */
  warningPercent: number;
  /** Percentuale disco usata oltre cui scatta critical. Default: 85 */
  criticalPercent: number;
  /** Percentuale disco usata oltre cui scatta emergency. Default: 90 */
  emergencyPercent: number;
  /** Limite cache locale in MB. Default: 500 */
  cacheSizeLimitMB: number;
  /** TTL cache in ore prima della pulizia. Default: 72 */
  cacheTTLHours: number;
  /** Giorni di retention per i log. Default: 7 */
  logRetentionDays: number;
  /** Numero massimo di run storiche per job. Default: 30 */
  historyMaxRuns: number;
  /** Intervallo pulizia file temporanei in ore. Default: 6 */
  tempCleanIntervalHours: number;
}

export interface TokenThresholds {
  /** Budget giornaliero in token. Default: 10000 */
  dailyBudget: number;
  /** Budget mensile in token. Default: 200000 */
  monthlyBudget: number;
  /** Massimo token per singolo job. Default: 5000 */
  perJobMax: number;
  /** Percentuale budget usato oltre cui scatta warning. Default: 60 */
  warningPercent: number;
  /** Percentuale budget usato oltre cui scatta critical. Default: 80 */
  criticalPercent: number;
  /** Percentuale budget usato oltre cui si blocca. Default: 95 */
  hardStopPercent: number;
  /**
   * Moltiplicatore della media giornaliera oltre cui scatta lo stop automatico.
   * Es. 2 = blocco se il consumo giornaliero supera 2x la media degli ultimi 7 giorni.
   * Default: 2
   */
  killSwitchMultiplier: number;
}

export interface ResourceConfig {
  memory: MemoryThresholds;
  disk: DiskThresholds;
  tokens: TokenThresholds;
  /** Abilita auto-healing (GC forzato, pulizia cache, ecc.). Default: true */
  autoHealEnabled: boolean;
  /** Intervallo di monitoraggio risorse in ms. Default: 30000 (30s) */
  monitorIntervalMs: number;
  /** Invia notifica desktop su livello warning. Default: true */
  notifyOnWarning: boolean;
  /** Invia notifica desktop su livello critical/emergency. Default: true */
  notifyOnCritical: boolean;
}

export interface TokenUsage {
  /** Consumo giornaliero. Chiave: YYYY-MM-DD, valore: token totali */
  daily: Record<string, number>;
  /** Consumo mensile. Chiave: YYYY-MM, valore: token totali */
  monthly: Record<string, number>;
  /** Consumo per job nel mese corrente. Chiave: jobId, valore: token */
  perJob: Record<string, number>;
  /** Data ISO dell'ultimo reset giornaliero */
  lastReset: string;
}

export interface ResourceSnapshot {
  timestamp: number;
  memory: {
    usedMB: number;
    totalMB: number;
    percent: number;
    level: ResourceLevel;
  };
  disk: {
    usedMB: number;
    totalMB: number;
    percent: number;
    level: ResourceLevel;
    cacheMB: number;
    logsMB: number;
  };
  tokens: {
    todayUsed: number;
    todayBudget: number;
    todayPercent: number;
    monthUsed: number;
    monthBudget: number;
    monthPercent: number;
    level: ResourceLevel;
  };
  overall: ResourceLevel;
}

// ---------------------------------------------------------------------------
// Costanti e path
// ---------------------------------------------------------------------------

const CONFIG_DIR_NAME = '.108ai';
const RESOURCES_FILE_NAME = 'resources.json';
const TOKEN_USAGE_FILE_NAME = 'token-usage.json';

function getConfigDir(): string {
  return join(homedir(), CONFIG_DIR_NAME);
}

function getResourcesPath(): string {
  return join(getConfigDir(), RESOURCES_FILE_NAME);
}

function getTokenUsagePath(): string {
  return join(getConfigDir(), TOKEN_USAGE_FILE_NAME);
}

function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

export function getDefaultResourceConfig(): ResourceConfig {
  return {
    memory: {
      warningPercent: 60,
      criticalPercent: 80,
      emergencyPercent: 90,
      maxHeapMB: 4096,
    },
    disk: {
      warningPercent: 70,
      criticalPercent: 85,
      emergencyPercent: 90,
      cacheSizeLimitMB: 500,
      cacheTTLHours: 72,
      logRetentionDays: 7,
      historyMaxRuns: 30,
      tempCleanIntervalHours: 6,
    },
    tokens: {
      dailyBudget: 10_000,
      monthlyBudget: 200_000,
      perJobMax: 5_000,
      warningPercent: 60,
      criticalPercent: 80,
      hardStopPercent: 95,
      killSwitchMultiplier: 2,
    },
    autoHealEnabled: true,
    monitorIntervalMs: 30_000,
    notifyOnWarning: true,
    notifyOnCritical: true,
  };
}

// ---------------------------------------------------------------------------
// Deep merge helpers
// ---------------------------------------------------------------------------

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function deepMerge<T extends object>(base: T, overrides: DeepPartial<T>): T {
  const result = { ...base } as T;

  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const overrideValue = overrides[key as keyof DeepPartial<T>];
    const baseValue = base[key];

    if (
      overrideValue !== undefined &&
      overrideValue !== null &&
      typeof overrideValue === 'object' &&
      !Array.isArray(overrideValue) &&
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as object,
        overrideValue as DeepPartial<object>,
      ) as T[keyof T];
    } else if (overrideValue !== undefined) {
      result[key] = overrideValue as T[keyof T];
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// ResourceConfig — load / save
// ---------------------------------------------------------------------------

/**
 * Carica la configurazione risorse da disco.
 * In caso di file mancante o corrotto, restituisce i default.
 * Fa deep merge: i valori mancanti vengono riempiti con i default.
 */
export function loadResourceConfig(): ResourceConfig {
  const path = getResourcesPath();

  if (!existsSync(path)) {
    return getDefaultResourceConfig();
  }

  try {
    const raw = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw) as DeepPartial<ResourceConfig>;
    return deepMerge(getDefaultResourceConfig(), parsed);
  } catch {
    // File corrotto — restituisce i default senza crashare
    return getDefaultResourceConfig();
  }
}

/**
 * Salva la configurazione risorse su disco.
 */
export function saveResourceConfig(config: ResourceConfig): void {
  ensureConfigDir();
  writeFileSync(getResourcesPath(), JSON.stringify(config, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// TokenUsage — default / load / save
// ---------------------------------------------------------------------------

export function getDefaultTokenUsage(): TokenUsage {
  return {
    daily: {},
    monthly: {},
    perJob: {},
    lastReset: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  };
}

/**
 * Carica il tracciamento token da disco.
 * In caso di file mancante o corrotto, restituisce i default.
 */
export function loadTokenUsage(): TokenUsage {
  const path = getTokenUsagePath();

  if (!existsSync(path)) {
    return getDefaultTokenUsage();
  }

  try {
    const raw = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<TokenUsage>;

    return {
      daily: parsed.daily ?? {},
      monthly: parsed.monthly ?? {},
      perJob: parsed.perJob ?? {},
      lastReset: parsed.lastReset ?? new Date().toISOString().slice(0, 10),
    };
  } catch {
    return getDefaultTokenUsage();
  }
}

/**
 * Salva il tracciamento token su disco.
 */
export function saveTokenUsage(usage: TokenUsage): void {
  ensureConfigDir();
  writeFileSync(getTokenUsagePath(), JSON.stringify(usage, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Token tracking helpers
// ---------------------------------------------------------------------------

/**
 * Restituisce la chiave YYYY-MM-DD per oggi.
 */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Restituisce la chiave YYYY-MM per il mese corrente.
 */
function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Aggiunge `amount` token al conteggio giornaliero, mensile e (opzionale) per-job.
 * Persiste il risultato su disco.
 */
export function trackTokens(amount: number, jobId?: string): void {
  const usage = loadTokenUsage();

  const today = todayKey();
  const month = monthKey();

  usage.daily[today] = (usage.daily[today] ?? 0) + amount;
  usage.monthly[month] = (usage.monthly[month] ?? 0) + amount;

  if (jobId !== undefined) {
    usage.perJob[jobId] = (usage.perJob[jobId] ?? 0) + amount;
  }

  saveTokenUsage(usage);
}

/**
 * Token consumati oggi (YYYY-MM-DD corrente).
 */
export function getTodayUsage(): number {
  const usage = loadTokenUsage();
  return usage.daily[todayKey()] ?? 0;
}

/**
 * Token consumati nel mese corrente (YYYY-MM).
 */
export function getMonthUsage(): number {
  const usage = loadTokenUsage();
  return usage.monthly[monthKey()] ?? 0;
}

/**
 * Token consumati da un job specifico nel mese corrente.
 */
export function getJobUsage(jobId: string): number {
  const usage = loadTokenUsage();
  return usage.perJob[jobId] ?? 0;
}

/**
 * Resetta il contatore giornaliero se è cambiata la data dall'ultimo reset.
 * Non azzera i dati storici — aggiorna solo `lastReset` e azzera il perJob
 * se siamo in un mese nuovo.
 * Restituisce true se è avvenuto un reset.
 */
export function resetDailyIfNeeded(): boolean {
  const usage = loadTokenUsage();
  const today = todayKey();

  if (usage.lastReset === today) {
    return false;
  }

  const prevMonth = usage.lastReset.slice(0, 7);
  const currentMonth = today.slice(0, 7);

  if (prevMonth !== currentMonth) {
    // Nuovo mese: azzera il tracciamento per-job (mensile)
    usage.perJob = {};
  }

  usage.lastReset = today;
  saveTokenUsage(usage);
  return true;
}

// ---------------------------------------------------------------------------
// Livello risorsa
// ---------------------------------------------------------------------------

/**
 * Calcola il livello di allerta per una percentuale di utilizzo.
 *
 * Ordine di priorità: emergency > critical > warning > normal.
 * `emergencyPercent` è opzionale — se non fornito, non viene mai restituito
 * il livello 'emergency'.
 */
export function getLevel(
  percent: number,
  thresholds: {
    warningPercent: number;
    criticalPercent: number;
    emergencyPercent?: number;
  },
): ResourceLevel {
  if (thresholds.emergencyPercent !== undefined && percent >= thresholds.emergencyPercent) {
    return 'emergency';
  }
  if (percent >= thresholds.criticalPercent) {
    return 'critical';
  }
  if (percent >= thresholds.warningPercent) {
    return 'warning';
  }
  return 'normal';
}
