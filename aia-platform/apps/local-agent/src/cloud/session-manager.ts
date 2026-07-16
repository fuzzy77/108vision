/**
 * Cloud Coding Session Manager — Orchestrates sandbox lifecycle per-tenant.
 *
 * Manages: creation, caching, timeout, cleanup.
 * Sessions are ephemeral but can be kept alive for workspace persistence.
 */

import type { ModelMessage } from 'ai';
import { callDirectLlm, type ModelTier } from '../llm/ai-sdk-direct.js';
import { createSandboxCodingTools } from './sandbox-tools.js';
import type { Sandbox } from './sandbox.js';
import { createE2BSandbox } from './e2b-provider.js';

export interface CloudSessionOptions {
  tenantId: string;
  repoUrl?: string;
  branch?: string;
  template?: string;
  tier?: ModelTier;
  model?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface CloudCodingResult {
  response: string;
  toolCalls: Array<{ name: string; args: unknown; result: unknown }>;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  model: string;
  roundtrips: number;
  sandboxId: string;
}

interface ManagedSession {
  sandbox: Sandbox;
  tenantId: string;
  createdAt: number;
  lastUsed: number;
}

const sessions = new Map<string, ManagedSession>();

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 min idle timeout
const CLEANUP_INTERVAL_MS = 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export async function createCloudSession(opts: CloudSessionOptions): Promise<string> {
  const sandbox = await createE2BSandbox({
    template: opts.template ?? '108ai-workspace',
    timeout: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    env: opts.env,
    metadata: { tenantId: opts.tenantId },
  });

  // Clone repo if provided
  if (opts.repoUrl) {
    const branchFlag = opts.branch ? `-b ${opts.branch}` : '';
    await sandbox.process.exec(
      `git clone --depth 1 ${branchFlag} ${opts.repoUrl} /workspace`,
      { timeout: 120_000 },
    );
  }

  // Install dependencies if package.json exists
  const hasPackageJson = await sandbox.filesystem.exists('/workspace/package.json');
  if (hasPackageJson) {
    await sandbox.process.exec('cd /workspace && npm install --prefer-offline', {
      timeout: 120_000,
    });
  }

  const sessionId = `${opts.tenantId}:${sandbox.id}`;
  sessions.set(sessionId, {
    sandbox,
    tenantId: opts.tenantId,
    createdAt: Date.now(),
    lastUsed: Date.now(),
  });

  startCleanupIfNeeded();
  return sessionId;
}

export async function runCloudCodingTask(
  sessionId: string,
  task: string,
  opts?: { tier?: ModelTier; model?: string; context?: string; maxRoundtrips?: number },
): Promise<CloudCodingResult> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  session.lastUsed = Date.now();

  const tools = createSandboxCodingTools(session.sandbox);
  const messages: ModelMessage[] = [];

  if (opts?.context) {
    messages.push({ role: 'user', content: opts.context });
    messages.push({ role: 'assistant', content: 'Understood. Ready for the task.' });
  }
  messages.push({ role: 'user', content: task });

  const system = `You are a skilled software engineer working in a cloud sandbox.
The workspace is at /workspace. You have tools to read, write, edit files, search code, and run shell commands.

Guidelines:
- Read files BEFORE editing to understand context
- Use editFile for surgical modifications (fuzzy matching handles whitespace differences)
- Use writeFile only for new files
- After editing, verify the change (re-read or run tests)
- The shell tool runs in a Linux environment with common dev tools installed
- Be concise in your final response — report what you did and any issues found`;

  const result = await callDirectLlm({
    messages,
    system,
    tier: opts?.tier ?? 'coding',
    model: opts?.model,
    tools,
    maxToolRoundtrips: opts?.maxRoundtrips ?? 15,
    maxTokens: 8192,
  });

  return {
    response: result.text,
    toolCalls: result.toolCalls,
    usage: result.usage,
    model: result.model,
    roundtrips: result.roundtrips,
    sandboxId: session.sandbox.id,
  };
}

export async function destroySession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (session) {
    await session.sandbox.destroy();
    sessions.delete(sessionId);
  }
}

export async function destroyAllSessions(): Promise<void> {
  for (const [id] of sessions) {
    await destroySession(id);
  }
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

export function getActiveSessions(tenantId?: string): Array<{
  sessionId: string;
  sandboxId: string;
  tenantId: string;
  ageMs: number;
  idleMs: number;
}> {
  const now = Date.now();
  const result: Array<{
    sessionId: string;
    sandboxId: string;
    tenantId: string;
    ageMs: number;
    idleMs: number;
  }> = [];

  for (const [sessionId, session] of sessions) {
    if (tenantId && session.tenantId !== tenantId) continue;
    result.push({
      sessionId,
      sandboxId: session.sandbox.id,
      tenantId: session.tenantId,
      ageMs: now - session.createdAt,
      idleMs: now - session.lastUsed,
    });
  }
  return result;
}

// --- Cleanup idle sessions ---

function startCleanupIfNeeded(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(async () => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.lastUsed > DEFAULT_TIMEOUT_MS) {
        await destroySession(id);
      }
    }
    if (sessions.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);
}
