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
  if (capabilities.length > 0 && !capabilities.includes(body.action)) {
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
