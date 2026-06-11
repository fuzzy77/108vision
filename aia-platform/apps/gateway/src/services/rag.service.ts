import { type Result, success, failure, AppError } from '@aia/shared';
import { createAIClient, type ChatMessage } from '@aia/ai-client';
import { getQdrant, getCollectionName, ensureCollection } from '../lib/qdrant.js';
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
 * Handles context retrieval from Qdrant and prompt assembly.
 */
export const ragService = {
  /**
   * Search the tenant's knowledge base for relevant context.
   * Embeds the query and performs vector similarity search in Qdrant.
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

      const qdrant = getQdrant();
      const collectionName = getCollectionName(tenantId);

      // Check if collection exists
      const collections = await qdrant.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);

      if (!exists) {
        // No knowledge base for this tenant -- return empty
        return success([]);
      }

      // Search Qdrant
      const searchResult = await qdrant.search(collectionName, {
        vector: queryVector,
        limit,
        score_threshold: threshold,
        with_payload: true,
      });

      const chunks: RetrievedChunk[] = searchResult.map((point) => ({
        id: String(point.id),
        content: (point.payload?.['content'] as string) ?? '',
        score: point.score,
        metadata: {
          documentId: point.payload?.['document_id'],
          documentTitle: point.payload?.['document_title'],
          chunkIndex: point.payload?.['chunk_index'],
        },
      }));

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
   * Store vector embeddings in Qdrant.
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
      await ensureCollection(tenantId);

      const qdrant = getQdrant();
      const collectionName = getCollectionName(tenantId);

      await qdrant.upsert(collectionName, {
        wait: true,
        points: vectors.map((v) => ({
          id: v.id,
          vector: v.embedding,
          payload: v.payload,
        })),
      });

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
   * Delete all vectors for a specific document from Qdrant.
   */
  async deleteDocumentVectors(tenantId: string, documentId: string): Promise<Result<void>> {
    try {
      const qdrant = getQdrant();
      const collectionName = getCollectionName(tenantId);

      const collections = await qdrant.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);

      if (!exists) {
        return success(undefined);
      }

      await qdrant.delete(collectionName, {
        wait: true,
        filter: {
          must: [
            {
              key: 'document_id',
              match: { value: documentId },
            },
          ],
        },
      });

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
