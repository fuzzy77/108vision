/**
 * Microsoft Graph Email Provider.
 *
 * Uses @azure/msal-node for OAuth2 token management and the Microsoft Graph
 * REST API for email operations (read, send, search, folders).
 *
 * Tokens are automatically refreshed when expired using the stored refresh token.
 */

import { ConfidentialClientApplication } from '@azure/msal-node';
import type {
  MicrosoftConfig,
  EmailMessage,
  EmailSearchOptions,
  EmailDraft,
  EmailFolder,
  EmailProvider,
  EmailAddress,
} from '../types.js';

// ---------------------------------------------------------------------------
// Microsoft Graph raw response types
// ---------------------------------------------------------------------------

interface GraphRecipient {
  emailAddress: { name: string; address: string };
}

interface GraphMessage {
  id: string;
  internetMessageId: string;
  subject: string;
  from: GraphRecipient | null;
  toRecipients: GraphRecipient[];
  ccRecipients: GraphRecipient[];
  receivedDateTime: string;
  sentDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  bodyPreview: string;
  body: { contentType: string; content: string };
  parentFolderId: string;
  conversationId: string;
}

interface GraphFolder {
  id: string;
  displayName: string;
  parentFolderId: string | null;
  childFolderCount: number;
  totalItemCount: number;
  unreadItemCount: number;
}

interface GraphPageResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

// ---------------------------------------------------------------------------
// HTML text extraction (lightweight, no DOM needed)
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export class MicrosoftProvider implements EmailProvider {
  private config: MicrosoftConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: MicrosoftConfig) {
    this.config = config;
  }

  /**
   * Build a ConfidentialClientApplication for token management.
   */
  private buildMsalApp(): ConfidentialClientApplication {
    return new ConfidentialClientApplication({
      auth: {
        clientId: this.config.clientId,
        authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
        clientSecret: this.config.clientSecret,
      },
    });
  }

  /**
   * Get a valid access token, refreshing if expired.
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && this.tokenExpiresAt > Date.now() + 60_000) {
      return this.accessToken;
    }

    const msalApp = this.buildMsalApp();

    const result = await msalApp.acquireTokenByRefreshToken({
      refreshToken: this.config.refreshToken,
      scopes: this.config.scopes.length > 0
        ? this.config.scopes
        : ['https://graph.microsoft.com/Mail.ReadWrite', 'https://graph.microsoft.com/Mail.Send'],
    });

    if (!result?.accessToken) {
      throw new Error('Microsoft Graph: failed to acquire access token via refresh token');
    }

    this.accessToken = result.accessToken;
    this.tokenExpiresAt = result.expiresOn?.getTime() ?? (Date.now() + 3600_000);
    return this.accessToken;
  }

  /**
   * Make a request to Microsoft Graph API.
   */
  private async graphRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getAccessToken();
    const url = path.startsWith('http') ? path : `https://graph.microsoft.com/v1.0${path}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Graph API error ${response.status}: ${errorBody}`);
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Convert a Graph message to our EmailMessage type.
   */
  private normalizeMessage(raw: GraphMessage, folder?: string): EmailMessage {
    const from: EmailAddress = raw.from
      ? { name: raw.from.emailAddress.name, address: raw.from.emailAddress.address }
      : { name: '', address: '' };

    const to: EmailAddress[] = raw.toRecipients.map(r => ({
      name: r.emailAddress.name,
      address: r.emailAddress.address,
    }));

    const cc: EmailAddress[] = raw.ccRecipients.map(r => ({
      name: r.emailAddress.name,
      address: r.emailAddress.address,
    }));

    const isHtml = raw.body.contentType === 'html';
    const body = isHtml ? stripHtml(raw.body.content) : raw.body.content;
    const htmlBody = isHtml ? raw.body.content : undefined;

    return {
      id: raw.id,
      messageId: raw.internetMessageId ?? raw.id,
      from,
      to,
      cc: cc.length > 0 ? cc : undefined,
      subject: raw.subject ?? '(no subject)',
      body,
      htmlBody,
      date: new Date(raw.receivedDateTime),
      isRead: raw.isRead,
      hasAttachments: raw.hasAttachments,
      folder: folder ?? raw.parentFolderId,
      threadId: raw.conversationId ?? undefined,
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.graphRequest<{ id: string }>('GET', '/me?$select=id');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  async listFolders(): Promise<EmailFolder[]> {
    const response = await this.graphRequest<GraphPageResponse<GraphFolder>>(
      'GET',
      '/me/mailFolders?$top=100&$select=id,displayName,parentFolderId,childFolderCount,totalItemCount,unreadItemCount'
    );

    return response.value.map(f => ({
      name: f.displayName,
      path: f.id,
      delimiter: '/',
      totalMessages: f.totalItemCount,
      unreadMessages: f.unreadItemCount,
      specialUse: this.mapSpecialUse(f.displayName),
    }));
  }

  private mapSpecialUse(displayName: string): string | undefined {
    const map: Record<string, string> = {
      'Inbox': '\\Inbox',
      'Sent Items': '\\Sent',
      'Drafts': '\\Drafts',
      'Deleted Items': '\\Trash',
      'Junk Email': '\\Junk',
      'Archive': '\\Archive',
    };
    return map[displayName];
  }

  async fetchMessages(options: EmailSearchOptions = {}): Promise<EmailMessage[]> {
    const limit = options.limit ?? 20;
    const folder = options.folder ?? 'inbox';

    let path = `/me/mailFolders/${folder}/messages`;
    const params = new URLSearchParams();
    params.set('$top', String(Math.min(limit, 50)));
    params.set('$orderby', 'receivedDateTime desc');
    params.set('$select', 'id,internetMessageId,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,isRead,hasAttachments,bodyPreview,body,parentFolderId,conversationId');

    const filters = this.buildFilters(options);
    if (filters.length > 0) {
      params.set('$filter', filters.join(' and '));
    }

    path += '?' + params.toString();

    const response = await this.graphRequest<GraphPageResponse<GraphMessage>>('GET', path);
    return response.value.map(m => this.normalizeMessage(m, folder));
  }

  async getMessage(messageId: string): Promise<EmailMessage | null> {
    try {
      const raw = await this.graphRequest<GraphMessage>(
        'GET',
        `/me/messages/${messageId}?$select=id,internetMessageId,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,isRead,hasAttachments,body,parentFolderId,conversationId`
      );
      return this.normalizeMessage(raw);
    } catch {
      return null;
    }
  }

  async searchMessages(options: EmailSearchOptions): Promise<EmailMessage[]> {
    const limit = options.limit ?? 20;

    let path = '/me/messages';
    const params = new URLSearchParams();
    params.set('$top', String(Math.min(limit, 50)));
    params.set('$orderby', 'receivedDateTime desc');
    params.set('$select', 'id,internetMessageId,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,isRead,hasAttachments,bodyPreview,body,parentFolderId,conversationId');

    // Use $search for full-text queries, $filter for structured filters
    if (options.query) {
      params.set('$search', `"${options.query.replace(/"/g, '\\"')}"`);
    }

    const filters = this.buildFilters(options);
    if (filters.length > 0) {
      params.set('$filter', filters.join(' and '));
    }

    path += '?' + params.toString();

    const response = await this.graphRequest<GraphPageResponse<GraphMessage>>('GET', path);
    return response.value.map(m => this.normalizeMessage(m));
  }

  async markAsRead(messageId: string, _folder: string): Promise<void> {
    await this.graphRequest('PATCH', `/me/messages/${messageId}`, {
      isRead: true,
    });
  }

  async moveMessage(messageId: string, _sourceFolder: string, targetFolder: string): Promise<void> {
    await this.graphRequest('POST', `/me/messages/${messageId}/move`, {
      destinationId: targetFolder,
    });
  }

  async sendEmail(draft: EmailDraft): Promise<{ messageId: string }> {
    const message: Record<string, unknown> = {
      subject: draft.subject,
      body: {
        contentType: draft.htmlBody ? 'HTML' : 'Text',
        content: draft.htmlBody ?? draft.body,
      },
      toRecipients: draft.to.map(addr => ({
        emailAddress: { address: addr },
      })),
    };

    if (draft.cc && draft.cc.length > 0) {
      message['ccRecipients'] = draft.cc.map(addr => ({
        emailAddress: { address: addr },
      }));
    }

    await this.graphRequest('POST', '/me/sendMail', {
      message,
      saveToSentItems: true,
    });

    return { messageId: `graph-${Date.now()}` };
  }

  /**
   * Reply to an existing message.
   */
  async replyToMessage(messageId: string, body: string, htmlBody?: string): Promise<void> {
    await this.graphRequest('POST', `/me/messages/${messageId}/reply`, {
      comment: htmlBody ?? body,
    });
  }

  /**
   * Generate the OAuth2 authorization URL for user consent.
   */
  static getAuthUrl(config: { clientId: string; tenantId: string; redirectUri: string; scopes?: string[] }): string {
    const scopes = config.scopes ?? [
      'https://graph.microsoft.com/Mail.ReadWrite',
      'https://graph.microsoft.com/Mail.Send',
      'offline_access',
    ];

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: scopes.join(' '),
      response_mode: 'query',
    });

    return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens.
   */
  static async handleCallback(params: {
    code: string;
    clientId: string;
    clientSecret: string;
    tenantId: string;
    redirectUri: string;
    scopes?: string[];
  }): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const body = new URLSearchParams({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
      grant_type: 'authorization_code',
      scope: (params.scopes ?? [
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/Mail.Send',
        'offline_access',
      ]).join(' '),
    });

    const response = await fetch(
      `https://login.microsoftonline.com/${params.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      }
    );

    const data = await response.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!data.access_token || !data.refresh_token) {
      throw new Error(
        `Microsoft OAuth callback failed: ${data.error ?? 'unknown'} - ${data.error_description ?? 'no details'}`
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in ?? 3600,
    };
  }

  /**
   * Build OData $filter clauses from search options.
   */
  private buildFilters(options: EmailSearchOptions): string[] {
    const filters: string[] = [];

    if (options.unreadOnly) {
      filters.push('isRead eq false');
    }
    if (options.since) {
      filters.push(`receivedDateTime ge ${options.since.toISOString()}`);
    }
    if (options.before) {
      filters.push(`receivedDateTime lt ${options.before.toISOString()}`);
    }
    if (options.from) {
      filters.push(`from/emailAddress/address eq '${options.from.replace(/'/g, "''")}'`);
    }

    return filters;
  }
}
