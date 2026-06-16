/**
 * WhatsApp integration via Baileys (Multi-Device protocol).
 *
 * Connects to a personal WhatsApp account — no Business API required, completely free.
 * Auth state is persisted at ~/.108ai/integrations/wa-session/ so the QR scan is
 * only needed once.  On subsequent runs the saved credentials are re-used
 * transparently.
 *
 * Dependencies (must be present in package.json):
 *   @whiskeysockets/baileys  — Multi-Device WA protocol implementation
 *   qrcode-terminal          — (optional) print QR as ASCII art in the terminal
 *   pino                     — Baileys peer dep; used as the internal logger
 *
 * Session dir:  ~/.108ai/integrations/wa-session/
 * Config file:  ~/.108ai/integrations/wa.json
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface WABaileysConfig {
  /** Whether the integration is active. */
  enabled: boolean;
  /** Directory that stores Baileys multi-file auth state. */
  sessionDir: string;
  /**
   * JIDs or plain phone numbers whose messages are dispatched to the handler.
   * Empty array = accept all.
   */
  allowedContacts: string[];
  /** Reconnect automatically on non-logout disconnect. */
  autoReconnect: boolean;
  /** Maximum auto-reconnect attempts (0 = unlimited). */
  maxReconnectAttempts: number;
  /** Baileys / pino log verbosity. */
  logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug';
}

export interface WAContact {
  /** Full JID, e.g. '39xxxxxxxxxx@s.whatsapp.net' or 'xxx@g.us' */
  jid: string;
  name?: string;
  pushName?: string;
  isGroup: boolean;
}

export interface WAIncomingMessage {
  id: string;
  /** Sender JID */
  jid: string;
  /** Phone number (groups: group JID) */
  from: string;
  /** Sender display name */
  pushName?: string;
  text?: string;
  timestamp: number;
  isGroup: boolean;
  groupName?: string;
  hasMedia: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  quotedMessage?: { id: string; text?: string };
}

export interface WAConnectionState {
  status: 'disconnected' | 'connecting' | 'qr_pending' | 'connected';
  phoneNumber?: string;
  pushName?: string;
  /** ISO timestamp of last successful connection */
  lastConnected?: string;
  /** Raw QR string — pass to qrcode-terminal or render as-is */
  qrCode?: string;
}

export type MessageHandler = (msg: WAIncomingMessage) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Internal — Baileys type stubs
// ---------------------------------------------------------------------------

/**
 * Minimal type overlay for the parts of Baileys we actually use.
 * Using `unknown` for untyped internals; we narrow where needed.
 */
interface BaileysModule {
  default: (config: Record<string, unknown>) => WASocket;
  useMultiFileAuthState: (dir: string) => Promise<{
    state: unknown;
    saveCreds: () => Promise<void>;
  }>;
  DisconnectReason: Record<string, number>;
  fetchLatestBaileysVersion: () => Promise<{ version: [number, number, number] }>;
  getContentType: (message: unknown) => string | undefined;
}

interface WASocket {
  ev: {
    on: (event: string, handler: (data: unknown) => void) => void;
  };
  sendMessage: (
    jid: string,
    content: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => Promise<{ key: { id?: string } }>;
  user?: { id?: string; name?: string };
  groupMetadata?: (jid: string) => Promise<{ subject?: string }>;
  logout?: () => Promise<void>;
  end?: (err?: Error) => void;
  store?: { contacts?: Record<string, { notify?: string; name?: string }> };
}

// ---------------------------------------------------------------------------
// Internal — lazy-loaded Baileys + pino singletons
// ---------------------------------------------------------------------------

let _baileys: BaileysModule | null = null;
let _pino: ((opts: Record<string, unknown>) => unknown) | null = null;

async function _loadBaileys(): Promise<BaileysModule> {
  if (_baileys) return _baileys;
  try {
    _baileys = (await import('@whiskeysockets/baileys')) as unknown as BaileysModule;
    return _baileys;
  } catch {
    throw new Error(
      'Package @whiskeysockets/baileys is not installed. ' +
        'Run: npm install @whiskeysockets/baileys',
    );
  }
}

async function _loadPino(): Promise<(opts: Record<string, unknown>) => unknown> {
  if (_pino) return _pino;
  try {
    const mod = (await import('pino')) as { default: (opts: Record<string, unknown>) => unknown };
    _pino = mod.default;
  } catch {
    // pino not available — return a silent no-op logger factory compatible with Baileys
    _pino = (opts: Record<string, unknown>) => {
      const level = (opts['level'] as string | undefined) ?? 'silent';
      const noop = () => undefined;
      return { level, trace: noop, debug: noop, info: noop, warn: noop, error: noop, fatal: noop, child: () => ({}) };
    };
  }
  return _pino;
}

// ---------------------------------------------------------------------------
// Internal — module-level state
// ---------------------------------------------------------------------------

const CONFIG_BASE_DIR = join(homedir(), '.108ai', 'integrations');
const CONFIG_PATH = join(CONFIG_BASE_DIR, 'wa.json');

const DEFAULT_SESSION_DIR = join(CONFIG_BASE_DIR, 'wa-session');

const DEFAULT_CONFIG: WABaileysConfig = {
  enabled: false,
  sessionDir: DEFAULT_SESSION_DIR,
  allowedContacts: [],
  autoReconnect: true,
  maxReconnectAttempts: 5,
  logLevel: 'silent',
};

let _connectionState: WAConnectionState = { status: 'disconnected' };
let _socket: WASocket | null = null;
let _messageHandler: MessageHandler | null = null;
let _reconnectCount = 0;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Load config from ~/.108ai/integrations/wa.json; returns defaults if absent. */
export function loadBaileysConfig(): WABaileysConfig {
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG };
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<WABaileysConfig>) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/** Persist config to ~/.108ai/integrations/wa.json. */
export function saveBaileysConfig(config: WABaileysConfig): void {
  _ensureConfigDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

/**
 * Establish a WhatsApp Multi-Device connection.
 *
 * @param onQr  Optional callback invoked with the raw QR string.  If omitted
 *              and qrcode-terminal is available the QR is printed to stdout.
 * @returns     true once the socket is initialised (not necessarily connected).
 */
export async function connect(onQr?: (qr: string) => void): Promise<boolean> {
  const baileys = await _loadBaileys();
  const pinoFactory = await _loadPino();
  const config = loadBaileysConfig();

  // Ensure session directory exists before passing it to Baileys
  mkdirSync(config.sessionDir, { recursive: true });

  const { state, saveCreds } = await baileys.useMultiFileAuthState(config.sessionDir);
  const { version } = await baileys.fetchLatestBaileysVersion();

  _connectionState = { ..._connectionState, status: 'connecting' };

  const logger = pinoFactory({ level: config.logLevel });

  const socket = baileys.default({
    version,
    auth: state as Record<string, unknown>,
    printQRInTerminal: false,  // we manage QR display ourselves
    logger,
    browser: ['108ai Desktop', 'Chrome', '120.0'],
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 30_000,
    // Provide getMessage for reliable retry delivery
    getMessage: async (_key: unknown) => ({ conversation: '' }),
  });

  _socket = socket;

  // Persist credentials after every update
  socket.ev.on('creds.update', () => {
    saveCreds().catch((_err: unknown) => {
      // Non-fatal — next successful update will overwrite
    });
  });

  // Connection / QR events
  socket.ev.on('connection.update', (raw: unknown) => {
    const update = raw as {
      connection?: string;
      lastDisconnect?: { error?: unknown };
      qr?: string;
    };

    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      _connectionState = { ..._connectionState, status: 'qr_pending', qrCode: qr };
      if (onQr) {
        onQr(qr);
      } else {
        _printQr(qr);
      }
    }

    if (connection === 'close') {
      _connectionState = { ..._connectionState, status: 'disconnected' };
      _socket = null;

      const statusCode = _extractStatusCode(lastDisconnect?.error);
      const isLoggedOut = statusCode === baileys.DisconnectReason['loggedOut'];

      if (isLoggedOut) {
        clearSession();
        return;
      }

      const maxAttempts = config.maxReconnectAttempts;
      const limitReached = maxAttempts > 0 && _reconnectCount >= maxAttempts;

      if (config.autoReconnect && !limitReached) {
        _reconnectCount++;
        // Exponential back-off: 1s, 2s, 4s, 8s … capped at 30s
        const delay = Math.min(1000 * Math.pow(2, _reconnectCount - 1), 30_000);
        setTimeout(() => {
          connect(onQr).catch((_err: unknown) => {
            // Reconnect attempt failed — state stays disconnected
          });
        }, delay);
      }
    }

    if (connection === 'open') {
      _reconnectCount = 0;
      _connectionState = {
        ..._connectionState,
        status: 'connected',
        qrCode: undefined,
        lastConnected: new Date().toISOString(),
        phoneNumber: _normaliseJid(socket.user?.id),
        pushName: socket.user?.name,
      };
    }
  });

  // Incoming messages
  socket.ev.on('messages.upsert', (raw: unknown) => {
    const upsert = raw as { messages?: unknown[]; type?: string };
    if (!upsert.messages) return;

    for (const rawMsg of upsert.messages) {
      try {
        const msg = rawMsg as Record<string, unknown>;

        // Ignore messages we sent ourselves
        const key = msg['key'] as Record<string, unknown> | undefined;
        if (key?.['fromMe'] === true) continue;

        // Skip status-broadcast messages
        const remoteJid = key?.['remoteJid'] as string | undefined;
        if (!remoteJid || remoteJid === 'status@broadcast') continue;

        // Apply allowed-contacts filter
        if (!_isAllowed(remoteJid, config.allowedContacts)) continue;

        const parsed = _parseMessage(msg, remoteJid);
        if (!parsed) continue;

        if (_messageHandler) {
          try {
            const result = _messageHandler(parsed);
            if (result instanceof Promise) {
              result.catch((_err: unknown) => {
                // Message handler errors must not crash the event loop
              });
            }
          } catch {
            // Synchronous handler errors are silently swallowed
          }
        }
      } catch {
        // Skip unparseable messages
      }
    }
  });

  return true;
}

/** Close the current socket gracefully and set state to disconnected. */
export async function disconnect(): Promise<void> {
  if (!_socket) return;
  try {
    if (_socket.logout) {
      await _socket.logout();
    } else if (_socket.end) {
      _socket.end();
    }
  } catch {
    // Ignore errors on close — socket may already be torn down
  } finally {
    _socket = null;
    _connectionState = { ..._connectionState, status: 'disconnected' };
  }
}

/** Current connection state snapshot. */
export function getConnectionState(): WAConnectionState {
  return { ..._connectionState };
}

/** True if the socket is in connected state. */
export function isConnected(): boolean {
  return _connectionState.status === 'connected';
}

// ---------------------------------------------------------------------------
// Message handler registration
// ---------------------------------------------------------------------------

/** Register the function that will receive all incoming (non-outgoing) messages. */
export function onMessage(handler: MessageHandler): void {
  _messageHandler = handler;
}

/** Remove the registered message handler. */
export function removeMessageHandler(): void {
  _messageHandler = null;
}

// ---------------------------------------------------------------------------
// Send messages
// ---------------------------------------------------------------------------

/**
 * Send a plain-text message to a JID.
 */
export async function sendText(
  jid: string,
  text: string,
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  if (!_socket) return { ok: false, error: 'Not connected' };
  try {
    const result = await _socket.sendMessage(jid, { text });
    return { ok: true, messageId: result.key.id };
  } catch (err) {
    return { ok: false, error: _errorMessage(err) };
  }
}

/**
 * Send an image message, optionally with a caption.
 */
export async function sendImage(
  jid: string,
  imageBuffer: Buffer,
  caption?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!_socket) return { ok: false, error: 'Not connected' };
  try {
    const content: Record<string, unknown> = { image: imageBuffer };
    if (caption) content['caption'] = caption;
    await _socket.sendMessage(jid, content);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: _errorMessage(err) };
  }
}

/**
 * Send a file as a document.
 */
export async function sendDocument(
  jid: string,
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!_socket) return { ok: false, error: 'Not connected' };
  try {
    await _socket.sendMessage(jid, {
      document: buffer,
      fileName: filename,
      mimetype: mimeType,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: _errorMessage(err) };
  }
}

/**
 * Reply to a specific message (quoted reply).
 */
export async function sendReply(
  jid: string,
  text: string,
  quotedMessageId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!_socket) return { ok: false, error: 'Not connected' };
  try {
    await _socket.sendMessage(
      jid,
      { text },
      { quoted: { key: { id: quotedMessageId, remoteJid: jid } } },
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: _errorMessage(err) };
  }
}

/**
 * Send an emoji reaction to a message.
 */
export async function sendReaction(
  jid: string,
  messageId: string,
  emoji: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!_socket) return { ok: false, error: 'Not connected' };
  try {
    await _socket.sendMessage(jid, {
      react: {
        text: emoji,
        key: { remoteJid: jid, id: messageId },
      },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: _errorMessage(err) };
  }
}

// ---------------------------------------------------------------------------
// Contacts & Groups
// ---------------------------------------------------------------------------

/**
 * Return all known contacts (individual JIDs only).
 * Requires a connected socket with a populated contact store.
 */
export async function getContacts(): Promise<WAContact[]> {
  if (!_socket?.store?.contacts) return [];
  const contacts = _socket.store.contacts;
  return Object.entries(contacts)
    .filter(([jid]) => jid.endsWith('@s.whatsapp.net'))
    .map(([jid, data]) => ({
      jid,
      name: data.name ?? undefined,
      pushName: data.notify ?? undefined,
      isGroup: false,
    }));
}

/**
 * Return all known groups (JIDs ending with @g.us).
 */
export async function getGroups(): Promise<WAContact[]> {
  if (!_socket?.store?.contacts) return [];
  const contacts = _socket.store.contacts;
  return Object.entries(contacts)
    .filter(([jid]) => jid.endsWith('@g.us'))
    .map(([jid, data]) => ({
      jid,
      name: data.name ?? undefined,
      pushName: data.notify ?? undefined,
      isGroup: true,
    }));
}

/**
 * Convert a phone number to a WhatsApp JID.
 * '39xxxxxxxxxx' → '39xxxxxxxxxx@s.whatsapp.net'
 * '+39xxxxxxxxxx' → '39xxxxxxxxxx@s.whatsapp.net'
 */
export function phoneToJid(phone: string): string {
  const stripped = phone.replace(/^\+/, '').replace(/@.*$/, '').replace(/\s+/g, '');
  return `${stripped}@s.whatsapp.net`;
}

/**
 * Convert a WhatsApp JID to a human-readable phone number.
 * '39xxxxxxxxxx@s.whatsapp.net' → '+39xxxxxxxxxx'
 */
export function jidToPhone(jid: string): string {
  const number = jid.replace(/@.*$/, '').replace(/:[^@]*$/, '');
  return `+${number}`;
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/** True when a Baileys session directory exists on disk. */
export function hasExistingSession(): boolean {
  const config = loadBaileysConfig();
  return existsSync(config.sessionDir);
}

/**
 * Delete the session directory, forcing re-authentication via QR on the next
 * connect().  Safe to call while disconnected.
 */
export function clearSession(): void {
  const config = loadBaileysConfig();
  try {
    rmSync(config.sessionDir, { recursive: true, force: true });
  } catch {
    // If the directory doesn't exist, that's fine
  }
  // Recreate an empty directory so useMultiFileAuthState can initialise
  mkdirSync(config.sessionDir, { recursive: true });
  _connectionState = { status: 'disconnected' };
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/** Quick status summary suitable for health checks and CLI display. */
export async function getStatus(): Promise<{
  connected: boolean;
  phone?: string;
  name?: string;
  lastSeen?: string;
}> {
  return {
    connected: _connectionState.status === 'connected',
    phone: _connectionState.phoneNumber,
    name: _connectionState.pushName,
    lastSeen: _connectionState.lastConnected,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Ensure ~/.108ai/integrations/ exists. */
function _ensureConfigDir(): void {
  if (!existsSync(CONFIG_BASE_DIR)) {
    mkdirSync(CONFIG_BASE_DIR, { recursive: true });
  }
}

/**
 * Parse a raw Baileys WAMessage object into our public WAIncomingMessage shape.
 * Returns null if the message carries no extractable content.
 */
function _parseMessage(
  msg: Record<string, unknown>,
  remoteJid: string,
): WAIncomingMessage | null {
  const key = msg['key'] as Record<string, unknown> | undefined;
  const messageId = (key?.['id'] as string | undefined) ?? '';
  const pushName = msg['pushName'] as string | undefined;

  const rawTimestamp = msg['messageTimestamp'];
  const timestamp =
    typeof rawTimestamp === 'number'
      ? rawTimestamp
      : typeof rawTimestamp === 'bigint'
        ? Number(rawTimestamp)
        : Math.floor(Date.now() / 1000);

  const isGroup = remoteJid.endsWith('@g.us');
  const participant = (key?.['participant'] as string | undefined) ?? remoteJid;
  const senderJid = isGroup ? participant : remoteJid;

  const message = msg['message'] as Record<string, unknown> | undefined;
  if (!message) return null;

  // Extract text content — ordered by priority
  const text =
    (message['conversation'] as string | undefined) ??
    (
      (message['extendedTextMessage'] as Record<string, unknown> | undefined)
        ?.['text'] as string | undefined
    ) ??
    (
      (message['imageMessage'] as Record<string, unknown> | undefined)
        ?.['caption'] as string | undefined
    ) ??
    (
      (message['videoMessage'] as Record<string, unknown> | undefined)
        ?.['caption'] as string | undefined
    ) ??
    undefined;

  // Detect media type
  let hasMedia = false;
  let mediaType: WAIncomingMessage['mediaType'] | undefined;

  if (message['imageMessage']) { hasMedia = true; mediaType = 'image'; }
  else if (message['videoMessage']) { hasMedia = true; mediaType = 'video'; }
  else if (message['audioMessage']) { hasMedia = true; mediaType = 'audio'; }
  else if (message['documentMessage']) { hasMedia = true; mediaType = 'document'; }
  else if (message['stickerMessage']) { hasMedia = true; mediaType = 'sticker'; }

  // Quoted / context info
  const contextInfo = (
    (message['extendedTextMessage'] as Record<string, unknown> | undefined)
      ?.['contextInfo'] as Record<string, unknown> | undefined
  );
  const stanzaId = contextInfo?.['stanzaId'] as string | undefined;
  const quotedContent = contextInfo?.['quotedMessage'] as Record<string, unknown> | undefined;
  const quotedText = quotedContent
    ? ((quotedContent['conversation'] as string | undefined) ??
        (
          (quotedContent['extendedTextMessage'] as Record<string, unknown> | undefined)
            ?.['text'] as string | undefined
        ))
    : undefined;

  return {
    id: messageId,
    jid: senderJid,
    from: isGroup ? remoteJid : jidToPhone(senderJid),
    pushName,
    text,
    timestamp,
    isGroup,
    hasMedia,
    mediaType,
    quotedMessage: stanzaId
      ? { id: stanzaId, text: quotedText }
      : undefined,
  };
}

/**
 * Check whether a JID is in the allowed-contacts list.
 * If the list is empty, all JIDs are accepted.
 */
function _isAllowed(jid: string, allowed: string[]): boolean {
  if (allowed.length === 0) return true;
  return allowed.some((entry) => {
    // Normalise: if entry has no @, treat as phone number
    const normalised = entry.includes('@') ? entry : phoneToJid(entry);
    return normalised === jid;
  });
}

/** Normalise the Baileys user.id format 'number:device@s.whatsapp.net' → '+number'. */
function _normaliseJid(id: string | undefined): string | undefined {
  if (!id) return undefined;
  const bare = id.replace(/:.*@/, '@');
  return jidToPhone(bare);
}

/** Extract a numeric status code from a Baileys disconnect error. */
function _extractStatusCode(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as { output?: { statusCode?: number } };
  return e.output?.statusCode;
}

/** Stringify any caught error to a human-readable message. */
function _errorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  const e = err as { message?: string };
  return e.message ?? String(err);
}

/**
 * Print a QR code to stdout using qrcode-terminal if available,
 * falling back to the raw string (parseable by many terminal emulators).
 */
function _printQr(qr: string): void {
  import('qrcode-terminal')
    .then((mod) => {
      const qrTerminal = mod as { generate: (qr: string, opts: Record<string, unknown>) => void };
      qrTerminal.generate(qr, { small: true });
      console.info('[108ai WA] Scan the QR code above with WhatsApp → Linked Devices → Link a device');
    })
    .catch(() => {
      console.info('[108ai WA] QR (scan with WhatsApp → Linked Devices → Link a device):');
      console.info(qr);
    });
}
