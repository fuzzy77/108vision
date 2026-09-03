import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { type Result, success, failure, AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { kbDocuments } from '../db/schema.js';
import { ragService } from './rag.service.js';

export interface IngestDocumentInput {
  content: string;
  metadata: {
    name: string;
    type: string;
    tenantId: string;
    sourceType: 'upload' | 'url' | 'api' | 'manual';
    sourceUrl?: string;
  };
}

interface TextChunk {
  text: string;
  index: number;
}

/**
 * Document ingestion service.
 * Handles text chunking, embedding generation, and vector storage.
 */
export const ingestionService = {
  /**
   * Full document ingestion pipeline:
   * 1. Create document record (status: processing)
   * 2. Chunk the text
   * 3. Generate embeddings for each chunk
   * 4. Store vectors in pgvector (shared.kb_chunks)
   * 5. Update document status to ready
   */
  async ingestDocument(input: IngestDocumentInput): Promise<Result<string>> {
    const db = getDb();
    const { content, metadata } = input;
    const documentId = uuidv4();

    try {
      // Step 1: Create document record
      await db.insert(kbDocuments).values({
        id: documentId,
        tenantId: metadata.tenantId,
        title: metadata.name,
        sourceType: metadata.sourceType,
        sourceUrl: metadata.sourceUrl ?? null,
        contentHash: await hashContent(content),
        sizeBytes: Buffer.byteLength(content, 'utf8'),
        status: 'processing',
        metadata: { originalType: metadata.type },
      });

      // Step 2: Chunk the text
      const chunks = chunkText(content, 1000, 200);

      if (chunks.length === 0) {
        await db
          .update(kbDocuments)
          .set({ status: 'error', metadata: { error: 'No content to index' } })
          .where(eq(kbDocuments.id, documentId));

        return failure(new AppError('INGESTION_EMPTY', 'Document has no indexable content', 400));
      }

      // Step 3: Generate embeddings in batches (DashScope limit: max 10 texts per request)
      const batchSize = 10;
      const allVectors: Array<{
        id: string;
        embedding: number[];
        payload: Record<string, unknown>;
      }> = [];

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const texts = batch.map((c) => c.text);

        const embeddingResult = await ragService.generateEmbeddings(texts);
        if (!embeddingResult.success) {
          await db
            .update(kbDocuments)
            .set({ status: 'error', metadata: { error: embeddingResult.error.message } })
            .where(eq(kbDocuments.id, documentId));

          return failure(embeddingResult.error);
        }

        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j]!;
          const embedding = embeddingResult.data[j];
          if (!embedding) continue;

          allVectors.push({
            id: uuidv4(),
            embedding,
            payload: {
              content: chunk.text,
              document_id: documentId,
              document_title: metadata.name,
              chunk_index: chunk.index,
              tenant_id: metadata.tenantId,
            },
          });
        }
      }

      // Step 4: Store vectors in pgvector
      const storeResult = await ragService.storeVectors(metadata.tenantId, allVectors);
      if (!storeResult.success) {
        await db
          .update(kbDocuments)
          .set({ status: 'error', metadata: { error: storeResult.error.message } })
          .where(eq(kbDocuments.id, documentId));

        return failure(storeResult.error);
      }

      // Step 5: Update document status
      await db
        .update(kbDocuments)
        .set({
          status: 'ready',
          chunkCount: chunks.length,
        })
        .where(eq(kbDocuments.id, documentId));

      return success(documentId);
    } catch (error) {
      // Mark document as errored
      await db
        .update(kbDocuments)
        .set({
          status: 'error',
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        })
        .where(eq(kbDocuments.id, documentId))
        .catch(() => { /* ignore cleanup errors */ });

      if (error instanceof AppError) {
        return failure(error);
      }

      return failure(
        new AppError(
          'INGESTION_FAILED',
          `Document ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Delete a document and its associated vectors.
   */
  async deleteDocument(documentId: string, tenantId: string): Promise<Result<void>> {
    const db = getDb();

    const [doc] = await db
      .select({ id: kbDocuments.id })
      .from(kbDocuments)
      .where(
        and(
          eq(kbDocuments.id, documentId),
          eq(kbDocuments.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!doc) {
      return failure(new AppError('DOCUMENT_NOT_FOUND', 'Document not found', 404));
    }

    // Delete vectors from pgvector
    const deleteResult = await ragService.deleteDocumentVectors(tenantId, documentId);
    if (!deleteResult.success) {
      return failure(deleteResult.error);
    }

    // Soft-delete in database
    await db
      .update(kbDocuments)
      .set({ status: 'deleted' })
      .where(eq(kbDocuments.id, documentId));

    return success(undefined);
  },
};

/**
 * Recursive character text splitter.
 * Splits text into chunks of approximately `chunkSize` characters
 * with `overlap` characters of overlap between consecutive chunks.
 */
function chunkText(text: string, chunkSize: number, overlap: number): TextChunk[] {
  const chunks: TextChunk[] = [];
  const separators = ['\n\n', '\n', '. ', ' ', ''];

  function splitRecursive(text: string, separatorIdx: number): string[] {
    if (text.length <= chunkSize) {
      return [text];
    }

    const separator = separators[separatorIdx] ?? '';
    const parts = separator ? text.split(separator) : [text];

    const results: string[] = [];
    let current = '';

    for (const part of parts) {
      const candidate = current ? current + separator + part : part;

      if (candidate.length > chunkSize && current) {
        results.push(current);
        current = part;
      } else if (candidate.length > chunkSize && !current) {
        // Single part exceeds chunk size -- try next separator
        if (separatorIdx < separators.length - 1) {
          results.push(...splitRecursive(part, separatorIdx + 1));
        } else {
          // Fallback: hard split
          for (let i = 0; i < part.length; i += chunkSize) {
            results.push(part.slice(i, i + chunkSize));
          }
        }
      } else {
        current = candidate;
      }
    }

    if (current) {
      results.push(current);
    }

    return results;
  }

  const rawChunks = splitRecursive(text.trim(), 0);

  // Apply overlap
  for (let i = 0; i < rawChunks.length; i++) {
    let chunk = rawChunks[i]!;

    // Prepend overlap from previous chunk
    if (i > 0 && overlap > 0) {
      const prevChunk = rawChunks[i - 1]!;
      const overlapText = prevChunk.slice(-overlap);
      chunk = overlapText + chunk;
    }

    const trimmed = chunk.trim();
    if (trimmed.length > 0) {
      chunks.push({ text: trimmed, index: i });
    }
  }

  return chunks;
}

/**
 * Generate a SHA-256 hash of the content for deduplication.
 */
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
