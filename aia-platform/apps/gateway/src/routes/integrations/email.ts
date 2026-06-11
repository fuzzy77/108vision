/**
 * Email Integration Routes.
 *
 * Provides REST endpoints for managing email accounts, reading/searching messages,
 * and sending emails with risk-level gating.
 *
 * Mounted at: /api/integrations/email
 * All routes require authentication + tenant context.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { AppError } from '@aia/shared';
import {
  emailService,
  encryptConfig,
  decryptConfig,
  getEncryptionKey,
  classifyAction,
  shouldAutoApprove,
  DEFAULT_TENANT_ACTION_CONFIG,
  MicrosoftProvider,
  type EmailAccount,
  type ImapConfig,
  type MicrosoftConfig,
  type EmailSearchOptions,
  type TenantActionConfig,
} from '@aia/integrations';
import { getDb } from '../../lib/db.js';
import { emailAccounts, actionRequests } from '../../db/schema-integrations.js';

const emailRouter = new Hono();

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const imapConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1),
  password: z.string().min(1),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
});

const microsoftConfigSchema = z.object({
  clientId: z.string().min(1),
  tenantId: z.string().min(1),
  clientSecret: z.string().min(1),
  refreshToken: z.string().min(1),
  scopes: z.array(z.string()).default([
    'https://graph.microsoft.com/Mail.ReadWrite',
    'https://graph.microsoft.com/Mail.Send',
    'offline_access',
  ]),
});

const addAccountSchema = z.object({
  provider: z.enum(['imap', 'microsoft', 'google']),
  email: z.string().email(),
  config: z.union([imapConfigSchema, microsoftConfigSchema]),
});

const updateAccountSchema = z.object({
  config: z.union([imapConfigSchema, microsoftConfigSchema]).optional(),
  status: z.enum(['active', 'error', 'disconnected']).optional(),
});

const searchSchema = z.object({
  query: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  since: z.string().datetime().optional(),
  before: z.string().datetime().optional(),
  folder: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  unreadOnly: z.boolean().default(false),
});

const sendSchema = z.object({
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  htmlBody: z.string().optional(),
});

const replySchema = z.object({
  messageId: z.string().min(1),
  body: z.string().min(1),
  htmlBody: z.string().optional(),
});

const messagesQuerySchema = z.object({
  folder: z.string().default('INBOX'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

const oauthStartSchema = z.object({
  clientId: z.string().min(1),
  tenantId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).optional(),
});

const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  tenantId: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Helper: reconstruct EmailAccount from DB row
// ---------------------------------------------------------------------------

function dbRowToAccount(row: {
  id: string;
  tenantId: string;
  provider: string;
  email: string;
  configEncrypted: string;
  status: string;
  lastSync: Date | null;
}): EmailAccount {
  const key = getEncryptionKey();
  const config = decryptConfig<ImapConfig | MicrosoftConfig>(row.configEncrypted, key);

  return {
    id: row.id,
    tenantId: row.tenantId,
    provider: row.provider as EmailAccount['provider'],
    email: row.email,
    config,
    status: row.status as EmailAccount['status'],
    lastSync: row.lastSync,
  };
}

/**
 * Get tenant action config from tenant settings (stored in tenants.config JSONB).
 * Falls back to defaults if not configured.
 */
function getTenantActionConfig(_tenantId: string): TenantActionConfig {
  // In a full implementation this would read from the tenant config in DB.
  // For now return defaults — can be extended later.
  return DEFAULT_TENANT_ACTION_CONFIG;
}

// ---------------------------------------------------------------------------
// Routes: Account Management
// ---------------------------------------------------------------------------

/**
 * GET /accounts — List configured email accounts for the tenant.
 */
emailRouter.get('/accounts', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const db = getDb();

  const accounts = await db
    .select({
      id: emailAccounts.id,
      provider: emailAccounts.provider,
      email: emailAccounts.email,
      status: emailAccounts.status,
      lastSync: emailAccounts.lastSync,
      createdAt: emailAccounts.createdAt,
    })
    .from(emailAccounts)
    .where(eq(emailAccounts.tenantId, tenantId));

  return c.json({ items: accounts, count: accounts.length });
});

/**
 * POST /accounts — Add a new email account.
 * Tests connection before saving.
 */
emailRouter.post('/accounts', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = await c.req.json();
  const parsed = addAccountSchema.parse(body);

  const key = getEncryptionKey();

  // Build temporary account for testing
  const testAccount: EmailAccount = {
    id: 'test',
    tenantId,
    provider: parsed.provider,
    email: parsed.email,
    config: parsed.config as ImapConfig | MicrosoftConfig,
    status: 'active',
    lastSync: null,
  };

  // Test connection before saving
  const testResult = await emailService.testConnection(testAccount);
  if (!testResult.success) {
    throw testResult.error;
  }

  // Encrypt config and store
  const configEncrypted = encryptConfig(parsed.config as Record<string, unknown>, key);

  const db = getDb();
  const [inserted] = await db
    .insert(emailAccounts)
    .values({
      tenantId,
      provider: parsed.provider,
      email: parsed.email,
      configEncrypted,
      status: 'active',
    })
    .returning({
      id: emailAccounts.id,
      provider: emailAccounts.provider,
      email: emailAccounts.email,
      status: emailAccounts.status,
      createdAt: emailAccounts.createdAt,
    });

  return c.json(inserted, 201);
});

/**
 * PUT /accounts/:id — Update an email account's config.
 */
emailRouter.put('/accounts/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const accountId = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateAccountSchema.parse(body);

  const db = getDb();

  // Verify ownership
  const existing = await db
    .select({ id: emailAccounts.id })
    .from(emailAccounts)
    .where(and(eq(emailAccounts.id, accountId), eq(emailAccounts.tenantId, tenantId)))
    .limit(1);

  if (existing.length === 0) {
    throw new AppError('ACCOUNT_NOT_FOUND', 'Email account not found', 404);
  }

  const updates: Record<string, unknown> = {};

  if (parsed.config) {
    const key = getEncryptionKey();
    updates['configEncrypted'] = encryptConfig(parsed.config as Record<string, unknown>, key);
  }

  if (parsed.status) {
    updates['status'] = parsed.status;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('NO_CHANGES', 'No fields to update', 400);
  }

  const [updated] = await db
    .update(emailAccounts)
    .set(updates)
    .where(and(eq(emailAccounts.id, accountId), eq(emailAccounts.tenantId, tenantId)))
    .returning({
      id: emailAccounts.id,
      provider: emailAccounts.provider,
      email: emailAccounts.email,
      status: emailAccounts.status,
      updatedAt: emailAccounts.updatedAt,
    });

  return c.json(updated);
});

/**
 * DELETE /accounts/:id — Remove an email account.
 */
emailRouter.delete('/accounts/:id', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const accountId = c.req.param('id');

  const db = getDb();

  const deleted = await db
    .delete(emailAccounts)
    .where(and(eq(emailAccounts.id, accountId), eq(emailAccounts.tenantId, tenantId)))
    .returning({ id: emailAccounts.id });

  if (deleted.length === 0) {
    throw new AppError('ACCOUNT_NOT_FOUND', 'Email account not found', 404);
  }

  return c.json({ message: 'Account removed', id: accountId });
});

/**
 * POST /accounts/:id/test — Test an existing account's connection.
 */
emailRouter.post('/accounts/:id/test', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const accountId = c.req.param('id');

  const db = getDb();

  const rows = await db
    .select({
      id: emailAccounts.id,
      tenantId: emailAccounts.tenantId,
      provider: emailAccounts.provider,
      email: emailAccounts.email,
      configEncrypted: emailAccounts.configEncrypted,
      status: emailAccounts.status,
      lastSync: emailAccounts.lastSync,
    })
    .from(emailAccounts)
    .where(and(eq(emailAccounts.id, accountId), eq(emailAccounts.tenantId, tenantId)))
    .limit(1);

  if (rows.length === 0) {
    throw new AppError('ACCOUNT_NOT_FOUND', 'Email account not found', 404);
  }

  const account = dbRowToAccount(rows[0]!);
  const result = await emailService.testConnection(account);

  if (!result.success) {
    // Update status to error
    await db
      .update(emailAccounts)
      .set({ status: 'error' })
      .where(eq(emailAccounts.id, accountId));

    throw result.error;
  }

  // Update status to active on successful test
  await db
    .update(emailAccounts)
    .set({ status: 'active' })
    .where(eq(emailAccounts.id, accountId));

  return c.json({ success: true, message: 'Connection successful' });
});

// ---------------------------------------------------------------------------
// Routes: Email Operations
// ---------------------------------------------------------------------------

/**
 * GET /accounts/:id/messages — Fetch messages (paginated).
 */
emailRouter.get('/accounts/:id/messages', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const accountId = c.req.param('id');

  const query = messagesQuerySchema.parse({
    folder: c.req.query('folder'),
    limit: c.req.query('limit'),
    unreadOnly: c.req.query('unreadOnly'),
  });

  const account = await loadAccount(accountId, tenantId);

  const options: EmailSearchOptions = {
    folder: query.folder,
    limit: query.limit,
    unreadOnly: query.unreadOnly,
  };

  const result = await emailService.fetchInbox(account, options);
  if (!result.success) throw result.error;

  // Update last sync timestamp
  const db = getDb();
  await db
    .update(emailAccounts)
    .set({ lastSync: new Date() })
    .where(eq(emailAccounts.id, accountId));

  return c.json({
    items: result.data,
    count: result.data.length,
    folder: query.folder,
  });
});

/**
 * GET /accounts/:id/messages/:msgId — Get a single message.
 */
emailRouter.get('/accounts/:id/messages/:msgId', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const accountId = c.req.param('id');
  const msgId = c.req.param('msgId');

  const account = await loadAccount(accountId, tenantId);
  const result = await emailService.getMessage(account, msgId);

  if (!result.success) throw result.error;

  return c.json(result.data);
});

/**
 * POST /accounts/:id/search — Search messages.
 */
emailRouter.post('/accounts/:id/search', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const accountId = c.req.param('id');
  const body = await c.req.json();
  const parsed = searchSchema.parse(body);

  const account = await loadAccount(accountId, tenantId);

  const options: EmailSearchOptions = {
    query: parsed.query,
    from: parsed.from,
    to: parsed.to,
    subject: parsed.subject,
    since: parsed.since ? new Date(parsed.since) : undefined,
    before: parsed.before ? new Date(parsed.before) : undefined,
    folder: parsed.folder,
    limit: parsed.limit,
    unreadOnly: parsed.unreadOnly,
  };

  const result = await emailService.search(account, options);
  if (!result.success) throw result.error;

  return c.json({
    items: result.data,
    count: result.data.length,
  });
});

/**
 * POST /accounts/:id/send — Send an email (HIGH RISK — requires approval).
 */
emailRouter.post('/accounts/:id/send', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const userId = c.get('userId') as string;
  const accountId = c.req.param('id');
  const body = await c.req.json();
  const parsed = sendSchema.parse(body);

  const account = await loadAccount(accountId, tenantId);
  const tenantConfig = getTenantActionConfig(tenantId);

  const riskLevel = classifyAction('email.send');
  const autoApprove = shouldAutoApprove(riskLevel, tenantConfig);

  if (!autoApprove) {
    // Create approval request and return pending status
    const db = getDb();
    const [request] = await db
      .insert(actionRequests)
      .values({
        tenantId,
        userId,
        action: 'email.send',
        riskLevel,
        description: `Send email to ${parsed.to.join(', ')} with subject "${parsed.subject}"`,
        parameters: {
          accountId,
          to: parsed.to,
          cc: parsed.cc,
          subject: parsed.subject,
          body: parsed.body,
          htmlBody: parsed.htmlBody,
        },
        status: 'pending',
      })
      .returning({
        id: actionRequests.id,
        status: actionRequests.status,
        createdAt: actionRequests.createdAt,
      });

    return c.json({
      message: 'Action requires approval',
      actionRequest: request,
      riskLevel,
    }, 202);
  }

  // Auto-approved: execute immediately
  const result = await emailService.send(account, {
    to: parsed.to,
    cc: parsed.cc,
    subject: parsed.subject,
    body: parsed.body,
    htmlBody: parsed.htmlBody,
  });

  if (!result.success) throw result.error;

  return c.json({
    message: 'Email sent',
    messageId: result.data.messageId,
  });
});

/**
 * POST /accounts/:id/reply — Reply to a message (HIGH RISK — requires approval).
 */
emailRouter.post('/accounts/:id/reply', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const userId = c.get('userId') as string;
  const accountId = c.req.param('id');
  const body = await c.req.json();
  const parsed = replySchema.parse(body);

  const account = await loadAccount(accountId, tenantId);
  const tenantConfig = getTenantActionConfig(tenantId);

  const riskLevel = classifyAction('email.reply');
  const autoApprove = shouldAutoApprove(riskLevel, tenantConfig);

  if (!autoApprove) {
    const db = getDb();
    const [request] = await db
      .insert(actionRequests)
      .values({
        tenantId,
        userId,
        action: 'email.reply',
        riskLevel,
        description: `Reply to message ${parsed.messageId}`,
        parameters: {
          accountId,
          messageId: parsed.messageId,
          body: parsed.body,
          htmlBody: parsed.htmlBody,
        },
        status: 'pending',
      })
      .returning({
        id: actionRequests.id,
        status: actionRequests.status,
        createdAt: actionRequests.createdAt,
      });

    return c.json({
      message: 'Action requires approval',
      actionRequest: request,
      riskLevel,
    }, 202);
  }

  // Get the original message to build reply
  const originalResult = await emailService.getMessage(account, parsed.messageId);
  if (!originalResult.success) throw originalResult.error;

  const original = originalResult.data;

  const result = await emailService.send(account, {
    to: [original.from.address],
    subject: original.subject.startsWith('Re:') ? original.subject : `Re: ${original.subject}`,
    body: parsed.body,
    htmlBody: parsed.htmlBody,
    replyTo: parsed.messageId,
  });

  if (!result.success) throw result.error;

  return c.json({
    message: 'Reply sent',
    messageId: result.data.messageId,
  });
});

/**
 * GET /accounts/:id/folders — List mailbox folders.
 */
emailRouter.get('/accounts/:id/folders', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const accountId = c.req.param('id');

  const account = await loadAccount(accountId, tenantId);
  const result = await emailService.listFolders(account);

  if (!result.success) throw result.error;

  return c.json({ items: result.data, count: result.data.length });
});

// ---------------------------------------------------------------------------
// Routes: Microsoft OAuth Flow
// ---------------------------------------------------------------------------

/**
 * POST /oauth/microsoft/start — Begin Microsoft OAuth consent flow.
 * Returns the authorization URL to redirect the user to.
 */
emailRouter.post('/oauth/microsoft/start', async (c) => {
  const body = await c.req.json();
  const parsed = oauthStartSchema.parse(body);

  const authUrl = MicrosoftProvider.getAuthUrl({
    clientId: parsed.clientId,
    tenantId: parsed.tenantId,
    redirectUri: parsed.redirectUri,
    scopes: parsed.scopes,
  });

  return c.json({ authUrl });
});

/**
 * POST /oauth/microsoft/callback — Handle Microsoft OAuth callback.
 * Exchanges the authorization code for tokens.
 */
emailRouter.post('/oauth/microsoft/callback', async (c) => {
  const body = await c.req.json();
  const parsed = oauthCallbackSchema.parse(body);

  try {
    const tokens = await MicrosoftProvider.handleCallback({
      code: parsed.code,
      clientId: parsed.clientId,
      clientSecret: parsed.clientSecret,
      tenantId: parsed.tenantId,
      redirectUri: parsed.redirectUri,
      scopes: parsed.scopes,
    });

    return c.json({
      message: 'OAuth flow completed successfully',
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    throw new AppError(
      'OAUTH_CALLBACK_FAILED',
      `OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      400,
    );
  }
});

// ---------------------------------------------------------------------------
// Helper: load and decrypt an account from DB
// ---------------------------------------------------------------------------

async function loadAccount(accountId: string, tenantId: string): Promise<EmailAccount> {
  const db = getDb();

  const rows = await db
    .select({
      id: emailAccounts.id,
      tenantId: emailAccounts.tenantId,
      provider: emailAccounts.provider,
      email: emailAccounts.email,
      configEncrypted: emailAccounts.configEncrypted,
      status: emailAccounts.status,
      lastSync: emailAccounts.lastSync,
    })
    .from(emailAccounts)
    .where(and(eq(emailAccounts.id, accountId), eq(emailAccounts.tenantId, tenantId)))
    .limit(1);

  if (rows.length === 0) {
    throw new AppError('ACCOUNT_NOT_FOUND', 'Email account not found', 404);
  }

  const row = rows[0]!;

  if (row.status === 'disconnected') {
    throw new AppError('ACCOUNT_DISCONNECTED', 'Email account is disconnected. Please re-configure.', 400);
  }

  return dbRowToAccount(row);
}

export { emailRouter };
