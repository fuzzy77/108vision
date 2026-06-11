/**
 * @aia/graph — Graph CRUD repository.
 *
 * All operations are tenant-scoped. Neo4j nodes use the label "Entity"
 * plus an additional label matching the EntityType (e.g., :Entity:PERSON).
 * Relationships use typed relationship names matching RelationType.
 */

import { type Result, success, failure, AppError } from '@aia/shared';
import { nanoid } from 'nanoid';
import { runInTransaction, runReadTransaction } from './client.js';
import type {
  GraphEntity,
  GraphRelation,
  EntityType,
  RelationType,
  GraphStats,
  GraphPath,
} from './types.js';

// --- Entity Operations ---

/**
 * Create a new entity node in the graph.
 * The node gets labels [:Entity, :${type}] and all properties are stored as node properties.
 */
export async function createEntity(
  entity: Omit<GraphEntity, 'id' | 'createdAt'>,
): Promise<Result<GraphEntity>> {
  const id = nanoid(21);
  const now = new Date();

  const result = await runInTransaction(async (tx) => {
    const queryResult = await tx.run(
      `CREATE (e:Entity:${entity.type} {
        id: $id,
        tenantId: $tenantId,
        type: $type,
        name: $name,
        normalizedName: $normalizedName,
        properties: $properties,
        sourceDocumentId: $sourceDocumentId,
        sourceChunkIndex: $sourceChunkIndex,
        confidence: $confidence,
        createdAt: $createdAt
      })
      RETURN e`,
      {
        id,
        tenantId: entity.tenantId,
        type: entity.type,
        name: entity.name,
        normalizedName: entity.name.toLowerCase().trim(),
        properties: JSON.stringify(entity.properties),
        sourceDocumentId: entity.sourceDocumentId,
        sourceChunkIndex: entity.sourceChunkIndex,
        confidence: entity.confidence,
        createdAt: now.toISOString(),
      },
    );

    return queryResult.records[0];
  });

  if (!result.success) {
    return failure(result.error);
  }

  const created: GraphEntity = {
    id,
    tenantId: entity.tenantId,
    type: entity.type,
    name: entity.name,
    properties: entity.properties,
    sourceDocumentId: entity.sourceDocumentId,
    sourceChunkIndex: entity.sourceChunkIndex,
    confidence: entity.confidence,
    createdAt: now,
  };

  return success(created);
}

/**
 * Create a relationship between two entities.
 * Uses a generic GRAPH_REL relationship type with a `type` property to allow Cypher filtering.
 */
export async function createRelation(
  relation: Omit<GraphRelation, 'id' | 'createdAt'>,
): Promise<Result<GraphRelation>> {
  const id = nanoid(21);
  const now = new Date();

  const result = await runInTransaction(async (tx) => {
    const queryResult = await tx.run(
      `MATCH (source:Entity {id: $sourceId, tenantId: $tenantId})
       MATCH (target:Entity {id: $targetId, tenantId: $tenantId})
       CREATE (source)-[r:GRAPH_REL {
         id: $id,
         tenantId: $tenantId,
         type: $type,
         properties: $properties,
         weight: $weight,
         sourceDocumentId: $sourceDocumentId,
         createdAt: $createdAt
       }]->(target)
       RETURN r`,
      {
        id,
        tenantId: relation.tenantId,
        sourceId: relation.sourceEntityId,
        targetId: relation.targetEntityId,
        type: relation.type,
        properties: JSON.stringify(relation.properties),
        weight: relation.weight,
        sourceDocumentId: relation.sourceDocumentId,
        createdAt: now.toISOString(),
      },
    );

    return queryResult.records[0];
  });

  if (!result.success) {
    return failure(result.error);
  }

  const created: GraphRelation = {
    id,
    tenantId: relation.tenantId,
    sourceEntityId: relation.sourceEntityId,
    targetEntityId: relation.targetEntityId,
    type: relation.type,
    properties: relation.properties,
    weight: relation.weight,
    sourceDocumentId: relation.sourceDocumentId,
    createdAt: now,
  };

  return success(created);
}

/**
 * Find an entity by name within a tenant, with optional type filter.
 * Uses normalized name for case-insensitive matching.
 */
export async function findEntity(
  tenantId: string,
  name: string,
  type?: EntityType,
): Promise<Result<GraphEntity | null>> {
  const normalizedName = name.toLowerCase().trim();

  const typeFilter = type ? `AND e.type = $type` : '';
  const params: Record<string, unknown> = { tenantId, normalizedName };
  if (type) {
    params['type'] = type;
  }

  const result = await runReadTransaction(async (tx) => {
    const queryResult = await tx.run(
      `MATCH (e:Entity {tenantId: $tenantId, normalizedName: $normalizedName})
       WHERE true ${typeFilter}
       RETURN e
       LIMIT 1`,
      params,
    );
    return queryResult.records[0] ?? null;
  });

  if (!result.success) {
    return failure(result.error);
  }

  if (!result.data) {
    return success(null);
  }

  const node = result.data.get('e').properties;
  return success(recordToEntity(node));
}

/**
 * Find all entities extracted from a specific document.
 */
export async function findEntitiesByDocument(
  tenantId: string,
  documentId: string,
): Promise<Result<GraphEntity[]>> {
  const result = await runReadTransaction(async (tx) => {
    const queryResult = await tx.run(
      `MATCH (e:Entity {tenantId: $tenantId, sourceDocumentId: $documentId})
       RETURN e
       ORDER BY e.sourceChunkIndex ASC`,
      { tenantId, documentId },
    );
    return queryResult.records;
  });

  if (!result.success) {
    return failure(result.error);
  }

  const entities = result.data.map((record) => recordToEntity(record.get('e').properties));
  return success(entities);
}

/**
 * Traverse the graph starting from an entity, following relationships up to a given depth.
 */
export async function findRelatedEntities(
  tenantId: string,
  entityId: string,
  depth: number = 2,
  relationTypes?: RelationType[],
): Promise<Result<{ entities: GraphEntity[]; relations: GraphRelation[] }>> {
  const relFilter = relationTypes && relationTypes.length > 0
    ? `WHERE r.type IN $relationTypes`
    : '';
  const params: Record<string, unknown> = { tenantId, entityId, depth };
  if (relationTypes && relationTypes.length > 0) {
    params['relationTypes'] = relationTypes;
  }

  const result = await runReadTransaction(async (tx) => {
    const queryResult = await tx.run(
      `MATCH (start:Entity {id: $entityId, tenantId: $tenantId})
       MATCH path = (start)-[r:GRAPH_REL*1..${depth}]-(related:Entity {tenantId: $tenantId})
       ${relFilter}
       UNWIND relationships(path) AS rel
       WITH COLLECT(DISTINCT related) AS relatedNodes, COLLECT(DISTINCT rel) AS rels
       RETURN relatedNodes, rels`,
      params,
    );
    return queryResult.records[0] ?? null;
  });

  if (!result.success) {
    return failure(result.error);
  }

  if (!result.data) {
    return success({ entities: [], relations: [] });
  }

  const relatedNodes = result.data.get('relatedNodes') as unknown[];
  const rels = result.data.get('rels') as unknown[];

  const entities = (relatedNodes ?? []).map((node: any) => recordToEntity(node.properties));
  const relations = (rels ?? []).map((rel: any) => recordToRelation(rel.properties));

  return success({ entities, relations });
}

/**
 * Full-text search on entity names and properties.
 */
export async function searchEntities(
  tenantId: string,
  query: string,
  types?: EntityType[],
  limit: number = 20,
): Promise<Result<GraphEntity[]>> {
  const result = await runReadTransaction(async (tx) => {
    // Use full-text index for search
    const queryResult = await tx.run(
      `CALL db.index.fulltext.queryNodes("entity_fulltext_idx", $query)
       YIELD node, score
       WHERE node.tenantId = $tenantId
       ${types && types.length > 0 ? 'AND node.type IN $types' : ''}
       RETURN node, score
       ORDER BY score DESC
       LIMIT $limit`,
      {
        tenantId,
        query: `${query}~`,
        types: types ?? [],
        limit: neo4jInt(limit),
      },
    );
    return queryResult.records;
  });

  if (!result.success) {
    return failure(result.error);
  }

  const entities = result.data.map((record) => recordToEntity(record.get('node').properties));
  return success(entities);
}

/**
 * Get an entity with all its direct relationships and neighbor entities (1-hop).
 */
export async function getEntityContext(
  tenantId: string,
  entityId: string,
): Promise<Result<{ entity: GraphEntity; neighbors: GraphEntity[]; relations: GraphRelation[] } | null>> {
  const result = await runReadTransaction(async (tx) => {
    const queryResult = await tx.run(
      `MATCH (e:Entity {id: $entityId, tenantId: $tenantId})
       OPTIONAL MATCH (e)-[r:GRAPH_REL]-(neighbor:Entity {tenantId: $tenantId})
       RETURN e,
              COLLECT(DISTINCT neighbor) AS neighbors,
              COLLECT(DISTINCT r) AS relations`,
      { tenantId, entityId },
    );
    return queryResult.records[0] ?? null;
  });

  if (!result.success) {
    return failure(result.error);
  }

  if (!result.data) {
    return success(null);
  }

  const entityNode = result.data.get('e');
  if (!entityNode) {
    return success(null);
  }

  const entity = recordToEntity(entityNode.properties);
  const neighbors = (result.data.get('neighbors') as unknown[] ?? [])
    .map((node: any) => recordToEntity(node.properties));
  const relations = (result.data.get('relations') as unknown[] ?? [])
    .filter((rel: any) => rel !== null)
    .map((rel: any) => recordToRelation(rel.properties));

  return success({ entity, neighbors, relations });
}

/**
 * Get a subgraph containing the specified entities and all relationships between them.
 */
export async function getSubgraph(
  tenantId: string,
  entityIds: string[],
): Promise<Result<{ entities: GraphEntity[]; relations: GraphRelation[] }>> {
  if (entityIds.length === 0) {
    return success({ entities: [], relations: [] });
  }

  const result = await runReadTransaction(async (tx) => {
    const queryResult = await tx.run(
      `MATCH (e:Entity {tenantId: $tenantId})
       WHERE e.id IN $entityIds
       OPTIONAL MATCH (e)-[r:GRAPH_REL]-(other:Entity {tenantId: $tenantId})
       WHERE other.id IN $entityIds
       RETURN COLLECT(DISTINCT e) AS entities, COLLECT(DISTINCT r) AS relations`,
      { tenantId, entityIds },
    );
    return queryResult.records[0] ?? null;
  });

  if (!result.success) {
    return failure(result.error);
  }

  if (!result.data) {
    return success({ entities: [], relations: [] });
  }

  const entities = (result.data.get('entities') as unknown[] ?? [])
    .map((node: any) => recordToEntity(node.properties));
  const relations = (result.data.get('relations') as unknown[] ?? [])
    .filter((rel: any) => rel !== null)
    .map((rel: any) => recordToRelation(rel.properties));

  return success({ entities, relations });
}

/**
 * Delete all entities and relationships from a specific document.
 */
export async function deleteDocumentEntities(
  tenantId: string,
  documentId: string,
): Promise<Result<number>> {
  const result = await runInTransaction(async (tx) => {
    const queryResult = await tx.run(
      `MATCH (e:Entity {tenantId: $tenantId, sourceDocumentId: $documentId})
       DETACH DELETE e
       RETURN count(e) AS deletedCount`,
      { tenantId, documentId },
    );
    const record = queryResult.records[0];
    return record ? (record.get('deletedCount') as number) : 0;
  });

  if (!result.success) {
    return failure(result.error);
  }

  return success(result.data);
}

/**
 * Get graph statistics for a tenant.
 */
export async function getStats(tenantId: string): Promise<Result<GraphStats>> {
  const result = await runReadTransaction(async (tx) => {
    const entityCountResult = await tx.run(
      `MATCH (e:Entity {tenantId: $tenantId})
       RETURN e.type AS type, count(e) AS count`,
      { tenantId },
    );

    const relationCountResult = await tx.run(
      `MATCH (:Entity {tenantId: $tenantId})-[r:GRAPH_REL]->(:Entity {tenantId: $tenantId})
       RETURN count(r) AS totalRelations`,
      { tenantId },
    );

    const topEntitiesResult = await tx.run(
      `MATCH (e:Entity {tenantId: $tenantId})
       OPTIONAL MATCH (e)-[r:GRAPH_REL]-()
       WITH e, count(r) AS relCount
       ORDER BY relCount DESC
       LIMIT 10
       RETURN e.name AS name, e.type AS type, relCount`,
      { tenantId },
    );

    return { entityCountResult, relationCountResult, topEntitiesResult };
  });

  if (!result.success) {
    return failure(result.error);
  }

  const { entityCountResult, relationCountResult, topEntitiesResult } = result.data;

  const entitiesByType: Record<string, number> = {};
  let totalEntities = 0;

  for (const record of entityCountResult.records) {
    const type = record.get('type') as string;
    const count = record.get('count') as number;
    entitiesByType[type] = count;
    totalEntities += count;
  }

  const totalRelations = relationCountResult.records[0]?.get('totalRelations') as number ?? 0;

  const topEntities = topEntitiesResult.records.map((record) => ({
    name: record.get('name') as string,
    type: record.get('type') as EntityType,
    relationCount: record.get('relCount') as number,
  }));

  return success({
    totalEntities,
    totalRelations,
    entitiesByType,
    topEntities,
  });
}

/**
 * Merge two entities: transfers all relationships from source to target,
 * then deletes the source entity.
 */
export async function mergeEntities(
  tenantId: string,
  sourceId: string,
  targetId: string,
): Promise<Result<void>> {
  if (sourceId === targetId) {
    return failure(new AppError('GRAPH_MERGE_SAME', 'Cannot merge an entity with itself', 400));
  }

  const result = await runInTransaction(async (tx) => {
    // Verify both entities exist and belong to the tenant
    const verifyResult = await tx.run(
      `MATCH (s:Entity {id: $sourceId, tenantId: $tenantId})
       MATCH (t:Entity {id: $targetId, tenantId: $tenantId})
       RETURN s.id AS sourceExists, t.id AS targetExists`,
      { tenantId, sourceId, targetId },
    );

    if (verifyResult.records.length === 0) {
      throw new Error('One or both entities not found');
    }

    // Transfer incoming relationships
    await tx.run(
      `MATCH (s:Entity {id: $sourceId, tenantId: $tenantId})
       MATCH (t:Entity {id: $targetId, tenantId: $tenantId})
       MATCH (other)-[r:GRAPH_REL]->(s)
       WHERE other.id <> $targetId
       CREATE (other)-[newRel:GRAPH_REL]->(t)
       SET newRel = properties(r)
       DELETE r`,
      { tenantId, sourceId, targetId },
    );

    // Transfer outgoing relationships
    await tx.run(
      `MATCH (s:Entity {id: $sourceId, tenantId: $tenantId})
       MATCH (t:Entity {id: $targetId, tenantId: $tenantId})
       MATCH (s)-[r:GRAPH_REL]->(other)
       WHERE other.id <> $targetId
       CREATE (t)-[newRel:GRAPH_REL]->(other)
       SET newRel = properties(r)
       DELETE r`,
      { tenantId, sourceId, targetId },
    );

    // Delete the source entity (and any remaining self-loops)
    await tx.run(
      `MATCH (s:Entity {id: $sourceId, tenantId: $tenantId})
       DETACH DELETE s`,
      { tenantId, sourceId },
    );
  });

  if (!result.success) {
    return failure(result.error);
  }

  return success(undefined);
}

/**
 * Delete a single entity and all its relationships.
 */
export async function deleteEntity(
  tenantId: string,
  entityId: string,
): Promise<Result<void>> {
  const result = await runInTransaction(async (tx) => {
    const queryResult = await tx.run(
      `MATCH (e:Entity {id: $entityId, tenantId: $tenantId})
       DETACH DELETE e
       RETURN count(e) AS deleted`,
      { tenantId, entityId },
    );
    const deleted = queryResult.records[0]?.get('deleted') as number ?? 0;
    if (deleted === 0) {
      throw new Error('Entity not found');
    }
  });

  if (!result.success) {
    if (result.error.message.includes('Entity not found')) {
      return failure(new AppError('ENTITY_NOT_FOUND', 'Entity not found', 404));
    }
    return failure(result.error);
  }

  return success(undefined);
}

/**
 * Find an entity by its ID.
 */
export async function findEntityById(
  tenantId: string,
  entityId: string,
): Promise<Result<GraphEntity | null>> {
  const result = await runReadTransaction(async (tx) => {
    const queryResult = await tx.run(
      `MATCH (e:Entity {id: $entityId, tenantId: $tenantId})
       RETURN e`,
      { tenantId, entityId },
    );
    return queryResult.records[0] ?? null;
  });

  if (!result.success) {
    return failure(result.error);
  }

  if (!result.data) {
    return success(null);
  }

  return success(recordToEntity(result.data.get('e').properties));
}

// --- Helpers ---

function recordToEntity(props: Record<string, unknown>): GraphEntity {
  return {
    id: props['id'] as string,
    tenantId: props['tenantId'] as string,
    type: props['type'] as EntityType,
    name: props['name'] as string,
    properties: parseJsonProp(props['properties']),
    sourceDocumentId: props['sourceDocumentId'] as string,
    sourceChunkIndex: props['sourceChunkIndex'] as number,
    confidence: props['confidence'] as number,
    createdAt: new Date(props['createdAt'] as string),
  };
}

function recordToRelation(props: Record<string, unknown>): GraphRelation {
  return {
    id: props['id'] as string,
    tenantId: props['tenantId'] as string,
    sourceEntityId: '', // populated from relationship context if needed
    targetEntityId: '',
    type: props['type'] as RelationType,
    properties: parseJsonProp(props['properties']),
    weight: props['weight'] as number,
    sourceDocumentId: props['sourceDocumentId'] as string,
    createdAt: new Date(props['createdAt'] as string),
  };
}

function parseJsonProp(value: unknown): Record<string, string | number | boolean> {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, string | number | boolean>;
  }
  return {};
}

function neo4jInt(value: number): number {
  return value;
}
