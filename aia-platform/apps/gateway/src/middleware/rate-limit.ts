import type { Context, Next } from 'hono';
import { getRedis } from '../lib/redis.js';

const PLAN_RATE_LIMITS: Record<string, number> = {
  starter: 20,
  growth: 60,
  scale: 200,
  unlimited: 1000,
};

const WINDOW_MS = 60_000;

export async function proxyRateLimitMiddleware(c: Context, next: Next): Promise<void | Response> {
  const tenantId = c.get('tenantId' as never) as string;
  const tenantPlan = (c.get('tenantPlan' as never) as string) ?? 'growth';

  const maxRequests = PLAN_RATE_LIMITS[tenantPlan] ?? PLAN_RATE_LIMITS['growth']!;
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const key = `ratelimit:proxy:${tenantId}`;

  const redis = getRedis();

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}:${Math.random().toString(36).slice(2, 8)}`);
    pipeline.expire(key, 120);

    const results = await pipeline.exec();
    const currentCount = (results?.[1]?.[1] as number) ?? 0;

    if (currentCount >= maxRequests) {
      const retryAfter = Math.ceil(WINDOW_MS / 1000);
      c.header('Retry-After', String(retryAfter));
      c.header('X-RateLimit-Limit', String(maxRequests));
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(Math.ceil((now + WINDOW_MS) / 1000)));

      return c.json(
        {
          error: {
            message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`,
            type: 'rate_limit_error',
            code: 'rate_limit_exceeded',
          },
        },
        429,
      );
    }

    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - currentCount - 1)));
    c.header('X-RateLimit-Reset', String(Math.ceil((now + WINDOW_MS) / 1000)));
  } catch {
    // Fail open: if Redis is unavailable, allow the request through
  }

  await next();
}
