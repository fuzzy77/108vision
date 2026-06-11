/**
 * Graph Knowledge Base API routes.
 *
 * All routes are tenant-scoped (tenantMiddleware applied upstream).
 * Provides access to the entity graph: search, browse, merge, delete.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '@aia/shared';
import {
  searchEntities,
  findEntitiesByDocument,
  getEntityContext,
  getSubgraph,
  getStats,
  mergeEntities,
  deleteEntity,
  ENTITY_TYPES,
} from '@aia/graph';

const graph = new Hono();

// --- Validation Schemas ---

const listEntitiesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  type: z.string().optional(),
});

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  types: z.string().optional(), // comma-separated EntityType values
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const subgraphSchema = z.object({
  ids: z.string().min(1), // comma-separated entity IDs
});

const mergeSchema = z.object({
  targetEntityId: z.string().min(1),
});

// --- Routes ---

/**
 * GET /api/graph/entities — List entities for the current tenant (paginated, filterable).
 */
graph.get('/entities', async (c) => {
  const tenantId = c.get('tenantId') as string;

  const params = listEntitiesSchema.parse({
    page: c.req.query('page'),
    pageSize: c.req.query('pageSize'),
    type: c.req.query('type'),
  });

  // Use search with wildcard if no specific query -- fallback to listing
  const types = params.type ? [params.type] as any : undefined;
  const result = await searchEntities(tenantId, '*', types, params.pageSize);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    items: result.data,
    count: result.data.length,
    page: params.page,
    pageSize: params.pageSize,
  });
});

/**
 * GET /api/graph/entities/:id — Get a single entity with its relations.
 */
graph.get('/entities/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const entityId = c.req.param('id');

  if (!entityId) {
    throw new AppError('INVALID_ID', 'Entity ID is required', 400);
  }

  const result = await getEntityContext(tenantId, entityId);

  if (!result.success) {
    throw result.error;
  }

  if (!result.data) {
    throw new AppError('ENTITY_NOT_FOUND', 'Entity not found', 404);
  }

  return c.json(result.data);
});

/**
 * GET /api/graph/entities/:id/context — Get entity + 1-hop neighborhood.
 */
graph.get('/entities/:id/context', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const entityId = c.req.param('id');

  if (!entityId) {
    throw new AppError('INVALID_ID', 'Entity ID is required', 400);
  }

  const result = await getEntityContext(tenantId, entityId);

  if (!result.success) {
    throw result.error;
  }

  if (!result.data) {
    throw new AppError('ENTITY_NOT_FOUND', 'Entity not found', 404);
  }

  return c.json({
    entity: result.data.entity,
    neighbors: result.data.neighbors,
    relations: result.data.relations,
    neighborCount: result.data.neighbors.length,
    relationCount: result.data.relations.length,
  });
});

/**
 * GET /api/graph/search — Search entities by name/query (full-text).
 */
graph.get('/search', async (c) => {
  const tenantId = c.get('tenantId') as string;

  const params = searchSchema.parse({
    query: c.req.query('query'),
    types: c.req.query('types'),
    limit: c.req.query('limit'),
  });

  const types = params.types
    ? params.types.split(',').filter((t) => ENTITY_TYPES.includes(t as any)) as any[]
    : undefined;

  const result = await searchEntities(tenantId, params.query, types, params.limit);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    query: params.query,
    results: result.data,
    count: result.data.length,
  });
});

/**
 * GET /api/graph/subgraph — Get subgraph for given entity IDs.
 */
graph.get('/subgraph', async (c) => {
  const tenantId = c.get('tenantId') as string;

  const params = subgraphSchema.parse({
    ids: c.req.query('ids'),
  });

  const entityIds = params.ids.split(',').map((id) => id.trim()).filter(Boolean);

  if (entityIds.length === 0) {
    throw new AppError('INVALID_IDS', 'At least one entity ID is required', 400);
  }

  if (entityIds.length > 50) {
    throw new AppError('TOO_MANY_IDS', 'Maximum 50 entity IDs allowed', 400);
  }

  const result = await getSubgraph(tenantId, entityIds);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    entities: result.data.entities,
    relations: result.data.relations,
    entityCount: result.data.entities.length,
    relationCount: result.data.relations.length,
  });
});

/**
 * GET /api/graph/stats — Graph statistics for the current tenant.
 */
graph.get('/stats', async (c) => {
  const tenantId = c.get('tenantId') as string;

  const result = await getStats(tenantId);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * POST /api/graph/entities/:id/merge — Merge duplicate entities.
 * Transfers all relationships from source (path param) to target (body).
 */
graph.post('/entities/:id/merge', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const sourceEntityId = c.req.param('id');

  if (!sourceEntityId) {
    throw new AppError('INVALID_ID', 'Source entity ID is required', 400);
  }

  const body = await c.req.json();
  const { targetEntityId } = mergeSchema.parse(body);

  const result = await mergeEntities(tenantId, sourceEntityId, targetEntityId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    message: 'Entities merged successfully',
    sourceEntityId,
    targetEntityId,
  });
});

/**
 * DELETE /api/graph/entities/:id — Remove an entity and its relationships.
 */
graph.delete('/entities/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const entityId = c.req.param('id');

  if (!entityId) {
    throw new AppError('INVALID_ID', 'Entity ID is required', 400);
  }

  const result = await deleteEntity(tenantId, entityId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({ message: 'Entity deleted' });
});

/**
 * GET /api/graph/documents/:docId/entities — Entities extracted from a specific document.
 */
graph.get('/documents/:docId/entities', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const documentId = c.req.param('docId');

  if (!documentId) {
    throw new AppError('INVALID_ID', 'Document ID is required', 400);
  }

  const result = await findEntitiesByDocument(tenantId, documentId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    documentId,
    entities: result.data,
    count: result.data.length,
  });
});

export { graph };
