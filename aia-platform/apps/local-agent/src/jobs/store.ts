import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { JobDefinition, JobRun, JobRunHistory } from './types.js';

const JOBS_DIR = join(homedir(), '.108ai', 'jobs');
const HISTORY_DIR = join(JOBS_DIR, 'history');
const MAX_HISTORY_PER_JOB = 100;
const DEFAULT_RECENT_RUNS_LIMIT = 20;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function ensureDirs(): void {
  if (!existsSync(JOBS_DIR)) {
    mkdirSync(JOBS_DIR, { recursive: true });
  }
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function jobPath(id: string): string {
  return join(JOBS_DIR, `${id}.json`);
}

function historyPath(jobId: string): string {
  return join(HISTORY_DIR, `${jobId}.json`);
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Job definitions — CRUD
// ---------------------------------------------------------------------------

/** Load all job definitions from disk. Files that fail to parse are skipped. */
export function loadAllJobs(): JobDefinition[] {
  ensureDirs();

  let entries: string[];
  try {
    entries = readdirSync(JOBS_DIR);
  } catch {
    return [];
  }

  const jobs: JobDefinition[] = [];

  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;

    const parsed = readJson<JobDefinition>(join(JOBS_DIR, entry));
    if (parsed == null) {
      console.warn(`[store] Failed to parse job file: ${entry} — skipping`);
      continue;
    }
    jobs.push(parsed);
  }

  return jobs;
}

/** Load a single job by ID. Returns null if not found or unreadable. */
export function loadJob(id: string): JobDefinition | null {
  ensureDirs();
  return readJson<JobDefinition>(jobPath(id));
}

/**
 * Find a job by name (case-insensitive partial match).
 * Returns the first match, or null if none found.
 */
export function findJobByName(name: string): JobDefinition | null {
  ensureDirs();

  const needle = name.toLowerCase();
  const jobs = loadAllJobs();

  return jobs.find((j) => j.name.toLowerCase().includes(needle)) ?? null;
}

/** Save (create or overwrite) a job definition to disk. */
export function saveJob(job: JobDefinition): void {
  ensureDirs();
  writeJson(jobPath(job.id), job);
}

/**
 * Delete a job by ID.
 * Also removes its history file.
 * Returns true if the job file existed and was deleted, false otherwise.
 */
export function deleteJob(id: string): boolean {
  ensureDirs();

  const path = jobPath(id);
  if (!existsSync(path)) return false;

  unlinkSync(path);

  const hPath = historyPath(id);
  if (existsSync(hPath)) {
    unlinkSync(hPath);
  }

  return true;
}

/**
 * Enable or disable a job.
 * Returns true if the job was found and updated, false otherwise.
 */
export function setJobEnabled(id: string, enabled: boolean): boolean {
  ensureDirs();

  const job = loadJob(id);
  if (job == null) return false;

  const updated: JobDefinition = { ...job, enabled };
  saveJob(updated);
  return true;
}

// ---------------------------------------------------------------------------
// Run history
// ---------------------------------------------------------------------------

/** Load the full run history for a job. Returns an empty history if not found. */
export function loadHistory(jobId: string): JobRunHistory {
  ensureDirs();

  const existing = readJson<JobRunHistory>(historyPath(jobId));
  if (existing != null) return existing;

  return { jobId, runs: [] };
}

/**
 * Append a run to a job's history.
 * Keeps only the last MAX_HISTORY_PER_JOB (100) runs.
 */
export function appendRun(jobId: string, run: JobRun): void {
  ensureDirs();

  const history = loadHistory(jobId);
  history.runs.push(run);

  if (history.runs.length > MAX_HISTORY_PER_JOB) {
    history.runs = history.runs.slice(-MAX_HISTORY_PER_JOB);
  }

  writeJson(historyPath(jobId), history);
}

export function getRecentRunsForJob(jobId: string, limit = DEFAULT_RECENT_RUNS_LIMIT): JobRun[] {
  const { runs } = loadHistory(jobId);
  return runs.slice(-limit).reverse();
}

/**
 * Get the last N runs across all jobs, sorted by startedAt descending.
 * Defaults to the 20 most recent.
 */
export function getRecentRuns(limit = DEFAULT_RECENT_RUNS_LIMIT): JobRun[] {
  ensureDirs();

  let entries: string[];
  try {
    entries = readdirSync(HISTORY_DIR);
  } catch {
    return [];
  }

  const allRuns: JobRun[] = [];

  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;

    const history = readJson<JobRunHistory>(join(HISTORY_DIR, entry));
    if (history == null) {
      console.warn(`[store] Failed to parse history file: ${entry} — skipping`);
      continue;
    }
    allRuns.push(...history.runs);
  }

  allRuns.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  return allRuns.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/**
 * Compute aggregate stats for a single job.
 * All cost/token fields default to 0 when missing.
 */
export function getJobStats(jobId: string): {
  totalRuns: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
  lastRun: string | null;
} {
  ensureDirs();

  const history = loadHistory(jobId);
  const { runs } = history;

  if (runs.length === 0) {
    return {
      totalRuns: 0,
      successRate: 0,
      totalTokens: 0,
      totalCost: 0,
      lastRun: null,
    };
  }

  const totalRuns = runs.length;
  const successCount = runs.filter((r) => r.status === 'completed').length;
  const successRate = successCount / totalRuns;

  const totalTokens = runs.reduce((sum, r) => sum + (r.totalTokens ?? 0), 0);
  const totalCost = runs.reduce((sum, r) => sum + (r.totalCost ?? 0), 0);

  // History is kept in insertion order; last element is the most recent
  const lastRun = runs[runs.length - 1]?.startedAt ?? null;

  return { totalRuns, successRate, totalTokens, totalCost, lastRun };
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/**
 * Generate a new job ID by slugifying the name and appending 4 random hex chars.
 * Example: "Daily Report" → "daily-report-a3f2"
 */
export function generateJobId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');

  return `${slug}-${suffix}`;
}
