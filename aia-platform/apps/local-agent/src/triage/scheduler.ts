/**
 * Triage Scheduler — Cron-like scheduling for automatic triage execution
 * and notification dispatch.
 *
 * Storage:  ~/.108ai/triage-schedule.json
 * Interval: checked every 60 seconds via setInterval
 * Notifications: console (stdout), desktop (node-notifier), file (append), or none
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CronField {
  /** Flattened set of all matching values within the field's valid range. */
  values: Set<number>;
}

export interface CronSchedule {
  minute: CronField; // 0–59
  hour: CronField;   // 0–23
  dom: CronField;    // 1–31
  month: CronField;  // 1–12
  dow: CronField;    // 0–6 (0 = Sunday)
}

export interface ScheduleConfig {
  enabled: boolean;
  cron: string;              // e.g. "0 7 * * 1-5"
  notifyChannel: 'console' | 'desktop' | 'file' | 'none';
  notifyFilePath?: string;   // only for 'file' channel
  lastRun?: string;          // ISO timestamp of last execution
  nextRun?: string;          // ISO timestamp of next expected run
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONFIG_DIR = join(homedir(), '.108ai');
const SCHEDULE_FILE = join(CONFIG_DIR, 'triage-schedule.json');
const CHECK_INTERVAL_MS = 60_000; // 1 minute

const DEFAULT_SCHEDULE: ScheduleConfig = {
  enabled: false,
  cron: '0 7 * * 1-5',
  notifyChannel: 'console',
};

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let _intervalHandle: ReturnType<typeof setInterval> | null = null;
/** ISO minute string of the last tick that triggered a run ("YYYY-MM-DDTHH:MM"). */
let _lastFiredMinute: string | null = null;

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadScheduleConfig(): ScheduleConfig {
  try {
    if (existsSync(SCHEDULE_FILE)) {
      const raw = readFileSync(SCHEDULE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<ScheduleConfig>;
      return { ...DEFAULT_SCHEDULE, ...parsed };
    }
  } catch {
    // Corrupt file — fall back to default
  }
  return { ...DEFAULT_SCHEDULE };
}

function saveScheduleConfig(config: ScheduleConfig): void {
  ensureConfigDir();
  writeFileSync(SCHEDULE_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Cron parser
// ---------------------------------------------------------------------------

/**
 * Parse a single cron field token into a set of matching integers.
 *
 * Supported syntax:
 *   `*`         — all values in [min, max]
 *   `N`         — single value
 *   `N-M`       — inclusive range
 *   `N,M,...`   — comma-separated list (each element can be a range)
 *   `* /N`      — step (all values in [min, max] divisible by N mod range start)
 *   `N-M/S`     — step over range
 *
 * @param token  Raw field string, e.g. "1-5", "star/15", "0,30", "7"
 * @param min    Minimum allowed value for this field
 * @param max    Maximum allowed value for this field
 */
function parseField(token: string, min: number, max: number): CronField {
  const values = new Set<number>();

  // Comma-separated list: recurse on each segment
  if (token.includes(',')) {
    for (const segment of token.split(',')) {
      const sub = parseField(segment.trim(), min, max);
      for (const v of sub.values) {
        values.add(v);
      }
    }
    return { values };
  }

  // Step syntax: */N or N-M/S
  if (token.includes('/')) {
    const [rangePart, stepStr] = token.split('/') as [string, string];
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step < 1) {
      throw new Error(`Invalid step value in cron field "${token}"`);
    }

    let rangeMin = min;
    let rangeMax = max;

    if (rangePart !== '*') {
      if (rangePart.includes('-')) {
        const [lo, hi] = rangePart.split('-').map((s) => parseInt(s, 10)) as [number, number];
        rangeMin = lo;
        rangeMax = hi;
      } else {
        rangeMin = parseInt(rangePart, 10);
        rangeMax = max;
      }
    }

    for (let v = rangeMin; v <= rangeMax; v += step) {
      values.add(v);
    }
    return { values };
  }

  // Wildcard
  if (token === '*') {
    for (let v = min; v <= max; v++) {
      values.add(v);
    }
    return { values };
  }

  // Range: N-M
  if (token.includes('-')) {
    const [lo, hi] = token.split('-').map((s) => parseInt(s, 10)) as [number, number];
    if (isNaN(lo) || isNaN(hi) || lo > hi || lo < min || hi > max) {
      throw new Error(`Invalid range "${token}" for field with bounds [${min}, ${max}]`);
    }
    for (let v = lo; v <= hi; v++) {
      values.add(v);
    }
    return { values };
  }

  // Single value
  const n = parseInt(token, 10);
  if (isNaN(n) || n < min || n > max) {
    throw new Error(`Invalid value "${token}" for field with bounds [${min}, ${max}]`);
  }
  values.add(n);
  return { values };
}

/**
 * Parse a standard 5-field cron expression.
 *
 * Fields: minute hour day-of-month month day-of-week
 * Ranges: 0–59   0–23  1–31         1–12  0–6
 *
 * @throws Error if the expression is malformed.
 */
export function parseCron(expression: string): CronSchedule {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Cron expression must have exactly 5 fields, got "${expression}"`);
  }

  const [minuteToken, hourToken, domToken, monthToken, dowToken] = parts as [
    string, string, string, string, string,
  ];

  return {
    minute: parseField(minuteToken, 0, 59),
    hour:   parseField(hourToken,   0, 23),
    dom:    parseField(domToken,    1, 31),
    month:  parseField(monthToken,  1, 12),
    dow:    parseField(dowToken,    0, 6),
  };
}

/**
 * Return true if the given Date matches all five cron fields.
 * Month is compared as 1-based; dow follows Date.getDay() (0 = Sunday).
 */
export function cronMatchesNow(schedule: CronSchedule, now: Date = new Date()): boolean {
  return (
    schedule.minute.values.has(now.getMinutes()) &&
    schedule.hour.values.has(now.getHours()) &&
    schedule.dom.values.has(now.getDate()) &&
    schedule.month.values.has(now.getMonth() + 1) &&
    schedule.dow.values.has(now.getDay())
  );
}

/**
 * Brute-force: advance by one minute at a time (max 7 days = 10080 minutes)
 * until cronMatchesNow returns true.
 *
 * @param schedule  Parsed cron schedule
 * @param after     Start searching after this moment (exclusive). Defaults to now.
 * @returns         The next matching Date, truncated to whole minutes.
 * @throws          Error if no match found within 7 days (should never happen for valid expressions).
 */
export function getNextRun(schedule: CronSchedule, after: Date = new Date()): Date {
  // Start from the minute *after* `after`
  const cursor = new Date(after);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const MAX_ITERATIONS = 7 * 24 * 60; // 10080

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (cronMatchesNow(schedule, cursor)) {
      return new Date(cursor);
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  throw new Error('No matching time found within 7 days for the given cron expression');
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

/**
 * Dispatch a notification via the configured channel.
 *
 * - 'console'  → writes to stdout (JSON structured log)
 * - 'desktop'  → node-notifier native OS notification (dynamically imported)
 * - 'file'     → appends a timestamped line to notifyFilePath
 * - 'none'     → no-op
 */
export async function sendNotification(
  title: string,
  body: string,
  channel: ScheduleConfig['notifyChannel'],
  filePath?: string,
): Promise<void> {
  switch (channel) {
    case 'console': {
      process.stdout.write(
        JSON.stringify({
          level: 'info',
          message: `[triage] ${title}`,
          body,
          timestamp: new Date().toISOString(),
        }) + '\n',
      );
      break;
    }

    case 'desktop': {
      try {
        const notifier = await import('node-notifier');
        notifier.default.notify({
          title: `108ai Triage`,
          message: body,
          sound: false,
          wait: false,
        });
      } catch {
        // Graceful degradation: fall back to console if node-notifier unavailable
        process.stdout.write(
          JSON.stringify({
            level: 'warn',
            message: '[triage] desktop notification unavailable, falling back to console',
            title,
            body,
          }) + '\n',
        );
      }
      break;
    }

    case 'file': {
      if (!filePath) {
        process.stdout.write(
          JSON.stringify({
            level: 'warn',
            message: '[triage] file notification channel configured but notifyFilePath is not set',
          }) + '\n',
        );
        break;
      }
      try {
        const entry = `[${new Date().toISOString()}] ${title}: ${body}\n`;
        appendFileSync(filePath, entry, 'utf-8');
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            level: 'error',
            message: '[triage] failed to write notification to file',
            path: filePath,
            error: err instanceof Error ? err.message : String(err),
          }) + '\n',
        );
      }
      break;
    }

    case 'none':
    default:
      // Intentionally silent
      break;
  }
}

// ---------------------------------------------------------------------------
// Scheduler core
// ---------------------------------------------------------------------------

/**
 * Compute the ISO "minute string" (YYYY-MM-DDTHH:MM) for a given Date.
 * Used to detect whether a given minute has already fired.
 */
function toMinuteKey(date: Date): string {
  return date.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

/**
 * Execute triage and dispatch the result notification.
 * Lazily imports the engine to avoid circular-dependency risk.
 */
async function executeTriage(config: ScheduleConfig): Promise<void> {
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      message: '[triage] scheduled run starting',
      cron: config.cron,
      timestamp: new Date().toISOString(),
    }) + '\n',
  );

  let notifyTitle = '108ai Triage completato';
  let notifyBody = 'Triage eseguito senza risultati.';

  try {
    // Dynamic import isolates the triage engine — allows the scheduler to
    // be loaded at boot without requiring the engine to initialise eagerly.
    const { runTriage, loadTriageConfig, resolveTriageTokens } = await import('./engine.js');
    const { formatTriageCompact } = await import('./cli.js');

    const config = loadTriageConfig();
    const tokens = await resolveTriageTokens();
    const result = await runTriage(config, tokens);
    const { saveLastTriageReport } = await import('../capabilities/triage-jobs.js');
    saveLastTriageReport(result);
    notifyBody = formatTriageCompact(result);
    notifyTitle = `108ai Triage — ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stdout.write(
      JSON.stringify({
        level: 'error',
        message: '[triage] scheduled run failed',
        error: message,
      }) + '\n',
    );
    notifyBody = `Triage fallito: ${message}`;
    notifyTitle = '108ai Triage — errore';
  }

  await sendNotification(notifyTitle, notifyBody, config.notifyChannel, config.notifyFilePath);
}

/**
 * One tick of the scheduler loop (called every 60 seconds).
 * Checks if the current minute matches the cron expression, guards
 * against double-fire, and triggers triage execution when appropriate.
 */
async function tick(): Promise<void> {
  const config = loadScheduleConfig();

  if (!config.enabled) {
    return;
  }

  const now = new Date();
  const currentMinute = toMinuteKey(now);

  // Prevent double-fire within the same minute
  if (_lastFiredMinute === currentMinute) {
    return;
  }

  let schedule: CronSchedule;
  try {
    schedule = parseCron(config.cron);
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        level: 'error',
        message: '[triage] invalid cron expression',
        cron: config.cron,
        error: err instanceof Error ? err.message : String(err),
      }) + '\n',
    );
    return;
  }

  if (!cronMatchesNow(schedule, now)) {
    return;
  }

  // Mark this minute as fired before execution to prevent re-entry
  _lastFiredMinute = currentMinute;

  // Update lastRun and compute nextRun
  const nextRunDate = (() => {
    try {
      return getNextRun(schedule, now);
    } catch {
      return null;
    }
  })();

  const updatedConfig: ScheduleConfig = {
    ...config,
    lastRun: now.toISOString(),
    nextRun: nextRunDate?.toISOString(),
  };
  saveScheduleConfig(updatedConfig);

  // Execute asynchronously — do not block the interval
  executeTriage(updatedConfig).catch((err) => {
    process.stdout.write(
      JSON.stringify({
        level: 'error',
        message: '[triage] unhandled error in executeTriage',
        error: err instanceof Error ? err.message : String(err),
      }) + '\n',
    );
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the scheduler loop. Safe to call multiple times — a running scheduler
 * will not create a second interval.
 *
 * Intended to be called once at agent boot (in daemon / agent mode).
 */
export function startTriageScheduler(): void {
  if (_intervalHandle !== null) {
    return; // Already running
  }

  // Compute and persist nextRun on start
  const config = loadScheduleConfig();
  if (config.enabled) {
    try {
      const schedule = parseCron(config.cron);
      const nextRun = getNextRun(schedule);
      saveScheduleConfig({ ...config, nextRun: nextRun.toISOString() });
    } catch {
      // Invalid expression — leave nextRun untouched
    }
  }

  process.stdout.write(
    JSON.stringify({
      level: 'info',
      message: '[triage] scheduler started',
      enabled: config.enabled,
      cron: config.cron,
    }) + '\n',
  );

  _intervalHandle = setInterval(() => {
    tick().catch((err) => {
      process.stdout.write(
        JSON.stringify({
          level: 'error',
          message: '[triage] scheduler tick error',
          error: err instanceof Error ? err.message : String(err),
        }) + '\n',
      );
    });
  }, CHECK_INTERVAL_MS);

  // Allow the Node.js process to exit even if the interval is active
  if (_intervalHandle.unref) {
    _intervalHandle.unref();
  }
}

/**
 * Stop the scheduler loop. No-op if not running.
 */
export function stopTriageScheduler(): void {
  if (_intervalHandle !== null) {
    clearInterval(_intervalHandle);
    _intervalHandle = null;

    process.stdout.write(
      JSON.stringify({
        level: 'info',
        message: '[triage] scheduler stopped',
      }) + '\n',
    );
  }
}

/**
 * Return current schedule status (snapshot from disk).
 */
export function getScheduleStatus(): {
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  cron: string;
} {
  const config = loadScheduleConfig();
  return {
    enabled: config.enabled,
    lastRun: config.lastRun ?? null,
    nextRun: config.nextRun ?? null,
    cron: config.cron,
  };
}

/**
 * Update the cron expression. Immediately recomputes and persists nextRun.
 *
 * @throws Error if the expression is invalid.
 */
export function setSchedule(cron: string): void {
  // Validate before saving
  const schedule = parseCron(cron);

  const config = loadScheduleConfig();
  const nextRun = (() => {
    try {
      return getNextRun(schedule).toISOString();
    } catch {
      return undefined;
    }
  })();

  saveScheduleConfig({ ...config, cron, nextRun });
}

/**
 * Enable or disable the scheduler. Persists the change immediately.
 * When enabling, recomputes nextRun from the stored cron expression.
 */
export function enableSchedule(enabled: boolean): void {
  const config = loadScheduleConfig();
  let nextRun = config.nextRun;

  if (enabled) {
    try {
      const schedule = parseCron(config.cron);
      nextRun = getNextRun(schedule).toISOString();
    } catch {
      // Keep existing nextRun if cron is invalid
    }
  }

  saveScheduleConfig({ ...config, enabled, nextRun });
}

/**
 * Set the notification channel. Persists the change immediately.
 */
export function setNotifyChannel(channel: ScheduleConfig['notifyChannel']): void {
  const config = loadScheduleConfig();
  saveScheduleConfig({ ...config, notifyChannel: channel });
}
