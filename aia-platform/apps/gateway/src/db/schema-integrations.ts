/**
 * Drizzle ORM schema for integration tables.
 * Mirrors migration 004-integrations.sql.
 */

import {
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { shared, tenants, users } from './schema.js';

// -----------------------------------------------------------
// Email Accounts
// -----------------------------------------------------------
export const emailAccounts = shared.table('email_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).notNull().$type<'imap' | 'microsoft' | 'google'>(),
  email: varchar('email', { length: 255 }).notNull(),
  configEncrypted: text('config_encrypted').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active').$type<'active' | 'error' | 'disconnected'>(),
  lastSync: timestamp('last_sync', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Action Requests
// -----------------------------------------------------------
export const actionRequests = shared.table('action_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  agentId: uuid('agent_id'),
  action: varchar('action', { length: 100 }).notNull(),
  riskLevel: varchar('risk_level', { length: 20 }).notNull().$type<'read_only' | 'low_risk' | 'high_risk'>(),
  description: text('description').notNull(),
  parameters: jsonb('parameters').notNull().default({}).$type<Record<string, unknown>>(),
  status: varchar('status', { length: 20 }).notNull().default('pending').$type<'pending' | 'approved' | 'rejected' | 'auto_approved' | 'executed'>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
});

// -----------------------------------------------------------
// Integration Configs
// -----------------------------------------------------------
export const integrationConfigs = shared.table('integration_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  configEncrypted: text('config_encrypted').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active').$type<'active' | 'error' | 'disconnected'>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// -----------------------------------------------------------
// Relations
// -----------------------------------------------------------
export const emailAccountsRelations = relations(emailAccounts, ({ one }) => ({
  tenant: one(tenants, { fields: [emailAccounts.tenantId], references: [tenants.id] }),
}));

export const actionRequestsRelations = relations(actionRequests, ({ one }) => ({
  tenant: one(tenants, { fields: [actionRequests.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [actionRequests.userId], references: [users.id] }),
}));

export const integrationConfigsRelations = relations(integrationConfigs, ({ one }) => ({
  tenant: one(tenants, { fields: [integrationConfigs.tenantId], references: [tenants.id] }),
}));
