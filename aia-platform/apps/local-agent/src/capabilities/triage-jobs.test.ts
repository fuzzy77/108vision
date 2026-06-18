import { describe, it, expect } from 'vitest';
import { triageJobsHandlers } from './triage-jobs.js';
import type { AgentConfig } from '../config.js';

const stubConfig = {
  gatewayUrl: '',
  authToken: '',
  tenantId: '',
  allowedDirectories: [],
  autoStart: false,
  riskPreferences: {
    autoApproveReadOnly: true,
    autoApproveLowRisk: true,
    requireApprovalHighRisk: true,
  },
  maxActionsPerMinute: 10,
  desktopEnabled: false,
  desktopVisionEnabled: true,
  screenshotBeforeAction: true,
} satisfies AgentConfig;

describe('triage-jobs capabilities', () => {
  it('registers expected actions', () => {
    expect(triageJobsHandlers.has('triage.schedule')).toBe(true);
    expect(triageJobsHandlers.has('jobs.list')).toBe(true);
    expect(triageJobsHandlers.has('jobs.run')).toBe(true);
  });

  it('triage.schedule returns schedule shape', async () => {
    const handler = triageJobsHandlers.get('triage.schedule');
    const result = await handler!({}, stubConfig) as {
      enabled: boolean;
      cron: string;
    };
    expect(typeof result.enabled).toBe('boolean');
    expect(typeof result.cron).toBe('string');
  });

  it('jobs.list returns array', async () => {
    const handler = triageJobsHandlers.get('jobs.list');
    const result = await handler!({}, stubConfig);
    expect(Array.isArray(result)).toBe(true);
  });
});
