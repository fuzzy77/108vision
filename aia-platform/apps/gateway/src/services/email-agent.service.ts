/**
 * Email Agent Service.
 *
 * Connects email capabilities to the chat/agent system.
 * Provides context retrieval, action execution with risk checks,
 * and message formatting for LLM prompts.
 */

import { type Result, success, failure, AppError } from '@aia/shared';
import { eq, and, desc } from 'drizzle-orm';
import {
  emailService,
  decryptConfig,
  getEncryptionKey,
  classifyAction,
  shouldAutoApprove,
  isActionBlocked,
  DEFAULT_TENANT_ACTION_CONFIG,
  getApprovalReason,
  type EmailAccount,
  type EmailMessage,
  type EmailSearchOptions,
  type ImapConfig,
  type MicrosoftConfig,
  type TenantActionConfig,
  type RiskLevel,
} from '@aia/integrations';
import { getDb } from '../lib/db.js';
import { emailAccounts, actionRequests } from '../db/schema-integrations.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailActionResult {
  executed: boolean;
  requiresApproval: boolean;
  approvalRequestId?: string;
  riskLevel: RiskLevel;
  reason?: string;
  data?: unknown;
}

export interface EmailContext {
  messages: EmailMessage[];
  formattedContext: string;
  accountEmail: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const emailAgentService = {
  /**
   * Get email context relevant to a user query.
   * Searches across all active email accounts for the tenant.
   *
   * Used by the RAG pipeline to inject email context into LLM prompts.
   */
  async getEmailContext(
    tenantId: string,
    query: string,
    options: { limit?: number } = {},
  ): Promise<Result<EmailContext | null>> {
    const limit = options.limit ?? 5;

    try {
      const db = getDb();
      const key = getEncryptionKey();

      // Get all active email accounts for this tenant
      const accounts = await db
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
        .where(and(
          eq(emailAccounts.tenantId, tenantId),
          eq(emailAccounts.status, 'active'),
        ));

      if (accounts.length === 0) {
        return success(null);
      }

      // Search across all accounts (take first active one for simplicity)
      const firstAccount = accounts[0]!;
      const account: EmailAccount = {
        id: firstAccount.id,
        tenantId: firstAccount.tenantId,
        provider: firstAccount.provider as EmailAccount['provider'],
        email: firstAccount.email,
        config: decryptConfig<ImapConfig | MicrosoftConfig>(firstAccount.configEncrypted, key),
        status: firstAccount.status as EmailAccount['status'],
        lastSync: firstAccount.lastSync,
      };

      const searchOptions: EmailSearchOptions = {
        query,
        limit,
      };

      const result = await emailService.search(account, searchOptions);
      if (!result.success) {
        // Non-fatal: return null context if email search fails
        return success(null);
      }

      if (result.data.length === 0) {
        return success(null);
      }

      const formattedContext = emailService.formatEmailsForContext(result.data);

      return success({
        messages: result.data,
        formattedContext,
        accountEmail: account.email,
      });
    } catch (error) {
      // Email context is supplementary; don't fail the entire request
      return success(null);
    }
  },

  /**
   * Execute an email action on behalf of an AI agent, with risk checks.
   *
   * Flow:
   * 1. Classify the action risk level
   * 2. Check if action is blocked for this tenant
   * 3. Check if auto-approve is allowed
   * 4. Either execute immediately or create an approval request
   */
  async executeEmailAction(params: {
    tenantId: string;
    userId: string;
    agentId: string;
    action: string;
    accountId: string;
    parameters: Record<string, unknown>;
    description: string;
  }): Promise<Result<EmailActionResult>> {
    const { tenantId, userId, agentId, action, accountId, parameters, description } = params;

    const tenantConfig = this.getTenantActionConfig(tenantId);

    // Check if action is blocked
    if (isActionBlocked(action, tenantConfig)) {
      return failure(
        new AppError('ACTION_BLOCKED', `Action "${action}" is not allowed for this tenant`, 403),
      );
    }

    const riskLevel = classifyAction(action);
    const autoApprove = shouldAutoApprove(riskLevel, tenantConfig);

    if (!autoApprove) {
      // Create approval request
      const db = getDb();
      const [request] = await db
        .insert(actionRequests)
        .values({
          tenantId,
          userId,
          agentId,
          action,
          riskLevel,
          description,
          parameters: { accountId, ...parameters },
          status: 'pending',
        })
        .returning({ id: actionRequests.id });

      return success({
        executed: false,
        requiresApproval: true,
        approvalRequestId: request!.id,
        riskLevel,
        reason: getApprovalReason(action, riskLevel),
      });
    }

    // Auto-approved: execute the action
    const executionResult = await this.performAction(tenantId, accountId, action, parameters);
    if (!executionResult.success) {
      return failure(executionResult.error);
    }

    // Log auto-approved action
    const db = getDb();
    await db
      .insert(actionRequests)
      .values({
        tenantId,
        userId,
        agentId,
        action,
        riskLevel,
        description,
        parameters: { accountId, ...parameters },
        status: 'auto_approved',
        resolvedAt: new Date(),
      });

    return success({
      executed: true,
      requiresApproval: false,
      riskLevel,
      data: executionResult.data,
    });
  },

  /**
   * Execute a previously approved action.
   */
  async executeApprovedAction(
    actionRequestId: string,
    tenantId: string,
    approvedBy: string,
  ): Promise<Result<unknown>> {
    const db = getDb();

    // Load the action request
    const rows = await db
      .select()
      .from(actionRequests)
      .where(and(
        eq(actionRequests.id, actionRequestId),
        eq(actionRequests.tenantId, tenantId),
        eq(actionRequests.status, 'pending'),
      ))
      .limit(1);

    if (rows.length === 0) {
      return failure(
        new AppError('ACTION_NOT_FOUND', 'Pending action request not found', 404),
      );
    }

    const request = rows[0]!;
    const params = request.parameters as Record<string, unknown>;
    const accountId = params['accountId'] as string;

    // Execute the action
    const result = await this.performAction(
      tenantId,
      accountId,
      request.action,
      params,
    );

    // Update status
    const newStatus = result.success ? 'executed' : 'rejected';
    await db
      .update(actionRequests)
      .set({
        status: newStatus,
        resolvedAt: new Date(),
        resolvedBy: approvedBy,
      })
      .where(eq(actionRequests.id, actionRequestId));

    return result;
  },

  /**
   * Reject a pending action request.
   */
  async rejectAction(
    actionRequestId: string,
    tenantId: string,
    rejectedBy: string,
  ): Promise<Result<void>> {
    const db = getDb();

    const updated = await db
      .update(actionRequests)
      .set({
        status: 'rejected',
        resolvedAt: new Date(),
        resolvedBy: rejectedBy,
      })
      .where(and(
        eq(actionRequests.id, actionRequestId),
        eq(actionRequests.tenantId, tenantId),
        eq(actionRequests.status, 'pending'),
      ))
      .returning({ id: actionRequests.id });

    if (updated.length === 0) {
      return failure(
        new AppError('ACTION_NOT_FOUND', 'Pending action request not found', 404),
      );
    }

    return success(undefined);
  },

  /**
   * Get pending action requests for a tenant.
   */
  async getPendingActions(tenantId: string): Promise<Result<Array<{
    id: string;
    action: string;
    riskLevel: string;
    description: string;
    createdAt: Date | null;
  }>>> {
    const db = getDb();

    const pending = await db
      .select({
        id: actionRequests.id,
        action: actionRequests.action,
        riskLevel: actionRequests.riskLevel,
        description: actionRequests.description,
        createdAt: actionRequests.createdAt,
      })
      .from(actionRequests)
      .where(and(
        eq(actionRequests.tenantId, tenantId),
        eq(actionRequests.status, 'pending'),
      ))
      .orderBy(desc(actionRequests.createdAt));

    return success(pending);
  },

  /**
   * Format email messages as context for LLM prompts.
   * Delegates to emailService.formatEmailsForContext.
   */
  formatEmailForContext(messages: EmailMessage[]): string {
    return emailService.formatEmailsForContext(messages);
  },

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Actually perform an email action (after risk check / approval).
   */
  async performAction(
    tenantId: string,
    accountId: string,
    action: string,
    parameters: Record<string, unknown>,
  ): Promise<Result<unknown>> {
    const account = await this.loadAccount(accountId, tenantId);
    if (!account) {
      return failure(new AppError('ACCOUNT_NOT_FOUND', 'Email account not found', 404));
    }

    switch (action) {
      case 'email.read':
      case 'email.get_message': {
        const messageId = parameters['messageId'] as string;
        return emailService.getMessage(account, messageId);
      }

      case 'email.search': {
        const options = parameters as unknown as EmailSearchOptions;
        return emailService.search(account, options);
      }

      case 'email.list_folders': {
        return emailService.listFolders(account);
      }

      case 'email.mark_read': {
        const messageId = parameters['messageId'] as string;
        const folder = (parameters['folder'] as string) ?? 'INBOX';
        return emailService.markAsRead(account, messageId, folder);
      }

      case 'email.move': {
        const messageId = parameters['messageId'] as string;
        const sourceFolder = (parameters['sourceFolder'] as string) ?? 'INBOX';
        const targetFolder = parameters['targetFolder'] as string;
        return emailService.moveMessage(account, messageId, sourceFolder, targetFolder);
      }

      case 'email.send': {
        return emailService.send(account, {
          to: parameters['to'] as string[],
          cc: parameters['cc'] as string[] | undefined,
          subject: parameters['subject'] as string,
          body: parameters['body'] as string,
          htmlBody: parameters['htmlBody'] as string | undefined,
        });
      }

      case 'email.reply': {
        const messageId = parameters['messageId'] as string;
        const originalResult = await emailService.getMessage(account, messageId);
        if (!originalResult.success) return originalResult;

        const original = originalResult.data;
        return emailService.send(account, {
          to: [original.from.address],
          subject: original.subject.startsWith('Re:') ? original.subject : `Re: ${original.subject}`,
          body: parameters['body'] as string,
          htmlBody: parameters['htmlBody'] as string | undefined,
          replyTo: messageId,
        });
      }

      default:
        return failure(
          new AppError('UNKNOWN_ACTION', `Unknown email action: ${action}`, 400),
        );
    }
  },

  /**
   * Load an email account from DB.
   */
  async loadAccount(accountId: string, tenantId: string): Promise<EmailAccount | null> {
    const db = getDb();
    const key = getEncryptionKey();

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

    if (rows.length === 0) return null;

    const row = rows[0]!;
    return {
      id: row.id,
      tenantId: row.tenantId,
      provider: row.provider as EmailAccount['provider'],
      email: row.email,
      config: decryptConfig<ImapConfig | MicrosoftConfig>(row.configEncrypted, key),
      status: row.status as EmailAccount['status'],
      lastSync: row.lastSync,
    };
  },

  /**
   * Get tenant action config. In production this reads from tenants.config JSONB.
   */
  getTenantActionConfig(_tenantId: string): TenantActionConfig {
    return DEFAULT_TENANT_ACTION_CONFIG;
  },
};
