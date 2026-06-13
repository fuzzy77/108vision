import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { AppError } from '@aia/shared';
import { getDb } from '../../lib/db.js';
import { tenants, usageDaily } from '../../db/schema.js';

const adminBillingRouter = new Hono();

const EUR_USD_RATE = 0.93;

const reportQuerySchema = z.object({
  tenantId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM'),
});

function getMonthBounds(month: string): { startDate: string; endDate: string } {
  const [year, mon] = month.split('-') as [string, string];
  const startDate = `${year}-${mon}-01`;
  const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
  const endDate = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

adminBillingRouter.get('/report', async (c) => {
  const params = reportQuerySchema.parse({
    tenantId: c.req.query('tenantId'),
    month: c.req.query('month'),
  });

  const { startDate, endDate } = getMonthBounds(params.month);

  const db = getDb();

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, params.tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  const conditions = [
    eq(usageDaily.tenantId, params.tenantId),
    sql`${usageDaily.date} >= ${startDate}`,
    sql`${usageDaily.date} <= ${endDate}`,
  ];

  const [summary] = await db
    .select({
      totalRequests: sql<number>`COALESCE(SUM(${usageDaily.requestsCount}), 0)::int`,
      totalInputTokens: sql<number>`COALESCE(SUM(${usageDaily.inputTokens}), 0)::bigint`,
      totalOutputTokens: sql<number>`COALESCE(SUM(${usageDaily.outputTokens}), 0)::bigint`,
      totalCostUsd: sql<number>`COALESCE(SUM(${usageDaily.costUsd}::numeric), 0)::float`,
    })
    .from(usageDaily)
    .where(and(...conditions));

  const totalCostUsd = summary?.totalCostUsd ?? 0;
  const totalRequests = summary?.totalRequests ?? 0;

  const breakdown = await db
    .select({
      model: usageDaily.model,
      requests: sql<number>`COALESCE(SUM(${usageDaily.requestsCount}), 0)::int`,
      tokens: sql<number>`COALESCE(SUM(${usageDaily.inputTokens} + ${usageDaily.outputTokens}), 0)::bigint`,
      costUsd: sql<number>`COALESCE(SUM(${usageDaily.costUsd}::numeric), 0)::float`,
    })
    .from(usageDaily)
    .where(and(...conditions))
    .groupBy(usageDaily.model)
    .orderBy(sql`SUM(${usageDaily.costUsd}::numeric) DESC`);

  const daily = await db
    .select({
      date: usageDaily.date,
      requests: sql<number>`COALESCE(SUM(${usageDaily.requestsCount}), 0)::int`,
      costUsd: sql<number>`COALESCE(SUM(${usageDaily.costUsd}::numeric), 0)::float`,
    })
    .from(usageDaily)
    .where(and(...conditions))
    .groupBy(usageDaily.date)
    .orderBy(usageDaily.date);

  return c.json({
    tenant: { name: tenant.name, slug: tenant.slug },
    period: { month: params.month, startDate, endDate },
    summary: {
      totalRequests,
      totalInputTokens: summary?.totalInputTokens ?? 0,
      totalOutputTokens: summary?.totalOutputTokens ?? 0,
      totalCostUsd,
      costEur: Math.round(totalCostUsd * EUR_USD_RATE * 100) / 100,
      avgCostPerRequest: totalRequests > 0 ? Math.round((totalCostUsd / totalRequests) * 10000) / 10000 : 0,
    },
    breakdown,
    daily,
  });
});

adminBillingRouter.get('/export/csv', async (c) => {
  const params = reportQuerySchema.parse({
    tenantId: c.req.query('tenantId'),
    month: c.req.query('month'),
  });

  const { startDate, endDate } = getMonthBounds(params.month);

  const db = getDb();

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, params.tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  const rows = await db
    .select({
      date: usageDaily.date,
      model: usageDaily.model,
      requests: usageDaily.requestsCount,
      inputTokens: usageDaily.inputTokens,
      outputTokens: usageDaily.outputTokens,
      costUsd: usageDaily.costUsd,
    })
    .from(usageDaily)
    .where(
      and(
        eq(usageDaily.tenantId, params.tenantId),
        sql`${usageDaily.date} >= ${startDate}`,
        sql`${usageDaily.date} <= ${endDate}`,
      ),
    )
    .orderBy(usageDaily.date, usageDaily.model);

  const header = 'date,model,requests,input_tokens,output_tokens,cost_usd\n';
  const csvBody = rows
    .map((r) => `${r.date},${r.model},${r.requests ?? 0},${r.inputTokens ?? 0},${r.outputTokens ?? 0},${r.costUsd ?? '0'}`)
    .join('\n');

  const csv = header + csvBody;

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', `attachment; filename=billing-${params.tenantId}-${params.month}.csv`);

  return c.body(csv);
});

export { adminBillingRouter };
