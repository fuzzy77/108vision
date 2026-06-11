/**
 * Graph-enhanced ingestion service.
 *
 * Extends the standard document ingestion pipeline by extracting entities
 * and relationships from document chunks and storing them in Neo4j.
 *
 * Graph extraction is NON-BLOCKING: if it fails, the document remains
 * available via vector search. Graph data is supplementary.
 */

import { type Result, success, failure } from '@aia/shared';
import {
  extractEntitiesBatch,
  deduplicateEntities,
  createEntity,
  createRelation,
  findEntity,
  deleteDocumentEntities,
  type ExtractionConfig,
  type ExtractedEntity,
  type GraphEntity,
} from '@aia/graph';

export interface GraphIngestionInput {
  documentId: string;
  tenantId: string;
  documentTitle: string;
  chunks: Array<{ text: string; index: number }>;
}

export interface GraphIngestionResult {
  entitiesCreated: number;
  relationsCreated: number;
  entitiesSkipped: number;
  durationMs: number;
}

/**
 * Process document chunks for entity extraction and graph storage.
 * This function is designed to be called AFTER successful vector ingestion.
 */
export async function ingestDocumentGraph(
  input: GraphIngestionInput,
  config: ExtractionConfig,
): Promise<Result<GraphIngestionResult>> {
  const startTime = Date.now();
  const { documentId, tenantId, documentTitle, chunks } = input;

  if (chunks.length === 0) {
    return success({
      entitiesCreated: 0,
      relationsCreated: 0,
      entitiesSkipped: 0,
      durationMs: Date.now() - startTime,
    });
  }

  // Step 1: Extract entities from all chunks (batched)
  const extractionResult = await extractEntitiesBatch(
    chunks,
    config,
    `Document: ${documentTitle}`,
    5, // max 5 concurrent LLM calls
  );

  if (!extractionResult.success) {
    return failure(extractionResult.error);
  }

  // Step 2: Deduplicate entities across chunks
  const deduplicated = deduplicateEntities(extractionResult.data);

  if (deduplicated.entities.length === 0) {
    return success({
      entitiesCreated: 0,
      relationsCreated: 0,
      entitiesSkipped: 0,
      durationMs: Date.now() - startTime,
    });
  }

  // Step 3: Store entities in Neo4j (merge with existing or create new)
  const entityIdMap = new Map<string, string>(); // normalized name -> neo4j entity id
  let entitiesCreated = 0;
  let entitiesSkipped = 0;

  for (const entity of deduplicated.entities) {
    const storedEntity = await storeOrMergeEntity(entity, tenantId, documentId);
    if (storedEntity) {
      entityIdMap.set(entity.name.toLowerCase().trim(), storedEntity.id);
      entitiesCreated++;
    } else {
      entitiesSkipped++;
    }
  }

  // Step 4: Store relations
  let relationsCreated = 0;

  for (const relation of deduplicated.relations) {
    const sourceId = entityIdMap.get(relation.source.toLowerCase().trim());
    const targetId = entityIdMap.get(relation.target.toLowerCase().trim());

    if (!sourceId || !targetId) continue;

    const relResult = await createRelation({
      tenantId,
      sourceEntityId: sourceId,
      targetEntityId: targetId,
      type: relation.type,
      properties: relation.properties,
      weight: relation.weight,
      sourceDocumentId: documentId,
    });

    if (relResult.success) {
      relationsCreated++;
    }
  }

  return success({
    entitiesCreated,
    relationsCreated,
    entitiesSkipped,
    durationMs: Date.now() - startTime,
  });
}

/**
 * Re-extract entities for an existing document.
 * Removes old graph data, then re-runs extraction on the provided chunks.
 */
export async function reindexDocumentGraph(
  input: GraphIngestionInput,
  config: ExtractionConfig,
): Promise<Result<GraphIngestionResult>> {
  const { documentId, tenantId } = input;

  // Remove existing graph data for this document
  const deleteResult = await deleteDocumentEntities(tenantId, documentId);
  if (!deleteResult.success) {
    return failure(deleteResult.error);
  }

  // Re-run extraction
  return ingestDocumentGraph(input, config);
}

/**
 * Remove all graph data for a document.
 */
export async function removeDocumentGraph(
  tenantId: string,
  documentId: string,
): Promise<Result<number>> {
  return deleteDocumentEntities(tenantId, documentId);
}

// --- Internal ---

/**
 * Store an entity in Neo4j. If an entity with the same name and type
 * already exists for this tenant, returns the existing entity ID
 * instead of creating a duplicate.
 */
async function storeOrMergeEntity(
  extracted: ExtractedEntity,
  tenantId: string,
  documentId: string,
): Promise<GraphEntity | null> {
  // Check if entity already exists for this tenant
  const existingResult = await findEntity(tenantId, extracted.name, extracted.type);

  if (existingResult.success && existingResult.data) {
    // Entity already exists -- return existing
    return existingResult.data;
  }

  // Create new entity
  // Determine chunk index from first occurrence (use 0 as default)
  const createResult = await createEntity({
    tenantId,
    type: extracted.type,
    name: extracted.name,
    properties: extracted.properties,
    sourceDocumentId: documentId,
    sourceChunkIndex: 0,
    confidence: extracted.confidence,
  });

  if (createResult.success) {
    return createResult.data;
  }

  return null;
}
