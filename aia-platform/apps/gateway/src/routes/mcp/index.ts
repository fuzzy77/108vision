/**
 * MCP (Model Context Protocol) server exposed via HTTP SSE transport.
 * Allows Claude Code, Cursor, Continue and other MCP-capable clients to access
 * tenant knowledge base, memories, agents, and documents.
 *
 * Auth: Bearer API key on the initial HTTP request (same keys as proxy endpoints).
 * Protocol: JSON-RPC over SSE (server→client) + POST (client→server).
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../../lib/db.js';
import { apiKeys, tenants } from '../../db/schema.js';
import { mcpTools } from './tools.js';
import { usageTrackingService } from '../../services/usage-tracking.service.js';

const mcpRouter = new Hono();

// Simple JSON-RPC types
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

async function resolveApiKeyTenant(rawKey: string): Promise<string | null> {
  const prefix = rawKey.slice(0, 10);
  const keyHash = hashKey(rawKey);
  const db = getDb();

  const [keyRecord] = await db
    .select({ tenantId: apiKeys.tenantId, keyHash: apiKeys.keyHash, revokedAt: apiKeys.revokedAt, expiresAt: apiKeys.expiresAt })
    .from(apiKeys)
    .where(eq(apiKeys.keyPrefix, prefix))
    .limit(1);

  if (!keyRecord || keyRecord.keyHash !== keyHash) return null;
  if (keyRecord.revokedAt !== null) return null;
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) return null;

  const [tenant] = await db
    .select({ id: tenants.id, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, keyRecord.tenantId))
    .limit(1);

  if (!tenant || (tenant.status !== 'active' && tenant.status !== 'trial')) return null;
  return tenant.id;
}

function extractKey(c: { req: { header: (name: string) => string | undefined; query: (name: string) => string | undefined } }): string | null {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  const queryToken = c.req.query('token');
  if (queryToken) return queryToken;
  return null;
}

// In-memory session store for SSE connections (maps sessionId → tenantId + message queue)
const sessions = new Map<string, { tenantId: string; messageQueue: JsonRpcRequest[]; resolve?: (msg: JsonRpcRequest) => void }>();

/**
 * GET /mcp — Establish SSE connection (Streamable HTTP MCP transport)
 * Client connects here to receive responses. Server sends JSON-RPC responses as SSE events.
 */
mcpRouter.get('/', async (c) => {
  const rawKey = extractKey(c);
  if (!rawKey) {
    return c.json({ error: { message: 'API key required', type: 'authentication_error' } }, 401);
  }

  const tenantId = await resolveApiKeyTenant(rawKey);
  if (!tenantId) {
    return c.json({ error: { message: 'Invalid or inactive API key', type: 'authentication_error' } }, 401);
  }

  const sessionId = crypto.randomUUID();

  return streamSSE(c, async (stream) => {
    sessions.set(sessionId, { tenantId, messageQueue: [] });

    // Send session ID as first event
    await stream.writeSSE({
      event: 'endpoint',
      data: `/mcp?sessionId=${sessionId}`,
    });

    // Keep connection alive with periodic pings
    const pingInterval = setInterval(async () => {
      try {
        await stream.writeSSE({ event: 'ping', data: '' });
      } catch {
        clearInterval(pingInterval);
      }
    }, 30_000);

    // Wait for messages (simplified: poll-based for now)
    try {
      while (true) {
        const session = sessions.get(sessionId);
        if (!session) break;

        const msg = session.messageQueue.shift();
        if (msg) {
          const response = await handleJsonRpc(msg, tenantId);
          await stream.writeSSE({
            event: 'message',
            data: JSON.stringify(response),
          });
        } else {
          // Wait a bit before checking again
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    } finally {
      clearInterval(pingInterval);
      sessions.delete(sessionId);
    }
  });
});

/**
 * POST /mcp — Receive JSON-RPC messages from client
 */
mcpRouter.post('/', async (c) => {
  const rawKey = extractKey(c);
  const sessionId = c.req.query('sessionId');

  // If sessionId provided, queue message to existing session
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      return c.json({ error: { message: 'Session not found or expired', type: 'invalid_request_error' } }, 404);
    }

    const body = await c.req.json() as JsonRpcRequest;
    session.messageQueue.push(body);
    return c.json({ ok: true });
  }

  // Stateless mode: auth + handle immediately
  if (!rawKey) {
    return c.json({ error: { message: 'API key required', type: 'authentication_error' } }, 401);
  }

  const tenantId = await resolveApiKeyTenant(rawKey);
  if (!tenantId) {
    return c.json({ error: { message: 'Invalid API key', type: 'authentication_error' } }, 401);
  }

  const body = await c.req.json() as JsonRpcRequest;
  const response = await handleJsonRpc(body, tenantId);
  return c.json(response);
});

async function handleJsonRpc(req: JsonRpcRequest, tenantId: string): Promise<JsonRpcResponse> {
  switch (req.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: '108ai-gateway',
            version: '1.0.0',
          },
        },
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          tools: mcpTools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        },
      };

    case 'tools/call': {
      const params = req.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
      const toolName = params?.name;
      const toolArgs = params?.arguments ?? {};

      const tool = mcpTools.find((t) => t.name === toolName);
      if (!tool) {
        return {
          jsonrpc: '2.0',
          id: req.id,
          error: { code: -32601, message: `Tool '${toolName}' not found` },
        };
      }

      try {
        const result = await tool.handler(toolArgs, tenantId);

        // Track MCP tool usage
        usageTrackingService.trackRequest({
          tenantId,
          model: 'mcp',
          inputTokens: 0,
          outputTokens: 0,
          requestType: 'proxy_mcp',
        }).catch(() => {});

        return {
          jsonrpc: '2.0',
          id: req.id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          },
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id: req.id,
          error: { code: -32000, message: err instanceof Error ? err.message : 'Tool execution failed' },
        };
      }
    }

    case 'notifications/initialized':
    case 'ping':
      return { jsonrpc: '2.0', id: req.id, result: {} };

    default:
      return {
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32601, message: `Method '${req.method}' not supported` },
      };
  }
}

export { mcpRouter };
