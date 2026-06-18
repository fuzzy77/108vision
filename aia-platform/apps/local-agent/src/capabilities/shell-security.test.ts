import { describe, expect, it } from 'vitest';

import {
  assertShellEnabled,
  validateShellCommand,
} from './shell-security.js';
import { performSecurityCheck } from '../security.js';
import type { AgentConfig } from '../config.js';

const config = {
  gatewayUrl: '',
  authToken: '',
  tenantId: '',
  allowedDirectories: [process.cwd()],
  autoStart: false,
  riskPreferences: {
    autoApproveReadOnly: true,
    autoApproveLowRisk: true,
    requireApprovalHighRisk: false,
  },
  maxActionsPerMinute: 100,
  desktopEnabled: false,
  desktopVisionEnabled: false,
  screenshotBeforeAction: false,
  shellEnabled: false,
  shellBlocklist: [],
} satisfies AgentConfig;

describe('shell-security', () => {
  it('rejects shell when disabled', () => {
    expect(() => assertShellEnabled(config)).toThrow(/disabled/);
  });

  it('blocks command chaining with &&', () => {
    expect(() => validateShellCommand('echo ok && rm -rf /', {
      ...config,
      shellEnabled: true,
    })).toThrow(/Logical chaining/);
  });

  it('allows safe piped grep', () => {
    expect(() => validateShellCommand('git status | grep modified', {
      ...config,
      shellEnabled: true,
    })).not.toThrow();
  });

  it('performSecurityCheck blocks shell.execute when shellEnabled false', () => {
    const check = performSecurityCheck(
      'shell.execute',
      { command: 'echo hi', cwd: process.cwd() },
      config,
    );
    expect(check.allowed).toBe(false);
    expect(check.reason).toMatch(/disabled/);
  });
});
