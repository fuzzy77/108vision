import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { AppError } from '@aia/shared';
import { getDb } from '../../lib/db.js';
import { plans } from '../../db/schema.js';

const adminPlansRouter = new Hono();

const MODEL_TIERS = ['fast-cheap', 'balanced', 'powerful', 'coding', 'vision'] as const;
type PlanModelTier = (typeof MODEL_TIERS)[number];

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  maxConversationsMonth: z.number().int().positive().default(200),
  maxKbDocuments: z.number().int().positive().default(100),
  maxKbSizeMb: z.number().int().positive().default(256),
  allowedModels: z.array(z.enum(MODEL_TIERS)).min(1),
  priceEurMonth: z.number().min(0),
  features: z.record(z.unknown()).default({}),
});

const updatePlanSchema = createPlanSchema.partial();

/**
 * GET /api/admin/plans — List all plans ordered by name.
 */
adminPlansRouter.get('/', async (c) => {
  const db = getDb();
  const allPlans = await db.select().from(plans).orderBy(plans.name);
  return c.json({ items: allPlans });
});

/**
 * GET /api/admin/plans/:id — Get a single plan by ID.
 */
adminPlansRouter.get('/:id', async (c) => {
  const db = getDb();
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, c.req.param('id')))
    .limit(1);

  if (!plan) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404);
  return c.json(plan);
});

/**
 * POST /api/admin/plans — Create a new plan.
 */
adminPlansRouter.post('/', async (c) => {
  const body = await c.req.json();
  const input = createPlanSchema.parse(body);
  const db = getDb();

  const [plan] = await db
    .insert(plans)
    .values({
      name: input.name,
      maxConversationsMonth: input.maxConversationsMonth,
      maxKbDocuments: input.maxKbDocuments,
      maxKbSizeMb: input.maxKbSizeMb,
      allowedModels: input.allowedModels as string[],
      priceEurMonth: String(input.priceEurMonth),
      features: input.features,
    })
    .returning();

  return c.json(plan, 201);
});

/**
 * PUT /api/admin/plans/:id — Update an existing plan.
 * Only fields present in the body are updated.
 */
adminPlansRouter.put('/:id', async (c) => {
  const planId = c.req.param('id');
  const body = await c.req.json();
  const input = updatePlanSchema.parse(body);
  const db = getDb();

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData['name'] = input.name;
  if (input.maxConversationsMonth !== undefined) updateData['maxConversationsMonth'] = input.maxConversationsMonth;
  if (input.maxKbDocuments !== undefined) updateData['maxKbDocuments'] = input.maxKbDocuments;
  if (input.maxKbSizeMb !== undefined) updateData['maxKbSizeMb'] = input.maxKbSizeMb;
  if (input.allowedModels !== undefined) updateData['allowedModels'] = input.allowedModels as string[];
  if (input.priceEurMonth !== undefined) updateData['priceEurMonth'] = String(input.priceEurMonth);
  if (input.features !== undefined) updateData['features'] = input.features;

  const [updated] = await db
    .update(plans)
    .set(updateData)
    .where(eq(plans.id, planId))
    .returning();

  if (!updated) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404);
  return c.json(updated);
});

/**
 * DELETE /api/admin/plans/:id — Soft-deactivate a plan (sets isActive = false).
 * Plans are never hard-deleted because tenants may still reference them.
 */
adminPlansRouter.delete('/:id', async (c) => {
  const planId = c.req.param('id');
  const db = getDb();

  const [existing] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!existing) throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404);

  await db.update(plans).set({ isActive: false }).where(eq(plans.id, planId));
  return c.json({ message: 'Plan deactivated', planId });
});

export { adminPlansRouter };
export type { PlanModelTier };
