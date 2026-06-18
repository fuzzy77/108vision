import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { nanoid } from 'nanoid';
import type { IncomingMessage } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { jwtVerify } from 'jose';
import { loadEnv } from './lib/env.js';
import { getRedis, closeRedis } from './lib/redis.js';
import { closeDb } from './lib/db.js';
import { errorHandler } from './middleware/error-handler.js';
import { authMiddlewareV2 } from './middleware/auth-v2.js';
import { apiKeyAuthMiddleware } from './middleware/api-key-auth.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { health } from './routes/health.js';
import { auth as authRoutes } from './routes/auth.js';
import { chat } from './routes/chat.js';
import { conversations } from './routes/conversations.js';
import { knowledge } from './routes/knowledge.js';
import { agentsRouter } from './routes/agents.js';
import { adminRouter } from './routes/admin/index.js';
import { integrationsRouter } from './routes/integrations/index.js';
import { startIngestionWorker, stopIngestionWorker } from './jobs/ingestion.worker.js';
import { startGraphExtractionWorker, stopGraphExtractionWorker } from './jobs/graph-ingestion.worker.js';
import { graph } from './routes/graph.js';
import { tenantRouter } from './routes/tenant.js';
import { memoryRouter } from './routes/memory.js';
import { desktopAgentDownload } from './routes/desktop-agent-download.js';
import { connect as connectNeo4j, close as closeNeo4j, initializeGraphSchema } from '@aia/graph';
import {
  getLocalAgentRegistry,
  shutdownLocalAgentRegistry,
} from './routes/integrations/local-agent.ws.js';

// --- Bootstrap ---

const env = loadEnv();

const app = new Hono();

// --- Global Middleware ---

// Request ID
app.use('*', async (c, next) => {
  const requestId = c.req.header('X-Request-ID') ?? nanoid(21);
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
});

// CORS
app.use('*', cors({
  origin: env.NODE_ENV === 'production'
    ? (origin) => {
        const allowed = (env.CORS_ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
        return allowed.includes(origin) ? origin : allowed[0] ?? null;
      }
    : '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID', 'X-API-Key'],
  exposeHeaders: ['X-Request-ID'],
  maxAge: 86400,
}));

// Request logging (structured JSON in production)
if (env.NODE_ENV === 'development') {
  app.use('*', logger());
} else {
  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      level: 'info',
      message: 'request',
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: duration,
      requestId: c.get('requestId'),
    }));
  });
}

// --- Error Handler ---
app.onError(errorHandler);

// --- Routes ---

// Health checks (no auth required)
app.route('/health', health);

// Auth routes (no auth required — login, register, etc.)
app.route('/api/auth', authRoutes);

// Desktop Agent download (no auth required — user downloads before login)
app.route('/api/desktop-agent', desktopAgentDownload);

// Protected API routes
const api = new Hono();
api.use('*', async (c, next) => {
  if (c.req.header('X-API-Key')) {
    return apiKeyAuthMiddleware(c, next);
  }
  return authMiddlewareV2(c, next);
});

// Admin routes: auth required, but NO tenant middleware (admin operates cross-tenant)
api.route('/admin', adminRouter);

// Tenant-scoped routes: auth + tenant middleware
const tenantApi = new Hono();
tenantApi.use('*', tenantMiddleware);
tenantApi.route('/chat', chat);
tenantApi.route('/conversations', conversations);
tenantApi.route('/knowledge', knowledge);
tenantApi.route('/agents', agentsRouter);
tenantApi.route('/integrations', integrationsRouter);
tenantApi.route('/graph', graph);
tenantApi.route('/tenant', tenantRouter);
tenantApi.route('/memory', memoryRouter);

api.route('/', tenantApi);

app.route('/api', api);

// --- 404 Handler ---
app.notFound((c) => {
  return c.json({
    type: 'https://aia.platform/errors/not_found',
    title: 'NOT_FOUND',
    status: 404,
    detail: `Route ${c.req.method} ${c.req.path} not found`,
    instance: c.req.path,
  }, 404);
});

// --- Server Start ---

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

// --- Local Agent WebSocket Server ---
//
// Mounts a WebSocket server on /ws/local-agent on the same HTTP port.
// Local agents authenticate via ?token=<jwt> query param on the upgrade request.
// The WS server piggybacks on the HTTP server via the 'upgrade' event.

const wss = new WebSocketServer({ noServer: true });
const localAgentRegistry = getLocalAgentRegistry();

// The 'connection' event listener is cast because we emit with an extra tenantId
// argument (a standard pattern when using ws with noServer:true + manual emit).
(wss as { on: (event: 'connection', handler: (ws: WebSocket, tenantId: string) => void) => void })
  .on('connection', (ws: WebSocket, tenantId: string) => {
    const agentId = localAgentRegistry.registerAgent(tenantId, {
      send: (data: string) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(data);
        }
      },
      close: (code?: number, reason?: string) => ws.close(code, reason),
      get readyState() { return ws.readyState; },
    });

    ws.on('message', (raw: Buffer | string) => {
      localAgentRegistry.handleMessage(agentId, raw.toString());
    });

    ws.on('close', () => {
      localAgentRegistry.disconnectAgent(agentId);
    });

    ws.on('error', (err: Error) => {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Local agent WebSocket error',
        agentId,
        error: err.message,
      }));
      localAgentRegistry.disconnectAgent(agentId);
    });
  });

// Attach WS upgrade handler to the HTTP server returned by @hono/node-server.
// The server value is the Node.js http.Server instance wrapped by @hono/node-server.
// We use a typed upgrade handler callback matching Node's http.Server 'upgrade' event.

type UpgradeHandler = (
  req: IncomingMessage,
  socket: import('node:stream').Duplex,
  head: Buffer,
) => void;

const upgradeHandler: UpgradeHandler = (req, socket, head) => {
  void (async () => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (url.pathname !== '/ws/local-agent') {
    // Not our upgrade path — destroy the socket
    socket.destroy();
    return;
  }

  // Extract the auth token from the query param (?token=<jwt>)
  const token = url.searchParams.get('token');
  if (!token) {
    socket.destroy();
    return;
  }

  // Verify the JWT signature and extract tenantId.
  // ws is not yet created here (pre-upgrade), so on failure we destroy the socket
  // with a 4001 close code written to the raw stream before destroying.
  let tenantId: string | null = null;
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    tenantId = (payload.tenantId as string) ?? null;
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  if (!tenantId) {
    socket.destroy();
    return;
  }

  const resolvedTenantId = tenantId;
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, resolvedTenantId);
  });
  })();
};

(server as unknown as { on: (event: 'upgrade', handler: UpgradeHandler) => void })
  .on('upgrade', upgradeHandler);

console.log(JSON.stringify({
  level: 'info',
  message: 'AIA Gateway started',
  port: env.PORT,
  environment: env.NODE_ENV,
}));

// Connect Redis eagerly
const redis = getRedis();
redis.connect().catch((err) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Redis connection failed',
    error: err instanceof Error ? err.message : String(err),
  }));
});

// Connect Neo4j (non-blocking: graph is supplementary)
connectNeo4j({ url: env.NEO4J_URL, user: env.NEO4J_USER, password: env.NEO4J_PASSWORD });
initializeGraphSchema().then((result) => {
  if (result.success) {
    console.log(JSON.stringify({ level: 'info', message: 'Neo4j graph schema initialized' }));
  } else {
    console.error(JSON.stringify({ level: 'warn', message: 'Neo4j schema init failed (non-critical)', error: result.error.message }));
  }
}).catch((err) => {
  console.error(JSON.stringify({ level: 'warn', message: 'Neo4j connection failed (non-critical)', error: err instanceof Error ? err.message : String(err) }));
});

// Start background workers
const ingestionWorker = startIngestionWorker();
const graphWorker = startGraphExtractionWorker();

// --- Graceful Shutdown ---

async function shutdown(signal: string): Promise<void> {
  console.log(JSON.stringify({
    level: 'info',
    message: `Received ${signal}, shutting down gracefully`,
  }));

  // Stop accepting new connections
  server.close();

  // Shutdown WebSocket server and local agent registry
  shutdownLocalAgentRegistry();
  wss.close();

  // Stop workers
  await stopIngestionWorker();
  await stopGraphExtractionWorker();

  // Close connections
  await closeNeo4j();
  await closeRedis();
  await closeDb();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Shutdown complete',
  }));

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Unhandled rejection',
    error: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  }));
});

process.on('uncaughtException', (error) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Uncaught exception',
    error: error.message,
    stack: error.stack,
  }));
  process.exit(1);
});

export { app };
