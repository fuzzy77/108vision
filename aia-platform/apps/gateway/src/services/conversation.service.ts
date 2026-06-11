import { eq, and, desc, sql } from 'drizzle-orm';
import { type Result, success, failure, AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { conversations, messages } from '../db/schema.js';

export interface CreateConversationInput {
  tenantId: string;
  userId: string;
  title?: string;
  channel?: 'web' | 'api' | 'whatsapp' | 'widget';
  metadata?: Record<string, unknown>;
}

export interface AddMessageInput {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelUsed?: string;
  tokensUsed?: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationWithMessages {
  id: string;
  tenantId: string;
  userId: string | null;
  title: string | null;
  channel: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  messages: Array<{
    id: string;
    role: string | null;
    content: string;
    modelUsed: string | null;
    tokensUsed: number | null;
    createdAt: Date | null;
  }>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Conversation management service.
 * Handles CRUD operations for conversations and messages.
 */
export const conversationService = {
  async create(input: CreateConversationInput): Promise<Result<typeof conversations.$inferSelect>> {
    const db = getDb();

    const [conversation] = await db
      .insert(conversations)
      .values({
        tenantId: input.tenantId,
        userId: input.userId,
        title: input.title ?? null,
        channel: input.channel ?? 'web',
        status: 'active',
        metadata: input.metadata ?? {},
      })
      .returning();

    if (!conversation) {
      return failure(new AppError('CONVERSATION_CREATE_FAILED', 'Failed to create conversation', 500));
    }

    return success(conversation);
  },

  async getById(conversationId: string, tenantId: string): Promise<Result<ConversationWithMessages>> {
    const db = getDb();

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!conversation) {
      return failure(new AppError('CONVERSATION_NOT_FOUND', 'Conversation not found', 404));
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    return success({
      ...conversation,
      messages: conversationMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        modelUsed: m.modelUsed,
        tokensUsed: m.tokensUsed,
        createdAt: m.createdAt,
      })),
    });
  },

  async listByUser(
    tenantId: string,
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<Result<PaginatedResult<typeof conversations.$inferSelect>>> {
    const db = getDb();
    const offset = (page - 1) * pageSize;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(
        and(
          eq(conversations.tenantId, tenantId),
          eq(conversations.userId, userId),
          sql`${conversations.status} != 'archived'`,
        ),
      );

    const total = countResult?.count ?? 0;

    const items = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.tenantId, tenantId),
          eq(conversations.userId, userId),
          sql`${conversations.status} != 'archived'`,
        ),
      )
      .orderBy(desc(conversations.updatedAt))
      .limit(pageSize)
      .offset(offset);

    return success({
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total,
    });
  },

  async softDelete(conversationId: string, tenantId: string): Promise<Result<void>> {
    const db = getDb();

    const [updated] = await db
      .update(conversations)
      .set({ status: 'archived' })
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.tenantId, tenantId),
        ),
      )
      .returning({ id: conversations.id });

    if (!updated) {
      return failure(new AppError('CONVERSATION_NOT_FOUND', 'Conversation not found', 404));
    }

    return success(undefined);
  },

  async addMessage(input: AddMessageInput): Promise<Result<typeof messages.$inferSelect>> {
    const db = getDb();

    const [message] = await db
      .insert(messages)
      .values({
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        modelUsed: input.modelUsed ?? null,
        tokensUsed: input.tokensUsed ?? 0,
        metadata: input.metadata ?? {},
      })
      .returning();

    if (!message) {
      return failure(new AppError('MESSAGE_CREATE_FAILED', 'Failed to create message', 500));
    }

    // Update conversation's updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, input.conversationId));

    return success(message);
  },

  async getHistory(
    conversationId: string,
    limit: number = 20,
  ): Promise<Result<Array<{ role: string | null; content: string }>>> {
    const db = getDb();

    const history = await db
      .select({
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    // Reverse to get chronological order
    return success(history.reverse());
  },

  async updateTitle(conversationId: string, title: string): Promise<void> {
    const db = getDb();
    await db
      .update(conversations)
      .set({ title })
      .where(eq(conversations.id, conversationId));
  },
};
