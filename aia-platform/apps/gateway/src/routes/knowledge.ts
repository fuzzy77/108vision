import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { kbDocuments } from '../db/schema.js';
import { ragService } from '../services/rag.service.js';
import { ingestionService } from '../services/ingestion.service.js';
import { getIngestionQueue } from '../jobs/ingestion.worker.js';

const knowledge = new Hono();

const searchQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.coerce.number().int().positive().max(20).default(5),
  threshold: z.coerce.number().min(0).max(1).default(0.7),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['processing', 'ready', 'error', 'all']).default('all'),
});

/**
 * POST /api/knowledge/upload — Upload a document for ingestion.
 * Accepts multipart/form-data with a file field.
 * Queues the document for async processing.
 */
knowledge.post('/upload', async (c) => {
  const tenantId = c.get('tenantId') as string;

  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    throw new AppError('FILE_REQUIRED', 'A file must be provided in the "file" field', 400);
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new AppError('FILE_TOO_LARGE', 'File size exceeds 10MB limit', 400);
  }

  // Validate file type
  const allowedTypes = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/pdf',
    'application/json',
    'text/html',
  ];
  const fileType = file.type || 'text/plain';
  if (!allowedTypes.includes(fileType)) {
    throw new AppError(
      'FILE_TYPE_NOT_SUPPORTED',
      `Unsupported file type: ${fileType}. Allowed: ${allowedTypes.join(', ')}`,
      400,
    );
  }

  // Read file content as text
  const content = await file.text();

  if (!content.trim()) {
    throw new AppError('FILE_EMPTY', 'File has no content', 400);
  }

  // Queue for async processing
  const queue = getIngestionQueue();
  const job = await queue.add('ingest-document', {
    content,
    metadata: {
      name: file.name,
      type: fileType,
      tenantId,
      sourceType: 'upload' as const,
    },
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });

  return c.json({
    message: 'Document queued for processing',
    jobId: job.id,
    fileName: file.name,
    fileSize: file.size,
  }, 202);
});

/**
 * GET /api/knowledge/documents — List documents for the current tenant.
 */
knowledge.get('/documents', async (c) => {
  const tenantId = c.get('tenantId') as string;

  const query = listQuerySchema.parse({
    page: c.req.query('page'),
    pageSize: c.req.query('pageSize'),
    status: c.req.query('status'),
  });

  const db = getDb();
  const offset = (query.page - 1) * query.pageSize;

  const conditions = [
    eq(kbDocuments.tenantId, tenantId),
    sql`${kbDocuments.status} != 'deleted'`,
  ];

  if (query.status !== 'all') {
    conditions.push(eq(kbDocuments.status, query.status));
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(kbDocuments)
    .where(and(...conditions));

  const total = countResult?.count ?? 0;

  const documents = await db
    .select({
      id: kbDocuments.id,
      title: kbDocuments.title,
      sourceType: kbDocuments.sourceType,
      chunkCount: kbDocuments.chunkCount,
      sizeBytes: kbDocuments.sizeBytes,
      status: kbDocuments.status,
      createdAt: kbDocuments.createdAt,
      updatedAt: kbDocuments.updatedAt,
    })
    .from(kbDocuments)
    .where(and(...conditions))
    .orderBy(sql`${kbDocuments.createdAt} DESC`)
    .limit(query.pageSize)
    .offset(offset);

  return c.json({
    items: documents,
    total,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: offset + documents.length < total,
  });
});

/**
 * GET /api/knowledge/search — Semantic search over the knowledge base.
 */
knowledge.get('/search', async (c) => {
  const tenantId = c.get('tenantId') as string;

  const query = searchQuerySchema.parse({
    query: c.req.query('query'),
    limit: c.req.query('limit'),
    threshold: c.req.query('threshold'),
  });

  const result = await ragService.retrieveContext(query.query, tenantId, {
    limit: query.limit,
    threshold: query.threshold,
  });

  if (!result.success) {
    throw result.error;
  }

  return c.json({
    query: query.query,
    results: result.data,
    count: result.data.length,
  });
});

/**
 * DELETE /api/knowledge/documents/:id — Remove a document and its vectors.
 */
knowledge.delete('/documents/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const documentId = c.req.param('id');

  if (!documentId) {
    throw new AppError('INVALID_ID', 'Document ID is required', 400);
  }

  const result = await ingestionService.deleteDocument(documentId, tenantId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({ message: 'Document deleted' });
});

export { knowledge };
