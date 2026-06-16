/**
 * Job Scheduler — 108 AI Desktop Agent
 *
 * Drives cron-based execution of JobDefinitions loaded from the job store.
 * Reuses the cron primitives (parseCron, cronMatchesNow, getNextRun,
 * sendNotification) from the triage scheduler to keep a single source of truth
 * for cron logic.
 *
 * Tick interval: 60 seconds (same cadence as triage scheduler).
 * Circuit breaker: per-job in-memory state; auto-pauses a job after N
 * consecutive failures, resets after a configurable delay.
 */

import {
  parseCron,
  cronMatchesNow,
  getNextRun,
  sendNotification,
} from '../triage/scheduler.js';
import { loadAllJobs, loadJob } from './store.js';
import { executeJob } from './executor.js';
import type { JobDefinition } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHECK_INTERVAL_MS = 60_000; // 1 minute
const DEFAULT_CB_THRESHOLD = 3;   // failures before opening circuit
const DEFAULT_CB_RESET_MS = 60 * 60 * 1_000; // 1 hour

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface CircuitBreakerEntry {
  failures: number;
  pausedUntil: number; // epoch ms; 0 = not paused
}

interface SchedulerState {
  running: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
  /** ISO "YYYY-MM-DDTHH:MM" of the last minute that triggered execution. */
  lastCheckedMinute: number;
  circuitBreakers: Map<string, CircuitBreakerEntry>;
}

const state: SchedulerState = {
  running: false,
  intervalId: null,
  lastCheckedMinute: -1,
  circuitBreakers: new Map(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Structured-log writer — JSON on stdout, no PII. */
function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  extra?: Record<string, unknown>,
): void {
  process.stdout.write(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    }) + '\n',
  );
}

/**
 * Encode the current minute as an integer (yyyyMMddHHmm) for cheap
 * double-fire guard without string allocation on every tick.
 */
function currentMinuteKey(now: Date): number {
  return (
    now.getFullYear() * 100_000_000 +
    (now.getMonth() + 1) * 1_000_000 +
    now.getDate() * 10_000 +
    now.getHours() * 100 +
    now.getMinutes()
  );
}

/** Lazily create or fetch the CB entry for a job. */
function getCbEntry(jobId: string): CircuitBreakerEntry {
  let entry = state.circuitBreakers.get(jobId);
  if (entry === undefined) {
    entry = { failures: 0, pausedUntil: 0 };
    state.circuitBreakers.set(jobId, entry);
  }
  return entry;
}

/** Return true when the circuit is open (job should be skipped). */
function isCircuitOpen(jobId: string, now: number): boolean {
  const entry = state.circuitBreakers.get(jobId);
  if (entry === undefined || entry.pausedUntil === 0) return false;
  if (now >= entry.pausedUntil) {
    // Auto-reset: the pause window has expired
    entry.failures = 0;
    entry.pausedUntil = 0;
    return false;
  }
  return true;
}

/**
 * Record a failed execution. Opens the circuit if the failure threshold is
 * reached, using the job's onFailure config for threshold and reset window.
 */
function recordFailure(job: JobDefinition): void {
  const threshold: number =
    (job.onFailure as { circuitBreakerThreshold?: number } | undefined)
      ?.circuitBreakerThreshold ?? DEFAULT_CB_THRESHOLD;

  const resetMs: number =
    (job.onFailure as { resetAfterMs?: number } | undefined)?.resetAfterMs ??
    DEFAULT_CB_RESET_MS;

  const entry = getCbEntry(job.id);
  entry.failures += 1;

  if (entry.failures >= threshold) {
    entry.pausedUntil = Date.now() + resetMs;
    log('warn', '[jobs] circuit breaker opened', {
      jobId: job.id,
      jobName: job.name,
      failures: entry.failures,
      pausedUntil: new Date(entry.pausedUntil).toISOString(),
    });
  }
}

/** Record a successful execution — reset the failure counter. */
function recordSuccess(jobId: string): void {
  const entry = state.circuitBreakers.get(jobId);
  if (entry !== undefined) {
    entry.failures = 0;
    entry.pausedUntil = 0;
  }
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

/**
 * Called every CHECK_INTERVAL_MS. Evaluates all cron-triggered jobs and
 * dispatches eligible ones asynchronously.
 */
async function tick(): Promise<void> {
  const now = new Date();
  const minuteKey = currentMinuteKey(now);
  const nowMs = now.getTime();

  // Guard: never fire twice in the same minute
  if (state.lastCheckedMinute === minuteKey) {
    return;
  }
  state.lastCheckedMinute = minuteKey;

  let jobs: JobDefinition[];
  try {
    jobs = loadAllJobs();
  } catch (err) {
    log('error', '[jobs] failed to load jobs from store', {
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  // Keep only enabled cron jobs
  const candidates = jobs.filter(
    (j) =>
      j.enabled === true &&
      j.trigger?.type === 'cron' &&
      typeof j.trigger.schedule === 'string' &&
      j.trigger.schedule.trim().length > 0,
  );

  for (const job of candidates) {
    // Circuit breaker check
    if (isCircuitOpen(job.id, nowMs)) {
      log('info', '[jobs] skipping job — circuit open', {
        jobId: job.id,
        jobName: job.name,
      });
      continue;
    }

    let matches: boolean;
    try {
      const schedule = parseCron(job.trigger.schedule as string);
      matches = cronMatchesNow(schedule, now);
    } catch (err) {
      log('error', '[jobs] invalid cron expression — skipping job', {
        jobId: job.id,
        jobName: job.name,
        schedule: job.trigger.schedule,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    if (!matches) {
      continue;
    }

    log('info', '[jobs] scheduled run starting', {
      jobId: job.id,
      jobName: job.name,
      schedule: job.trigger.schedule,
    });

    // Execute asynchronously — do NOT await; the tick must not block
    executeJob(job, 'scheduled')
      .then((run) => {
        if (run.status === 'failed') {
          recordFailure(job);
          dispatchFailureNotification(job, run.error ?? 'Unknown error').catch(() => {
            // Notification errors are non-fatal
          });
        } else {
          recordSuccess(job.id);
          log('info', '[jobs] scheduled run completed', {
            jobId: job.id,
            jobName: job.name,
            runId: run.id,
            durationMs: run.durationMs,
          });
        }
      })
      .catch((err) => {
        // executeJob itself threw — treat as failure
        recordFailure(job);
        log('error', '[jobs] unhandled error during job execution', {
          jobId: job.id,
          jobName: job.name,
          error: err instanceof Error ? err.message : String(err),
        });
        dispatchFailureNotification(job, err instanceof Error ? err.message : String(err)).catch(
          () => {},
        );
      });
  }
}

/**
 * Dispatch a failure notification using the job's onFailure.notify config.
 * Falls back to 'console' if no channel is configured.
 */
async function dispatchFailureNotification(
  job: JobDefinition,
  errorMessage: string,
): Promise<void> {
  const notifyConfig = (
    job.onFailure as
      | { notify?: { channel?: string; filePath?: string } }
      | undefined
  )?.notify;

  const channel =
    (notifyConfig?.channel as 'console' | 'desktop' | 'file' | 'none' | undefined) ?? 'console';

  if (channel === 'none') return;

  const title = `108ai Job failed: ${job.name}`;
  const body = `Job "${job.name}" (${job.id}) failed at ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}.\nError: ${errorMessage}`;

  await sendNotification(title, body, channel, notifyConfig?.filePath);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the job scheduler. Safe to call multiple times — a running scheduler
 * will not create a second interval.
 *
 * Intended to be called once at agent boot.
 */
export function startJobScheduler(): void {
  if (state.running) {
    return;
  }

  state.running = true;
  state.lastCheckedMinute = -1;

  const jobs = (() => {
    try {
      return loadAllJobs();
    } catch {
      return [];
    }
  })();

  const cronJobCount = jobs.filter(
    (j) => j.enabled && j.trigger?.type === 'cron',
  ).length;

  log('info', '[jobs] scheduler started', {
    scheduledJobs: cronJobCount,
  });

  state.intervalId = setInterval(() => {
    tick().catch((err) => {
      log('error', '[jobs] scheduler tick error', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, CHECK_INTERVAL_MS);

  // Allow the process to exit even when the interval is active
  if (state.intervalId.unref) {
    state.intervalId.unref();
  }
}

/**
 * Stop the scheduler. No-op if not running.
 */
export function stopJobScheduler(): void {
  if (!state.running) {
    return;
  }

  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.running = false;
  log('info', '[jobs] scheduler stopped');
}

/**
 * Return a lightweight snapshot of scheduler status.
 *
 * `nextFiring` is the earliest next-run across all enabled cron jobs, or null
 * if no valid cron job exists.
 */
export function getJobSchedulerStatus(): {
  running: boolean;
  scheduledJobs: number;
  nextFiring: string | null;
} {
  let scheduledJobs = 0;
  let nextFiringMs: number | null = null;
  const now = new Date();

  try {
    const jobs = loadAllJobs();

    for (const job of jobs) {
      if (!job.enabled || job.trigger?.type !== 'cron') continue;
      const scheduleStr = job.trigger.schedule as string | undefined;
      if (!scheduleStr) continue;

      scheduledJobs += 1;

      try {
        const schedule = parseCron(scheduleStr);
        const next = getNextRun(schedule, now);
        const nextMs = next.getTime();
        if (nextFiringMs === null || nextMs < nextFiringMs) {
          nextFiringMs = nextMs;
        }
      } catch {
        // Skip jobs with invalid cron expressions
      }
    }
  } catch {
    // loadAllJobs failed — return what we have
  }

  return {
    running: state.running,
    scheduledJobs,
    nextFiring: nextFiringMs !== null ? new Date(nextFiringMs).toISOString() : null,
  };
}

/**
 * Manually trigger a job by ID or name, bypassing schedule and circuit breaker.
 *
 * Lookup order: exact ID match first, then case-insensitive name match.
 */
export async function triggerJob(
  idOrName: string,
): Promise<{ success: boolean; runId?: string; error?: string }> {
  // Try ID lookup first (fast path)
  let job: JobDefinition | null = null;
  try {
    job = loadJob(idOrName);
  } catch (err) {
    return {
      success: false,
      error: `Store error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Fall back to name search
  if (job === null) {
    try {
      const all = loadAllJobs();
      const needle = idOrName.toLowerCase();
      job = all.find((j) => j.name.toLowerCase() === needle) ?? null;
    } catch (err) {
      return {
        success: false,
        error: `Store error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  if (job === null) {
    return { success: false, error: `Job not found: "${idOrName}"` };
  }

  log('info', '[jobs] manual trigger', {
    jobId: job.id,
    jobName: job.name,
  });

  try {
    const run = await executeJob(job, 'manual');

    if (run.status === 'failed') {
      // Manual triggers still update the circuit breaker so operators can see
      // the failure, but we never auto-pause on a manual run.
      log('warn', '[jobs] manual trigger failed', {
        jobId: job.id,
        jobName: job.name,
        runId: run.id,
        error: run.error,
      });
      return { success: false, runId: run.id, error: run.error ?? 'Job failed' };
    }

    log('info', '[jobs] manual trigger completed', {
      jobId: job.id,
      jobName: job.name,
      runId: run.id,
      durationMs: run.durationMs,
    });

    return { success: true, runId: run.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('error', '[jobs] unhandled error during manual trigger', {
      jobId: job.id,
      jobName: job.name,
      error: message,
    });
    return { success: false, error: message };
  }
}

/**
 * Inspect the circuit breaker state for a specific job.
 */
export function getCircuitBreakerState(jobId: string): {
  open: boolean;
  failures: number;
  pausedUntil: string | null;
} {
  const entry = state.circuitBreakers.get(jobId);
  if (entry === undefined) {
    return { open: false, failures: 0, pausedUntil: null };
  }

  const nowMs = Date.now();
  const isOpen = entry.pausedUntil > 0 && nowMs < entry.pausedUntil;

  return {
    open: isOpen,
    failures: entry.failures,
    pausedUntil:
      entry.pausedUntil > 0 ? new Date(entry.pausedUntil).toISOString() : null,
  };
}

/**
 * Manually reset the circuit breaker for a job, clearing its failure count
 * and pause window. Useful for operator intervention after a transient outage.
 */
export function resetCircuitBreaker(jobId: string): void {
  const entry = state.circuitBreakers.get(jobId);
  if (entry !== undefined) {
    entry.failures = 0;
    entry.pausedUntil = 0;
  }
  log('info', '[jobs] circuit breaker reset', { jobId });
}
