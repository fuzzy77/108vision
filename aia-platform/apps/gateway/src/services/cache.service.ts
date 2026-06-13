import { createHash } from 'node:crypto';
import { getRedis } from '../lib/redis.js';

const CACHE_PREFIX = 'llm_cache';
const DEFAULT_TTL: Record<string, number> = {
  'fast-cheap': 3600,
  'balanced': 1800,
  'powerful': 0,
  'coding': 1800,
  'vision': 0,
  'embedding': 86400,
};

export interface CachedResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedAt: number;
}

function buildCacheKey(
  tenantId: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  contextChunks: string[],
): string {
  const payload = JSON.stringify({
    model,
    systemPrompt: systemPrompt.slice(0, 500),
    userMessage,
    context: contextChunks.slice(0, 5).map(c => c.slice(0, 200)),
  });
  const hash = createHash('sha256').update(payload).digest('hex').slice(0, 32);
  return `${CACHE_PREFIX}:${tenantId}:${model}:${hash}`;
}

export const cacheService = {
  async get(
    tenantId: string,
    model: string,
    systemPrompt: string,
    userMessage: string,
    contextChunks: string[],
  ): Promise<CachedResponse | null> {
    const ttl = DEFAULT_TTL[model] ?? 0;
    if (ttl === 0) return null;

    const key = buildCacheKey(tenantId, model, systemPrompt, userMessage, contextChunks);
    const redis = getRedis();

    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as CachedResponse;
    } catch {
      return null;
    }
  },

  async set(
    tenantId: string,
    model: string,
    systemPrompt: string,
    userMessage: string,
    contextChunks: string[],
    response: CachedResponse,
  ): Promise<void> {
    const ttl = DEFAULT_TTL[model] ?? 0;
    if (ttl === 0) return;

    const key = buildCacheKey(tenantId, model, systemPrompt, userMessage, contextChunks);
    const redis = getRedis();

    try {
      await redis.setex(key, ttl, JSON.stringify(response));
    } catch {
      // Cache write failure is non-critical
    }
  },

  async invalidateTenant(tenantId: string): Promise<void> {
    const redis = getRedis();
    try {
      const keys = await redis.keys(`${CACHE_PREFIX}:${tenantId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Non-critical
    }
  },
};
