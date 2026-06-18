/**
 * Local Agent REST routes — Manage and interact with on-premise local agents.
 *
 * These routes allow the chat/AI system to:
 * - Check if a local agent is connected for the current tenant
 * - Query what capabilities the agent provides
 * - Execute actions on the local agent (with risk validation)
 * - View execution history
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '@aia/shared';
import { getLocalAgentRegistry } from './local-agent.ws.js';

const localAgent = new Hono();

// --- Validation Schemas ---

const executeSchema = z.object({
  action: z.string().min(1).max(100),
  params: z.record(z.unknown()).default({}),
});

const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// In-memory action history (per-tenant, limited size)
const actionHistory = new Map<string, ActionHistoryEntry[]>();
const MAX_HISTORY_PER_TENANT = 200;

interface ActionHistoryEntry {
  id: string;
  action: string;
  params: Record<string, unknown>;
  result: unknown;
  error: string | null;
  executedAt: number;
  durationMs: number;
}

// --- Routes ---

/**
 * GET /api/integrations/local-agent/status — Check if local agent is connected.
 */
localAgent.get('/status', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const registry = getLocalAgentRegistry();
  const status = registry.getAgentStatus(tenantId);

  return c.json(status);
});

/**
 * GET /api/integrations/local-agent/capabilities — Get available capabilities.
 */
localAgent.get('/capabilities', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const registry = getLocalAgentRegistry();

  if (!registry.isAgentConnected(tenantId)) {
    throw new AppError(
      'LOCAL_AGENT_NOT_CONNECTED',
      'No local agent is currently connected for this tenant',
      503,
    );
  }

  const capabilities = registry.getAgentCapabilities(tenantId);

  return c.json({
    capabilities,
    count: capabilities.length,
  });
});

/**
 * POST /api/integrations/local-agent/execute — Execute an action on the local agent.
 */
localAgent.post('/execute', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = executeSchema.parse(await c.req.json());

  const registry = getLocalAgentRegistry();

  if (!registry.isAgentConnected(tenantId)) {
    throw new AppError(
      'LOCAL_AGENT_NOT_CONNECTED',
      'No local agent is currently connected for this tenant',
      503,
    );
  }

  // Validate that the action is within the agent's capabilities
  const capabilities = registry.getAgentCapabilities(tenantId);
  const internalPrefixes = ['triage.', 'jobs.'];
  const isInternal = internalPrefixes.some((p) => body.action.startsWith(p));
  if (
    capabilities.length > 0 &&
    !capabilities.includes(body.action) &&
    !isInternal
  ) {
    throw new AppError(
      'LOCAL_AGENT_CAPABILITY_MISSING',
      `The local agent does not support action: ${body.action}. Available: ${capabilities.join(', ')}`,
      400,
    );
  }

  const startTime = Date.now();
  let result: unknown;
  let durationMs = 0;

  try {
    result = await registry.executeAction(tenantId, body.action, body.params);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    durationMs = Date.now() - startTime;
    addToHistory(tenantId, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: body.action,
      params: sanitizeParamsForHistory(body.params),
      result: null,
      error: errorMsg,
      executedAt: startTime,
      durationMs,
    });

    throw new AppError(
      'LOCAL_AGENT_EXECUTION_FAILED',
      `Action "${body.action}" failed: ${errorMsg}`,
      502,
    );
  }

  durationMs = Date.now() - startTime;

  // Record successful execution in history
  const entry: ActionHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action: body.action,
    params: sanitizeParamsForHistory(body.params),
    result,
    error: null,
    executedAt: startTime,
    durationMs,
  };
  addToHistory(tenantId, entry);

  return c.json({
    action: body.action,
    result,
    durationMs,
  });
});

// --- Triage & Jobs (dashboard consulente) ---

async function requireConnectedAgent(tenantId: string) {
  const registry = getLocalAgentRegistry();
  if (!registry.isAgentConnected(tenantId)) {
    throw new AppError(
      'LOCAL_AGENT_NOT_CONNECTED',
      'No local agent is currently connected for this tenant',
      503,
    );
  }
  return registry;
}

/**
 * GET /api/integrations/local-agent/triage — Last triage report + schedule.
 */
localAgent.get('/triage', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const registry = await requireConnectedAgent(tenantId);

  const [report, schedule] = await Promise.all([
    registry.executeAction(tenantId, 'triage.lastReport', {}, 15_000),
    registry.executeAction(tenantId, 'triage.schedule', {}, 15_000),
  ]);

  return c.json({ report, schedule });
});

/**
 * POST /api/integrations/local-agent/triage/run — Run triage on the agent.
 */
localAgent.post('/triage/run', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const registry = await requireConnectedAgent(tenantId);

  const report = await registry.executeAction(tenantId, 'triage.run', {}, 120_000);

  return c.json({ report });
});

/**
 * GET /api/integrations/local-agent/jobs — List jobs with stats.
 */
localAgent.get('/jobs', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const registry = await requireConnectedAgent(tenantId);

  const [jobs, scheduler] = await Promise.all([
    registry.executeAction(tenantId, 'jobs.list', {}, 30_000),
    registry.executeAction(tenantId, 'jobs.scheduler', {}, 15_000),
  ]);

  return c.json({ jobs, scheduler });
});

/**
 * GET /api/integrations/local-agent/jobs/:id — Job detail + recent runs.
 */
localAgent.get('/jobs/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const jobId = c.req.param('id');
  const registry = await requireConnectedAgent(tenantId);

  const detail = await registry.executeAction(
    tenantId,
    'jobs.get',
    { id: jobId },
    30_000,
  );

  return c.json(detail);
});

/**
 * POST /api/integrations/local-agent/jobs/:id/run — Trigger job manually.
 */
localAgent.post('/jobs/:id/run', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const jobId = c.req.param('id');
  const registry = await requireConnectedAgent(tenantId);

  const result = await registry.executeAction(
    tenantId,
    'jobs.run',
    { id: jobId },
    180_000,
  );

  return c.json(result);
});

/**
 * GET /api/integrations/local-agent/history — View action execution history.
 */
localAgent.get('/history', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const query = historyQuerySchema.parse({
    page: c.req.query('page'),
    pageSize: c.req.query('pageSize'),
  });

  const history = actionHistory.get(tenantId) ?? [];
  const total = history.length;
  const offset = (query.page - 1) * query.pageSize;

  // History is stored newest-first
  const items = history.slice(offset, offset + query.pageSize);

  return c.json({
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: offset + items.length < total,
  });
});

/**
 * GET /api/integrations/local-agent/setup — Setup info for the local agent.
 * Returns download links and gateway connection details.
 * The new flow: download exe → double-click → OAuth login via browser → auto-connect.
 */
localAgent.get('/setup', async (c) => {
  const tenantId = c.get('tenantId') as string;

  const host = c.req.header('host') ?? 'localhost:3000';
  const wsProtocol = c.req.header('x-forwarded-proto') === 'https' ? 'wss' : 'ws';
  const httpProtocol = c.req.header('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const gatewayUrl = `${wsProtocol}://${host}/ws/local-agent`;
  const downloadBaseUrl = `${httpProtocol}://${host}/api/desktop-agent`;

  return c.json({
    gatewayUrl,
    tenantId,
    version: '0.3.0',
    downloads: {
      windows: `${downloadBaseUrl}/download/108ai-agent.exe`,
      macosIntel: `${downloadBaseUrl}/download/108ai-agent-macos-x64`,
      macosArm: `${downloadBaseUrl}/download/108ai-agent-macos-arm64`,
      linux: `${downloadBaseUrl}/download/108ai-agent-linux`,
    },
    instructions: [
      'Scarica l\'eseguibile per il tuo sistema operativo',
      'Avvia con doppio click (si apre in background nella system tray)',
      'Si apre il browser per il login — usa le stesse credenziali di 108 AI',
      'Pronto! L\'agente si connette automaticamente',
    ],
  });
});

// --- Helpers ---

function addToHistory(tenantId: string, entry: ActionHistoryEntry): void {
  if (!actionHistory.has(tenantId)) {
    actionHistory.set(tenantId, []);
  }

  const history = actionHistory.get(tenantId)!;
  history.unshift(entry); // newest first

  // Trim to max size
  if (history.length > MAX_HISTORY_PER_TENANT) {
    history.length = MAX_HISTORY_PER_TENANT;
  }
}

/**
 * Sanitize params for history storage — remove large/sensitive values.
 */
function sanitizeParamsForHistory(params: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = `[string, ${value.length} chars]`;
    } else if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export { localAgent as localAgentRouter };
