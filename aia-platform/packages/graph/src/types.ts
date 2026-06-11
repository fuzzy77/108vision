/**
 * @aia/graph — Type definitions for the Knowledge Graph module.
 */

export type EntityType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'PRODUCT'
  | 'SERVICE'
  | 'PROCESS'
  | 'DEPARTMENT'
  | 'ROLE'
  | 'LOCATION'
  | 'DOCUMENT'
  | 'REGULATION'
  | 'TECHNOLOGY'
  | 'EVENT'
  | 'METRIC'
  | 'CONCEPT';

export const ENTITY_TYPES: readonly EntityType[] = [
  'PERSON',
  'ORGANIZATION',
  'PRODUCT',
  'SERVICE',
  'PROCESS',
  'DEPARTMENT',
  'ROLE',
  'LOCATION',
  'DOCUMENT',
  'REGULATION',
  'TECHNOLOGY',
  'EVENT',
  'METRIC',
  'CONCEPT',
] as const;

export type RelationType =
  | 'WORKS_FOR'
  | 'MANAGES'
  | 'REPORTS_TO'
  | 'PRODUCES'
  | 'CONSUMES'
  | 'DEPENDS_ON'
  | 'PART_OF'
  | 'CONTAINS'
  | 'RELATED_TO'
  | 'RESPONSIBLE_FOR'
  | 'LOCATED_IN'
  | 'USES'
  | 'PROVIDES'
  | 'REQUIRES'
  | 'PRECEDES'
  | 'FOLLOWS'
  | 'TRIGGERS';

export const RELATION_TYPES: readonly RelationType[] = [
  'WORKS_FOR',
  'MANAGES',
  'REPORTS_TO',
  'PRODUCES',
  'CONSUMES',
  'DEPENDS_ON',
  'PART_OF',
  'CONTAINS',
  'RELATED_TO',
  'RESPONSIBLE_FOR',
  'LOCATED_IN',
  'USES',
  'PROVIDES',
  'REQUIRES',
  'PRECEDES',
  'FOLLOWS',
  'TRIGGERS',
] as const;

export interface GraphEntity {
  id: string;
  tenantId: string;
  type: EntityType;
  name: string;
  properties: Record<string, string | number | boolean>;
  sourceDocumentId: string;
  sourceChunkIndex: number;
  confidence: number;
  createdAt: Date;
}

export interface GraphRelation {
  id: string;
  tenantId: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: RelationType;
  properties: Record<string, string | number | boolean>;
  weight: number;
  sourceDocumentId: string;
  createdAt: Date;
}

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  properties: Record<string, string>;
  confidence: number;
}

export interface ExtractedRelation {
  source: string;
  target: string;
  type: RelationType;
  properties: Record<string, string>;
  weight: number;
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
}

export interface GraphSearchResult {
  entities: GraphEntity[];
  relations: GraphRelation[];
  paths: GraphPath[];
  relevanceScore: number;
}

export interface GraphPath {
  nodes: GraphEntity[];
  relationships: GraphRelation[];
  length: number;
}

export interface GraphStats {
  totalEntities: number;
  totalRelations: number;
  entitiesByType: Record<string, number>;
  topEntities: Array<{ name: string; type: EntityType; relationCount: number }>;
}
