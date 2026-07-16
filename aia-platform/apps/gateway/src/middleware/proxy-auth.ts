import type { Context, Next } from 'hono';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../lib/db.js';
import { apiKeys, tenants, plans } from '../db/schema.js';

export interface ProxyConfig {
  ragEnabled: boolean;
  memoryEnabled: boolean;
  ragTopK: number;
  ragMinScore: number;
}

const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  ragEnabled: false,
  memoryEnabled: false,
  ragTopK: 5,
  ragMinScore: 0.6,
};

function extractApiKey(c: Context): string | null {
  // 1. Authorization: Bearer <key> (OpenAI standard)
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. x-api-key (Anthropic convention, case-insensitive)
  const anthropicKey = c.req.header('x-api-key');
  if (anthropicKey) return anthropicKey;

  // 3. X-API-Key (existing convention)
  const existingKey = c.req.header('X-API-Key');
  if (existingKey) return existingKey;

  return null;
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function proxyAuthMiddleware(c: Context, next: Next): Promise<void | Response> {
  const rawKey = extractApiKey(c);

  if (!rawKey) {
    return c.json(
      { error: { message: 'API key is required', type: 'authentication_error', code: 'missing_api_key' } },
      401,
    );
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
      scopes: apiKeys.scopes,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyPrefix, prefix))
    .limit(1);

  if (!keyRecord || keyRecord.keyHash !== keyHash) {
    return c.json(
      { error: { message: 'Invalid API key', type: 'authentication_error', code: 'invalid_api_key' } },
      401,
    );
  }

  if (keyRecord.revokedAt !== null) {
    return c.json(
      { error: { message: 'API key has been revoked', type: 'authentication_error', code: 'revoked_api_key' } },
      401,
    );
  }

  if (keyRecord.expiresAt !== null && keyRecord.expiresAt < now) {
    return c.json(
      { error: { message: 'API key has expired', type: 'authentication_error', code: 'expired_api_key' } },
      401,
    );
  }

  // Resolve tenant + plan in one query
  const [tenant] = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      status: tenants.status,
      planId: tenants.planId,
      planName: plans.name,
    })
    .from(tenants)
    .leftJoin(plans, eq(tenants.planId, plans.id))
    .where(eq(tenants.id, keyRecord.tenantId))
    .limit(1);

  if (!tenant || (tenant.status !== 'active' && tenant.status !== 'trial')) {
    return c.json(
      { error: { message: 'Tenant is inactive or suspended', type: 'authentication_error', code: 'tenant_inactive' } },
      403,
    );
  }

  // Update lastUsedAt (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: now })
    .where(eq(apiKeys.id, keyRecord.id))
    .catch(() => {});

  // Parse proxy config from scopes
  const scopes = keyRecord.scopes ?? [];
  const proxyConfig: ProxyConfig = {
    ragEnabled: scopes.includes('proxy:rag'),
    memoryEnabled: scopes.includes('proxy:memory'),
    ragTopK: DEFAULT_PROXY_CONFIG.ragTopK,
    ragMinScore: DEFAULT_PROXY_CONFIG.ragMinScore,
  };

  // Set context for downstream handlers
  c.set('tenantId', tenant.id);
  c.set('tenantSlug', tenant.slug);
  c.set('tenantStatus', tenant.status);
  c.set('tenantPlan', (tenant.planName ?? 'growth').toLowerCase());
  c.set('apiKeyId', keyRecord.id);
  c.set('userId', null);
  c.set('userRole', 'api_key');
  c.set('proxyConfig', proxyConfig);

  await next();
}
