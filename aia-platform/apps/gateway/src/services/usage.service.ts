import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import { type Result, success, failure, AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { usageDaily, tenants } from '../db/schema.js';

/**
 * Model pricing tiers (cost per 1M tokens in USD).
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'fast-cheap': { input: 0.14, output: 0.28 },
  'balanced': { input: 0.25, output: 1.25 },
  'powerful': { input: 3.00, output: 15.00 },
};

export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  totalCostUsd: number;
  startDate: string;
  endDate: string;
}

export interface UsageByTenant {
  tenantId: string;
  tenantName: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
}

export interface UsageByModel {
  model: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
}

export interface DailyUsagePoint {
  date: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
}

/**
 * Usage tracking and billing service.
 * Aggregates usage_daily records for admin dashboard reporting.
 */
export const usageService = {
  /**
   * Get aggregate usage summary across all tenants.
   */
  async getUsageSummary(
    startDate: string,
    endDate: string,
  ): Promise<Result<UsageSummary>> {
    try {
      const db = getDb();

      const [result] = await db
        .select({
          totalInputTokens: sql<number>`COALESCE(SUM(${usageDaily.inputTokens}), 0)::int`,
          totalOutputTokens: sql<number>`COALESCE(SUM(${usageDaily.outputTokens}), 0)::int`,
          totalRequests: sql<number>`COALESCE(SUM(${usageDaily.requestsCount}), 0)::int`,
          totalCostUsd: sql<number>`COALESCE(SUM(${usageDaily.costUsd}::numeric), 0)::float`,
        })
        .from(usageDaily)
        .where(
          and(
            gte(usageDaily.date, startDate),
            lte(usageDaily.date, endDate),
          ),
        );

      return success({
        totalInputTokens: result?.totalInputTokens ?? 0,
        totalOutputTokens: result?.totalOutputTokens ?? 0,
        totalRequests: result?.totalRequests ?? 0,
        totalCostUsd: result?.totalCostUsd ?? 0,
        startDate,
        endDate,
      });
    } catch (error) {
      return failure(
        new AppError(
          'USAGE_SUMMARY_FAILED',
          `Failed to retrieve usage summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Get usage breakdown grouped by tenant.
   */
  async getUsageByTenant(
    startDate: string,
    endDate: string,
  ): Promise<Result<UsageByTenant[]>> {
    try {
      const db = getDb();

      const results = await db
        .select({
          tenantId: usageDaily.tenantId,
          tenantName: tenants.name,
          inputTokens: sql<number>`COALESCE(SUM(${usageDaily.inputTokens}), 0)::int`,
          outputTokens: sql<number>`COALESCE(SUM(${usageDaily.outputTokens}), 0)::int`,
          requests: sql<number>`COALESCE(SUM(${usageDaily.requestsCount}), 0)::int`,
          costUsd: sql<number>`COALESCE(SUM(${usageDaily.costUsd}::numeric), 0)::float`,
        })
        .from(usageDaily)
        .innerJoin(tenants, eq(usageDaily.tenantId, tenants.id))
        .where(
          and(
            gte(usageDaily.date, startDate),
            lte(usageDaily.date, endDate),
          ),
        )
        .groupBy(usageDaily.tenantId, tenants.name)
        .orderBy(sql`SUM(${usageDaily.costUsd}::numeric) DESC`);

      return success(results);
    } catch (error) {
      return failure(
        new AppError(
          'USAGE_BY_TENANT_FAILED',
          `Failed to retrieve usage by tenant: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Get usage breakdown grouped by model tier.
   */
  async getUsageByModel(
    tenantId: string | undefined,
    startDate: string,
    endDate: string,
  ): Promise<Result<UsageByModel[]>> {
    try {
      const db = getDb();

      const conditions = [
        gte(usageDaily.date, startDate),
        lte(usageDaily.date, endDate),
      ];

      if (tenantId) {
        conditions.push(eq(usageDaily.tenantId, tenantId));
      }

      const results = await db
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

      return success(results);
    } catch (error) {
      return failure(
        new AppError(
          'USAGE_BY_MODEL_FAILED',
          `Failed to retrieve usage by model: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Get daily time series for usage (last N days).
   */
  async getDailyUsage(
    tenantId: string | undefined,
    days: number,
  ): Promise<Result<DailyUsagePoint[]>> {
    try {
      const db = getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0]!;

      const conditions = [gte(usageDaily.date, startDateStr)];

      if (tenantId) {
        conditions.push(eq(usageDaily.tenantId, tenantId));
      }

      const results = await db
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

      return success(results);
    } catch (error) {
      return failure(
        new AppError(
          'USAGE_DAILY_FAILED',
          `Failed to retrieve daily usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Calculate cost for a given number of tokens and model.
   */
  calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['balanced']!;
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return Number((inputCost + outputCost).toFixed(6));
  },

  /**
   * Export usage data as CSV string for invoicing.
   */
  async exportCSV(
    tenantId: string | undefined,
    startDate: string,
    endDate: string,
  ): Promise<Result<string>> {
    try {
      const db = getDb();

      const conditions = [
        gte(usageDaily.date, startDate),
        lte(usageDaily.date, endDate),
      ];

      if (tenantId) {
        conditions.push(eq(usageDaily.tenantId, tenantId));
      }

      const rows = await db
        .select({
          tenantId: usageDaily.tenantId,
          tenantName: tenants.name,
          date: usageDaily.date,
          model: usageDaily.model,
          inputTokens: usageDaily.inputTokens,
          outputTokens: usageDaily.outputTokens,
          requestsCount: usageDaily.requestsCount,
          costUsd: usageDaily.costUsd,
        })
        .from(usageDaily)
        .innerJoin(tenants, eq(usageDaily.tenantId, tenants.id))
        .where(and(...conditions))
        .orderBy(usageDaily.date, tenants.name, usageDaily.model);

      const header = 'tenant_id,tenant_name,date,model,input_tokens,output_tokens,requests,cost_usd';
      const csvRows = rows.map((r) =>
        `${r.tenantId},"${r.tenantName}",${r.date},${r.model},${r.inputTokens},${r.outputTokens},${r.requestsCount},${r.costUsd}`,
      );

      const csv = [header, ...csvRows].join('\n');
      return success(csv);
    } catch (error) {
      return failure(
        new AppError(
          'USAGE_EXPORT_FAILED',
          `Failed to export usage CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },
};
