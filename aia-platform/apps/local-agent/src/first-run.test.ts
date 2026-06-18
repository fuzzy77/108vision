import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { getDataDir } from './paths.js';
import {
  applyFirstRunDefaults,
  isFirstRunComplete,
  loadFirstRunState,
} from './first-run.js';

const FIRST_RUN_PATH = join(getDataDir(), 'first-run.json');
const SCHEDULE_PATH = join(getDataDir(), 'triage-schedule.json');

describe('first-run', () => {
  beforeEach(() => {
    if (!existsSync(getDataDir())) {
      mkdirSync(getDataDir(), { recursive: true });
    }
    if (existsSync(FIRST_RUN_PATH)) unlinkSync(FIRST_RUN_PATH);
    if (existsSync(SCHEDULE_PATH)) unlinkSync(SCHEDULE_PATH);
  });

  afterEach(() => {
    if (existsSync(FIRST_RUN_PATH)) unlinkSync(FIRST_RUN_PATH);
    if (existsSync(SCHEDULE_PATH)) unlinkSync(SCHEDULE_PATH);
  });

  it('applies defaults once and marks complete', () => {
    expect(isFirstRunComplete()).toBe(false);

    const state = applyFirstRunDefaults();
    expect(state).not.toBeNull();
    expect(state?.triageScheduleEnabled).toBe(true);
    expect(isFirstRunComplete()).toBe(true);

    const again = applyFirstRunDefaults();
    expect(again).toEqual(loadFirstRunState());
  });
});
