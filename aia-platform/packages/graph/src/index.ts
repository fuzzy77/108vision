/**
 * @aia/graph — Knowledge Graph module for the AIA Platform.
 *
 * Provides entity extraction from documents, graph storage via Neo4j,
 * and graph-enhanced retrieval for RAG pipelines.
 */

// Types
export type {
  GraphEntity,
  GraphRelation,
  EntityType,
  RelationType,
  ExtractedEntity,
  ExtractedRelation,
  EntityExtractionResult,
  GraphSearchResult,
  GraphPath,
  GraphStats,
} from './types.js';

export { ENTITY_TYPES, RELATION_TYPES } from './types.js';

// Client
export {
  connect,
  close,
  getDriver,
  getSession,
  runQuery,
  runInTransaction,
  runReadTransaction,
  healthCheck,
  type Neo4jConfig,
} from './client.js';

// Setup
export { initializeGraphSchema, checkApocAvailable } from './setup.js';

// Repository
export {
  createEntity,
  createRelation,
  findEntity,
  findEntityById,
  findEntitiesByDocument,
  findRelatedEntities,
  searchEntities,
  getEntityContext,
  getSubgraph,
  deleteDocumentEntities,
  deleteEntity,
  getStats,
  mergeEntities,
} from './repository.js';

// Extraction
export {
  extractEntities,
  extractEntitiesBatch,
  deduplicateEntities,
  type ExtractionConfig,
} from './extraction.js';
