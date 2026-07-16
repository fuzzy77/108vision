import { z } from 'zod';
import { hybridRagService } from '../../services/hybrid-rag.service.js';
import { memoryService } from '../../services/memory.service.js';
import { getDb } from '../../lib/db.js';
import { agents, kbDocuments } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: Record<string, unknown>, tenantId: string) => Promise<unknown>;
}

export const mcpTools: McpToolDefinition[] = [
  {
    name: 'search_knowledge',
    description: 'Search the organization knowledge base using semantic search. Returns relevant document chunks.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
        topK: { type: 'number', description: 'Maximum number of results (default: 5)' },
        minScore: { type: 'number', description: 'Minimum relevance score 0-1 (default: 0.6)' },
      },
      required: ['query'],
    },
    handler: async (params, tenantId) => {
      const query = z.string().parse(params['query']);
      const topK = z.number().int().min(1).max(20).default(5).parse(params['topK'] ?? 5);
      const minScore = z.number().min(0).max(1).default(0.6).parse(params['minScore'] ?? 0.6);

      const result = await hybridRagService.retrieveHybridContext(query, tenantId, {
        vectorTopK: topK,
        minVectorScore: minScore,
        useGraph: true,
      });

      if (!result.success) {
        return { results: [], error: 'Knowledge base search failed' };
      }

      const chunks = result.data.vectorChunks.map((c) => ({
        content: c.content,
        score: c.score,
        metadata: c.metadata,
      }));

      const graphInfo = result.data.graphContext
        ? {
            entities: result.data.graphContext.entities.slice(0, 10).map((e: { id: string; name: string; type: string }) => ({
              name: e.name,
              type: e.type,
            })),
            relations: (() => {
              const nameMap = new Map(result.data.graphContext!.entities.map((e: { id: string; name: string }) => [e.id, e.name]));
              return result.data.graphContext!.relations.slice(0, 10).map((r: { sourceId: string; type: string; targetId: string }) => ({
                source: nameMap.get(r.sourceId) ?? r.sourceId,
                type: r.type,
                target: nameMap.get(r.targetId) ?? r.targetId,
              }));
            })(),
          }
        : null;

      return { results: chunks, graph: graphInfo };
    },
  },

  {
    name: 'get_memories',
    description: 'Retrieve persistent memories relevant to a query. Memories contain user preferences, past decisions, and organizational context.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query to find relevant memories (optional — returns recent if empty)' },
      },
      required: [],
    },
    handler: async (params, tenantId) => {
      const query = z.string().optional().parse(params['query']);

      if (query) {
        const block = await memoryService.getRelevantForChat(tenantId, query);
        return { memories: block ?? 'No relevant memories found.' };
      }

      // Return recent memories if no query
      const block = await memoryService.getRelevantForChat(tenantId, 'recent context');
      return { memories: block ?? 'No memories stored yet.' };
    },
  },

  {
    name: 'store_memory',
    description: 'Store a new persistent memory for this tenant. Use for important decisions, preferences, or context that should persist across sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The memory content to store' },
        type: { type: 'string', enum: ['preference', 'decision', 'fact', 'context'], description: 'Type of memory' },
      },
      required: ['content'],
    },
    handler: async (params, tenantId) => {
      const content = z.string().min(1).max(4000).parse(params['content']);
      const category = z.enum(['preference', 'decision', 'fact', 'context']).default('context').parse(params['type'] ?? 'context');

      await memoryService.store(tenantId, { content, category, source: 'system' });
      return { stored: true, category };
    },
  },

  {
    name: 'list_agents',
    description: 'List all AI agents configured for this tenant, with their names, descriptions, and model tiers.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (_params, tenantId) => {
      const db = getDb();
      const rows = await db
        .select({
          id: agents.id,
          name: agents.name,
          description: agents.description,
          model: agents.model,
          isActive: agents.isActive,
        })
        .from(agents)
        .where(and(eq(agents.tenantId, tenantId), eq(agents.isActive, true)));

      return { agents: rows };
    },
  },

  {
    name: 'list_documents',
    description: 'List documents in the knowledge base with their processing status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ready', 'processing', 'error', 'all'], description: 'Filter by status (default: all)' },
      },
      required: [],
    },
    handler: async (params, tenantId) => {
      const status = z.enum(['ready', 'processing', 'error', 'all']).default('all').parse(params['status'] ?? 'all');

      const db = getDb();

      const baseConditions = status !== 'all'
        ? and(eq(kbDocuments.tenantId, tenantId), eq(kbDocuments.status, status as 'processing' | 'ready' | 'error'))
        : eq(kbDocuments.tenantId, tenantId);

      const rows = await db
        .select({
          id: kbDocuments.id,
          title: kbDocuments.title,
          status: kbDocuments.status,
          chunkCount: kbDocuments.chunkCount,
          sourceType: kbDocuments.sourceType,
        })
        .from(kbDocuments)
        .where(baseConditions)
        .limit(50);

      return { documents: rows, total: rows.length };
    },
  },
];
