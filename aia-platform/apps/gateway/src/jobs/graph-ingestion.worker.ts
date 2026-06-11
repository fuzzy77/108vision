/**
 * BullMQ worker for graph entity extraction.
 *
 * Processes document chunks asynchronously after they have been stored
 * in Qdrant. Graph extraction is non-blocking: failures do NOT affect
 * document availability via vector search.
 */

import { Worker, Queue } from 'bullmq';
import { getEnv } from '../lib/env.js';
import { ingestDocumentGraph, type GraphIngestionResult } from '../services/graph-ingestion.service.js';
import type { ExtractionConfig } from '@aia/graph';

const QUEUE_NAME = 'graph-extraction';

export interface GraphExtractionJobData {
  documentId: string;
  tenantId: string;
  documentTitle: string;
  chunks: Array<{ text: string; index: number }>;
}

let _queue: Queue | null = null;
let _worker: Worker | null = null;

/**
 * Get the graph extraction queue instance (lazy-initialized).
 */
export function getGraphExtractionQueue(): Queue {
  if (!_queue) {
    const env = getEnv();
    _queue = new Queue(QUEUE_NAME, {
      connection: parseRedisUrl(env.REDIS_URL),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: 200,
        removeOnFail: 100,
      },
    });
  }
  return _queue;
}

/**
 * Start the graph extraction worker.
 * Processes chunks for entity extraction and graph storage.
 *
 * Design decisions:
 * - Low concurrency (2) to limit LLM API costs
 * - Generous rate limiting (5 jobs per minute)
 * - Failures are logged but do not propagate to document status
 */
export function startGraphExtractionWorker(): Worker | null {
  if (_worker) return _worker;

  const env = getEnv();

  // Only start if graph extraction is enabled
  const graphEnabled = process.env['GRAPH_EXTRACTION_ENABLED'] !== 'false';
  if (!graphEnabled) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Graph extraction worker disabled (GRAPH_EXTRACTION_ENABLED=false)',
    }));
    return null;
  }

  const extractionConfig: ExtractionConfig = {
    litellmUrl: env.LITELLM_URL,
    litellmApiKey: env.LITELLM_MASTER_KEY,
    model: process.env['GRAPH_EXTRACTION_MODEL'] ?? 'fast-cheap',
    minConfidence: parseFloat(process.env['GRAPH_EXTRACTION_MIN_CONFIDENCE'] ?? '0.3'),
    timeoutMs: 45_000,
    maxRetries: 2,
  };

  _worker = new Worker<GraphExtractionJobData, GraphIngestionResult>(
    QUEUE_NAME,
    async (job) => {
      const { documentId, tenantId, documentTitle, chunks } = job.data;

      console.log(JSON.stringify({
        level: 'info',
        message: 'Processing graph extraction',
        jobId: job.id,
        documentId,
        tenantId,
        documentTitle,
        chunkCount: chunks.length,
      }));

      await job.updateProgress(10);

      const result = await ingestDocumentGraph(
        { documentId, tenantId, documentTitle, chunks },
        extractionConfig,
      );

      if (!result.success) {
        console.error(JSON.stringify({
          level: 'error',
          message: 'Graph extraction failed',
          jobId: job.id,
          documentId,
          tenantId,
          error: result.error.message,
          code: result.error.code,
        }));
        // Throw to trigger retry, but this is non-critical
        throw new Error(`Graph extraction failed: ${result.error.message}`);
      }

      await job.updateProgress(100);

      console.log(JSON.stringify({
        level: 'info',
        message: 'Graph extraction completed',
        jobId: job.id,
        documentId,
        tenantId,
        entitiesCreated: result.data.entitiesCreated,
        relationsCreated: result.data.relationsCreated,
        entitiesSkipped: result.data.entitiesSkipped,
        durationMs: result.data.durationMs,
      }));

      return result.data;
    },
    {
      connection: parseRedisUrl(env.REDIS_URL),
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 60_000, // 5 jobs per minute
      },
    },
  );

  _worker.on('failed', (job, err) => {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Graph extraction job failed',
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      error: err.message,
    }));
  });

  _worker.on('completed', (job) => {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Graph extraction job completed',
      jobId: job.id,
      returnvalue: job.returnvalue,
    }));
  });

  _worker.on('error', (err) => {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Graph extraction worker error',
      error: err.message,
    }));
  });

  console.log(JSON.stringify({
    level: 'info',
    message: 'Graph extraction worker started',
    concurrency: 2,
    model: extractionConfig.model,
    minConfidence: extractionConfig.minConfidence,
  }));

  return _worker;
}

/**
 * Gracefully stop the graph extraction worker.
 */
export async function stopGraphExtractionWorker(): Promise<void> {
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
