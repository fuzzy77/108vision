/**
 * @aia/integrations — Shared types for external service integrations.
 */

// ---------------------------------------------------------------------------
// Email Account Configuration
// ---------------------------------------------------------------------------

export interface EmailAccount {
  id: string;
  tenantId: string;
  provider: 'imap' | 'microsoft' | 'google';
  email: string;
  config: ImapConfig | MicrosoftConfig;
  status: 'active' | 'error' | 'disconnected';
  lastSync: Date | null;
}

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string; // encrypted at rest
  smtpHost?: string;
  smtpPort?: number;
}

export interface MicrosoftConfig {
  clientId: string;
  tenantId: string; // Azure AD tenant
  clientSecret: string;
  refreshToken: string;
  scopes: string[];
}

// ---------------------------------------------------------------------------
// Email Message Types
// ---------------------------------------------------------------------------

export interface EmailAddress {
  name: string;
  address: string;
}

export interface EmailMessage {
  id: string;
  messageId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  subject: string;
  body: string; // plain text extracted
  htmlBody?: string;
  date: Date;
  isRead: boolean;
  hasAttachments: boolean;
  folder: string;
  threadId?: string;
}

export interface EmailSearchOptions {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  since?: Date;
  before?: Date;
  folder?: string;
  limit?: number;
  unreadOnly?: boolean;
}

export interface EmailDraft {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  replyTo?: string; // messageId to reply to
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

// ---------------------------------------------------------------------------
// Email Folder
// ---------------------------------------------------------------------------

export interface EmailFolder {
  name: string;
  path: string;
  delimiter: string;
  totalMessages: number;
  unreadMessages: number;
  specialUse?: string; // e.g., '\\Inbox', '\\Sent', '\\Drafts', '\\Trash'
}

// ---------------------------------------------------------------------------
// Provider Interface
// ---------------------------------------------------------------------------

export interface EmailProvider {
  fetchMessages(options: EmailSearchOptions): Promise<EmailMessage[]>;
  getMessage(messageId: string): Promise<EmailMessage | null>;
  searchMessages(options: EmailSearchOptions): Promise<EmailMessage[]>;
  listFolders(): Promise<EmailFolder[]>;
  sendEmail(draft: EmailDraft): Promise<{ messageId: string }>;
  markAsRead(messageId: string, folder: string): Promise<void>;
  moveMessage(messageId: string, sourceFolder: string, targetFolder: string): Promise<void>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
}

// ---------------------------------------------------------------------------
// Integration Config (generic)
// ---------------------------------------------------------------------------

export interface IntegrationConfig {
  id: string;
  tenantId: string;
  type: string;
  name: string;
  configEncrypted: string;
  status: 'active' | 'error' | 'disconnected';
  createdAt: Date;
}
