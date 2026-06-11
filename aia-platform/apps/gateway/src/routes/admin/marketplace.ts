import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '@aia/shared';
import { marketplaceService } from '../../services/marketplace.service.js';

const adminMarketplaceRouter = new Hono();

const listTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().max(100).optional(),
  isPublic: z.enum(['true', 'false']).optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(100),
  systemPrompt: z.string().min(1).max(50000),
  modelPreference: z.enum(['fast-cheap', 'balanced', 'powerful']).default('balanced'),
  temperature: z.number().min(0).max(2).default(0.7),
  icon: z.string().max(100).optional(),
  isPublic: z.boolean().default(true),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(100).optional(),
  systemPrompt: z.string().min(1).max(50000).optional(),
  modelPreference: z.enum(['fast-cheap', 'balanced', 'powerful']).optional(),
  temperature: z.number().min(0).max(2).optional(),
  icon: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
});

const installTemplateSchema = z.object({
  tenantId: z.string().uuid(),
});

/**
 * GET /api/admin/marketplace/templates — List all available agent templates.
 */
adminMarketplaceRouter.get('/templates', async (c) => {
  const query = listTemplatesQuerySchema.parse({
    page: c.req.query('page'),
    pageSize: c.req.query('pageSize'),
    category: c.req.query('category'),
    isPublic: c.req.query('isPublic'),
  });

  const filters = {
    category: query.category,
    isPublic: query.isPublic !== undefined ? query.isPublic === 'true' : undefined,
  };

  const result = await marketplaceService.listTemplates(filters, query.page, query.pageSize);

  if (!result.success) {
    throw result.error;
  }

  const offset = (query.page - 1) * query.pageSize;

  return c.json({
    items: result.data.items,
    total: result.data.total,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: offset + result.data.items.length < result.data.total,
  });
});

/**
 * GET /api/admin/marketplace/templates/:id — Get template detail.
 */
adminMarketplaceRouter.get('/templates/:id', async (c) => {
  const templateId = c.req.param('id');

  if (!templateId) {
    throw new AppError('INVALID_ID', 'Template ID is required', 400);
  }

  const result = await marketplaceService.getTemplate(templateId);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * POST /api/admin/marketplace/templates — Create/publish a new template.
 */
adminMarketplaceRouter.post('/templates', async (c) => {
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const input = createTemplateSchema.parse(body);

  const result = await marketplaceService.createTemplate(input, userId);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data, 201);
});

/**
 * POST /api/admin/marketplace/templates/:id/install — Install template for a specific tenant.
 */
adminMarketplaceRouter.post('/templates/:id/install', async (c) => {
  const templateId = c.req.param('id');

  if (!templateId) {
    throw new AppError('INVALID_ID', 'Template ID is required', 400);
  }

  const body = await c.req.json();
  const input = installTemplateSchema.parse(body);

  const result = await marketplaceService.installTemplate(templateId, input.tenantId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    message: 'Template installed',
    agentId: result.data.agentId,
    templateId,
    tenantId: input.tenantId,
  }, 201);
});

/**
 * PUT /api/admin/marketplace/templates/:id — Update a template.
 */
adminMarketplaceRouter.put('/templates/:id', async (c) => {
  const templateId = c.req.param('id');

  if (!templateId) {
    throw new AppError('INVALID_ID', 'Template ID is required', 400);
  }

  const body = await c.req.json();
  const input = updateTemplateSchema.parse(body);

  // Ensure at least one field is being updated
  const hasUpdates = Object.values(input).some((v) => v !== undefined);
  if (!hasUpdates) {
    throw new AppError('NO_UPDATES', 'No fields to update', 400);
  }

  const result = await marketplaceService.updateTemplate(templateId, input);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * DELETE /api/admin/marketplace/templates/:id — Unpublish a template.
 */
adminMarketplaceRouter.delete('/templates/:id', async (c) => {
  const templateId = c.req.param('id');

  if (!templateId) {
    throw new AppError('INVALID_ID', 'Template ID is required', 400);
  }

  const result = await marketplaceService.deleteTemplate(templateId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({ message: 'Template unpublished', templateId });
});

export { adminMarketplaceRouter };
