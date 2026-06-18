import type { Context, Next } from 'hono';
import { AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { tenants } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantStatus: string;
}

/**
 * Tenant resolution middleware.
 * Resolves tenant from:
 * 1. `X-Tenant-ID` header (direct UUID)
 * 2. JWT payload `tenantId` claim (set by auth middleware)
 *
 * Validates the tenant exists and is active.
 * Attaches tenant info to the Hono context.
 */
export async function tenantMiddleware(c: Context, next: Next): Promise<void | Response> {
  const headerTenantId = c.req.header('X-Tenant-ID');
  const jwtPayload = c.get('jwtPayload');
  const jwtTenantId = jwtPayload?.tenantId as string | undefined;
  const jwtRole = jwtPayload?.role as string | undefined;
  // Only platform_admin can override tenant via header
  let tenantId = (jwtRole === 'platform_admin' && headerTenantId)
    ? headerTenantId
    : (jwtTenantId || headerTenantId);

  // Platform admins without a tenant_id: resolve to first active tenant
  if (!tenantId && jwtRole === 'platform_admin') {
    const db = getDb();
    const first = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.status, 'active'))
      .limit(1);
    if (first.length > 0) {
      tenantId = first[0]!.id;
    }
  }

  if (!tenantId) {
    throw new AppError(
      'TENANT_REQUIRED',
      'Tenant identification required. Provide X-Tenant-ID header or authenticate with a tenant-scoped token.',
      400,
    );
  }

  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    throw new AppError(
      'INVALID_TENANT_ID',
      'Tenant ID must be a valid UUID',
      400,
    );
  }

  const db = getDb();
  const tenant = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      status: tenants.status,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (tenant.length === 0) {
    throw new AppError(
      'TENANT_NOT_FOUND',
      'The specified tenant does not exist',
      404,
    );
  }

  const tenantRecord = tenant[0]!;

  if (tenantRecord.status !== 'active' && tenantRecord.status !== 'trial') {
    throw new AppError(
      'TENANT_INACTIVE',
      `Tenant is ${tenantRecord.status}. Access denied.`,
      403,
    );
  }

  // Attach tenant context
  c.set('tenantId', tenantRecord.id);
  c.set('tenantSlug', tenantRecord.slug);
  c.set('tenantStatus', tenantRecord.status);

  await next();
}
