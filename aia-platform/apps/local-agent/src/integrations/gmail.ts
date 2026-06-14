/**
 * Gmail API adapter for the 108 AI Desktop Agent.
 *
 * Uses the Gmail REST API v1 with an OAuth2 access token obtained from google-auth.ts.
 * No external dependencies — native fetch and Buffer only.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string; // "Name <email>"
  to: string;
  subject: string;
  date: string; // ISO string
  snippet: string; // short preview
  body: string; // plain text body (decoded)
  labels: string[];
  isUnread: boolean;
  hasAttachments: boolean;
}

export interface GmailThread {
  id: string;
  subject: string;
  messageCount: number;
  lastMessage: GmailMessage;
  participants: string[];
}

export interface GmailSearchResult {
  messages: GmailMessage[];
  total: number;
  nextPageToken?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyToMessageId?: string; // for replies
  threadId?: string;         // to keep in same thread
}

// ---------------------------------------------------------------------------
// Internal types matching the Gmail REST API v1 wire format
// ---------------------------------------------------------------------------

interface GmailApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

interface MessageListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  resultSizeEstimate?: number;
  nextPageToken?: string;
}

interface MessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: {
    data?: string;
    size?: number;
    attachmentId?: string;
  };
  parts?: MessagePart[];
}

interface MessageResource {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: MessagePart;
  internalDate?: string;
}

interface MetadataMessageResource {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    parts?: MessagePart[];
  };
  internalDate?: string;
}

interface LabelResource {
  id: string;
  name: string;
  type: string;
}

interface LabelsListResponse {
  labels?: LabelResource[];
}

interface SendMessageResponse {
  id: string;
  threadId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Execute a Gmail API request and surface meaningful errors.
 * - 401 → token expired
 * - 429 → rate limited
 * - 404 → resource not found
 */
async function gmailFetch<T>(
  accessToken: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(accessToken),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (res.ok) {
    // Some operations (modify, trash) return 200 with an empty or partial body.
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  let apiError: GmailApiError | null = null;
  try {
    apiError = (await res.json()) as GmailApiError;
  } catch {
    // ignore parse failure
  }

  const message = apiError?.error?.message ?? res.statusText;

  if (res.status === 401) {
    throw new GmailAuthError(`Access token expired or invalid: ${message}`);
  }
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    throw new GmailRateLimitError(
      `Gmail API rate limit exceeded: ${message}`,
      retryAfter ? parseInt(retryAfter, 10) : undefined,
    );
  }
  if (res.status === 404) {
    throw new GmailNotFoundError(`Resource not found: ${message}`);
  }

  throw new GmailApiRequestError(
    `Gmail API error ${res.status}: ${message}`,
    res.status,
  );
}

// ---------------------------------------------------------------------------
// Custom error classes
// ---------------------------------------------------------------------------

export class GmailAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailAuthError';
  }
}

export class GmailRateLimitError extends Error {
  readonly retryAfterSeconds?: number;
  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'GmailRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class GmailNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailNotFoundError';
  }
}

export class GmailApiRequestError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'GmailApiRequestError';
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Base64url helpers (Gmail uses base64url, not standard base64)
// ---------------------------------------------------------------------------

function base64urlDecode(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf-8');
}

function base64urlEncode(raw: string): string {
  return Buffer.from(raw).toString('base64url');
}

// ---------------------------------------------------------------------------
// Message parsing helpers
// ---------------------------------------------------------------------------

function getHeader(
  headers: Array<{ name: string; value: string }> | undefined,
  name: string,
): string {
  if (!headers) return '';
  const lc = name.toLowerCase();
  return headers.find((h) => h.name.toLowerCase() === lc)?.value ?? '';
}

/**
 * Recursively walk a MIME part tree and extract the first text/plain body.
 * Returns empty string if not found.
 */
function extractPlainText(part: MessagePart | undefined): string {
  if (!part) return '';

  // Leaf part with text/plain data
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return base64urlDecode(part.body.data);
  }

  // Prefer text/plain over text/html in multipart — walk children
  if (part.parts && part.parts.length > 0) {
    // First pass: look for an explicit text/plain child
    for (const child of part.parts) {
      if (child.mimeType === 'text/plain') {
        const text = extractPlainText(child);
        if (text) return text;
      }
    }
    // Second pass: recurse into any multipart child
    for (const child of part.parts) {
      if (child.mimeType?.startsWith('multipart/')) {
        const text = extractPlainText(child);
        if (text) return text;
      }
    }
  }

  return '';
}

/**
 * Return true if the part tree contains at least one attachment
 * (a part with a non-empty filename).
 */
function hasAttachmentParts(part: MessagePart | undefined): boolean {
  if (!part) return false;
  if (part.filename && part.filename.length > 0) return true;
  if (part.parts) {
    return part.parts.some((p) => hasAttachmentParts(p));
  }
  return false;
}

/**
 * Convert a raw MessageResource (format=full) to our public GmailMessage shape.
 */
function toGmailMessage(raw: MessageResource): GmailMessage {
  const headers = raw.payload?.headers ?? [];
  const dateHeader = getHeader(headers, 'Date');

  let parsedDate: string;
  try {
    parsedDate = dateHeader ? new Date(dateHeader).toISOString() : new Date(Number(raw.internalDate)).toISOString();
  } catch {
    parsedDate = raw.internalDate ? new Date(Number(raw.internalDate)).toISOString() : new Date().toISOString();
  }

  const labels = raw.labelIds ?? [];

  return {
    id: raw.id,
    threadId: raw.threadId,
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    subject: getHeader(headers, 'Subject'),
    date: parsedDate,
    snippet: raw.snippet ?? '',
    body: extractPlainText(raw.payload),
    labels,
    isUnread: labels.includes('UNREAD'),
    hasAttachments: hasAttachmentParts(raw.payload),
  };
}

/**
 * Build a lightweight GmailMessage from a metadata-format response.
 * Body will be empty — use getMessage() for the full body.
 */
function toGmailMessageFromMetadata(raw: MetadataMessageResource): GmailMessage {
  const headers = raw.payload?.headers ?? [];
  const dateHeader = getHeader(headers, 'Date');

  let parsedDate: string;
  try {
    parsedDate = dateHeader ? new Date(dateHeader).toISOString() : new Date(Number(raw.internalDate)).toISOString();
  } catch {
    parsedDate = raw.internalDate ? new Date(Number(raw.internalDate)).toISOString() : new Date().toISOString();
  }

  const labels = raw.labelIds ?? [];

  return {
    id: raw.id,
    threadId: raw.threadId,
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    subject: getHeader(headers, 'Subject'),
    date: parsedDate,
    snippet: raw.snippet ?? '',
    body: '',
    labels,
    isUnread: labels.includes('UNREAD'),
    hasAttachments: false,
  };
}

// ---------------------------------------------------------------------------
// RFC 2822 message builder
// ---------------------------------------------------------------------------

interface RawMessageOptions {
  from?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}

/**
 * Build a base64url-encoded RFC 2822 message ready for the Gmail send API.
 */
function buildRawMessage(opts: RawMessageOptions): string {
  const lines: string[] = [];

  if (opts.from) lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to}`);
  if (opts.cc) lines.push(`Cc: ${opts.cc}`);
  if (opts.bcc) lines.push(`Bcc: ${opts.bcc}`);
  lines.push(`Subject: ${opts.subject}`);
  lines.push('Content-Type: text/plain; charset=utf-8');
  lines.push('MIME-Version: 1.0');
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push('');
  lines.push(opts.body);

  return base64urlEncode(lines.join('\r\n'));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List messages matching a query, returning rich metadata.
 * For performance, fetches ID + metadata headers in one pass (no full-body fetch).
 * Use getMessage() to get the full body of a specific message.
 */
export async function listMessages(
  accessToken: string,
  options?: {
    query?: string;
    maxResults?: number;
    labelIds?: string[];
    pageToken?: string;
  },
): Promise<GmailSearchResult> {
  const params = new URLSearchParams();
  if (options?.query) params.set('q', options.query);
  params.set('maxResults', String(options?.maxResults ?? 10));
  if (options?.labelIds?.length) {
    for (const label of options.labelIds) {
      params.append('labelIds', label);
    }
  }
  if (options?.pageToken) params.set('pageToken', options.pageToken);

  const listUrl = `${BASE_URL}/messages?${params.toString()}`;
  const listResult = await gmailFetch<MessageListResponse>(accessToken, listUrl);

  const ids = listResult.messages ?? [];
  if (ids.length === 0) {
    return { messages: [], total: listResult.resultSizeEstimate ?? 0 };
  }

  // Fetch metadata (headers + snippet) for each message in parallel
  const metadataMessages = await Promise.all(
    ids.map(({ id }) => {
      const metaParams = new URLSearchParams({
        format: 'metadata',
        metadataHeaders: 'From',
      });
      metaParams.append('metadataHeaders', 'To');
      metaParams.append('metadataHeaders', 'Subject');
      metaParams.append('metadataHeaders', 'Date');
      return gmailFetch<MetadataMessageResource>(
        accessToken,
        `${BASE_URL}/messages/${id}?${metaParams.toString()}`,
      );
    }),
  );

  return {
    messages: metadataMessages.map(toGmailMessageFromMetadata),
    total: listResult.resultSizeEstimate ?? ids.length,
    nextPageToken: listResult.nextPageToken,
  };
}

/**
 * Fetch a single message with its full body decoded.
 */
export async function getMessage(
  accessToken: string,
  messageId: string,
): Promise<GmailMessage> {
  const raw = await gmailFetch<MessageResource>(
    accessToken,
    `${BASE_URL}/messages/${messageId}?format=full`,
  );
  return toGmailMessage(raw);
}

/**
 * Return the number of unread messages in the inbox.
 */
export async function getUnreadCount(accessToken: string): Promise<number> {
  const params = new URLSearchParams({
    q: 'is:unread in:inbox',
    maxResults: '1',
  });
  const result = await gmailFetch<MessageListResponse>(
    accessToken,
    `${BASE_URL}/messages?${params.toString()}`,
  );
  return result.resultSizeEstimate ?? 0;
}

/**
 * Search messages using a Gmail search query string.
 */
export async function searchMessages(
  accessToken: string,
  query: string,
  maxResults = 10,
): Promise<GmailSearchResult> {
  return listMessages(accessToken, { query, maxResults });
}

/**
 * Send a new email.
 */
export async function sendEmail(
  accessToken: string,
  params: SendEmailParams,
): Promise<{ id: string; threadId: string }> {
  const raw = buildRawMessage({
    to: params.to,
    cc: params.cc,
    bcc: params.bcc,
    subject: params.subject,
    body: params.body,
    threadId: params.threadId,
  });

  const body: Record<string, string> = { raw };
  if (params.threadId) body['threadId'] = params.threadId;

  return gmailFetch<SendMessageResponse>(accessToken, `${BASE_URL}/messages/send`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Reply to an existing message, keeping the thread intact.
 */
export async function replyToMessage(
  accessToken: string,
  messageId: string,
  body: string,
): Promise<{ id: string; threadId: string }> {
  // Fetch the original message to extract thread metadata
  const original = await gmailFetch<MessageResource>(
    accessToken,
    `${BASE_URL}/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Message-ID`,
  );

  const headers = original.payload?.headers ?? [];
  const originalSubject = getHeader(headers, 'Subject');
  const originalMessageId = getHeader(headers, 'Message-ID');
  const originalFrom = getHeader(headers, 'From');

  const replySubject = originalSubject.startsWith('Re:')
    ? originalSubject
    : `Re: ${originalSubject}`;

  const raw = buildRawMessage({
    to: originalFrom,
    subject: replySubject,
    body,
    inReplyTo: originalMessageId || undefined,
    references: originalMessageId || undefined,
  });

  const requestBody: Record<string, string> = { raw, threadId: original.threadId };

  return gmailFetch<SendMessageResponse>(accessToken, `${BASE_URL}/messages/send`, {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

/**
 * Mark a message as read (remove the UNREAD label).
 */
export async function markAsRead(
  accessToken: string,
  messageId: string,
): Promise<void> {
  await gmailFetch<unknown>(accessToken, `${BASE_URL}/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  });
}

/**
 * Mark a message as unread (add the UNREAD label).
 */
export async function markAsUnread(
  accessToken: string,
  messageId: string,
): Promise<void> {
  await gmailFetch<unknown>(accessToken, `${BASE_URL}/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({ addLabelIds: ['UNREAD'] }),
  });
}

/**
 * Add a label to a message.
 */
export async function addLabel(
  accessToken: string,
  messageId: string,
  labelId: string,
): Promise<void> {
  await gmailFetch<unknown>(accessToken, `${BASE_URL}/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({ addLabelIds: [labelId] }),
  });
}

/**
 * Remove a label from a message.
 */
export async function removeLabel(
  accessToken: string,
  messageId: string,
  labelId: string,
): Promise<void> {
  await gmailFetch<unknown>(accessToken, `${BASE_URL}/messages/${messageId}/modify`, {
    method: 'POST',
    body: JSON.stringify({ removeLabelIds: [labelId] }),
  });
}

/**
 * List all labels in the authenticated user's mailbox.
 */
export async function listLabels(
  accessToken: string,
): Promise<Array<{ id: string; name: string; type: string }>> {
  const result = await gmailFetch<LabelsListResponse>(
    accessToken,
    `${BASE_URL}/labels`,
  );
  return (result.labels ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    type: l.type,
  }));
}

/**
 * Move a message to Trash.
 */
export async function trashMessage(
  accessToken: string,
  messageId: string,
): Promise<void> {
  await gmailFetch<unknown>(accessToken, `${BASE_URL}/messages/${messageId}/trash`, {
    method: 'POST',
  });
}

/**
 * Restore a message from Trash.
 */
export async function untrashMessage(
  accessToken: string,
  messageId: string,
): Promise<void> {
  await gmailFetch<unknown>(accessToken, `${BASE_URL}/messages/${messageId}/untrash`, {
    method: 'POST',
  });
}
