/**
 * @aia/graph — LLM-powered entity extraction.
 *
 * Extracts named entities and relationships from text chunks
 * using the cheapest model tier (DeepSeek/fast-cheap) to control costs.
 */

import { type Result, success, failure, AppError, MODEL_TIERS } from '@aia/shared';
import type {
  EntityExtractionResult,
  ExtractedEntity,
  ExtractedRelation,
  EntityType,
  RelationType,
} from './types.js';
import { ENTITY_TYPES, RELATION_TYPES } from './types.js';

export interface ExtractionConfig {
  litellmUrl: string;
  litellmApiKey: string;
  model?: string;
  minConfidence?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

const EXTRACTION_SYSTEM_PROMPT = `You are an entity extraction system. Given a text chunk from a business document, extract:
1. Named entities (people, organizations, products, services, processes, departments, roles, locations, technologies, regulations, metrics, concepts)
2. Relationships between entities

For each entity, provide:
- name: canonical name (normalized, no abbreviations expanded if obvious)
- type: one of [PERSON, ORGANIZATION, PRODUCT, SERVICE, PROCESS, DEPARTMENT, ROLE, LOCATION, DOCUMENT, REGULATION, TECHNOLOGY, EVENT, METRIC, CONCEPT]
- properties: relevant attributes as key-value pairs (e.g., for PERSON: {"role": "CEO"}; for PRODUCT: {"version": "2.0"})
- confidence: 0.0-1.0 (how certain you are this is a real named entity, not a generic term)

For each relation, provide:
- source: entity name (must match an extracted entity name exactly)
- target: entity name (must match an extracted entity name exactly)
- type: one of [WORKS_FOR, MANAGES, REPORTS_TO, PRODUCES, CONSUMES, DEPENDS_ON, PART_OF, CONTAINS, RELATED_TO, RESPONSIBLE_FOR, LOCATED_IN, USES, PROVIDES, REQUIRES, PRECEDES, FOLLOWS, TRIGGERS]
- weight: 0.0-1.0 (strength/certainty of relationship)

Rules:
- Only extract entities that are specific named things, not generic concepts unless they are domain-specific terms.
- Normalize names: trim whitespace, use proper capitalization.
- Do not extract the same entity twice.
- Relations must reference entities you have extracted.
- If no entities are found, return empty arrays.

Return ONLY valid JSON in this exact format, no explanations:
{"entities": [...], "relations": [...]}`;

/**
 * Extract entities and relationships from a single text chunk.
 */
export async function extractEntities(
  text: string,
  config: ExtractionConfig,
  context?: string,
): Promise<Result<EntityExtractionResult>> {
  if (!text.trim()) {
    return success({ entities: [], relations: [] });
  }

  const userPrompt = context
    ? `Document context: ${context}\n\nText chunk to analyze:\n${text}`
    : `Text chunk to analyze:\n${text}`;

  const model = config.model ?? MODEL_TIERS.FAST_CHEAP;
  const minConfidence = config.minConfidence ?? 0.3;

  try {
    const response = await callLLM(config, model, userPrompt);

    if (!response.success) {
      return failure(response.error);
    }

    const parsed = parseExtractionResponse(response.data, minConfidence);
    return success(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown extraction error';
    return failure(
      new AppError('GRAPH_EXTRACTION_FAILED', `Entity extraction failed: ${message}`, 500),
    );
  }
}

/**
 * Extract entities from multiple text chunks in parallel (with concurrency limit).
 */
export async function extractEntitiesBatch(
  chunks: Array<{ text: string; index: number }>,
  config: ExtractionConfig,
  context?: string,
  maxConcurrent: number = 5,
): Promise<Result<Array<{ index: number; result: EntityExtractionResult }>>> {
  const results: Array<{ index: number; result: EntityExtractionResult }> = [];
  const errors: string[] = [];

  // Process in batches of maxConcurrent
  for (let i = 0; i < chunks.length; i += maxConcurrent) {
    const batch = chunks.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (chunk) => {
      const extractionResult = await extractEntities(chunk.text, config, context);

      if (extractionResult.success) {
        return { index: chunk.index, result: extractionResult.data };
      } else {
        errors.push(`Chunk ${chunk.index}: ${extractionResult.error.message}`);
        return { index: chunk.index, result: { entities: [], relations: [] } };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  if (errors.length > 0 && errors.length === chunks.length) {
    return failure(
      new AppError(
        'GRAPH_EXTRACTION_ALL_FAILED',
        `All chunk extractions failed: ${errors[0]}`,
        500,
      ),
    );
  }

  return success(results);
}

/**
 * Deduplicate entities across multiple extraction results.
 * Merges entities with the same normalized name and type,
 * keeping the highest confidence score.
 */
export function deduplicateEntities(
  results: Array<{ index: number; result: EntityExtractionResult }>,
): EntityExtractionResult {
  const entityMap = new Map<string, ExtractedEntity & { chunkIndex: number }>();
  const allRelations: Array<ExtractedRelation & { chunkIndex: number }> = [];

  for (const { index, result } of results) {
    for (const entity of result.entities) {
      const key = `${entity.type}::${entity.name.toLowerCase().trim()}`;
      const existing = entityMap.get(key);

      if (!existing || entity.confidence > existing.confidence) {
        entityMap.set(key, { ...entity, chunkIndex: index });
      } else if (existing) {
        // Merge properties from both extractions
        existing.properties = { ...existing.properties, ...entity.properties };
      }
    }

    for (const relation of result.relations) {
      allRelations.push({ ...relation, chunkIndex: index });
    }
  }

  const entities = Array.from(entityMap.values()).map(({ chunkIndex: _, ...entity }) => entity);

  // Filter relations to only those where both source and target exist in deduplicated entities
  const entityNames = new Set(entities.map((e) => e.name.toLowerCase().trim()));
  const relations = allRelations
    .filter(
      (rel) =>
        entityNames.has(rel.source.toLowerCase().trim()) &&
        entityNames.has(rel.target.toLowerCase().trim()),
    )
    .map(({ chunkIndex: _unused, ...rel }) => rel);

  // Deduplicate relations (same source, target, type)
  const relationMap = new Map<string, ExtractedRelation>();
  for (const rel of relations) {
    const key = `${rel.source.toLowerCase()}::${rel.target.toLowerCase()}::${rel.type}`;
    const existing = relationMap.get(key);
    if (!existing || rel.weight > existing.weight) {
      relationMap.set(key, rel);
    }
  }

  return {
    entities,
    relations: Array.from(relationMap.values()),
  };
}

// --- Internal ---

async function callLLM(
  config: ExtractionConfig,
  model: string,
  userPrompt: string,
): Promise<Result<string>> {
  const baseUrl = config.litellmUrl.replace(/\/$/, '');
  const url = `${baseUrl}/v1/chat/completions`;
  const timeoutMs = config.timeoutMs ?? 30_000;
  const maxRetries = config.maxRetries ?? 2;

  const body = {
    model,
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1, // Low temperature for deterministic extraction
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await globalThis.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.litellmApiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          const errorBody = await response.json().catch(() => ({}));
          return failure(
            new AppError(
              'GRAPH_LLM_ERROR',
              `LLM extraction returned ${response.status}: ${(errorBody as any)?.error?.message ?? 'Unknown error'}`,
              response.status,
            ),
          );
        }
        lastError = new Error(`LLM returned ${response.status}`);
      } else {
        const data = await response.json() as any;
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          return failure(
            new AppError('GRAPH_LLM_EMPTY', 'LLM returned empty response for extraction', 500),
          );
        }
        return success(content as string);
      }
    } catch (error) {
      if (error instanceof AppError) {
        return failure(error);
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Exponential backoff
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return failure(
    new AppError(
      'GRAPH_LLM_UNAVAILABLE',
      `LLM unavailable after ${maxRetries + 1} attempts: ${lastError?.message}`,
      503,
    ),
  );
}

function parseExtractionResponse(
  rawJson: string,
  minConfidence: number,
): EntityExtractionResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch?.[1]) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch {
        return { entities: [], relations: [] };
      }
    } else {
      return { entities: [], relations: [] };
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { entities: [], relations: [] };
  }

  const data = parsed as Record<string, unknown>;
  const rawEntities = Array.isArray(data['entities']) ? data['entities'] : [];
  const rawRelations = Array.isArray(data['relations']) ? data['relations'] : [];

  // Validate and filter entities
  const entities: ExtractedEntity[] = [];
  for (const raw of rawEntities) {
    if (!raw || typeof raw !== 'object') continue;
    const e = raw as Record<string, unknown>;

    const name = typeof e['name'] === 'string' ? e['name'].trim() : '';
    const type = typeof e['type'] === 'string' ? e['type'].toUpperCase() : '';
    const confidence = typeof e['confidence'] === 'number' ? e['confidence'] : 0.5;
    const properties = (typeof e['properties'] === 'object' && e['properties'] !== null)
      ? e['properties'] as Record<string, string>
      : {};

    if (!name || name.length < 2) continue;
    if (!isValidEntityType(type)) continue;
    if (confidence < minConfidence) continue;

    entities.push({
      name,
      type: type as EntityType,
      properties: sanitizeProperties(properties),
      confidence: Math.min(1, Math.max(0, confidence)),
    });
  }

  // Validate and filter relations
  const entityNames = new Set(entities.map((e) => e.name.toLowerCase().trim()));
  const relations: ExtractedRelation[] = [];

  for (const raw of rawRelations) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;

    const source = typeof r['source'] === 'string' ? r['source'].trim() : '';
    const target = typeof r['target'] === 'string' ? r['target'].trim() : '';
    const type = typeof r['type'] === 'string' ? r['type'].toUpperCase() : '';
    const weight = typeof r['weight'] === 'number' ? r['weight'] : 0.5;
    const properties = (typeof r['properties'] === 'object' && r['properties'] !== null)
      ? r['properties'] as Record<string, string>
      : {};

    if (!source || !target) continue;
    if (!isValidRelationType(type)) continue;
    if (!entityNames.has(source.toLowerCase().trim()) || !entityNames.has(target.toLowerCase().trim())) continue;

    relations.push({
      source,
      target,
      type: type as RelationType,
      properties: sanitizeProperties(properties),
      weight: Math.min(1, Math.max(0, weight)),
    });
  }

  return { entities, relations };
}

function isValidEntityType(type: string): type is EntityType {
  return (ENTITY_TYPES as readonly string[]).includes(type);
}

function isValidRelationType(type: string): type is RelationType {
  return (RELATION_TYPES as readonly string[]).includes(type);
}

function sanitizeProperties(props: unknown): Record<string, string> {
  if (!props || typeof props !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = String(value);
    }
  }
  return result;
}
