import { sql, eq, and } from 'drizzle-orm';
import { getDb } from '../lib/db.js';
import { usageRecords, usageDaily } from '../db/schema.js';
import { usageService } from './usage.service.js';
import { budgetService } from './budget.service.js';

export interface TrackUsageInput {
  tenantId: string;
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  requestType?: string;
  cached?: boolean;
}

export const usageTrackingService = {
  async trackRequest(input: TrackUsageInput): Promise<void> {
    const db = getDb();
    const costUsd = usageService.calculateCost(input.inputTokens, input.outputTokens, input.model);
    const today = new Date().toISOString().split('T')[0]!;

    // Write per-request record
    await db.insert(usageRecords).values({
      tenantId: input.tenantId,
      userId: input.userId,
      modelName: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      costEur: String(costUsd),
      requestType: input.cached ? 'chat_cached' : (input.requestType ?? 'chat'),
    });

    // Upsert daily aggregate
    await db.execute(sql`
      INSERT INTO shared.usage_daily (id, tenant_id, date, model, input_tokens, output_tokens, requests_count, cost_usd)
      VALUES (gen_random_uuid(), ${input.tenantId}, ${today}, ${input.model}, ${input.inputTokens}, ${input.outputTokens}, 1, ${String(costUsd)})
      ON CONFLICT (tenant_id, date, model)
      DO UPDATE SET
        input_tokens = shared.usage_daily.input_tokens + EXCLUDED.input_tokens,
        output_tokens = shared.usage_daily.output_tokens + EXCLUDED.output_tokens,
        requests_count = shared.usage_daily.requests_count + 1,
        cost_usd = (shared.usage_daily.cost_usd::numeric + EXCLUDED.cost_usd::numeric)::text
    `);

    // Invalidate budget cache so next request sees updated numbers
    await budgetService.invalidateCache(input.tenantId);
  },
};
