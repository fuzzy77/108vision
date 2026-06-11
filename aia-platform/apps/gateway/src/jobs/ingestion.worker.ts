import { Worker, Queue } from 'bullmq';
import { getEnv } from '../lib/env.js';
import { ingestionService, type IngestDocumentInput } from '../services/ingestion.service.js';
import { getGraphExtractionQueue } from './graph-ingestion.worker.js';

const QUEUE_NAME = 'document-ingestion';

let _queue: Queue | null = null;
let _worker: Worker | null = null;

/**
 * Get the ingestion queue instance (lazy-initialized).
 */
export function getIngestionQueue(): Queue {
  if (!_queue) {
    const env = getEnv();
    _queue = new Queue(QUEUE_NAME, {
      connection: parseRedisUrl(env.REDIS_URL),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return _queue;
}

/**
 * Start the ingestion worker.
 * Processes uploaded files asynchronously.
 * Updates document status: pending -> processing -> ready | error
 */
export function startIngestionWorker(): Worker {
  if (_worker) return _worker;

  const env = getEnv();

  _worker = new Worker<IngestDocumentInput>(
    QUEUE_NAME,
    async (job) => {
      const { content, metadata } = job.data;

      console.log(JSON.stringify({
        level: 'info',
        message: 'Processing document ingestion',
        jobId: job.id,
        documentName: metadata.name,
        tenantId: metadata.tenantId,
        contentLength: content.length,
      }));

      await job.updateProgress(10);

      const result = await ingestionService.ingestDocument({ content, metadata });

      if (!result.success) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Document ingestion failed',
          jobId: job.id,
          documentName: metadata.name,
          tenantId: metadata.tenantId,
          error: result.error.message,
          code: result.error.code,
        }));
        throw new Error(`Ingestion failed: ${result.error.message}`);
      }

      await job.updateProgress(90);

      // Queue graph extraction if enabled (non-blocking)
      const graphEnabled = process.env['GRAPH_EXTRACTION_ENABLED'] !== 'false';
      if (graphEnabled && content.length > 0) {
        try {
          const graphQueue = getGraphExtractionQueue();
          // Build chunks for graph extraction (simplified chunking for entity extraction)
          const chunks = buildChunksForGraphExtraction(content);
          await graphQueue.add('extract-graph', {
            documentId: result.data,
            tenantId: metadata.tenantId,
            documentTitle: metadata.name,
            chunks,
          });
        } catch (graphErr) {
          // Graph extraction failure is non-critical
          console.error(JSON.stringify({
            level: 'warn',
            message: 'Failed to queue graph extraction (non-critical)',
            jobId: job.id,
            documentId: result.data,
            error: graphErr instanceof Error ? graphErr.message : String(graphErr),
          }));
        }
      }

      await job.updateProgress(100);

      console.log(JSON.stringify({
        level: 'info',
        message: 'Document ingestion completed',
        jobId: job.id,
        documentId: result.data,
        documentName: metadata.name,
        tenantId: metadata.tenantId,
      }));

      return { documentId: result.data };
    },
    {
      connection: parseRedisUrl(env.REDIS_URL),
      concurrency: 3,
      limiter: {
        max: 10,
        duration: 60000, // 10 jobs per minute max
      },
    },
  );

  _worker.on('failed', (job, err) => {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Ingestion job failed',
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      error: err.message,
    }));
  });

  _worker.on('completed', (job) => {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Ingestion job completed',
      jobId: job.id,
      returnvalue: job.returnvalue,
    }));
  });

  _worker.on('error', (err) => {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Ingestion worker error',
      error: err.message,
    }));
  });

  return _worker;
}

/**
 * Gracefully stop the ingestion worker.
 */
export async function stopIngestionWorker(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
  }
  if (_queue) {
    await _queue.close();
    _queue = null;
  }
}

/**
 * Parse Redis URL into connection options for BullMQ.
 */
function parseRedisUrl(url: string): { host: string; port: number; password?: string; db?: number } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    password: parsed.password || undefined,
    db: parsed.pathname ? parseInt(parsed.pathname.slice(1) || '0', 10) : 0,
  };
}

/**
 * Build text chunks for graph entity extraction.
 * Uses larger chunks (2000 chars) than vector embeddings since entity extraction
 * benefits from more context per chunk. No overlap needed.
 */
function buildChunksForGraphExtraction(content: string): Array<{ text: string; index: number }> {
  const chunkSize = 2000;
  const chunks: Array<{ text: string; index: number }> = [];
  const paragraphs = content.split(/\n\n+/);

  let current = '';
  let index = 0;

  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length > chunkSize && current.length > 0) {
      chunks.push({ text: current.trim(), index });
      index++;
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current.trim().length > 0) {
    chunks.push({ text: current.trim(), index });
  }

  return chunks;
}
