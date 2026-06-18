import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { AgentConfig } from '../config.js';
import { indexBuild, indexSearch, indexStatus, indexClear } from './indexer.js';

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
    shellEnabled: false,
    gitEnabled: true,
    gitAllowPush: false,
    gitAllowDestructive: false,
  };
}

describe('indexer', () => {
  it('builds, searches, status and clears', async () => {
    const dir = mkdtempSync(join(tmpdir(), '108ai-index-'));
    writeFileSync(join(dir, 'alpha.md'), '# Alpha\nhello world\n', 'utf-8');
    writeFileSync(join(dir, 'beta.ts'), 'export function beta() { return 42 }\n', 'utf-8');

    const cfg = makeConfig(dir);
    const build = await indexBuild({ directory: dir, maxFiles: 50 }, cfg);
    expect(build.directory).toBe(dir);
    expect(build.chunkCount).toBeGreaterThan(0);

    const status = indexStatus({ directory: dir }, cfg);
    expect(status.exists).toBe(true);
    expect(status.chunkCount).toBeGreaterThan(0);

    const search = await indexSearch({ directory: dir, query: 'beta function', topK: 5 }, cfg);
    expect(search.results.length).toBeGreaterThan(0);
    expect(search.results.some((r) => r.relativePath.includes('beta.ts'))).toBe(true);

    const cleared = indexClear({ directory: dir }, cfg);
    expect(cleared.cleared).toBe(true);
  });
});

