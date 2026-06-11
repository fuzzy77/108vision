/**
 * Unified Email Service.
 *
 * Wraps both IMAP and Microsoft providers behind a single interface,
 * implements provider factory, and handles cross-cutting concerns
 * like connection lifecycle and error normalization.
 */

import { type Result, success, failure, AppError } from '@aia/shared';
import { ImapProvider } from './imap.provider.js';
import { MicrosoftProvider } from './microsoft.provider.js';
import type {
  EmailAccount,
  ImapConfig,
  MicrosoftConfig,
  EmailMessage,
  EmailSearchOptions,
  EmailDraft,
  EmailFolder,
  EmailProvider,
} from '../types.js';

/**
 * Factory: create the correct provider instance for an email account.
 */
export function getProvider(account: EmailAccount): EmailProvider {
  switch (account.provider) {
    case 'imap':
      return new ImapProvider(account.config as ImapConfig);
    case 'microsoft':
      return new MicrosoftProvider(account.config as MicrosoftConfig);
    case 'google':
      // Google can be handled via IMAP with OAuth, or a dedicated provider later
      throw new AppError(
        'PROVIDER_NOT_IMPLEMENTED',
        'Google provider is not yet implemented. Use IMAP with app password.',
        501,
      );
    default:
      throw new AppError(
        'INVALID_PROVIDER',
        `Unknown email provider: ${account.provider}`,
        400,
      );
  }
}

/**
 * Unified email service — all operations return Result<T>.
 */
export const emailService = {
  /**
   * Test connection for an email account configuration.
   */
  async testConnection(account: EmailAccount): Promise<Result<{ success: boolean }>> {
    try {
      const provider = getProvider(account);
      const result = await provider.testConnection();

      if (!result.success) {
        return failure(
          new AppError('EMAIL_CONNECTION_FAILED', result.error ?? 'Connection test failed', 400),
        );
      }

      return success({ success: true });
    } catch (error) {
      return failure(
        new AppError(
          'EMAIL_CONNECTION_ERROR',
          `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Fetch recent messages from an account's inbox (or specified folder).
   */
  async fetchInbox(
    account: EmailAccount,
    options: EmailSearchOptions = {},
  ): Promise<Result<EmailMessage[]>> {
    try {
      const provider = getProvider(account);
      const messages = await provider.fetchMessages(options);
      return success(messages);
    } catch (error) {
      return failure(
        new AppError(
          'EMAIL_FETCH_FAILED',
          `Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Search messages using provider-native search capabilities.
   */
  async search(
    account: EmailAccount,
    options: EmailSearchOptions,
  ): Promise<Result<EmailMessage[]>> {
    try {
      const provider = getProvider(account);
      const messages = await provider.searchMessages(options);
      return success(messages);
    } catch (error) {
      return failure(
        new AppError(
          'EMAIL_SEARCH_FAILED',
          `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Get a single message by ID.
   */
  async getMessage(
    account: EmailAccount,
    messageId: string,
  ): Promise<Result<EmailMessage>> {
    try {
      const provider = getProvider(account);
      const message = await provider.getMessage(messageId);

      if (!message) {
        return failure(
          new AppError('EMAIL_NOT_FOUND', 'Message not found', 404),
        );
      }

      return success(message);
    } catch (error) {
      return failure(
        new AppError(
          'EMAIL_FETCH_FAILED',
          `Failed to get message: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Get full thread of messages by thread/conversation ID.
   */
  async getThread(
    account: EmailAccount,
    threadId: string,
  ): Promise<Result<EmailMessage[]>> {
    try {
      const provider = getProvider(account);

      // For Microsoft, conversationId is the thread identifier
      if (account.provider === 'microsoft') {
        const messages = await provider.searchMessages({
          query: threadId,
          limit: 50,
        });
        return success(messages);
      }

      // For IMAP, search by References/In-Reply-To header (best effort)
      const messages = await provider.searchMessages({
        query: threadId,
        limit: 50,
      });
      return success(messages);
    } catch (error) {
      return failure(
        new AppError(
          'EMAIL_THREAD_FAILED',
          `Failed to fetch thread: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * List all folders for an account.
   */
  async listFolders(account: EmailAccount): Promise<Result<EmailFolder[]>> {
    try {
      const provider = getProvider(account);
      const folders = await provider.listFolders();
      return success(folders);
    } catch (error) {
      return failure(
        new AppError(
          'EMAIL_FOLDERS_FAILED',
          `Failed to list folders: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Send an email. This is a HIGH RISK action (requires approval).
   */
  async send(
    account: EmailAccount,
    draft: EmailDraft,
  ): Promise<Result<{ messageId: string }>> {
    try {
      const provider = getProvider(account);
      const result = await provider.sendEmail(draft);
      return success(result);
    } catch (error) {
      return failure(
        new AppError(
          'EMAIL_SEND_FAILED',
          `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Mark a message as read.
   */
  async markAsRead(
    account: EmailAccount,
    messageId: string,
    folder: string,
  ): Promise<Result<void>> {
    try {
      const provider = getProvider(account);
      await provider.markAsRead(messageId, folder);
      return success(undefined);
    } catch (error) {
      return failure(
        new AppError(
          'EMAIL_FLAG_FAILED',
          `Failed to mark as read: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Move a message to another folder.
   */
  async moveMessage(
    account: EmailAccount,
    messageId: string,
    sourceFolder: string,
    targetFolder: string,
  ): Promise<Result<void>> {
    try {
      const provider = getProvider(account);
      await provider.moveMessage(messageId, sourceFolder, targetFolder);
      return success(undefined);
    } catch (error) {
      return failure(
        new AppError(
          'EMAIL_MOVE_FAILED',
          `Failed to move message: ${error instanceof Error ? error.message : 'Unknown error'}`,
          500,
        ),
      );
    }
  },

  /**
   * Format email messages as context for LLM prompts.
   * Used by the agent system to include email context in RAG.
   */
  formatEmailsForContext(messages: EmailMessage[], maxLength: number = 4000): string {
    if (messages.length === 0) return '';

    const lines: string[] = ['--- Recent Emails ---'];

    for (const msg of messages) {
      const entry = [
        `From: ${msg.from.name} <${msg.from.address}>`,
        `To: ${msg.to.map(t => `${t.name} <${t.address}>`).join(', ')}`,
        `Subject: ${msg.subject}`,
        `Date: ${msg.date.toISOString()}`,
        `Status: ${msg.isRead ? 'Read' : 'Unread'}`,
        '',
        msg.body.slice(0, 500),
        '---',
      ].join('\n');

      if (lines.join('\n').length + entry.length > maxLength) break;
      lines.push(entry);
    }

    return lines.join('\n');
  },
};
