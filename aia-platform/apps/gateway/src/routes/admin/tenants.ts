import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, sql, desc } from 'drizzle-orm';
import { AppError } from '@aia/shared';
import { getDb } from '../../lib/db.js';
import { tenants, conversations, usageDaily } from '../../db/schema.js';

const adminTenantsRouter = new Hono();

const listTenantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['active', 'suspended', 'trial', 'cancelled', 'all']).default('all'),
});

const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  planId: z.string().uuid().optional(),
  config: z.record(z.unknown()).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  planId: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'suspended', 'trial', 'cancelled']).optional(),
  config: z.record(z.unknown()).optional(),
});

const statsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
});

/**
 * GET /api/admin/tenants — List all tenants with summary stats.
 */
adminTenantsRouter.get('/', async (c) => {
  const query = listTenantsQuerySchema.parse({
    page: c.req.query('page'),
    pageSize: c.req.query('pageSize'),
    status: c.req.query('status'),
  });

  const db = getDb();
  const offset = (query.page - 1) * query.pageSize;

  const conditions = [];
  if (query.status !== 'all') {
    conditions.push(eq(tenants.status, query.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tenants)
    .where(whereClause);

  const total = countResult?.count ?? 0;

  // Fetch tenants with aggregate stats via subqueries
  const tenantRows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      status: tenants.status,
      config: tenants.config,
      planId: tenants.planId,
      trialEndsAt: tenants.trialEndsAt,
      createdAt: tenants.createdAt,
      updatedAt: tenants.updatedAt,
      agentsCount: sql<number>`(SELECT count(*)::int FROM shared.agents a WHERE a.tenant_id = ${tenants.id} AND a.is_active = true)`,
      documentsCount: sql<number>`(SELECT count(*)::int FROM shared.kb_documents d WHERE d.tenant_id = ${tenants.id} AND d.status != 'deleted')`,
      usersCount: sql<number>`(SELECT count(*)::int FROM shared.users u WHERE u.tenant_id = ${tenants.id})`,
      lastActivity: sql<string>`(SELECT MAX(c.created_at)::text FROM shared.conversations c WHERE c.tenant_id = ${tenants.id})`,
      monthlyCostUsd: sql<number>`COALESCE((SELECT SUM(ud.cost_usd::numeric)::float FROM shared.usage_daily ud WHERE ud.tenant_id = ${tenants.id} AND ud.date >= date_trunc('month', CURRENT_DATE)::date), 0)`,
    })
    .from(tenants)
    .where(whereClause)
    .orderBy(desc(tenants.createdAt))
    .limit(query.pageSize)
    .offset(offset);

  return c.json({
    items: tenantRows,
    total,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: offset + tenantRows.length < total,
  });
});

/**
 * GET /api/admin/tenants/:id — Full tenant detail with usage breakdown.
 */
adminTenantsRouter.get('/:id', async (c) => {
  const tenantId = c.req.param('id');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  // Fetch related counts
  const [stats] = await db
    .select({
      agentsCount: sql<number>`(SELECT count(*)::int FROM shared.agents a WHERE a.tenant_id = ${tenantId} AND a.is_active = true)`,
      documentsCount: sql<number>`(SELECT count(*)::int FROM shared.kb_documents d WHERE d.tenant_id = ${tenantId} AND d.status != 'deleted')`,
      usersCount: sql<number>`(SELECT count(*)::int FROM shared.users u WHERE u.tenant_id = ${tenantId})`,
      conversationsCount: sql<number>`(SELECT count(*)::int FROM shared.conversations c WHERE c.tenant_id = ${tenantId})`,
      totalTokens: sql<number>`COALESCE((SELECT SUM(ud.input_tokens + ud.output_tokens)::int FROM shared.usage_daily ud WHERE ud.tenant_id = ${tenantId}), 0)`,
      totalCostUsd: sql<number>`COALESCE((SELECT SUM(ud.cost_usd::numeric)::float FROM shared.usage_daily ud WHERE ud.tenant_id = ${tenantId}), 0)`,
      monthlyCostUsd: sql<number>`COALESCE((SELECT SUM(ud.cost_usd::numeric)::float FROM shared.usage_daily ud WHERE ud.tenant_id = ${tenantId} AND ud.date >= date_trunc('month', CURRENT_DATE)::date), 0)`,
    })
    .from(sql`(SELECT 1) AS dummy`);

  return c.json({
    ...tenant,
    stats: stats ?? {
      agentsCount: 0,
      documentsCount: 0,
      usersCount: 0,
      conversationsCount: 0,
      totalTokens: 0,
      totalCostUsd: 0,
      monthlyCostUsd: 0,
    },
  });
});

/**
 * POST /api/admin/tenants — Create a new tenant.
 */
adminTenantsRouter.post('/', async (c) => {
  const body = await c.req.json();
  const input = createTenantSchema.parse(body);

  const db = getDb();

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, input.slug))
    .limit(1);

  if (existing) {
    throw new AppError('SLUG_ALREADY_EXISTS', `Slug "${input.slug}" is already in use`, 409);
  }

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: input.name,
      slug: input.slug,
      planId: input.planId ?? null,
      config: input.config ?? {},
      status: 'trial',
    })
    .returning();

  if (!tenant) {
    throw new AppError('TENANT_CREATE_FAILED', 'Failed to create tenant', 500);
  }

  // Provision Qdrant collection
  const { ensureCollection } = await import('../../lib/qdrant.js');
  await ensureCollection(tenant.id);

  return c.json(tenant, 201);
});

/**
 * PUT /api/admin/tenants/:id — Update tenant settings.
 */
adminTenantsRouter.put('/:id', async (c) => {
  const tenantId = c.req.param('id');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const body = await c.req.json();
  const input = updateTenantSchema.parse(body);

  const db = getDb();

  // Verify tenant exists
  const [existing] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!existing) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  // Check slug uniqueness if changing
  if (input.slug) {
    const [slugConflict] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(and(eq(tenants.slug, input.slug), sql`${tenants.id} != ${tenantId}`))
      .limit(1);

    if (slugConflict) {
      throw new AppError('SLUG_ALREADY_EXISTS', `Slug "${input.slug}" is already in use`, 409);
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData['name'] = input.name;
  if (input.slug !== undefined) updateData['slug'] = input.slug;
  if (input.planId !== undefined) updateData['planId'] = input.planId;
  if (input.status !== undefined) updateData['status'] = input.status;
  if (input.config !== undefined) updateData['config'] = input.config;

  const [updated] = await db
    .update(tenants)
    .set(updateData)
    .where(eq(tenants.id, tenantId))
    .returning();

  return c.json(updated);
});

/**
 * DELETE /api/admin/tenants/:id — Deactivate tenant (soft delete).
 */
adminTenantsRouter.delete('/:id', async (c) => {
  const tenantId = c.req.param('id');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const db = getDb();

  const [existing] = await db
    .select({ id: tenants.id, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!existing) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  if (existing.status === 'cancelled') {
    throw new AppError('TENANT_ALREADY_DEACTIVATED', 'Tenant is already deactivated', 409);
  }

  await db
    .update(tenants)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));

  return c.json({ message: 'Tenant deactivated', tenantId });
});

/**
 * POST /api/admin/tenants/:id/activate — Reactivate a deactivated tenant.
 */
adminTenantsRouter.post('/:id/activate', async (c) => {
  const tenantId = c.req.param('id');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const db = getDb();

  const [existing] = await db
    .select({ id: tenants.id, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!existing) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  if (existing.status === 'active') {
    return c.json({ message: 'Tenant is already active', tenantId, status: 'active' });
  }

  await db
    .update(tenants)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));

  return c.json({ message: 'Tenant reactivated', tenantId, status: 'active' });
});

/**
 * GET /api/admin/tenants/:id/stats — Detailed usage stats for a tenant.
 */
adminTenantsRouter.get('/:id/stats', async (c) => {
  const tenantId = c.req.param('id');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const queryParams = statsQuerySchema.parse({
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate'),
  });

  const db = getDb();

  // Verify tenant exists
  const [existing] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!existing) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  // Default date range: current month
  const now = new Date();
  const startDate = queryParams.startDate ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = queryParams.endDate ?? now.toISOString().split('T')[0]!;

  // Aggregate stats
  const conditions = [
    eq(usageDaily.tenantId, tenantId),
    sql`${usageDaily.date} >= ${startDate}`,
    sql`${usageDaily.date} <= ${endDate}`,
  ];

  const [summary] = await db
    .select({
      totalInputTokens: sql<number>`COALESCE(SUM(${usageDaily.inputTokens}), 0)::int`,
      totalOutputTokens: sql<number>`COALESCE(SUM(${usageDaily.outputTokens}), 0)::int`,
      totalRequests: sql<number>`COALESCE(SUM(${usageDaily.requestsCount}), 0)::int`,
      totalCostUsd: sql<number>`COALESCE(SUM(${usageDaily.costUsd}::numeric), 0)::float`,
    })
    .from(usageDaily)
    .where(and(...conditions));

  // By model breakdown
  const byModel = await db
    .select({
      model: usageDaily.model,
      inputTokens: sql<number>`COALESCE(SUM(${usageDaily.inputTokens}), 0)::int`,
      outputTokens: sql<number>`COALESCE(SUM(${usageDaily.outputTokens}), 0)::int`,
      requests: sql<number>`COALESCE(SUM(${usageDaily.requestsCount}), 0)::int`,
      costUsd: sql<number>`COALESCE(SUM(${usageDaily.costUsd}::numeric), 0)::float`,
    })
    .from(usageDaily)
    .where(and(...conditions))
    .groupBy(usageDaily.model)
    .orderBy(sql`SUM(${usageDaily.costUsd}::numeric) DESC`);

  // Daily breakdown
  const daily = await db
    .select({
      date: usageDaily.date,
      inputTokens: sql<number>`COALESCE(SUM(${usageDaily.inputTokens}), 0)::int`,
      outputTokens: sql<number>`COALESCE(SUM(${usageDaily.outputTokens}), 0)::int`,
      requests: sql<number>`COALESCE(SUM(${usageDaily.requestsCount}), 0)::int`,
      costUsd: sql<number>`COALESCE(SUM(${usageDaily.costUsd}::numeric), 0)::float`,
    })
    .from(usageDaily)
    .where(and(...conditions))
    .groupBy(usageDaily.date)
    .orderBy(usageDaily.date);

  // Conversations count in period
  const [convStats] = await db
    .select({
      conversationsCount: sql<number>`count(*)::int`,
      messagesCount: sql<number>`(SELECT count(*)::int FROM shared.messages m INNER JOIN shared.conversations cv ON cv.id = m.conversation_id WHERE cv.tenant_id = ${tenantId} AND cv.created_at >= ${startDate}::date AND cv.created_at <= (${endDate}::date + interval '1 day'))`,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.tenantId, tenantId),
        sql`${conversations.createdAt} >= ${startDate}::date`,
        sql`${conversations.createdAt} <= (${endDate}::date + interval '1 day')`,
      ),
    );

  return c.json({
    tenantId,
    period: { startDate, endDate },
    summary: summary ?? { totalInputTokens: 0, totalOutputTokens: 0, totalRequests: 0, totalCostUsd: 0 },
    conversations: convStats?.conversationsCount ?? 0,
    messages: convStats?.messagesCount ?? 0,
    byModel,
    daily,
  });
});

export { adminTenantsRouter };
