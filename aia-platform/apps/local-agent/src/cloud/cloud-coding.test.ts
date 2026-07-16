/**
 * Integration test — Cloud Coding Session (E2B sandbox).
 *
 * REQUIRES:
 *   - E2B_API_KEY env variable set
 *   - ANTHROPIC_API_KEY env variable set (for LLM calls)
 *
 * Run with:
 *   E2B_API_KEY=xxx ANTHROPIC_API_KEY=xxx npx vitest run src/cloud/cloud-coding.test.ts
 *
 * This test creates a real sandbox, so it costs ~$0.01 per run and takes ~10-20s.
 * Skipped in CI unless E2B_API_KEY is present.
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  createCloudSession,
  runCloudCodingTask,
  destroySession,
  destroyAllSessions,
  getActiveSessions,
} from './session-manager.js';

const SKIP = !process.env['E2B_API_KEY'] || !process.env['ANTHROPIC_API_KEY'];

describe.skipIf(SKIP)('Cloud Coding Session (E2B)', () => {
  let sessionId: string;

  afterAll(async () => {
    await destroyAllSessions();
  });

  it('creates a sandbox session', async () => {
    sessionId = await createCloudSession({
      tenantId: 'test-tenant-001',
      timeoutMs: 120_000,
    });
    expect(sessionId).toContain('test-tenant-001');

    const active = getActiveSessions('test-tenant-001');
    expect(active).toHaveLength(1);
    expect(active[0]!.tenantId).toBe('test-tenant-001');
  }, 30_000);

  it('runs a coding task: create a file', async () => {
    const result = await runCloudCodingTask(
      sessionId,
      'Create a file at /workspace/hello.ts with content: export const greeting = "Hello from 108ai cloud sandbox";',
      { tier: 'fast-cheap', maxRoundtrips: 5 },
    );

    expect(result.response).toBeTruthy();
    expect(result.toolCalls.length).toBeGreaterThan(0);
    expect(result.usage.totalTokens).toBeGreaterThan(0);
    expect(result.sandboxId).toBeTruthy();
  }, 60_000);

  it('runs a coding task: read and verify the file', async () => {
    const result = await runCloudCodingTask(
      sessionId,
      'Read the file /workspace/hello.ts and tell me what it exports.',
      { tier: 'fast-cheap', maxRoundtrips: 3 },
    );

    expect(result.response.toLowerCase()).toContain('greeting');
  }, 30_000);

  it('runs a coding task: edit the file', async () => {
    const result = await runCloudCodingTask(
      sessionId,
      'Edit /workspace/hello.ts: change "Hello from 108ai cloud sandbox" to "Hello from 108ai — cloud edition". Then read the file back to verify.',
      { tier: 'fast-cheap', maxRoundtrips: 5 },
    );

    expect(result.response.toLowerCase()).toContain('cloud edition');
    expect(result.toolCalls.some((tc) => tc.name === 'editFile')).toBe(true);
  }, 60_000);

  it('runs a shell command', async () => {
    const result = await runCloudCodingTask(
      sessionId,
      'Run "node --version" in the shell and tell me the Node.js version.',
      { tier: 'fast-cheap', maxRoundtrips: 3 },
    );

    expect(result.response).toMatch(/v?\d+\.\d+/);
  }, 30_000);

  it('destroys the session', async () => {
    await destroySession(sessionId);
    const active = getActiveSessions('test-tenant-001');
    expect(active).toHaveLength(0);
  });
});
