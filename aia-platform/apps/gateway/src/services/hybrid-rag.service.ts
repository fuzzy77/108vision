import { type Result, success, failure, AppError } from '@aia/shared';
import { ragService, type RetrievedChunk } from './rag.service.js';
import type { ChatMessage } from '@aia/ai-client';

// --- Interfaces ---

export interface HybridRagOptions {
  vectorWeight?: number;
  graphWeight?: number;
  vectorTopK?: number;
  graphDepth?: number;
  graphMaxEntities?: number;
  useGraph?: boolean;
  minVectorScore?: number;
}

export interface GraphEntity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, unknown>;
  confidence: number;
  sourceDocumentId?: string;
}

export interface GraphRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, unknown>;
  weight: number;
}

export interface GraphContext {
  entities: GraphEntity[];
  relations: GraphRelation[];
  summary: string;
}

export interface HybridContextItem {
  type: 'vector' | 'graph';
  content: string;
  score: number;
  source: string;
  metadata: Record<string, unknown>;
}

export interface HybridRetrievalResult {
  items: HybridContextItem[];
  vectorChunks: RetrievedChunk[];
  graphContext: GraphContext | null;
  graphAvailable: boolean;
}

// --- Graph Repository Interface ---
// The other agent will implement this interface in the graph repository module.
// We define it here so the hybrid RAG can reference it without a hard dependency.

export interface GraphRepository {
  searchEntities(
    tenantId: string,
    query: string,
    options?: { limit?: number; minConfidence?: number },
  ): Promise<GraphEntity[]>;

  getEntityNeighborhood(
    entityId: string,
    depth?: number,
  ): Promise<{ entities: GraphEntity[]; relations: GraphRelation[] }>;

  getEntitiesByNames(
    tenantId: string,
    names: string[],
  ): Promise<GraphEntity[]>;

  isAvailable(): Promise<boolean>;
}

// --- Default (null) graph repository for graceful degradation ---

const nullGraphRepository: GraphRepository = {
  async searchEntities(): Promise<GraphEntity[]> {
    return [];
  },
  async getEntityNeighborhood(): Promise<{ entities: GraphEntity[]; relations: GraphRelation[] }> {
    return { entities: [], relations: [] };
  },
  async getEntitiesByNames(): Promise<GraphEntity[]> {
    return [];
  },
  async isAvailable(): Promise<boolean> {
    return false;
  },
};

// --- Module state ---

let graphRepo: GraphRepository = nullGraphRepository;

/**
 * Register the graph repository implementation.
 * Called during startup if Neo4j is configured.
 */
export function registerGraphRepository(repo: GraphRepository): void {
  graphRepo = repo;
}

/**
 * Get the currently registered graph repository.
 */
export function getGraphRepository(): GraphRepository {
  return graphRepo;
}

// --- Entity Extraction ---

/**
 * Simple entity extraction from a query text.
 * Identifies capitalized multi-word phrases and single capitalized words
 * that might refer to known entities in the graph.
 */
function extractCandidateNames(query: string): string[] {
  const candidates: string[] = [];

  // Match capitalized multi-word phrases (e.g., "Mario Rossi", "Acme S.r.l.")
  const multiWordPattern = /(?:[A-ZÀ-Ü][a-zà-ü]+(?:\s+(?:di|del|della|dei|degli|delle|e|S\.r\.l\.|S\.p\.A\.|S\.a\.s\.)\s+)?)+(?:[A-ZÀ-Ü][a-zà-ü]+)/g;
  const multiWordMatches = query.match(multiWordPattern);
  if (multiWordMatches) {
    candidates.push(...multiWordMatches);
  }

  // Match single capitalized words (excluding sentence starts - heuristic: not after period/start)
  const words = query.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[.,;:!?()]/g, '');
    if (
      word.length > 2 &&
      /^[A-ZÀ-Ü]/.test(word) &&
      !isCommonWord(word) &&
      i > 0 // skip first word (sentence start)
    ) {
      // Only add if not already part of a multi-word match
      const alreadyCovered = candidates.some((c) => c.includes(word));
      if (!alreadyCovered) {
        candidates.push(word);
      }
    }
  }

  // Deduplicate
  return [...new Set(candidates)];
}

const COMMON_ITALIAN_WORDS = new Set([
  'Come', 'Cosa', 'Dove', 'Quando', 'Perche', 'Chi', 'Quale', 'Quanto',
  'Tutti', 'Tutto', 'Ogni', 'Questo', 'Quello', 'Questi', 'Quelli',
  'Primo', 'Secondo', 'Terzo', 'Ultimo', 'Altro', 'Stesso', 'Nuovo',
  'Nel', 'Del', 'Con', 'Per', 'Tra', 'Fra', 'Non', 'Sono', 'Hai',
]);

function isCommonWord(word: string): boolean {
  return COMMON_ITALIAN_WORDS.has(word);
}

// --- Graph Context Formatting ---

/**
 * Convert graph entities and relations into natural language context
 * that can be injected into the LLM prompt.
 */
function formatGraphContextToText(entities: GraphEntity[], relations: GraphRelation[]): string {
  if (entities.length === 0) return '';

  const entityMap = new Map<string, GraphEntity>();
  for (const entity of entities) {
    entityMap.set(entity.id, entity);
  }

  const lines: string[] = [];

  // Format entity descriptions
  for (const entity of entities) {
    const props = Object.entries(entity.properties)
      .filter(([key]) => key !== 'name' && key !== 'type')
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(', ');

    if (props) {
      lines.push(`- ${entity.name} (${translateEntityType(entity.type)}): ${props}`);
    } else {
      lines.push(`- ${entity.name} (${translateEntityType(entity.type)})`);
    }
  }

  // Format relationships as natural language
  for (const rel of relations) {
    const source = entityMap.get(rel.sourceId);
    const target = entityMap.get(rel.targetId);
    if (source && target) {
      const relText = translateRelationType(rel.type, source, target);
      lines.push(`- ${relText}`);
    }
  }

  return lines.join('\n');
}

function translateEntityType(type: string): string {
  const translations: Record<string, string> = {
    PERSON: 'persona',
    ORGANIZATION: 'organizzazione',
    PRODUCT: 'prodotto',
    SERVICE: 'servizio',
    PROCESS: 'processo',
    DEPARTMENT: 'dipartimento',
    ROLE: 'ruolo',
    LOCATION: 'luogo',
    DOCUMENT: 'documento',
    REGULATION: 'normativa',
    TECHNOLOGY: 'tecnologia',
    EVENT: 'evento',
    METRIC: 'metrica',
    CONCEPT: 'concetto',
  };
  return translations[type] ?? type.toLowerCase();
}

function translateRelationType(
  relType: string,
  source: GraphEntity,
  target: GraphEntity,
): string {
  const templates: Record<string, string> = {
    WORKS_FOR: `${source.name} lavora per ${target.name}`,
    MANAGES: `${source.name} gestisce ${target.name}`,
    BELONGS_TO: `${source.name} appartiene a ${target.name}`,
    DEPENDS_ON: `${source.name} dipende da ${target.name}`,
    PRODUCES: `${source.name} produce ${target.name}`,
    USES: `${source.name} utilizza ${target.name}`,
    CONTAINS: `${source.name} contiene ${target.name}`,
    RELATED_TO: `${source.name} e collegato a ${target.name}`,
    PART_OF: `${source.name} fa parte di ${target.name}`,
    RESPONSIBLE_FOR: `${source.name} e responsabile di ${target.name}`,
    LOCATED_IN: `${source.name} si trova in ${target.name}`,
    REPORTS_TO: `${source.name} riporta a ${target.name}`,
    COLLABORATES_WITH: `${source.name} collabora con ${target.name}`,
    PROVIDES: `${source.name} fornisce ${target.name}`,
    REGULATES: `${source.name} regola ${target.name}`,
  };

  return templates[relType] ?? `${source.name} [${relType.toLowerCase().replace(/_/g, ' ')}] ${target.name}`;
}

// --- Hybrid RAG Service ---

export const hybridRagService = {
  /**
   * Extract entity names from a query and match them against the knowledge graph.
   * Combines heuristic extraction with fuzzy search in Neo4j.
   */
  async extractQueryEntities(
    query: string,
    tenantId: string,
  ): Promise<GraphEntity[]> {
    const candidateNames = extractCandidateNames(query);

    if (candidateNames.length === 0) {
      // Fall back to full-text search on the query itself
      return graphRepo.searchEntities(tenantId, query, { limit: 5, minConfidence: 0.6 });
    }

    // Try exact/fuzzy match on extracted names
    const matched = await graphRepo.getEntitiesByNames(tenantId, candidateNames);

    // If no exact matches, try search with the full query
    if (matched.length === 0) {
      return graphRepo.searchEntities(tenantId, query, { limit: 5, minConfidence: 0.6 });
    }

    return matched;
  },

  /**
   * Format graph entities and relations into a structured text block for the LLM prompt.
   */
  formatGraphContext(entities: GraphEntity[], relations: GraphRelation[]): string {
    return formatGraphContextToText(entities, relations);
  },

  /**
   * Retrieve hybrid context combining vector search and graph traversal.
   * Gracefully degrades to vector-only if Neo4j is unavailable.
   */
  async retrieveHybridContext(
    query: string,
    tenantId: string,
    options: HybridRagOptions = {},
  ): Promise<Result<HybridRetrievalResult>> {
    const {
      vectorWeight = 0.7,
      graphWeight = 0.3,
      vectorTopK = 8,
      graphDepth = 1,
      graphMaxEntities = 5,
      useGraph = true,
      minVectorScore = 0.6,
    } = options;

    try {
      // Step 1: Vector search (always runs)
      const vectorResult = await ragService.retrieveContext(query, tenantId, {
        limit: vectorTopK,
        threshold: minVectorScore,
      });

      const vectorChunks: RetrievedChunk[] = vectorResult.success ? vectorResult.data : [];

      // Step 2: Graph search (conditional)
      let graphContext: GraphContext | null = null;
      let graphAvailable = false;

      if (useGraph) {
        try {
          graphAvailable = await graphRepo.isAvailable();

          if (graphAvailable) {
            // Extract entities from query
            const queryEntities = await this.extractQueryEntities(query, tenantId);

            if (queryEntities.length > 0) {
              // Limit to top N entities by confidence
              const topEntities = queryEntities
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, graphMaxEntities);

              // Get 1-hop neighborhood for each entity
              const allEntities: GraphEntity[] = [...topEntities];
              const allRelations: GraphRelation[] = [];
              const seenEntityIds = new Set(topEntities.map((e) => e.id));

              for (const entity of topEntities) {
                const neighborhood = await graphRepo.getEntityNeighborhood(entity.id, graphDepth);

                for (const neighborEntity of neighborhood.entities) {
                  if (!seenEntityIds.has(neighborEntity.id)) {
                    seenEntityIds.add(neighborEntity.id);
                    allEntities.push(neighborEntity);
                  }
                }

                allRelations.push(...neighborhood.relations);
              }

              const summary = this.formatGraphContext(allEntities, allRelations);

              graphContext = {
                entities: allEntities,
                relations: allRelations,
                summary,
              };
            }
          }
        } catch (graphError) {
          // Graph failure is non-fatal — log and continue with vector-only
          console.error(JSON.stringify({
            level: 'warn',
            message: 'Graph retrieval failed, falling back to vector-only',
            tenantId,
            error: graphError instanceof Error ? graphError.message : 'Unknown graph error',
          }));
          graphAvailable = false;
        }
      }

      // Step 3: Merge and rank results
      const items: HybridContextItem[] = [];

      // Add vector items
      for (const chunk of vectorChunks) {
        items.push({
          type: 'vector',
          content: chunk.content,
          score: chunk.score * vectorWeight,
          source: String(chunk.metadata.documentTitle ?? 'Documento'),
          metadata: chunk.metadata,
        });
      }

      // Add graph context as a single item (if available)
      if (graphContext && graphContext.summary.length > 0) {
        // Compute graph relevance: average confidence of matched entities
        const avgConfidence =
          graphContext.entities.length > 0
            ? graphContext.entities.reduce((sum, e) => sum + e.confidence, 0) / graphContext.entities.length
            : 0;

        items.push({
          type: 'graph',
          content: graphContext.summary,
          score: avgConfidence * graphWeight,
          source: 'Grafo della conoscenza',
          metadata: {
            entitiesCount: graphContext.entities.length,
            relationsCount: graphContext.relations.length,
          },
        });
      }

      // Sort by combined score (descending)
      items.sort((a, b) => b.score - a.score);

      return success({
        items,
        vectorChunks,
        graphContext,
        graphAvailable,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return failure(error);
      }
      return failure(
        new AppError(
          'HYBRID_RAG_FAILED',
          `Hybrid retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Build the complete prompt for the LLM call with hybrid context.
   * Structures the prompt with clear sections for vector and graph context.
   */
  buildHybridPrompt(
    systemPrompt: string,
    vectorContext: RetrievedChunk[],
    graphContext: GraphContext | null,
    history: Array<{ role: string | null; content: string }>,
    userMessage: string,
  ): ChatMessage[] {
    const prompt: ChatMessage[] = [];

    // Build system message with structured context
    let systemContent = systemPrompt;

    // Add vector context section
    if (vectorContext.length > 0) {
      const contextBlock = vectorContext
        .map((chunk, i) => {
          const source = chunk.metadata.documentTitle
            ? ` (da: ${chunk.metadata.documentTitle})`
            : '';
          return `[Fonte ${i + 1}${source}]\n${chunk.content}`;
        })
        .join('\n\n');

      systemContent += `\n\n---\n**Documenti rilevanti:**\n${contextBlock}`;
    }

    // Add graph context section
    if (graphContext && graphContext.summary.length > 0) {
      systemContent += `\n\n---\n**Contesto dal grafo della conoscenza:**\n${graphContext.summary}`;
    }

    // Add usage instructions
    if (vectorContext.length > 0 || (graphContext && graphContext.summary.length > 0)) {
      systemContent += `\n---\nUsa il contesto fornito sopra per rispondere in modo accurato. Se il contesto non contiene la risposta, dillo onestamente. Cita le fonti quando possibile.`;
    }

    prompt.push({ role: 'system', content: systemContent });

    // Conversation history
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        prompt.push({ role: msg.role, content: msg.content });
      }
    }

    // Current user message
    prompt.push({ role: 'user', content: userMessage });

    return prompt;
  },
};
