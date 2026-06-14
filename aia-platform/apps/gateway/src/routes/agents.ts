import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { agents } from '../db/schema.js';
import { requireRole } from '../middleware/auth.js';
import { principlesService } from '../services/principles.service.js';

const agentsRouter = new Hono();

const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  systemPrompt: z.string().min(1),
  model: z.enum(['fast-cheap', 'balanced', 'powerful']).default('balanced'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().max(32768).default(4096),
  knowledgeBaseIds: z.array(z.string().uuid()).optional(),
  config: z.record(z.unknown()).optional(),
});

const updateAgentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  systemPrompt: z.string().min(1).optional(),
  model: z.enum(['fast-cheap', 'balanced', 'powerful']).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(32768).optional(),
  knowledgeBaseIds: z.array(z.string().uuid()).optional(),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/agents/principles — List available AI governance principles.
 */
agentsRouter.get('/principles', async (c) => {
  const definitions = principlesService.getPrincipleDefinitions();
  return c.json({ items: definitions });
});

/**
 * GET /api/agents — List agents for the current tenant.
 */
agentsRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const db = getDb();

  const tenantAgents = await db
    .select()
    .from(agents)
    .where(
      and(
        eq(agents.tenantId, tenantId),
        eq(agents.isActive, true),
      ),
    );

  return c.json({ items: tenantAgents });
});

/**
 * GET /api/agents/:id — Get a specific agent.
 */
agentsRouter.get('/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const agentId = c.req.param('id');

  if (!agentId) {
    throw new AppError('INVALID_ID', 'Agent ID is required', 400);
  }

  const db = getDb();
  const [agent] = await db
    .select()
    .from(agents)
    .where(
      and(
        eq(agents.id, agentId),
        eq(agents.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (!agent) {
    throw new AppError('AGENT_NOT_FOUND', 'Agent not found', 404);
  }

  return c.json(agent);
});

/**
 * POST /api/agents — Create a new agent. Admin only.
 */
agentsRouter.post('/', requireRole('platform_admin', 'tenant_admin'), async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = await c.req.json();
  const input = createAgentSchema.parse(body);

  const db = getDb();
  const [agent] = await db
    .insert(agents)
    .values({
      tenantId,
      name: input.name,
      description: input.description ?? null,
      systemPrompt: input.systemPrompt,
      model: input.model,
      temperature: String(input.temperature),
      maxTokens: input.maxTokens,
      knowledgeBaseIds: input.knowledgeBaseIds ?? [],
      config: input.config ?? {},
      isActive: true,
    })
    .returning();

  if (!agent) {
    throw new AppError('AGENT_CREATE_FAILED', 'Failed to create agent', 500);
  }

  return c.json(agent, 201);
});

/**
 * PUT /api/agents/:id — Update an agent. Admin only.
 */
agentsRouter.put('/:id', requireRole('platform_admin', 'tenant_admin'), async (c) => {
  const tenantId = c.get('tenantId') as string;
  const agentId = c.req.param('id');

  if (!agentId) {
    throw new AppError('INVALID_ID', 'Agent ID is required', 400);
  }

  const body = await c.req.json();
  const input = updateAgentSchema.parse(body);

  const db = getDb();

  // Verify agent exists and belongs to tenant
  const [existing] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(
      and(
        eq(agents.id, agentId),
        eq(agents.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new AppError('AGENT_NOT_FOUND', 'Agent not found', 404);
  }

  // Build update object dynamically
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData['name'] = input.name;
  if (input.description !== undefined) updateData['description'] = input.description;
  if (input.systemPrompt !== undefined) updateData['systemPrompt'] = input.systemPrompt;
  if (input.model !== undefined) updateData['model'] = input.model;
  if (input.temperature !== undefined) updateData['temperature'] = String(input.temperature);
  if (input.maxTokens !== undefined) updateData['maxTokens'] = input.maxTokens;
  if (input.knowledgeBaseIds !== undefined) updateData['knowledgeBaseIds'] = input.knowledgeBaseIds;
  if (input.config !== undefined) updateData['config'] = input.config;
  if (input.isActive !== undefined) updateData['isActive'] = input.isActive;

  if (Object.keys(updateData).length === 0) {
    throw new AppError('NO_UPDATES', 'No fields to update', 400);
  }

  const [updated] = await db
    .update(agents)
    .set(updateData)
    .where(
      and(
        eq(agents.id, agentId),
        eq(agents.tenantId, tenantId),
      ),
    )
    .returning();

  return c.json(updated);
});

/**
 * DELETE /api/agents/:id — Soft delete an agent. Admin only.
 */
agentsRouter.delete('/:id', requireRole('platform_admin', 'tenant_admin'), async (c) => {
  const tenantId = c.get('tenantId') as string;
  const agentId = c.req.param('id');

  if (!agentId) {
    throw new AppError('INVALID_ID', 'Agent ID is required', 400);
  }

  const db = getDb();
  const [updated] = await db
    .update(agents)
    .set({ isActive: false })
    .where(
      and(
        eq(agents.id, agentId),
        eq(agents.tenantId, tenantId),
      ),
    )
    .returning({ id: agents.id });

  if (!updated) {
    throw new AppError('AGENT_NOT_FOUND', 'Agent not found', 404);
  }

  return c.json({ message: 'Agent deleted' });
});

export { agentsRouter };
