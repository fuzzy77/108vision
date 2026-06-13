import { eq, and, sql, gte } from 'drizzle-orm';
import { type ModelTier, MODEL_TIERS } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { usageDaily, tenants, plans, users } from '../db/schema.js';
import { getRedis } from '../lib/redis.js';
import { emailService } from './email.service.js';

export interface BudgetStatus {
  tenantId: string;
  currentMonthCostUsd: number;
  budgetLimitUsd: number;
  usageRatio: number;
  effectiveTier: ModelTier | null;
  alert: 'none' | 'warning' | 'high' | 'exceeded';
}

const BUDGET_CACHE_PREFIX = 'budget';
const BUDGET_CACHE_TTL = 300; // 5 minutes

const PLAN_BUDGETS: Record<string, number> = {
  starter: 50,
  growth: 200,
  scale: 500,
  unlimited: 999999,
};

export const budgetService = {
  async getBudgetStatus(tenantId: string): Promise<BudgetStatus> {
    const redis = getRedis();
    const cacheKey = `${BUDGET_CACHE_PREFIX}:${tenantId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as BudgetStatus;
    } catch {
      // Continue without cache
    }

    const db = getDb();
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [usageResult] = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${usageDaily.costUsd}::numeric), 0)::float`,
      })
      .from(usageDaily)
      .where(
        and(
          eq(usageDaily.tenantId, tenantId),
          gte(usageDaily.date, monthStart),
        ),
      );

    const currentMonthCostUsd = usageResult?.totalCost ?? 0;

    const [tenant] = await db
      .select({ planId: tenants.planId })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    let budgetLimitUsd = PLAN_BUDGETS['growth']!;

    if (tenant?.planId) {
      const [plan] = await db
        .select({ name: plans.name, features: plans.features })
        .from(plans)
        .where(eq(plans.id, tenant.planId))
        .limit(1);

      if (plan) {
        const planName = plan.name.toLowerCase();
        budgetLimitUsd = PLAN_BUDGETS[planName] ?? PLAN_BUDGETS['growth']!;
        const features = plan.features as Record<string, unknown> | null;
        if (features?.['budgetLimitUsd'] && typeof features['budgetLimitUsd'] === 'number') {
          budgetLimitUsd = features['budgetLimitUsd'];
        }
      }
    }

    const usageRatio = budgetLimitUsd > 0 ? currentMonthCostUsd / budgetLimitUsd : 0;

    let alert: BudgetStatus['alert'] = 'none';
    if (usageRatio >= 1.0) alert = 'exceeded';
    else if (usageRatio >= 0.9) alert = 'high';
    else if (usageRatio >= 0.7) alert = 'warning';

    let effectiveTier: ModelTier | null = null;
    if (usageRatio >= 1.0) effectiveTier = MODEL_TIERS.FAST_CHEAP as ModelTier;
    else if (usageRatio >= 0.9) effectiveTier = MODEL_TIERS.FAST_CHEAP as ModelTier;

    const status: BudgetStatus = {
      tenantId,
      currentMonthCostUsd,
      budgetLimitUsd,
      usageRatio,
      effectiveTier,
      alert,
    };

    try {
      await redis.setex(cacheKey, BUDGET_CACHE_TTL, JSON.stringify(status));
    } catch {
      // Non-critical
    }

    return status;
  },

  resolveEffectiveTier(requestedTier: ModelTier, budgetStatus: BudgetStatus): ModelTier {
    if (budgetStatus.effectiveTier) {
      return budgetStatus.effectiveTier;
    }
    return requestedTier;
  },

  async invalidateCache(tenantId: string): Promise<void> {
    const redis = getRedis();
    try {
      await redis.del(`${BUDGET_CACHE_PREFIX}:${tenantId}`);
    } catch {
      // Non-critical
    }
  },

  /**
   * Check budget and send an alert email if usage crossed >=90% today.
   * Deduplicates via Redis: only one alert per tenant per calendar day.
   */
  async checkAndSendBudgetAlert(tenantId: string): Promise<void> {
    try {
      const status = await budgetService.getBudgetStatus(tenantId);
      if (status.usageRatio < 0.9) return;

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const alertKey = `budget_alert_sent:${tenantId}:${today}`;

      const redis = getRedis();
      const alreadySent = await redis.get(alertKey).catch(() => null);
      if (alreadySent) return;

      const db = getDb();

      const [tenant] = await db
        .select({ name: tenants.name })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!tenant) return;

      const adminUsers = await db
        .select({ email: users.email })
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.role, 'tenant_admin')));

      if (adminUsers.length === 0) return;

      const usagePercent = Math.round(status.usageRatio * 100);

      for (const admin of adminUsers) {
        await emailService.sendBudgetAlert(
          admin.email,
          tenant.name,
          usagePercent,
          status.currentMonthCostUsd,
        );
      }

      // Mark as sent for the rest of the day (TTL = 25 hours to account for clock skew)
      await redis.setex(alertKey, 25 * 60 * 60, '1').catch(() => null);
    } catch {
      // Non-critical — do not block the main flow
    }
  },
};
