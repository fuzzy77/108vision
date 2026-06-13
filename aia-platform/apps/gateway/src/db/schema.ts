import {
  pgTable,
  pgSchema,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  integer,
  bigint,
  boolean,
  numeric,
  smallint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Drizzle ORM schema matching the PostgreSQL `shared` schema.
 * Mirrors `infrastructure/postgres/init/02-schemas.sql`.
 */

export const shared = pgSchema('shared');

// -----------------------------------------------------------
// Tenants
// -----------------------------------------------------------
export const tenants = shared.table('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  config: jsonb('config').default({}).$type<Record<string, unknown>>(),
  planId: uuid('plan_id'),
  status: varchar('status', { length: 20 }).default('active').$type<'active' | 'suspended' | 'trial' | 'cancelled'>(),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Users
// -----------------------------------------------------------
export const users = shared.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: varchar('role', { length: 20 }).notNull().default('client_user').$type<'platform_admin' | 'tenant_admin' | 'tenant_operator' | 'client_user'>(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Plans
// -----------------------------------------------------------
export const plans = shared.table('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  maxConversationsMonth: integer('max_conversations_month').default(1000),
  maxKbDocuments: integer('max_kb_documents').default(500),
  maxKbSizeMb: integer('max_kb_size_mb').default(1024),
  allowedModels: text('allowed_models').array(),
  priceEurMonth: numeric('price_eur_month', { precision: 10, scale: 2 }).default('0'),
  features: jsonb('features').default({}).$type<Record<string, unknown>>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// API Keys
// -----------------------------------------------------------
export const apiKeys = shared.table('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  scopes: text('scopes').array().default(['chat']),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Usage Records
// -----------------------------------------------------------
export const usageRecords = shared.table('usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  modelName: varchar('model_name', { length: 50 }).notNull(),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  costEur: numeric('cost_eur', { precision: 10, scale: 6 }).default('0'),
  requestType: varchar('request_type', { length: 30 }).default('chat'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Knowledge Base Documents
// -----------------------------------------------------------
export const kbDocuments = shared.table('kb_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  sourceType: varchar('source_type', { length: 30 }).notNull().$type<'upload' | 'url' | 'api' | 'manual'>(),
  sourceUrl: text('source_url'),
  contentHash: varchar('content_hash', { length: 64 }),
  chunkCount: integer('chunk_count').default(0),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).default(0),
  status: varchar('status', { length: 20 }).default('processing').$type<'processing' | 'ready' | 'error' | 'deleted'>(),
  metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Conversations
// -----------------------------------------------------------
export const conversations = shared.table('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 500 }),
  channel: varchar('channel', { length: 30 }).default('web').$type<'web' | 'api' | 'whatsapp' | 'widget'>(),
  status: varchar('status', { length: 20 }).default('active').$type<'active' | 'closed' | 'archived'>(),
  metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Messages
// -----------------------------------------------------------
export const messages = shared.table('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull().$type<'user' | 'assistant' | 'system'>(),
  content: text('content').notNull(),
  modelUsed: varchar('model_used', { length: 50 }),
  tokensUsed: integer('tokens_used').default(0),
  feedbackScore: smallint('feedback_score'),
  metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Agents (not in initial migration -- needs to be added)
// -----------------------------------------------------------
export const agents = shared.table('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt').notNull(),
  model: varchar('model', { length: 50 }).default('balanced'),
  temperature: numeric('temperature', { precision: 3, scale: 2 }).default('0.7'),
  maxTokens: integer('max_tokens').default(4096),
  knowledgeBaseIds: uuid('knowledge_base_ids').array(),
  config: jsonb('config').default({}).$type<Record<string, unknown>>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Agent Templates (marketplace)
// -----------------------------------------------------------
export const agentTemplates = shared.table('agent_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull().default('general'),
  systemPrompt: text('system_prompt').notNull(),
  modelPreference: varchar('model_preference', { length: 50 }).notNull().default('balanced'),
  temperature: numeric('temperature', { precision: 3, scale: 2 }).notNull().default('0.7'),
  icon: varchar('icon', { length: 100 }),
  isPublic: boolean('is_public').notNull().default(true),
  installCount: integer('install_count').notNull().default(0),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Usage Daily (aggregated per tenant/model/day)
// -----------------------------------------------------------
export const usageDaily = shared.table('usage_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(), // 'YYYY-MM-DD'
  model: varchar('model', { length: 50 }).notNull(),
  inputTokens: bigint('input_tokens', { mode: 'number' }).notNull().default(0),
  outputTokens: bigint('output_tokens', { mode: 'number' }).notNull().default(0),
  requestsCount: integer('requests_count').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Invitations
// -----------------------------------------------------------
export const invitations = shared.table('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('client_user'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending').$type<'pending' | 'accepted' | 'expired' | 'revoked'>(),
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
});

// -----------------------------------------------------------
// Sessions (auth)
// -----------------------------------------------------------
export const sessions = shared.table('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
});

// -----------------------------------------------------------
// Password Reset Tokens
// -----------------------------------------------------------
export const passwordResetTokens = shared.table('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Email Verification Tokens
// -----------------------------------------------------------
export const emailVerificationTokens = shared.table('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Platform Settings (singleton key/value store for admin config)
// -----------------------------------------------------------
export const platformSettings = shared.table('platform_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  encrypted: boolean('encrypted').default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

// -----------------------------------------------------------
// Relations
// -----------------------------------------------------------
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  plan: one(plans, { fields: [tenants.planId], references: [plans.id] }),
  users: many(users),
  conversations: many(conversations),
  kbDocuments: many(kbDocuments),
  agents: many(agents),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  conversations: many(conversations),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, { fields: [emailVerificationTokens.userId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  tenant: one(tenants, { fields: [conversations.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));

export const kbDocumentsRelations = relations(kbDocuments, ({ one }) => ({
  tenant: one(tenants, { fields: [kbDocuments.tenantId], references: [tenants.id] }),
}));

export const agentsRelations = relations(agents, ({ one }) => ({
  tenant: one(tenants, { fields: [agents.tenantId], references: [tenants.id] }),
}));

export const agentTemplatesRelations = relations(agentTemplates, ({ one }) => ({
  creator: one(users, { fields: [agentTemplates.createdBy], references: [users.id] }),
}));

export const usageDailyRelations = relations(usageDaily, ({ one }) => ({
  tenant: one(tenants, { fields: [usageDaily.tenantId], references: [tenants.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, { fields: [invitations.tenantId], references: [tenants.id] }),
  inviter: one(users, { fields: [invitations.invitedBy], references: [users.id] }),
}));
