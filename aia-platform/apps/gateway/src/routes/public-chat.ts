import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { AppError } from '@aia/shared';
import { getEnv } from '../lib/env.js';
import { getRedis } from '../lib/redis.js';
import { apiKeyAuthMiddleware } from '../middleware/api-key-auth.js';

/**
 * Public assistant endpoint — no user login required, but key-authenticated.
 *
 * POST /api/public/chat
 *
 * Mounted outside the JWT-authenticated `/api` subtree so visitors can try the
 * 108 Vision assistant before creating an account. Access is gated by a
 * tenant-scoped API key (`X-API-Key`, hashed in DB via `apiKeyAuthMiddleware`),
 * so the endpoint is revocable and tenant-attributable instead of fully open.
 *
 * Deliberately lean:
 *  - a per-key rate limit (Redis, fail-open) bounds abuse/cost;
 *  - a fixed `fast-cheap` model keeps spend low;
 *  - the caller-supplied `system` prompt (the 108 Vision guardrail) is the only
 *    instruction, so no tenant RAG/memory/principles run.
 *
 * Callers should gate this behind the `/health/live` liveness probe.
 */
const publicChat = new Hono();

const requestSchema = z.object({
  message: z.string().min(1).max(32000),
  system: z.string().max(32000).optional(),
});

const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful AI assistant. Answer questions clearly and concisely. If you do not know the answer, say so honestly. Do not make up information.';

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MODEL = 'fast-cheap';

function clientIp(c: Context): string {
  return (
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    c.req.header('X-Real-IP') ||
    'unknown'
  );
}

publicChat.use('/chat', apiKeyAuthMiddleware);

publicChat.post('/chat', async (c) => {
  const body = await c.req.json();
  const input = requestSchema.parse(body);

  // Per-key rate limit (falls back to per-IP) — fail open if Redis is down.
  const apiKeyId = c.get('apiKeyId' as never) as string | undefined;
  const limitKey = apiKeyId ?? `ip:${clientIp(c)}`;
  const key = `ratelimit:public:${limitKey}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const redis = getRedis();

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}:${Math.random().toString(36).slice(2, 8)}`);
    pipeline.expire(key, 120);
    const results = await pipeline.exec();
    const currentCount = (results?.[1]?.[1] as number) ?? 0;

    if (currentCount >= RATE_LIMIT_MAX) {
      c.header('Retry-After', '60');
      return c.json(
        {
          title: 'RATE_LIMITED',
          detail: 'Troppe richieste. Riprova tra un minuto.',
        },
        429,
      );
    }
  } catch {
    // fail open — rate limiting is a safety net, not a hard dependency
  }

  const systemPrompt = input.system?.trim() || DEFAULT_SYSTEM_PROMPT;
  const env = getEnv();

  const response = await fetch(`${env.LITELLM_URL}/v1/chat/completions`, {
    signal: AbortSignal.timeout(90_000),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LITELLM_MASTER_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input.message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[LLM_ERROR] /public/chat status ${response.status}: ${errorBody}`);
    throw new AppError('LLM_ERROR', 'AI service temporarily unavailable', 502);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
    model?: string;
  };

  return c.json({
    content: data.choices?.[0]?.message?.content ?? '',
    model: data.model ?? MODEL,
    tokens: data.usage?.total_tokens ?? 0,
  });
});

export { publicChat };
