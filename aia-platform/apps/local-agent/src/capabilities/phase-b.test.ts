import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { executeAction, getRegisteredActions } from './index.js';
import type { AgentConfig } from '../config.js';

function makeConfig(root: string): AgentConfig {
  return {
    gatewayUrl: '',
    authToken: '',
    tenantId: '',
    allowedDirectories: [root],
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
    gitEnabled: true,
    gitAllowPush: false,
    gitAllowDestructive: false,
  };
}

describe('Phase B capabilities registry', () => {
  it('registers git, code, search, web, process actions', () => {
    const actions = getRegisteredActions();
    for (const action of [
      'git.status',
      'code.readRange',
      'search.grep',
      'web.fetch',
      'shell.executeStream',
      'process.list',
    ]) {
      expect(actions).toContain(action);
    }
  });
});

describe('code.readRange', () => {
  it('returns line slice from file', async () => {
    const dir = mkdtempSync(join(tmpdir(), '108ai-code-'));
    const filePath = join(dir, 'sample.ts');
    writeFileSync(filePath, 'line1\nline2\nline3\n', 'utf-8');

    const result = await executeAction(
      'code.readRange',
      { filePath, startLine: 2, endLine: 2 },
      makeConfig(dir),
    );

    expect(result.success).toBe(true);
    const body = result.result as { lines: Array<{ line: number; text: string }> };
    expect(body.lines).toEqual([{ line: 2, text: 'line2' }]);
  });
});

describe('search.find', () => {
  it('finds files by name pattern', async () => {
    const dir = mkdtempSync(join(tmpdir(), '108ai-find-'));
    writeFileSync(join(dir, 'alpha.txt'), 'a', 'utf-8');
    writeFileSync(join(dir, 'beta.log'), 'b', 'utf-8');

    const result = await executeAction(
      'search.find',
      { path: dir, name: '*.txt', type: 'file' },
      makeConfig(dir),
    );

    expect(result.success).toBe(true);
    const body = result.result as { results: string[] };
    expect(body.results.some((p) => p.endsWith('alpha.txt'))).toBe(true);
    expect(body.results.some((p) => p.endsWith('beta.log'))).toBe(false);
  });
});

describe('process.list', () => {
  it('returns empty or running process list', async () => {
    const result = await executeAction('process.list', {}, makeConfig(process.cwd()));
    expect(result.success).toBe(true);
    const body = result.result as { processes: unknown[] };
    expect(Array.isArray(body.processes)).toBe(true);
  });
});
