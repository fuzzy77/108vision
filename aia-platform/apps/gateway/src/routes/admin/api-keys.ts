import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { nanoid } from 'nanoid';
import { AppError } from '@aia/shared';
import { getDb } from '../../lib/db.js';
import { apiKeys, tenants } from '../../db/schema.js';

const adminApiKeysRouter = new Hono();

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
});

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

adminApiKeysRouter.get('/', async (c) => {
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const db = getDb();

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.tenantId, tenantId));

  return c.json({ items: keys });
});

adminApiKeysRouter.post('/', async (c) => {
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const body = await c.req.json();
  const input = createKeySchema.parse(body);

  const db = getDb();

  const [tenant] = await db
    .select({ id: tenants.id, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  const rawKey = `sk-108-${tenant.slug}-${nanoid(32)}`;
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 10);

  const [created] = await db
    .insert(apiKeys)
    .values({
      tenantId,
      name: input.name,
      keyHash,
      keyPrefix,
      scopes: input.scopes ?? ['chat'],
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    });

  if (!created) {
    throw new AppError('API_KEY_CREATE_FAILED', 'Failed to create API key', 500);
  }

  return c.json({ ...created, key: rawKey }, 201);
});

adminApiKeysRouter.delete('/:keyId', async (c) => {
  const tenantId = c.req.param('tenantId');
  const keyId = c.req.param('keyId');

  if (!tenantId || !keyId) {
    throw new AppError('INVALID_ID', 'Tenant ID and Key ID are required', 400);
  }

  const db = getDb();

  const [existing] = await db
    .select({ id: apiKeys.id, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.tenantId, tenantId)))
    .limit(1);

  if (!existing) {
    throw new AppError('API_KEY_NOT_FOUND', 'API key not found', 404);
  }

  if (existing.revokedAt !== null) {
    throw new AppError('API_KEY_ALREADY_REVOKED', 'API key is already revoked', 409);
  }

  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.tenantId, tenantId)));

  return c.json({ message: 'API key revoked', keyId });
});

export { adminApiKeysRouter };
