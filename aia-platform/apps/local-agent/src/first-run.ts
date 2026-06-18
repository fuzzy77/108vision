/**
 * First-run defaults — enable triage schedule and desktop notifications after fresh install.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { getDataDir } from './paths.js';
import {
  enableSchedule,
  getScheduleStatus,
  setNotifyChannel,
  setSchedule,
} from './triage/scheduler.js';

const FIRST_RUN_FILE = 'first-run.json';
const DEFAULT_MORNING_CRON = '0 7 * * 1-5';

export interface FirstRunState {
  completedAt: string;
  triageScheduleEnabled: boolean;
  cron: string;
}

function getFirstRunPath(): string {
  return join(getDataDir(), FIRST_RUN_FILE);
}

export function isFirstRunComplete(): boolean {
  const path = getFirstRunPath();
  if (!existsSync(path)) return false;
  try {
    const state = JSON.parse(readFileSync(path, 'utf-8')) as FirstRunState;
    return Boolean(state.completedAt);
  } catch {
    return false;
  }
}

export function loadFirstRunState(): FirstRunState | null {
  const path = getFirstRunPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as FirstRunState;
  } catch {
    return null;
  }
}

/**
 * Apply PMI beta defaults once after the first successful install.
 * Idempotent — no-op if already completed.
 */
export function applyFirstRunDefaults(): FirstRunState | null {
  if (isFirstRunComplete()) return loadFirstRunState();

  const dataDir = getDataDir();
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const status = getScheduleStatus();
  if (!status.enabled || status.cron !== DEFAULT_MORNING_CRON) {
    setSchedule(DEFAULT_MORNING_CRON);
    setNotifyChannel('desktop');
    enableSchedule(true);
  }

  const state: FirstRunState = {
    completedAt: new Date().toISOString(),
    triageScheduleEnabled: true,
    cron: DEFAULT_MORNING_CRON,
  };

  writeFileSync(getFirstRunPath(), JSON.stringify(state, null, 2), 'utf-8');
  return state;
}
