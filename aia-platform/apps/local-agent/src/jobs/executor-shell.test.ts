import { describe, expect, it } from 'vitest';

import { validateShellCommand } from '../capabilities/shell-security.js';
import type { AgentConfig } from '../config.js';

const shellConfig = {
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
  shellEnabled: true,
  shellBlocklist: [],
} satisfies AgentConfig;

describe('job shell sandbox policy', () => {
  it('blocks destructive chained commands used in job templates', () => {
    expect(() => validateShellCommand('echo ok && del /s /q C:\\', shellConfig)).toThrow();
  });

  it('allows simple read-only shell commands', () => {
    expect(() => validateShellCommand('git status', shellConfig)).not.toThrow();
  });
});
