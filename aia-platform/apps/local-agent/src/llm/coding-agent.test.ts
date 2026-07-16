/**
 * Integration test — Local Coding Agent (no sandbox, runs on local filesystem).
 *
 * REQUIRES:
 *   - ANTHROPIC_API_KEY env variable set
 *
 * Run with:
 *   ANTHROPIC_API_KEY=xxx npx vitest run src/llm/coding-agent.test.ts
 *
 * This test creates real files in a temp directory and makes real LLM calls.
 * Cost: ~$0.01-0.03 per run (uses fast-cheap tier).
 * Skipped in CI unless ANTHROPIC_API_KEY is present.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCodingAgent } from './coding-agent.js';
import type { AgentConfig } from '../config.js';

const SKIP = !process.env['ANTHROPIC_API_KEY'];

describe.skipIf(SKIP)('Coding Agent (local, end-to-end)', () => {
  let workDir: string;
  let config: AgentConfig;

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), '108ai-test-'));
    config = {
      allowedDirectories: [workDir],
      shellEnabled: true,
      desktopEnabled: false,
      desktopVisionEnabled: false,
      maxFileSize: 10 * 1024 * 1024,
      agentId: 'test-agent',
      tenantId: 'test-tenant',
      gatewayUrl: 'http://localhost:3000',
      authToken: 'test-token',
      autoStart: false,
      riskPreferences: { maxRiskLevel: 'medium' },
      extensions: {},
      logLevel: 'info',
    } as unknown as AgentConfig;
  });

  afterAll(() => {
    if (workDir && existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it('creates a file when asked', async () => {
    const result = await runCodingAgent({
      task: `Create a file at ${workDir}/test-output.ts with this exact content:\nexport const answer = 42;\n`,
      config,
      tier: 'fast-cheap',
      maxRoundtrips: 5,
    });

    expect(result.response).toBeTruthy();
    expect(result.toolCalls.length).toBeGreaterThan(0);

    const filePath = join(workDir, 'test-output.ts');
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('export const answer = 42');
  }, 60_000);

  it('reads and edits a file', async () => {
    const result = await runCodingAgent({
      task: `Read the file ${workDir}/test-output.ts, then edit it to change the value from 42 to 108. Verify by reading again.`,
      config,
      tier: 'fast-cheap',
      maxRoundtrips: 8,
    });

    expect(result.response).toBeTruthy();
    const content = readFileSync(join(workDir, 'test-output.ts'), 'utf-8');
    expect(content).toContain('108');
    expect(content).not.toContain('42');
  }, 60_000);

  it('runs shell commands', async () => {
    const result = await runCodingAgent({
      task: `Run "echo hello-108ai" in the shell and report what you see.`,
      config,
      tier: 'fast-cheap',
      maxRoundtrips: 3,
    });

    expect(result.response.toLowerCase()).toContain('hello');
    expect(result.toolCalls.some((tc) => tc.name === 'shell')).toBe(true);
  }, 30_000);

  it('uses grep to search', async () => {
    const result = await runCodingAgent({
      task: `Search for the string "108" in ${workDir} and tell me which file contains it.`,
      config,
      tier: 'fast-cheap',
      maxRoundtrips: 5,
    });

    expect(result.response).toContain('test-output');
  }, 30_000);

  it('reports token usage', async () => {
    const result = await runCodingAgent({
      task: `List the files in ${workDir}`,
      config,
      tier: 'fast-cheap',
      maxRoundtrips: 3,
    });

    expect(result.usage.inputTokens).toBeGreaterThan(0);
    expect(result.usage.outputTokens).toBeGreaterThan(0);
    expect(result.model).toContain('anthropic');
  }, 30_000);
});
