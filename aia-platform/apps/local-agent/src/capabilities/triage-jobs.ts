/**
 * Triage & Jobs capabilities — remote API for dashboard consulente.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { AgentConfig } from '../config.js';
import {
  runTriage,
  loadTriageConfig,
  resolveTriageTokens,
  type TriageReport,
} from '../triage/engine.js';
import { getScheduleStatus } from '../triage/scheduler.js';
import {
  loadAllJobs,
  loadJob,
  getJobStats,
  getRecentRunsForJob,
  loadHistory,
} from '../jobs/store.js';
import { getJobSchedulerStatus, triggerJob } from '../jobs/scheduler.js';

type TriageJobHandler = (
  params: Record<string, unknown>,
  config: AgentConfig,
) => Promise<unknown> | unknown;

const LAST_REPORT_PATH = join(homedir(), '.108ai', 'triage-last.json');

export function saveLastTriageReport(report: TriageReport): void {
  const dir = join(homedir(), '.108ai');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(LAST_REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
}

export function loadLastTriageReport(): TriageReport | null {
  if (!existsSync(LAST_REPORT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(LAST_REPORT_PATH, 'utf-8')) as TriageReport;
  } catch {
    return null;
  }
}

function requireJobId(params: Record<string, unknown>): string {
  const id = params['id'] ?? params['jobId'];
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('Required parameter "id" must be a non-empty string');
  }
  return id;
}

export const triageJobsHandlers = new Map<string, TriageJobHandler>([
  ['triage.lastReport', async () => {
    return loadLastTriageReport();
  }],

  ['triage.schedule', async () => {
    return getScheduleStatus();
  }],

  ['triage.run', async (_params: Record<string, unknown>, _config: AgentConfig) => {
    const config = loadTriageConfig();
    const tokens = await resolveTriageTokens();
    const report = await runTriage(config, tokens);
    saveLastTriageReport(report);
    return report;
  }],

  ['jobs.list', async () => {
    const jobs = loadAllJobs();
    return jobs.map((job) => {
      const stats = getJobStats(job.id);
      const history = loadHistory(job.id);
      const last = history.runs[history.runs.length - 1];
      return {
        id: job.id,
        name: job.name,
        description: job.description,
        enabled: job.enabled,
        trigger: job.trigger,
        stats: {
          ...stats,
          lastStatus: last?.status ?? null,
        },
      };
    });
  }],

  ['jobs.get', async (params: Record<string, unknown>) => {
    const id = requireJobId(params);
    const job = loadJob(id);
    if (!job) {
      throw new Error(`Job not found: ${id}`);
    }
    return {
      job,
      stats: getJobStats(id),
      recentRuns: getRecentRunsForJob(id, 10),
    };
  }],

  ['jobs.scheduler', async () => {
    return getJobSchedulerStatus();
  }],

  ['jobs.run', async (params: Record<string, unknown>) => {
    const id = requireJobId(params);
    return triggerJob(id);
  }],
]);
