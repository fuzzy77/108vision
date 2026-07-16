import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '@aia/shared';
import { usageService } from '../../services/usage.service.js';

const adminUsageRouter = new Hono();

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
});

const dailyQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
  tenantId: z.string().uuid().optional(),
});

const byModelQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  tenantId: z.string().uuid().optional(),
});

const exportQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  tenantId: z.string().uuid().optional(),
});

/**
 * Compute default date range (current month).
 */
function getDefaultDateRange(startDate?: string, endDate?: string): { start: string; end: string } {
  const now = new Date();
  const start = startDate ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const end = endDate ?? now.toISOString().split('T')[0]!;
  return { start, end };
}

/**
 * GET /api/admin/usage/summary — Aggregate usage across all tenants (current month default).
 */
adminUsageRouter.get('/summary', async (c) => {
  const params = dateRangeSchema.parse({
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate'),
  });

  const { start, end } = getDefaultDateRange(params.startDate, params.endDate);

  const result = await usageService.getUsageSummary(start, end);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * GET /api/admin/usage/by-tenant — Usage breakdown per tenant (for billing).
 */
adminUsageRouter.get('/by-tenant', async (c) => {
  const params = dateRangeSchema.parse({
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate'),
  });

  const { start, end } = getDefaultDateRange(params.startDate, params.endDate);

  const result = await usageService.getUsageByTenant(start, end);

  if (!result.success) {
    throw result.error;
  }

  return c.json({ items: result.data, startDate: start, endDate: end });
});

/**
 * GET /api/admin/usage/by-model — Token consumption per model tier.
 */
adminUsageRouter.get('/by-model', async (c) => {
  const params = byModelQuerySchema.parse({
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate'),
    tenantId: c.req.query('tenantId'),
  });

  const { start, end } = getDefaultDateRange(params.startDate, params.endDate);

  const result = await usageService.getUsageByModel(params.tenantId, start, end);

  if (!result.success) {
    throw result.error;
  }

  return c.json({ items: result.data, startDate: start, endDate: end });
});

/**
 * GET /api/admin/usage/daily — Daily time series (last 30 days by default).
 */
adminUsageRouter.get('/daily', async (c) => {
  const params = dailyQuerySchema.parse({
    days: c.req.query('days'),
    tenantId: c.req.query('tenantId'),
  });

  const result = await usageService.getDailyUsage(params.tenantId, params.days);

  if (!result.success) {
    throw result.error;
  }

  return c.json({ items: result.data, days: params.days });
});

/**
 * GET /api/admin/usage/by-source — Usage breakdown by request source (chat, proxy_openai, proxy_anthropic, proxy_mcp).
 */
adminUsageRouter.get('/by-source', async (c) => {
  const params = byModelQuerySchema.parse({
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate'),
    tenantId: c.req.query('tenantId'),
  });

  const { start, end } = getDefaultDateRange(params.startDate, params.endDate);

  const result = await usageService.getUsageBySource(params.tenantId, start, end);

  if (!result.success) {
    throw result.error;
  }

  return c.json({ items: result.data, startDate: start, endDate: end });
});

/**
 * GET /api/admin/usage/export — CSV export for invoicing.
 */
adminUsageRouter.get('/export', async (c) => {
  const params = exportQuerySchema.parse({
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate'),
    tenantId: c.req.query('tenantId'),
  });

  const { start, end } = getDefaultDateRange(params.startDate, params.endDate);

  const result = await usageService.exportCSV(params.tenantId, start, end);

  if (!result.success) {
    throw result.error;
  }

  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', `attachment; filename="usage_${start}_${end}.csv"`);

  return c.body(result.data);
});

export { adminUsageRouter };
