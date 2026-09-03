import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { getEnv } from '../lib/env.js';
import { getRedis } from '../lib/redis.js';

/**
 * Public lead-capture endpoint — newsletter / lead-magnet signup from the
 * marketing site (www.108vision.it), proxied by nginx (`/api/subscribe`).
 *
 * POST /api/public/lead/subscribe
 * Body: { email, firstName, listId?, pdfSlug? }
 *
 * Pushes the contact to Brevo (updateEnabled → idempotent on duplicates).
 * No auth (public form) — bounded by a per-IP rate limit (Redis, fail-open)
 * and strict Zod validation. Errors are generic: no PII in responses/logs.
 */
const publicLead = new Hono();

const subscribeSchema = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(100),
  listId: z.number().int().positive().optional().default(3),
  pdfSlug: z.string().trim().max(120).optional(),
});

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function clientIp(c: Context): string {
  return (
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    c.req.header('X-Real-IP') ||
    'unknown'
  );
}

publicLead.post('/subscribe', async (c) => {
  // Per-IP rate limit — fail open if Redis is down.
  const key = `ratelimit:lead:ip:${clientIp(c)}`;
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
        { title: 'RATE_LIMITED', detail: 'Troppe richieste. Riprova tra un minuto.' },
        429,
      );
    }
  } catch {
    // fail open — rate limiting is a safety net, not a hard dependency
  }

  const parsed = subscribeSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json(
      { error: 'Nome ed email sono obbligatori e devono essere validi.' },
      400,
    );
  }
  const { email, firstName, listId, pdfSlug } = parsed.data;

  const { BREVO_API_KEY } = getEnv();
  if (!BREVO_API_KEY) {
    console.error('[public-lead] BREVO_API_KEY not configured');
    return c.json({ error: 'Servizio temporaneamente non disponibile.' }, 503);
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: firstName, PDF_SLUG: pdfSlug },
        listIds: [listId],
        updateEnabled: true,
      }),
    });

    if (res.ok || res.status === 204) {
      return c.json({ ok: true });
    }

    const data = (await res.json().catch(() => ({}))) as { code?: string };
    if (data.code === 'duplicate_parameter') {
      return c.json({ ok: true });
    }

    // Never forward Brevo's payload — may echo the submitted email.
    console.error(`[public-lead] Brevo error ${res.status}: ${data.code ?? 'unknown'}`);
    return c.json({ error: 'Errore nella registrazione.' }, 502);
  } catch (err) {
    console.error(`[public-lead] Brevo fetch failed: ${err instanceof Error ? err.name : 'unknown'}`);
    return c.json({ error: 'Errore di connessione al servizio.' }, 502);
  }
});

export { publicLead };
