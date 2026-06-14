/**
 * Memory Service — Persistent AI memory across sessions and devices.
 *
 * Stores user preferences, project context, and decisions.
 * Retrieves relevant memories via pgvector semantic similarity.
 *
 * Categories:
 * - general: catch-all
 * - preference: user preferences ("I prefer dark mode", "rispondimi in italiano")
 * - project: project-specific context ("deploy on Vercel", "main DB is MySQL")
 * - decision: decisions made ("we chose React over Vue because...")
 * - person: info about people ("Marco is the CTO", "Anna manages invoices")
 * - workflow: recurring processes ("every Monday run the backup script")
 */

import { eq, and, sql, desc, arrayContains } from 'drizzle-orm';
import { getDb } from '../lib/db.js';
import { ragService } from './rag.service.js';

const MEMORIES_TABLE = 'shared.memories';
const MAX_MEMORIES_PER_TENANT = 1000;
const MAX_INJECT_PER_CONVERSATION = 8;

export interface Memory {
  id: string;
  tenantId: string;
  userId: string | null;
  content: string;
  tags: string[];
  category: string;
  source: string;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreMemoryInput {
  content: string;
  tags?: string[];
  category?: string;
  source?: 'user' | 'auto' | 'system';
  conversationId?: string;
  userId?: string;
}

export interface SearchMemoryOptions {
  limit?: number;
  category?: string;
  tags?: string[];
  minScore?: number;
}

class MemoryService {
  /**
   * Store a new memory with its embedding.
   */
  async store(tenantId: string, input: StoreMemoryInput): Promise<Memory> {
    const db = getDb();

    // Check memory count limit
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int as count FROM shared.memories WHERE tenant_id = ${tenantId}
    `);
    const count = (countResult.rows[0] as { count: number })?.count ?? 0;

    if (count >= MAX_MEMORIES_PER_TENANT) {
      // Delete oldest memory to make room
      await db.execute(sql`
        DELETE FROM shared.memories
        WHERE id = (
          SELECT id FROM shared.memories
          WHERE tenant_id = ${tenantId}
          ORDER BY created_at ASC
          LIMIT 1
        )
      `);
    }

    // Generate embedding
    const embeddingResult = await ragService.generateEmbeddings([input.content]);
    const embedding = embeddingResult[0] ?? null;

    const embeddingStr = embedding ? `[${embedding.join(',')}]` : null;

    const result = await db.execute(sql`
      INSERT INTO shared.memories (tenant_id, user_id, content, tags, category, source, conversation_id, embedding)
      VALUES (
        ${tenantId},
        ${input.userId ?? null},
        ${input.content},
        ${sql`${input.tags ?? []}::text[]`},
        ${input.category ?? 'general'},
        ${input.source ?? 'user'},
        ${input.conversationId ?? null},
        ${embeddingStr ? sql.raw(`'${embeddingStr}'::vector`) : null}
      )
      RETURNING id, tenant_id, user_id, content, tags, category, source, conversation_id, created_at, updated_at
    `);

    const row = result.rows[0] as Record<string, unknown>;
    return rowToMemory(row);
  }

  /**
   * Search memories by semantic similarity to a query.
   */
  async search(
    tenantId: string,
    query: string,
    options: SearchMemoryOptions = {},
  ): Promise<Array<Memory & { score: number }>> {
    const db = getDb();
    const limit = Math.min(options.limit ?? MAX_INJECT_PER_CONVERSATION, 20);
    const minScore = options.minScore ?? 0.5;

    // Generate query embedding
    const embeddings = await ragService.generateEmbeddings([query]);
    const queryEmbedding = embeddings[0];
    if (!queryEmbedding) {
      return [];
    }

    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Build category filter
    const categoryFilter = options.category
      ? sql`AND category = ${options.category}`
      : sql``;

    const result = await db.execute(sql`
      SELECT
        id, tenant_id, user_id, content, tags, category, source,
        conversation_id, created_at, updated_at,
        1 - (embedding <=> ${sql.raw(`'${embeddingStr}'::vector`)}) as score
      FROM shared.memories
      WHERE tenant_id = ${tenantId}
        AND embedding IS NOT NULL
        ${categoryFilter}
      ORDER BY embedding <=> ${sql.raw(`'${embeddingStr}'::vector`)}
      LIMIT ${limit}
    `);

    return (result.rows as Array<Record<string, unknown>>)
      .filter((row) => (row.score as number) >= minScore)
      .map((row) => ({
        ...rowToMemory(row),
        score: row.score as number,
      }));
  }

  /**
   * Get all memories for a tenant (paginated).
   */
  async list(
    tenantId: string,
    options: { page?: number; pageSize?: number; category?: string } = {},
  ): Promise<{ items: Memory[]; total: number }> {
    const db = getDb();
    const page = options.page ?? 1;
    const pageSize = Math.min(options.pageSize ?? 50, 100);
    const offset = (page - 1) * pageSize;

    const categoryFilter = options.category
      ? sql`AND category = ${options.category}`
      : sql``;

    const [countResult, dataResult] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*)::int as count FROM shared.memories
        WHERE tenant_id = ${tenantId} ${categoryFilter}
      `),
      db.execute(sql`
        SELECT id, tenant_id, user_id, content, tags, category, source,
               conversation_id, created_at, updated_at
        FROM shared.memories
        WHERE tenant_id = ${tenantId} ${categoryFilter}
        ORDER BY updated_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `),
    ]);

    const total = (countResult.rows[0] as { count: number })?.count ?? 0;
    const items = (dataResult.rows as Array<Record<string, unknown>>).map(rowToMemory);

    return { items, total };
  }

  /**
   * Delete a memory by ID.
   */
  async delete(tenantId: string, memoryId: string): Promise<boolean> {
    const db = getDb();
    const result = await db.execute(sql`
      DELETE FROM shared.memories
      WHERE id = ${memoryId} AND tenant_id = ${tenantId}
    `);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Update a memory's content (re-generates embedding).
   */
  async update(tenantId: string, memoryId: string, content: string, tags?: string[]): Promise<Memory | null> {
    const db = getDb();

    const embeddings = await ragService.generateEmbeddings([content]);
    const embedding = embeddings[0];
    const embeddingStr = embedding ? `[${embedding.join(',')}]` : null;

    const result = await db.execute(sql`
      UPDATE shared.memories
      SET content = ${content},
          tags = COALESCE(${tags ? sql`${tags}::text[]` : sql`tags`}, tags),
          embedding = ${embeddingStr ? sql.raw(`'${embeddingStr}'::vector`) : sql`embedding`},
          updated_at = now()
      WHERE id = ${memoryId} AND tenant_id = ${tenantId}
      RETURNING id, tenant_id, user_id, content, tags, category, source, conversation_id, created_at, updated_at
    `);

    if (result.rows.length === 0) return null;
    return rowToMemory(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Retrieve the most relevant memories for a conversation.
   * Used by the chat flow to inject context.
   */
  async getRelevantForChat(tenantId: string, message: string): Promise<string | null> {
    const memories = await this.search(tenantId, message, {
      limit: MAX_INJECT_PER_CONVERSATION,
      minScore: 0.55,
    });

    if (memories.length === 0) return null;

    const block = memories
      .map((m) => `- ${m.content}${m.tags.length > 0 ? ` [${m.tags.join(', ')}]` : ''}`)
      .join('\n');

    return `**Memoria persistente (cose che l'utente ti ha chiesto di ricordare):**\n${block}`;
  }
}

function rowToMemory(row: Record<string, unknown>): Memory {
  return {
    id: row.id as string,
    tenantId: (row.tenant_id ?? row.tenantId) as string,
    userId: (row.user_id ?? row.userId) as string | null,
    content: row.content as string,
    tags: (row.tags as string[]) ?? [],
    category: (row.category as string) ?? 'general',
    source: (row.source as string) ?? 'user',
    conversationId: (row.conversation_id ?? row.conversationId) as string | null,
    createdAt: String(row.created_at ?? row.createdAt),
    updatedAt: String(row.updated_at ?? row.updatedAt),
  };
}

export const memoryService = new MemoryService();
