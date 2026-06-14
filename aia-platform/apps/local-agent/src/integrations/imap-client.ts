/**
 * IMAP + SMTP Client — 108 AI Desktop Agent
 *
 * A zero-dependency adapter for reading and sending email via IMAP/SMTP,
 * implemented as a thin wrapper around the system `curl` binary.
 *
 * curl supports the IMAP protocol via `imaps://` URLs (RFC 3501) and SMTP
 * via `smtps://`, so this module works with any standards-compliant provider
 * including Italian PEC (Posta Elettronica Certificata) services such as
 * Aruba, Legalmail, Register.it, and PosteCert.
 *
 * Prerequisites:
 *   curl must be available in the system PATH (bundled on macOS/Linux;
 *   shipped with Windows 10 build 17063+).
 *
 * Configuration is persisted at:
 *   ~/.108ai/integrations/imap.json
 *   ~/.108ai/integrations/smtp.json
 */

import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ImapConfig {
  /** IMAP hostname, e.g. "imaps.pec.aruba.it" */
  host: string;
  /** IMAP port, e.g. 993 */
  port: number;
  /** Login username / email address */
  user: string;
  /** Login password */
  password: string;
  /** Use TLS (IMAPS). Default: true */
  tls: boolean;
  /** Known provider key — enables preset host/port resolution */
  provider?: string;
}

export interface SmtpConfig {
  /** SMTP hostname, e.g. "smtps.pec.aruba.it" */
  host: string;
  /** SMTP port, e.g. 465 */
  port: number;
  /** Login username / email address */
  user: string;
  /** Login password */
  password: string;
  /** Use TLS (SMTPS). Default: true */
  tls: boolean;
}

export interface ImapMessage {
  uid: number;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  isRead: boolean;
  folder: string;
}

// ---------------------------------------------------------------------------
// PEC provider presets
// ---------------------------------------------------------------------------

export const PEC_PRESETS: Record<
  string,
  { imap: Partial<ImapConfig>; smtp: Partial<SmtpConfig> }
> = {
  'aruba-pec': {
    imap: { host: 'imaps.pec.aruba.it', port: 993, tls: true },
    smtp: { host: 'smtps.pec.aruba.it', port: 465, tls: true },
  },
  legalmail: {
    imap: { host: 'mbox.cert.legalmail.it', port: 993, tls: true },
    smtp: { host: 'sendm.cert.legalmail.it', port: 465, tls: true },
  },
  register: {
    imap: { host: 'imaps.pec.register.it', port: 993, tls: true },
    smtp: { host: 'smtps.pec.register.it', port: 465, tls: true },
  },
  postecert: {
    imap: { host: 'imap.postecert.it', port: 993, tls: true },
    smtp: { host: 'smtp.postecert.it', port: 465, tls: true },
  },
};

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const CONFIG_BASE_DIR = join(homedir(), '.108ai', 'integrations');
const IMAP_CONFIG_PATH = join(CONFIG_BASE_DIR, 'imap.json');
const SMTP_CONFIG_PATH = join(CONFIG_BASE_DIR, 'smtp.json');
const CURL_TIMEOUT_SEC = 15;

// ---------------------------------------------------------------------------
// Configuration management
// ---------------------------------------------------------------------------

/**
 * Load the IMAP configuration from ~/.108ai/integrations/imap.json.
 * Returns null when the file does not exist or is malformed.
 */
export function loadImapConfig(): ImapConfig | null {
  if (!existsSync(IMAP_CONFIG_PATH)) return null;
  try {
    const raw = readFileSync(IMAP_CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as ImapConfig;
  } catch {
    return null;
  }
}

/** Persist the IMAP configuration to ~/.108ai/integrations/imap.json. */
export function saveImapConfig(config: ImapConfig): void {
  _ensureConfigDir();
  writeFileSync(IMAP_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Load the SMTP configuration from ~/.108ai/integrations/smtp.json.
 * Returns null when the file does not exist or is malformed.
 */
export function loadSmtpConfig(): SmtpConfig | null {
  if (!existsSync(SMTP_CONFIG_PATH)) return null;
  try {
    const raw = readFileSync(SMTP_CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as SmtpConfig;
  } catch {
    return null;
  }
}

/** Persist the SMTP configuration to ~/.108ai/integrations/smtp.json. */
export function saveSmtpConfig(config: SmtpConfig): void {
  _ensureConfigDir();
  writeFileSync(SMTP_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Connection test
// ---------------------------------------------------------------------------

/**
 * Verify that the IMAP credentials are accepted by the server.
 * Attempts to list the INBOX — a minimal command that requires authentication.
 */
export async function testImapConnection(
  config: ImapConfig,
): Promise<{ success: boolean; error?: string }> {
  try {
    _curlImap(config, 'INBOX', 'EXAMINE INBOX');
    return { success: true };
  } catch (err) {
    return { success: false, error: _extractCurlError(err) };
  }
}

// ---------------------------------------------------------------------------
// Folder operations
// ---------------------------------------------------------------------------

/**
 * Return the list of mailbox folders available on the server.
 * Parses the IMAP LIST response from curl.
 */
export async function listFolders(config: ImapConfig): Promise<string[]> {
  // curl with no path and no request lists the top-level mailbox hierarchy.
  const raw = _curlImapRoot(config);
  return _parseFolderList(raw);
}

// ---------------------------------------------------------------------------
// Message listing
// ---------------------------------------------------------------------------

/**
 * List messages in the specified folder.
 *
 * @param config   IMAP server credentials
 * @param options  folder (default "INBOX"), limit (default 10), unreadOnly
 */
export async function listMessages(
  config: ImapConfig,
  options?: { folder?: string; limit?: number; unreadOnly?: boolean },
): Promise<ImapMessage[]> {
  const folder = options?.folder ?? 'INBOX';
  const limit = options?.limit ?? 10;
  const unreadOnly = options?.unreadOnly ?? false;

  // Step 1: Search for UIDs matching the filter.
  const searchCmd = unreadOnly ? 'SEARCH UNSEEN' : 'SEARCH ALL';
  const searchRaw = _curlImap(config, folder, searchCmd);
  const uids = _parseSearchUids(searchRaw);

  if (uids.length === 0) return [];

  // Newest first — take the tail of the sorted UID list, then reverse.
  const sorted = [...uids].sort((a, b) => a - b);
  const selected = sorted.slice(-limit).reverse();

  // Step 2: Fetch each message header + body.
  const messages: ImapMessage[] = [];
  for (const uid of selected) {
    try {
      const msg = await getMessageByUid(config, uid, folder);
      messages.push(msg);
    } catch {
      // Skip malformed messages — do not abort the whole listing.
    }
  }

  return messages;
}

// ---------------------------------------------------------------------------
// Unread count
// ---------------------------------------------------------------------------

/**
 * Return the number of unseen messages in the specified folder (default INBOX).
 */
export async function getUnreadCount(
  config: ImapConfig,
  folder?: string,
): Promise<number> {
  const targetFolder = folder ?? 'INBOX';
  const raw = _curlImap(config, targetFolder, 'SEARCH UNSEEN');
  const uids = _parseSearchUids(raw);
  return uids.length;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Search messages by a query string.
 * The query is passed as an IMAP SEARCH TEXT criterion — it matches against
 * headers and body text.
 */
export async function searchMessages(
  config: ImapConfig,
  query: string,
  folder?: string,
): Promise<ImapMessage[]> {
  const targetFolder = folder ?? 'INBOX';
  // Escape double-quotes in the query to avoid breaking the IMAP literal.
  const safeQuery = query.replace(/"/g, '\\"');
  const searchCmd = `SEARCH TEXT "${safeQuery}"`;
  const searchRaw = _curlImap(config, targetFolder, searchCmd);
  const uids = _parseSearchUids(searchRaw);

  const messages: ImapMessage[] = [];
  for (const uid of uids.slice(0, 20)) {
    try {
      const msg = await getMessageByUid(config, uid, targetFolder);
      messages.push(msg);
    } catch {
      // Skip malformed messages.
    }
  }

  return messages;
}

// ---------------------------------------------------------------------------
// Single message fetch
// ---------------------------------------------------------------------------

/**
 * Fetch a single message by its UID.
 * curl fetches the raw RFC 2822 message; headers and body are parsed locally.
 */
export async function getMessageByUid(
  config: ImapConfig,
  uid: number,
  folder?: string,
): Promise<ImapMessage> {
  const targetFolder = folder ?? 'INBOX';
  const raw = _curlImapUid(config, targetFolder, uid);
  return _parseRawMessage(raw, uid, targetFolder);
}

// ---------------------------------------------------------------------------
// Send email
// ---------------------------------------------------------------------------

/**
 * Send an email via SMTP.
 *
 * A temporary .eml file is written to the OS temp directory, passed to curl
 * via `-T`, then deleted regardless of outcome.
 */
export async function sendEmail(
  smtpConfig: SmtpConfig,
  params: {
    from: string;
    to: string;
    subject: string;
    body: string;
    cc?: string;
  },
): Promise<boolean> {
  const emlPath = _writeTempEml(params);
  try {
    _curlSmtp(smtpConfig, params.from, params.to, params.cc ?? null, emlPath);
    return true;
  } catch {
    return false;
  } finally {
    _safeUnlink(emlPath);
  }
}

// ---------------------------------------------------------------------------
// Internal — curl wrappers
// ---------------------------------------------------------------------------

/**
 * Run a single-command IMAP request against a specific folder using the
 * `-X "<command>"` flag.
 */
function _curlImap(config: ImapConfig, folder: string, command: string): string {
  const url = _imapUrl(config, folder);
  const args = [
    'curl',
    '--silent',
    '--show-error',
    `--max-time ${CURL_TIMEOUT_SEC}`,
    config.tls ? '--ssl-reqd' : '',
    `-u ${_shellEscape(`${config.user}:${config.password}`)}`,
    `-X ${_shellEscape(command)}`,
    _shellEscape(url),
  ]
    .filter(Boolean)
    .join(' ');

  return _exec(args);
}

/**
 * List the top-level mailbox hierarchy (no folder path, no -X command).
 * curl in IMAP mode with no request defaults to LIST "" "*".
 */
function _curlImapRoot(config: ImapConfig): string {
  const url = _imapUrl(config, '');
  const args = [
    'curl',
    '--silent',
    '--show-error',
    `--max-time ${CURL_TIMEOUT_SEC}`,
    config.tls ? '--ssl-reqd' : '',
    `-u ${_shellEscape(`${config.user}:${config.password}`)}`,
    _shellEscape(url),
  ]
    .filter(Boolean)
    .join(' ');

  return _exec(args);
}

/**
 * Fetch a single message by UID.
 * curl maps `imaps://host/FOLDER;UID=N` to a FETCH of the full RFC 2822 message.
 */
function _curlImapUid(
  config: ImapConfig,
  folder: string,
  uid: number,
): string {
  const url = `${_imapUrl(config, folder)};UID=${uid}`;
  const args = [
    'curl',
    '--silent',
    '--show-error',
    `--max-time ${CURL_TIMEOUT_SEC}`,
    config.tls ? '--ssl-reqd' : '',
    `-u ${_shellEscape(`${config.user}:${config.password}`)}`,
    _shellEscape(url),
  ]
    .filter(Boolean)
    .join(' ');

  return _exec(args);
}

/**
 * Send a message file via SMTP.
 */
function _curlSmtp(
  config: SmtpConfig,
  from: string,
  to: string,
  cc: string | null,
  emlPath: string,
): void {
  const scheme = config.tls ? 'smtps' : 'smtp';
  const url = `${scheme}://${config.host}:${config.port}`;

  const rcptArgs = [
    `--mail-rcpt ${_shellEscape(to)}`,
    cc ? `--mail-rcpt ${_shellEscape(cc)}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const args = [
    'curl',
    '--silent',
    '--show-error',
    `--max-time ${CURL_TIMEOUT_SEC}`,
    config.tls ? '--ssl-reqd' : '',
    `-u ${_shellEscape(`${config.user}:${config.password}`)}`,
    `--mail-from ${_shellEscape(from)}`,
    rcptArgs,
    `-T ${_shellEscape(emlPath)}`,
    _shellEscape(url),
  ]
    .filter(Boolean)
    .join(' ');

  _exec(args);
}

// ---------------------------------------------------------------------------
// Internal — URL builders
// ---------------------------------------------------------------------------

function _imapUrl(config: ImapConfig, folder: string): string {
  const scheme = config.tls ? 'imaps' : 'imap';
  const encodedFolder = encodeURIComponent(folder);
  return folder
    ? `${scheme}://${config.host}:${config.port}/${encodedFolder}`
    : `${scheme}://${config.host}:${config.port}/`;
}

// ---------------------------------------------------------------------------
// Internal — response parsers
// ---------------------------------------------------------------------------

/**
 * Parse an IMAP LIST response into folder names.
 *
 * Each response line looks like:
 *   * LIST (\HasNoChildren) "/" "INBOX"
 *   * LIST (\HasNoChildren) "/" Sent
 */
function _parseFolderList(raw: string): string[] {
  const folders: string[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('* LIST')) continue;

    // Extract the last token (the mailbox name), which may be quoted.
    const quotedMatch = /"\s*([^"]+)\s*"\s*$/.exec(trimmed);
    if (quotedMatch?.[1]) {
      folders.push(quotedMatch[1].trim());
      continue;
    }
    // Unquoted mailbox name — the last whitespace-separated token.
    const tokens = trimmed.split(/\s+/);
    const last = tokens[tokens.length - 1];
    if (last && last !== '""') {
      folders.push(last);
    }
  }
  return folders;
}

/**
 * Parse an IMAP SEARCH response line.
 *
 * curl returns a line like:
 *   * SEARCH 1 2 5 14
 */
function _parseSearchUids(raw: string): number[] {
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('* SEARCH')) continue;
    const parts = trimmed.replace('* SEARCH', '').trim().split(/\s+/);
    return parts
      .filter((p) => /^\d+$/.test(p))
      .map(Number);
  }
  return [];
}

/**
 * Parse a raw RFC 2822 message into an ImapMessage.
 * Handles Content-Transfer-Encoding: base64 and quoted-printable for the
 * text/plain body part.
 */
function _parseRawMessage(
  raw: string,
  uid: number,
  folder: string,
): ImapMessage {
  // Split headers from body at the first blank line.
  const blankLineIdx = raw.indexOf('\r\n\r\n');
  const headerSection =
    blankLineIdx !== -1 ? raw.slice(0, blankLineIdx) : raw;
  const bodySection =
    blankLineIdx !== -1 ? raw.slice(blankLineIdx + 4) : '';

  const from = _extractHeader(headerSection, 'From') ?? '';
  const to = _extractHeader(headerSection, 'To') ?? '';
  const subject = _decodeHeaderValue(_extractHeader(headerSection, 'Subject') ?? '');
  const date = _extractHeader(headerSection, 'Date') ?? '';

  const contentType = _extractHeader(headerSection, 'Content-Type') ?? '';
  const encoding = (
    _extractHeader(headerSection, 'Content-Transfer-Encoding') ?? ''
  ).toLowerCase();

  let body: string;
  if (contentType.toLowerCase().includes('multipart')) {
    body = _extractMultipartText(headerSection, bodySection);
  } else {
    body = _decodeBody(bodySection, encoding);
  }

  return { uid, from, to, subject, date, body: body.trim(), isRead: false, folder };
}

/**
 * Extract the value of a single RFC 2822 header by name (case-insensitive).
 * Handles folded headers (continuation lines beginning with whitespace).
 */
function _extractHeader(headers: string, name: string): string | undefined {
  const pattern = new RegExp(`^${name}:\\s*(.*)`, 'im');
  const match = pattern.exec(headers);
  if (!match) return undefined;

  let value = match[1] ?? '';

  // Unfold continuation lines.
  const lines = headers.split('\n');
  const startIdx = lines.findIndex((l) => new RegExp(`^${name}:`, 'i').test(l));
  if (startIdx !== -1) {
    let i = startIdx + 1;
    while (i < lines.length) {
      const line = lines[i];
      if (line !== undefined && /^[ \t]/.test(line)) {
        value += ' ' + line.trim();
        i++;
      } else {
        break;
      }
    }
  }

  return value.trim();
}

/**
 * Decode MIME encoded-word sequences (RFC 2047) commonly used in Subject/From.
 * Handles =?UTF-8?B?...?= (base64) and =?UTF-8?Q?...?= (quoted-printable).
 */
function _decodeHeaderValue(value: string): string {
  return value.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
    (_match, _charset: string, encoding: string, encoded: string) => {
      try {
        if (encoding.toUpperCase() === 'B') {
          return Buffer.from(encoded, 'base64').toString('utf-8');
        }
        if (encoding.toUpperCase() === 'Q') {
          const qpDecoded = encoded.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (_m, hex: string) =>
            String.fromCharCode(parseInt(hex, 16)),
          );
          return qpDecoded;
        }
      } catch {
        // Fall through — return the raw encoded word.
      }
      return value;
    },
  );
}

/**
 * Decode a body part based on its Content-Transfer-Encoding.
 */
function _decodeBody(raw: string, encoding: string): string {
  const cleaned = raw.replace(/\r\n/g, '\n');
  if (encoding === 'base64') {
    try {
      return Buffer.from(cleaned.replace(/\s/g, ''), 'base64').toString('utf-8');
    } catch {
      return cleaned;
    }
  }
  if (encoding === 'quoted-printable') {
    return _decodeQuotedPrintable(cleaned);
  }
  // 7bit / 8bit / binary — return as-is.
  return cleaned;
}

/**
 * Minimal quoted-printable decoder (RFC 2045 §6.7).
 */
function _decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r?\n/g, '')                                // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_m, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

/**
 * Extract the text/plain part from a multipart MIME body.
 * Falls back to the full body string if no text/plain boundary is found.
 */
function _extractMultipartText(headers: string, body: string): string {
  const contentType = _extractHeader(headers, 'Content-Type') ?? '';

  // Extract the boundary parameter.
  const boundaryMatch = /boundary="?([^";]+)"?/i.exec(contentType);
  if (!boundaryMatch?.[1]) return body;

  const boundary = '--' + boundaryMatch[1].trim();
  const parts = body.split(boundary);

  for (const part of parts) {
    if (part.trim() === '' || part.trim() === '--') continue;

    const partBlankLine = part.indexOf('\r\n\r\n');
    if (partBlankLine === -1) continue;

    const partHeaders = part.slice(0, partBlankLine);
    const partBody = part.slice(partBlankLine + 4);
    const partContentType = _extractHeader(partHeaders, 'Content-Type') ?? '';

    if (partContentType.toLowerCase().includes('text/plain')) {
      const partEncoding = (
        _extractHeader(partHeaders, 'Content-Transfer-Encoding') ?? ''
      ).toLowerCase();
      return _decodeBody(partBody, partEncoding);
    }
  }

  // No text/plain found — strip HTML tags from the first HTML part as fallback.
  for (const part of parts) {
    const partBlankLine = part.indexOf('\r\n\r\n');
    if (partBlankLine === -1) continue;

    const partHeaders = part.slice(0, partBlankLine);
    const partBody = part.slice(partBlankLine + 4);
    const partContentType = _extractHeader(partHeaders, 'Content-Type') ?? '';

    if (partContentType.toLowerCase().includes('text/html')) {
      const partEncoding = (
        _extractHeader(partHeaders, 'Content-Transfer-Encoding') ?? ''
      ).toLowerCase();
      const html = _decodeBody(partBody, partEncoding);
      return html.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }
  }

  return body;
}

// ---------------------------------------------------------------------------
// Internal — EML file builder
// ---------------------------------------------------------------------------

/**
 * Write a minimal RFC 2822 .eml file and return its path.
 * The file is created in the OS temp directory with a random name.
 */
function _writeTempEml(params: {
  from: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
}): string {
  const tmpDir = _getTmpDir();
  const fileName = `108ai-mail-${randomBytes(8).toString('hex')}.eml`;
  const emlPath = join(tmpDir, fileName);

  const date = new Date().toUTCString();
  const encodedSubject = `=?UTF-8?B?${Buffer.from(params.subject, 'utf-8').toString('base64')}?=`;

  const lines: string[] = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    ...(params.cc ? [`Cc: ${params.cc}`] : []),
    `Subject: ${encodedSubject}`,
    `Date: ${date}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    '',
    Buffer.from(params.body, 'utf-8').toString('base64'),
  ];

  writeFileSync(emlPath, lines.join('\r\n'), 'utf-8');
  return emlPath;
}

// ---------------------------------------------------------------------------
// Internal — utility helpers
// ---------------------------------------------------------------------------

/** Shell-escape a single argument by wrapping it in single quotes (POSIX). */
function _shellEscape(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

/** Execute a shell command synchronously and return stdout. */
function _exec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    throw err;
  }
}

/**
 * Extract a human-readable error message from an execSync Error.
 * curl writes diagnostics to stderr, which Node surfaces as `err.stderr`.
 */
function _extractCurlError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { stderr?: string | Buffer; message?: string };
    if (e.stderr) {
      const text = typeof e.stderr === 'string' ? e.stderr : e.stderr.toString('utf-8');
      const trimmed = text.trim();
      if (trimmed) return trimmed;
    }
    if (e.message) return e.message;
  }
  return String(err);
}

/** Create ~/.108ai/integrations/ if it does not already exist. */
function _ensureConfigDir(): void {
  if (!existsSync(CONFIG_BASE_DIR)) {
    mkdirSync(CONFIG_BASE_DIR, { recursive: true });
  }
}

/** Delete a file without throwing if it has already been removed. */
function _safeUnlink(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    // Ignore — file may have already been deleted.
  }
}

/** Resolve the OS temporary directory. */
function _getTmpDir(): string {
  return (
    process.env['TMPDIR'] ??
    process.env['TMP'] ??
    process.env['TEMP'] ??
    '/tmp'
  );
}
