/**
 * Memory Routes — CRUD + search for persistent AI memory.
 *
 * Endpoints:
 * - POST   /api/memory         — Store a new memory
 * - GET    /api/memory         — List memories (paginated)
 * - GET    /api/memory/search  — Semantic search
 * - PUT    /api/memory/:id     — Update a memory
 * - DELETE /api/memory/:id     — Delete a memory
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { memoryService } from '../services/memory.service.js';

const memory = new Hono();

const storeSchema = z.object({
  content: z.string().min(1).max(2000),
  tags: z.array(z.string().max(50)).max(10).optional(),
  category: z.enum(['general', 'preference', 'project', 'decision', 'person', 'workflow']).optional(),
});

const updateSchema = z.object({
  content: z.string().min(1).max(2000),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

/**
 * POST /api/memory — Store a new memory.
 */
memory.post('/', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const userId = c.get('userId') as string | undefined;
  const body = storeSchema.parse(await c.req.json());

  const result = await memoryService.store(tenantId, {
    content: body.content,
    tags: body.tags,
    category: body.category,
    userId,
    source: 'user',
  });

  return c.json(result, 201);
});

/**
 * GET /api/memory — List all memories (paginated).
 */
memory.get('/', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const page = parseInt(c.req.query('page') ?? '1', 10);
  const pageSize = Math.min(Math.max(parseInt(c.req.query('pageSize') ?? '50', 10) || 50, 1), 100);
  const category = c.req.query('category') ?? undefined;

  const result = await memoryService.list(tenantId, { page, pageSize, category });
  return c.json(result);
});

/**
 * GET /api/memory/search — Semantic search memories.
 */
memory.get('/search', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const query = c.req.query('q');

  if (!query || query.trim().length === 0) {
    return c.json({ items: [] });
  }

  const category = c.req.query('category') ?? undefined;
  const limit = parseInt(c.req.query('limit') ?? '10', 10);

  const items = await memoryService.search(tenantId, query, { limit, category });
  return c.json({ items });
});

/**
 * PUT /api/memory/:id — Update a memory.
 */
memory.put('/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const memoryId = c.req.param('id');
  const body = updateSchema.parse(await c.req.json());

  const result = await memoryService.update(tenantId, memoryId, body.content, body.tags);

  if (!result) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Memory not found' } }, 404);
  }

  return c.json(result);
});

/**
 * DELETE /api/memory/:id — Delete a memory.
 */
memory.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const memoryId = c.req.param('id');

  const deleted = await memoryService.delete(tenantId, memoryId);

  if (!deleted) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Memory not found' } }, 404);
  }

  return c.json({ deleted: true });
});

export { memory as memoryRouter };
