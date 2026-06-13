import type { Context, Next } from 'hono';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { apiKeys, tenants } from '../db/schema.js';

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function apiKeyAuthMiddleware(c: Context, next: Next): Promise<void | Response> {
  const rawKey = c.req.header('X-API-Key');

  if (!rawKey) {
    throw new AppError('AUTH_REQUIRED', 'X-API-Key header is required', 401);
  }

  const prefix = rawKey.slice(0, 10);
  const keyHash = hashKey(rawKey);
  const now = new Date();

  const db = getDb();

  const [keyRecord] = await db
    .select({
      id: apiKeys.id,
      tenantId: apiKeys.tenantId,
      revokedAt: apiKeys.revokedAt,
      expiresAt: apiKeys.expiresAt,
      keyHash: apiKeys.keyHash,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyPrefix, prefix))
    .limit(1);

  if (!keyRecord) {
    throw new AppError('AUTH_TOKEN_INVALID', 'Invalid API key', 401);
  }

  if (keyRecord.keyHash !== keyHash) {
    throw new AppError('AUTH_TOKEN_INVALID', 'Invalid API key', 401);
  }

  if (keyRecord.revokedAt !== null) {
    throw new AppError('AUTH_TOKEN_REVOKED', 'API key has been revoked', 401);
  }

  if (keyRecord.expiresAt !== null && keyRecord.expiresAt < now) {
    throw new AppError('AUTH_TOKEN_EXPIRED', 'API key has expired', 401);
  }

  const [tenant] = await db
    .select({ id: tenants.id, slug: tenants.slug, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, keyRecord.tenantId))
    .limit(1);

  if (!tenant || (tenant.status !== 'active' && tenant.status !== 'trial')) {
    throw new AppError('TENANT_INACTIVE', 'Tenant is inactive', 403);
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: now })
    .where(eq(apiKeys.id, keyRecord.id));

  c.set('tenantId', tenant.id);
  c.set('tenantSlug', tenant.slug);
  c.set('tenantStatus', tenant.status);
  c.set('apiKeyId', keyRecord.id);
  c.set('userId', null);
  c.set('userRole', 'api_key');
  c.set('jwtPayload', {
    sub: keyRecord.id,
    tenantId: tenant.id,
    email: '',
    role: 'api_key',
    iat: Math.floor(Date.now() / 1000),
  });

  await next();
}
