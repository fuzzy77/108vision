import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { AgentConfig } from '../config.js';
import { indexBuild } from './indexer.js';
import { contextAssemble } from './context.js';

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

describe('context.assemble', () => {
  it('returns markdown block with snippets', async () => {
    const dir = mkdtempSync(join(tmpdir(), '108ai-ctx-'));
    writeFileSync(join(dir, 'doc.md'), '## Payments\nTimeout policy is 10s.\n', 'utf-8');
    const cfg = makeConfig(dir);
    await indexBuild({ directory: dir, maxFiles: 50 }, cfg);

    const result = await contextAssemble({ directory: dir, query: 'timeout policy', topK: 3 }, cfg);
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.markdown).toMatch(/Local context/);
    expect(result.markdown).toMatch(/doc\.md/);
  });
});

