import { type Result, success, failure, AppError } from '@aia/shared';
import { createAIClient, type ChatMessage } from '@aia/ai-client';
import { getPool } from '../lib/db.js';
import { getEnv } from '../lib/env.js';

export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface RetrieveOptions {
  limit?: number;
  threshold?: number;
}

/**
 * RAG (Retrieval-Augmented Generation) service.
 * Handles context retrieval from pgvector (shared.kb_chunks) and prompt assembly.
 */
export const ragService = {
  /**
   * Search the tenant's knowledge base for relevant context.
   * Embeds the query and performs cosine similarity search via pgvector.
   * Always scoped to the given tenant.
   */
  async retrieveContext(
    query: string,
    tenantId: string,
    options: RetrieveOptions = {},
  ): Promise<Result<RetrievedChunk[]>> {
    const { limit = 5, threshold = 0.7 } = options;

    try {
      const env = getEnv();
      const aiClient = createAIClient({
        baseUrl: env.LITELLM_URL,
        apiKey: env.LITELLM_MASTER_KEY,
      });

      // Generate embedding for the query
      const embeddingResponse = await aiClient.embed({ input: query });
      const queryVector = embeddingResponse.data[0]?.embedding;

      if (!queryVector) {
        return failure(new AppError('EMBEDDING_FAILED', 'Failed to generate query embedding', 500));
      }

      // Cosine similarity = 1 - cosine distance; a similarity threshold
      // translates to distance < (1 - threshold).
      const vec = `[${queryVector.join(',')}]`;
      const maxDistance = 1 - threshold;

      const result = await getPool().query(
        `SELECT id,
                content,
                1 - (embedding <=> $1::vector) AS score,
                document_id,
                document_title,
                chunk_index
           FROM shared.kb_chunks
          WHERE tenant_id = $2
            AND embedding <=> $1::vector < $3
          ORDER BY embedding <=> $1::vector
          LIMIT $4`,
        [vec, tenantId, maxDistance, limit],
      );

      const chunks: RetrievedChunk[] = result.rows.map(
        (row: {
          id: string;
          content: string;
          score: string | number;
          document_id: string;
          document_title: string | null;
          chunk_index: number;
        }) => ({
          id: row.id,
          content: row.content,
          score: Number(row.score),
          metadata: {
            documentId: row.document_id,
            documentTitle: row.document_title,
            chunkIndex: row.chunk_index,
          },
        }),
      );

      return success(chunks);
    } catch (error) {
      if (error instanceof AppError) {
        return failure(error);
      }
      return failure(
        new AppError(
          'RAG_RETRIEVAL_FAILED',
          `Knowledge base search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Build the complete prompt for the LLM call.
   * Assembles: system prompt + retrieved context + conversation history + user message.
   */
  buildPrompt(
    systemPrompt: string,
    context: RetrievedChunk[],
    history: Array<{ role: string | null; content: string }>,
    userMessage: string,
  ): ChatMessage[] {
    const prompt: ChatMessage[] = [];

    // System message with context injection
    let systemContent = systemPrompt;

    if (context.length > 0) {
      const contextBlock = context
        .map((chunk, i) => `[Source ${i + 1}] ${chunk.content}`)
        .join('\n\n');

      systemContent += `\n\n---\nRelevant knowledge base context:\n${contextBlock}\n---\nUse the above context to inform your response when relevant. If the context doesn't contain the answer, say so honestly.`;
    }

    prompt.push({ role: 'system', content: systemContent });

    // Conversation history (exclude system messages from history)
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        prompt.push({ role: msg.role, content: msg.content });
      }
    }

    // Current user message
    prompt.push({ role: 'user', content: userMessage });

    return prompt;
  },

  /**
   * Generate embeddings for text chunks.
   * Used during document ingestion.
   */
  async generateEmbeddings(texts: string[]): Promise<Result<number[][]>> {
    try {
      const env = getEnv();
      const aiClient = createAIClient({
        baseUrl: env.LITELLM_URL,
        apiKey: env.LITELLM_MASTER_KEY,
      });

      const response = await aiClient.embed({ input: texts });
      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);

      return success(embeddings);
    } catch (error) {
      return failure(
        new AppError(
          'EMBEDDING_GENERATION_FAILED',
          `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Store vector embeddings in pgvector (shared.kb_chunks).
   * Upserts by chunk id; tenant_id is always persisted.
   */
  async storeVectors(
    tenantId: string,
    vectors: Array<{
      id: string;
      embedding: number[];
      payload: Record<string, unknown>;
    }>,
  ): Promise<Result<void>> {
    try {
      if (vectors.length === 0) {
        return success(undefined);
      }

      const pool = getPool();
      const values: unknown[] = [];
      const rows = vectors.map((v, i) => {
        // 7 parameters per row: id, tenant, doc_id, doc_title, chunk_idx, content, embedding
        const p = (n: number) => `$${i * 7 + n}`;
        values.push(
          v.id,
          tenantId,
          v.payload['document_id'] ?? null,
          v.payload['document_title'] ?? null,
          v.payload['chunk_index'] ?? 0,
          v.payload['content'] ?? '',
          `[${v.embedding.join(',')}]`,
        );
        return `(${p(1)}, ${p(2)}, ${p(3)}::uuid, ${p(4)}, ${p(5)}, ${p(6)}, ${p(7)}::vector)`;
      });

      await pool.query(
        `INSERT INTO shared.kb_chunks
           (id, tenant_id, document_id, document_title, chunk_index, content, embedding)
         VALUES ${rows.join(', ')}
         ON CONFLICT (id) DO UPDATE SET
           embedding = EXCLUDED.embedding,
           content = EXCLUDED.content`,
        values,
      );

      return success(undefined);
    } catch (error) {
      return failure(
        new AppError(
          'VECTOR_STORE_FAILED',
          `Failed to store vectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Delete all vectors for a specific document (tenant-scoped).
   */
  async deleteDocumentVectors(tenantId: string, documentId: string): Promise<Result<void>> {
    try {
      await getPool().query(
        'DELETE FROM shared.kb_chunks WHERE tenant_id = $1 AND document_id = $2',
        [tenantId, documentId],
      );
      return success(undefined);
    } catch (error) {
      return failure(
        new AppError(
          'VECTOR_DELETE_FAILED',
          `Failed to delete vectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },
};
