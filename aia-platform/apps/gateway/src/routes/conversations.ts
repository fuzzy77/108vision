import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '@aia/shared';
import { conversationService } from '../services/conversation.service.js';

const conversations = new Hono();

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * GET /api/conversations — List conversations for the current user (paginated).
 */
conversations.get('/', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const userId = c.get('userId') as string;

  const query = listQuerySchema.parse({
    page: c.req.query('page'),
    pageSize: c.req.query('pageSize'),
  });

  const result = await conversationService.listByUser(
    tenantId,
    userId,
    query.page,
    query.pageSize,
  );

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * GET /api/conversations/:id — Get a conversation with its messages.
 */
conversations.get('/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const conversationId = c.req.param('id');

  if (!conversationId) {
    throw new AppError('INVALID_ID', 'Conversation ID is required', 400);
  }

  const result = await conversationService.getById(conversationId, tenantId);

  if (!result.success) {
    throw result.error;
  }

  return c.json(result.data);
});

/**
 * DELETE /api/conversations/:id — Soft delete a conversation.
 */
conversations.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const conversationId = c.req.param('id');

  if (!conversationId) {
    throw new AppError('INVALID_ID', 'Conversation ID is required', 400);
  }

  const result = await conversationService.softDelete(conversationId, tenantId);

  if (!result.success) {
    throw result.error;
  }

  return c.json({ message: 'Conversation deleted' }, 200);
});

export { conversations };
