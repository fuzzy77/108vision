import { Hono } from 'hono';
import { getPool } from '../lib/db.js';
import { getRedis } from '../lib/redis.js';
import { getQdrant } from '../lib/qdrant.js';
import { createAIClient } from '@aia/ai-client';
import { healthCheck as neo4jHealthCheck } from '@aia/graph';
import { getEnv } from '../lib/env.js';

const health = new Hono();

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: Record<string, { status: 'pass' | 'fail'; latencyMs?: number; message?: string }>;
}

/**
 * GET /health — Readiness probe.
 * Returns healthy only if all critical dependencies are reachable.
 */
health.get('/', async (c) => {
  const checks: HealthCheck['checks'] = {};
  let overallHealthy = true;

  // PostgreSQL check
  const pgStart = Date.now();
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    checks['postgresql'] = { status: 'pass', latencyMs: Date.now() - pgStart };
  } catch (error) {
    checks['postgresql'] = {
      status: 'fail',
      latencyMs: Date.now() - pgStart,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    overallHealthy = false;
  }

  // Redis check
  const redisStart = Date.now();
  try {
    const redis = getRedis();
    await redis.ping();
    checks['redis'] = { status: 'pass', latencyMs: Date.now() - redisStart };
  } catch (error) {
    checks['redis'] = {
      status: 'fail',
      latencyMs: Date.now() - redisStart,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    overallHealthy = false;
  }

  // Qdrant check
  const qdrantStart = Date.now();
  try {
    const qdrant = getQdrant();
    await qdrant.getCollections();
    checks['qdrant'] = { status: 'pass', latencyMs: Date.now() - qdrantStart };
  } catch (error) {
    checks['qdrant'] = {
      status: 'fail',
      latencyMs: Date.now() - qdrantStart,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    overallHealthy = false;
  }

  // LiteLLM check
  const llmStart = Date.now();
  try {
    const env = getEnv();
    const aiClient = createAIClient({
      baseUrl: env.LITELLM_URL,
      apiKey: env.LITELLM_MASTER_KEY,
      timeoutMs: 5000,
    });
    const isHealthy = await aiClient.health();
    checks['litellm'] = isHealthy
      ? { status: 'pass', latencyMs: Date.now() - llmStart }
      : { status: 'fail', latencyMs: Date.now() - llmStart, message: 'Health check returned false' };
    if (!isHealthy) overallHealthy = false;
  } catch (error) {
    checks['litellm'] = {
      status: 'fail',
      latencyMs: Date.now() - llmStart,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
    overallHealthy = false;
  }

  // Neo4j check (non-critical: graph is supplementary)
  const neo4jStart = Date.now();
  try {
    const isHealthy = await neo4jHealthCheck();
    checks['neo4j'] = isHealthy
      ? { status: 'pass', latencyMs: Date.now() - neo4jStart }
      : { status: 'fail', latencyMs: Date.now() - neo4jStart, message: 'Health check returned false' };
    // Neo4j failure does NOT make overall status unhealthy (it's supplementary)
  } catch (error) {
    checks['neo4j'] = {
      status: 'fail',
      latencyMs: Date.now() - neo4jStart,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }

  const response: HealthCheck = {
    status: overallHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };

  return c.json(response, overallHealthy ? 200 : 503);
});

/**
 * GET /health/live — Liveness probe.
 * Returns 200 if the process is running. No dependency checks.
 */
health.get('/live', (c) => {
  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { health };
