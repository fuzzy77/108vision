/**
 * IMAP Email Provider — Full IMAP client using imapflow + nodemailer for sending.
 *
 * Connections are short-lived: connect -> operation -> disconnect.
 * Handles Italian providers (Aruba, Register.it, PEC) + generic IMAP.
 */

import { ImapFlow, type ImapFlowOptions } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { createTransport, type Transporter } from 'nodemailer';
import { parse as parseHtml } from 'node-html-parser';
import type {
  ImapConfig,
  EmailMessage,
  EmailSearchOptions,
  EmailDraft,
  EmailFolder,
  EmailProvider,
  EmailAddress,
} from '../types.js';

/**
 * Well-known Italian provider SMTP defaults.
 * Allows auto-configuration when smtpHost/smtpPort are not explicitly set.
 */
const SMTP_DEFAULTS: Record<string, { host: string; port: number }> = {
  'imaps.aruba.it': { host: 'smtps.aruba.it', port: 465 },
  'imap.aruba.it': { host: 'smtp.aruba.it', port: 587 },
  'imaps.pec.aruba.it': { host: 'smtps.pec.aruba.it', port: 465 },
  'mail.register.it': { host: 'authsmtp.register.it', port: 465 },
  'imap.legalmail.infocert.it': { host: 'sendm.legalmail.infocert.it', port: 465 },
};

export class ImapProvider implements EmailProvider {
  private config: ImapConfig;

  constructor(config: ImapConfig) {
    this.config = config;
  }

  /**
   * Create and connect an ImapFlow client.
   * Returns the connected client; caller MUST close it after use.
   */
  private async createClient(): Promise<ImapFlow> {
    const options: ImapFlowOptions = {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
      logger: false,
      // Timeouts to avoid hanging connections
      greetingTimeout: 10000,
      socketTimeout: 30000,
    };

    const client = new ImapFlow(options);
    await client.connect();
    return client;
  }

  /**
   * Create a nodemailer transport for sending.
   */
  private createSmtpTransport(): Transporter {
    const smtpHost = this.config.smtpHost ?? this.inferSmtpHost();
    const smtpPort = this.config.smtpPort ?? this.inferSmtpPort();

    return createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
      tls: {
        rejectUnauthorized: true,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
    });
  }

  private inferSmtpHost(): string {
    const defaults = SMTP_DEFAULTS[this.config.host];
    if (defaults) return defaults.host;
    // Generic fallback: replace 'imap' with 'smtp' in host
    return this.config.host.replace(/^imaps?\./, 'smtp.');
  }

  private inferSmtpPort(): number {
    const defaults = SMTP_DEFAULTS[this.config.host];
    if (defaults) return defaults.port;
    return 465; // default to SMTPS
  }

  /**
   * Extract plain text from HTML body.
   */
  private extractTextFromHtml(html: string): string {
    const root = parseHtml(html);
    return root.textContent.replace(/\s+/g, ' ').trim();
  }

  /**
   * Convert a parsed mail message to our EmailMessage type.
   */
  private parsedMailToMessage(parsed: ParsedMail, uid: string, folder: string, flags: Set<string>): EmailMessage {
    const fromAddr: EmailAddress = parsed.from?.value?.[0]
      ? { name: parsed.from.value[0].name ?? '', address: parsed.from.value[0].address ?? '' }
      : { name: '', address: '' };

    const toAddrs: EmailAddress[] = (parsed.to ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]) : [])
      .flatMap(addr => addr.value.map(v => ({ name: v.name ?? '', address: v.address ?? '' })));

    const ccAddrs: EmailAddress[] = (parsed.cc ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc]) : [])
      .flatMap(addr => addr.value.map(v => ({ name: v.name ?? '', address: v.address ?? '' })));

    const body = parsed.text ?? (parsed.html ? this.extractTextFromHtml(parsed.html) : '');

    return {
      id: uid,
      messageId: parsed.messageId ?? uid,
      from: fromAddr,
      to: toAddrs,
      cc: ccAddrs.length > 0 ? ccAddrs : undefined,
      subject: parsed.subject ?? '(no subject)',
      body,
      htmlBody: parsed.html !== false ? (parsed.html ?? undefined) : undefined,
      date: parsed.date ?? new Date(),
      isRead: flags.has('\\Seen'),
      hasAttachments: (parsed.attachments?.length ?? 0) > 0,
      folder,
      threadId: parsed.inReplyTo ?? undefined,
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    let client: ImapFlow | null = null;
    try {
      client = await this.createClient();
      await client.logout();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    } finally {
      if (client) {
        try { await client.logout(); } catch { /* already closed */ }
      }
    }
  }

  async listFolders(): Promise<EmailFolder[]> {
    let client: ImapFlow | null = null;
    try {
      client = await this.createClient();
      const mailboxes = await client.list();

      const folders: EmailFolder[] = [];
      for (const mb of mailboxes) {
        let totalMessages = 0;
        let unreadMessages = 0;

        try {
          const status = await client.status(mb.path, { messages: true, unseen: true });
          totalMessages = status.messages ?? 0;
          unreadMessages = status.unseen ?? 0;
        } catch {
          // Some folders may not support status queries
        }

        folders.push({
          name: mb.name,
          path: mb.path,
          delimiter: mb.delimiter ?? '/',
          totalMessages,
          unreadMessages,
          specialUse: mb.specialUse ?? undefined,
        });
      }

      await client.logout();
      return folders;
    } finally {
      if (client) {
        try { await client.logout(); } catch { /* ignore */ }
      }
    }
  }

  async fetchMessages(options: EmailSearchOptions = {}): Promise<EmailMessage[]> {
    let client: ImapFlow | null = null;
    try {
      client = await this.createClient();
      const folder = options.folder ?? 'INBOX';
      const limit = options.limit ?? 20;

      const lock = await client.getMailboxLock(folder);
      try {
        const messages: EmailMessage[] = [];
        let count = 0;

        // Fetch most recent messages first
        const totalMessages = client.mailbox?.exists ?? 0;
        if (totalMessages === 0) return [];

        const startSeq = Math.max(1, totalMessages - limit + 1);
        const range = `${startSeq}:*`;

        for await (const msg of client.fetch(range, {
          envelope: true,
          source: true,
          flags: true,
          uid: true,
        })) {
          if (count >= limit) break;

          const parsed = await simpleParser(msg.source);
          const flags = msg.flags ?? new Set<string>();

          // Apply filters
          if (options.unreadOnly && flags.has('\\Seen')) continue;
          if (options.since && parsed.date && parsed.date < options.since) continue;
          if (options.before && parsed.date && parsed.date > options.before) continue;
          if (options.from && !parsed.from?.text?.toLowerCase().includes(options.from.toLowerCase())) continue;
          if (options.subject && !parsed.subject?.toLowerCase().includes(options.subject.toLowerCase())) continue;

          messages.push(this.parsedMailToMessage(parsed, String(msg.uid), folder, flags));
          count++;
        }

        // Sort by date descending (most recent first)
        messages.sort((a, b) => b.date.getTime() - a.date.getTime());
        return messages.slice(0, limit);
      } finally {
        lock.release();
      }
    } finally {
      if (client) {
        try { await client.logout(); } catch { /* ignore */ }
      }
    }
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    let client: ImapFlow | null = null;
    try {
      client = await this.createClient();

      // Search across INBOX by default — messageId is a UID
      const lock = await client.getMailboxLock('INBOX');
      try {
        const msg = await client.fetchOne(messageId, {
          source: true,
          flags: true,
          uid: true,
        }, { uid: true });

        if (!msg) return null;

        const parsed = await simpleParser(msg.source);
        const flags = msg.flags ?? new Set<string>();
        return this.parsedMailToMessage(parsed, String(msg.uid), 'INBOX', flags);
      } finally {
        lock.release();
      }
    } finally {
      if (client) {
        try { await client.logout(); } catch { /* ignore */ }
      }
    }
  }

  async searchMessages(options: EmailSearchOptions): Promise<EmailMessage[]> {
    let client: ImapFlow | null = null;
    try {
      client = await this.createClient();
      const folder = options.folder ?? 'INBOX';
      const limit = options.limit ?? 20;

      const lock = await client.getMailboxLock(folder);
      try {
        // Build IMAP search criteria
        const searchCriteria: Record<string, unknown> = {};

        if (options.unreadOnly) searchCriteria['seen'] = false;
        if (options.since) searchCriteria['since'] = options.since;
        if (options.before) searchCriteria['before'] = options.before;
        if (options.from) searchCriteria['from'] = options.from;
        if (options.to) searchCriteria['to'] = options.to;
        if (options.subject) searchCriteria['subject'] = options.subject;
        if (options.query) {
          // Use BODY search for general text queries
          searchCriteria['body'] = options.query;
        }

        const uids = await client.search(searchCriteria, { uid: true });
        if (uids.length === 0) return [];

        // Take only the most recent UIDs (highest UID = most recent)
        const recentUids = uids.slice(-limit).reverse();
        const messages: EmailMessage[] = [];

        for await (const msg of client.fetch(recentUids, {
          source: true,
          flags: true,
          uid: true,
        }, { uid: true })) {
          const parsed = await simpleParser(msg.source);
          const flags = msg.flags ?? new Set<string>();
          messages.push(this.parsedMailToMessage(parsed, String(msg.uid), folder, flags));
        }

        messages.sort((a, b) => b.date.getTime() - a.date.getTime());
        return messages;
      } finally {
        lock.release();
      }
    } finally {
      if (client) {
        try { await client.logout(); } catch { /* ignore */ }
      }
    }
  }

  async markAsRead(messageId: string, folder: string): Promise<void> {
    let client: ImapFlow | null = null;
    try {
      client = await this.createClient();
      const lock = await client.getMailboxLock(folder);
      try {
        await client.messageFlagsAdd(messageId, ['\\Seen'], { uid: true });
      } finally {
        lock.release();
      }
    } finally {
      if (client) {
        try { await client.logout(); } catch { /* ignore */ }
      }
    }
  }

  async moveMessage(messageId: string, sourceFolder: string, targetFolder: string): Promise<void> {
    let client: ImapFlow | null = null;
    try {
      client = await this.createClient();
      const lock = await client.getMailboxLock(sourceFolder);
      try {
        await client.messageMove(messageId, targetFolder, { uid: true });
      } finally {
        lock.release();
      }
    } finally {
      if (client) {
        try { await client.logout(); } catch { /* ignore */ }
      }
    }
  }

  async sendEmail(draft: EmailDraft): Promise<{ messageId: string }> {
    const transport = this.createSmtpTransport();

    try {
      const info = await transport.sendMail({
        from: this.config.username,
        to: draft.to.join(', '),
        cc: draft.cc?.join(', '),
        subject: draft.subject,
        text: draft.body,
        html: draft.htmlBody,
        inReplyTo: draft.replyTo,
        attachments: draft.attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });

      return { messageId: info.messageId ?? '' };
    } finally {
      transport.close();
    }
  }
}
