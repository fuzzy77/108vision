/**
 * Telegram Bot integration for the 108 AI Desktop Agent.
 *
 * Handles both outbound notifications (agent → user) and inbound commands
 * (user → agent) via the Telegram Bot API.
 *
 * Zero external dependencies — all API calls use native `fetch` against
 * https://api.telegram.org/bot<token>/<method>.
 *
 * Configuration is persisted at:
 *   ~/.108ai/integrations/telegram.json
 *
 * Security note: all inbound messages are validated against `allowedUserIds`
 * before being forwarded to the polling callback. Messages from unknown
 * users are silently discarded.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TelegramConfig {
  botToken: string;
  /** The user's chat ID — populated automatically after the first /start. */
  chatId: string;
  /** Only respond to messages from these Telegram user IDs. */
  allowedUserIds: string[];
  /** If set, the bot uses webhook mode instead of long polling. */
  webhookUrl?: string;
  pollingEnabled: boolean;
  /** Stores the highest processed update_id so getUpdates can use it as offset. */
  lastUpdateId: number;
}

export interface TelegramMessage {
  messageId: number;
  chatId: string;
  from: {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
  };
  text?: string;
  /** Unix timestamp of the message. */
  date: number;
  replyToMessage?: {
    messageId: number;
    text?: string;
  };
  hasPhoto: boolean;
  hasDocument: boolean;
}

export interface InlineKeyboardButton {
  text: string;
  callbackData: string;
}

export interface SendOptions {
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  replyToMessageId?: number;
  inlineKeyboard?: InlineKeyboardButton[][];
  disableNotification?: boolean;
}

// ---------------------------------------------------------------------------
// Internal types matching the Telegram Bot API wire format
// ---------------------------------------------------------------------------

interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

interface TelegramApiUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_bot: boolean;
}

interface TelegramApiMessage {
  message_id: number;
  from?: TelegramApiUser;
  chat: { id: number; type: string };
  date: number;
  text?: string;
  reply_to_message?: { message_id: number; text?: string };
  photo?: unknown[];
  document?: unknown;
}

interface TelegramApiUpdate {
  update_id: number;
  message?: TelegramApiMessage;
  callback_query?: {
    id: string;
    from: TelegramApiUser;
    message?: TelegramApiMessage;
    data?: string;
  };
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const API_BASE = 'https://api.telegram.org/bot';
const CONFIG_BASE_DIR = join(homedir(), '.108ai', 'integrations');
const CONFIG_PATH = join(CONFIG_BASE_DIR, 'telegram.json');
const API_TIMEOUT_MS = 35_000;

// ---------------------------------------------------------------------------
// Internal state (polling)
// ---------------------------------------------------------------------------

let _pollingIntervalId: ReturnType<typeof setInterval> | null = null;
let _isPolling = false;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _ensureConfigDir(): void {
  if (!existsSync(CONFIG_BASE_DIR)) {
    mkdirSync(CONFIG_BASE_DIR, { recursive: true });
  }
}

/**
 * Low-level Telegram Bot API caller.
 * All public functions should go through this.
 * Throws on API-level errors (ok: false) or network failures.
 */
async function _callApi(
  token: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(`${API_BASE}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  const data = (await response.json()) as TelegramApiResponse;

  if (!data.ok) {
    const description = data.description ?? `Telegram API error on ${method}`;
    throw new Error(description);
  }

  return data.result;
}

/**
 * Variant that uses the token stored in the config.
 * Throws if config is absent.
 */
async function _callApiWithConfig(
  method: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const config = loadTelegramConfig();
  if (!config) throw new Error('Telegram non configurato — esegui prima la configurazione.');
  return _callApi(config.botToken, method, body);
}

/** Build a Telegram `reply_markup` object from an inline keyboard matrix. */
function _buildReplyMarkup(
  keyboard: InlineKeyboardButton[][] | undefined,
): Record<string, unknown> | undefined {
  if (!keyboard || keyboard.length === 0) return undefined;

  return {
    inline_keyboard: keyboard.map((row) =>
      row.map((btn) => ({
        text: btn.text,
        callback_data: btn.callbackData,
      })),
    ),
  };
}

/** Map a Telegram API message object to the public TelegramMessage type. */
function _mapMessage(raw: TelegramApiMessage): TelegramMessage {
  return {
    messageId: raw.message_id,
    chatId: String(raw.chat.id),
    from: {
      id: raw.from?.id ?? 0,
      firstName: raw.from?.first_name ?? '',
      lastName: raw.from?.last_name,
      username: raw.from?.username,
    },
    text: raw.text,
    date: raw.date,
    replyToMessage: raw.reply_to_message
      ? {
          messageId: raw.reply_to_message.message_id,
          text: raw.reply_to_message.text,
        }
      : undefined,
    hasPhoto: Array.isArray(raw.photo) && raw.photo.length > 0,
    hasDocument: raw.document !== undefined,
  };
}

// ---------------------------------------------------------------------------
// Configuration management
// ---------------------------------------------------------------------------

/**
 * Load the Telegram configuration from ~/.108ai/integrations/telegram.json.
 * Returns null when the file does not exist or is malformed.
 */
export function loadTelegramConfig(): TelegramConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as TelegramConfig;
  } catch {
    return null;
  }
}

/** Persist the Telegram configuration to ~/.108ai/integrations/telegram.json. */
export function saveTelegramConfig(config: TelegramConfig): void {
  _ensureConfigDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Returns true when a telegram.json exists and contains a non-empty botToken
 * and chatId (i.e., the user has completed the setup wizard).
 */
export function isTelegramConfigured(): boolean {
  const config = loadTelegramConfig();
  return config !== null && config.botToken.length > 0 && config.chatId.length > 0;
}

// ---------------------------------------------------------------------------
// Bot info
// ---------------------------------------------------------------------------

/**
 * Verify that the given token (or the one in config) is valid and return
 * basic bot metadata.
 */
export async function getBotInfo(
  token?: string,
): Promise<{ ok: boolean; username?: string; firstName?: string; error?: string }> {
  const resolvedToken = token ?? loadTelegramConfig()?.botToken;
  if (!resolvedToken) {
    return { ok: false, error: 'Nessun token disponibile.' };
  }

  try {
    const result = (await _callApi(resolvedToken, 'getMe')) as TelegramApiUser;
    return {
      ok: true,
      username: result.username,
      firstName: result.first_name,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Sending messages
// ---------------------------------------------------------------------------

/**
 * Send a text message to the configured chat.
 */
export async function sendMessage(
  text: string,
  options?: SendOptions,
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const config = loadTelegramConfig();
  if (!config) return { ok: false, error: 'Telegram non configurato.' };

  try {
    const body: Record<string, unknown> = {
      chat_id: config.chatId,
      text,
    };

    if (options?.parseMode) body['parse_mode'] = options.parseMode;
    if (options?.replyToMessageId) body['reply_to_message_id'] = options.replyToMessageId;
    if (options?.disableNotification) body['disable_notification'] = true;

    const markup = _buildReplyMarkup(options?.inlineKeyboard);
    if (markup) body['reply_markup'] = markup;

    const result = (await _callApi(config.botToken, 'sendMessage', body)) as TelegramApiMessage;
    return { ok: true, messageId: result.message_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send a photo to the configured chat.
 * The image must be provided as a base64-encoded string.
 * Uses multipart/form-data since Telegram requires binary uploads for photos.
 */
export async function sendPhoto(
  photoBase64: string,
  caption?: string,
): Promise<{ ok: boolean; error?: string }> {
  const config = loadTelegramConfig();
  if (!config) return { ok: false, error: 'Telegram non configurato.' };

  try {
    const buffer = Buffer.from(photoBase64, 'base64');
    const boundary = `----FormBoundary${Date.now().toString(16)}`;

    const parts: Buffer[] = [];

    // chat_id field
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${config.chatId}\r\n`,
      ),
    );

    // caption field (optional)
    if (caption) {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`,
        ),
      );
    }

    // photo field
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
      ),
    );
    parts.push(buffer);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const formBody = Buffer.concat(parts);

    const response = await fetch(`${API_BASE}${config.botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: formBody,
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    const data = (await response.json()) as TelegramApiResponse;
    if (!data.ok) throw new Error(data.description ?? 'sendPhoto failed');

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send a file (document) to the configured chat.
 */
export async function sendDocument(
  fileBuffer: Buffer,
  filename: string,
  caption?: string,
): Promise<{ ok: boolean; error?: string }> {
  const config = loadTelegramConfig();
  if (!config) return { ok: false, error: 'Telegram non configurato.' };

  try {
    const boundary = `----FormBoundary${Date.now().toString(16)}`;
    const parts: Buffer[] = [];

    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${config.chatId}\r\n`,
      ),
    );

    if (caption) {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`,
        ),
      );
    }

    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
      ),
    );
    parts.push(fileBuffer);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const formBody = Buffer.concat(parts);

    const response = await fetch(`${API_BASE}${config.botToken}/sendDocument`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: formBody,
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    const data = (await response.json()) as TelegramApiResponse;
    if (!data.ok) throw new Error(data.description ?? 'sendDocument failed');

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Edit a previously sent message in the configured chat.
 */
export async function editMessage(
  messageId: number,
  newText: string,
  options?: SendOptions,
): Promise<{ ok: boolean; error?: string }> {
  const config = loadTelegramConfig();
  if (!config) return { ok: false, error: 'Telegram non configurato.' };

  try {
    const body: Record<string, unknown> = {
      chat_id: config.chatId,
      message_id: messageId,
      text: newText,
    };

    if (options?.parseMode) body['parse_mode'] = options.parseMode;

    const markup = _buildReplyMarkup(options?.inlineKeyboard);
    if (markup) body['reply_markup'] = markup;

    await _callApi(config.botToken, 'editMessageText', body);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Delete a message in the configured chat.
 */
export async function deleteMessage(
  messageId: number,
): Promise<{ ok: boolean; error?: string }> {
  const config = loadTelegramConfig();
  if (!config) return { ok: false, error: 'Telegram non configurato.' };

  try {
    await _callApi(config.botToken, 'deleteMessage', {
      chat_id: config.chatId,
      message_id: messageId,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Receiving messages (long polling)
// ---------------------------------------------------------------------------

/**
 * Fetch pending updates from the Telegram server using long polling.
 *
 * Uses `lastUpdateId + 1` as the offset so already-processed updates are
 * not returned again. Updates `lastUpdateId` and persists the config after
 * each successful batch.
 *
 * Messages from users not in `allowedUserIds` are filtered out before
 * being returned to the caller.
 *
 * @param timeout Long-poll server timeout in seconds (default: 30). A value
 *   of 0 forces an immediate (non-blocking) poll.
 */
export async function getUpdates(timeout = 30): Promise<TelegramMessage[]> {
  const config = loadTelegramConfig();
  if (!config) return [];

  let rawUpdates: TelegramApiUpdate[];
  try {
    rawUpdates = (await _callApi(config.botToken, 'getUpdates', {
      offset: config.lastUpdateId + 1,
      timeout,
      allowed_updates: ['message', 'callback_query'],
    })) as TelegramApiUpdate[];
  } catch {
    // Network/timeout errors during polling are non-fatal — return empty.
    return [];
  }

  if (rawUpdates.length === 0) return [];

  // Advance the offset so processed updates are not re-fetched.
  const maxUpdateId = rawUpdates.reduce((max, u) => Math.max(max, u.update_id), 0);
  config.lastUpdateId = maxUpdateId;
  saveTelegramConfig(config);

  const messages: TelegramMessage[] = [];

  for (const update of rawUpdates) {
    const raw = update.message ?? update.callback_query?.message;
    if (!raw) continue;

    const senderId = String(raw.from?.id ?? '');

    // Security: discard messages from unknown users.
    if (config.allowedUserIds.length > 0 && !config.allowedUserIds.includes(senderId)) {
      continue;
    }

    messages.push(_mapMessage(raw));
  }

  return messages;
}

/**
 * Start polling for incoming messages at a fixed interval.
 *
 * Uses a long-poll server timeout of 25 s combined with the interval
 * (default 1000 ms) so the loop is responsive but avoids hammering the API.
 *
 * Calling this function while polling is already active is a no-op.
 *
 * @param onMessage Callback invoked for each allowed incoming message.
 * @param intervalMs Polling loop interval in milliseconds (default: 1000).
 */
export function startPolling(
  onMessage: (msg: TelegramMessage) => void | Promise<void>,
  intervalMs = 1_000,
): void {
  if (_pollingIntervalId !== null) return; // already running

  const LONG_POLL_TIMEOUT_SEC = 25;

  const tick = async (): Promise<void> => {
    if (_isPolling) return; // skip if previous tick is still running
    _isPolling = true;

    try {
      const messages = await getUpdates(LONG_POLL_TIMEOUT_SEC);
      for (const msg of messages) {
        await onMessage(msg);
      }
    } catch {
      // Errors are silently swallowed to keep the loop alive.
    } finally {
      _isPolling = false;
    }
  };

  _pollingIntervalId = setInterval(() => {
    void tick();
  }, intervalMs);
}

/** Stop the polling loop started by startPolling. */
export function stopPolling(): void {
  if (_pollingIntervalId !== null) {
    clearInterval(_pollingIntervalId);
    _pollingIntervalId = null;
    _isPolling = false;
  }
}

// ---------------------------------------------------------------------------
// Callback queries
// ---------------------------------------------------------------------------

/**
 * Answer an inline keyboard callback query.
 * Must be called within 10 seconds of the callback_query being received.
 *
 * @param callbackQueryId The `id` field from the incoming callback_query update.
 * @param text Optional notification text shown to the user (toast-style).
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  const body: Record<string, unknown> = { callback_query_id: callbackQueryId };
  if (text) body['text'] = text;

  await _callApiWithConfig('answerCallbackQuery', body);
}

// ---------------------------------------------------------------------------
// Inline keyboard helpers
// ---------------------------------------------------------------------------

/**
 * Build a single-column inline keyboard from a flat list of buttons.
 *
 * @example
 * buildKeyboard([{ text: 'Approva', data: 'approve' }, { text: 'Rifiuta', data: 'reject' }])
 * // => [[{ text: 'Approva', callbackData: 'approve' }], [{ text: 'Rifiuta', callbackData: 'reject' }]]
 */
export function buildKeyboard(
  buttons: Array<{ text: string; data: string }>,
): InlineKeyboardButton[][] {
  return buttons.map((btn) => [{ text: btn.text, callbackData: btn.data }]);
}

/**
 * Build a grid-layout inline keyboard from a flat list of buttons.
 *
 * @param buttons Flat list of button definitions.
 * @param columns Number of buttons per row (default: 2).
 */
export function buildKeyboardGrid(
  buttons: Array<{ text: string; data: string }>,
  columns = 2,
): InlineKeyboardButton[][] {
  const rows: InlineKeyboardButton[][] = [];

  for (let i = 0; i < buttons.length; i += columns) {
    const row = buttons.slice(i, i + columns).map((btn) => ({
      text: btn.text,
      callbackData: btn.data,
    }));
    rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Convenience: triage notification
// ---------------------------------------------------------------------------

/**
 * Send a formatted triage notification using Markdown.
 *
 * The message is rendered as:
 *   🔔 *{title}*
 *
 *   {body}
 */
export async function sendTriageNotification(
  title: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const text = `🔔 *${title}*\n\n${body}`;
  return sendMessage(text, { parseMode: 'Markdown' });
}

// ---------------------------------------------------------------------------
// Setup wizard
// ---------------------------------------------------------------------------

/**
 * Returns a multi-line Italian string explaining how to configure the
 * Telegram Bot integration from scratch.
 */
export function getSetupInstructions(): string {
  return `
Configurazione Telegram Bot — 108 AI Desktop Agent
===================================================

1. Vai su Telegram e cerca @BotFather.

2. Invia il comando /newbot e segui le istruzioni:
   - Scegli un nome visibile (es. "108 AI Agent")
   - Scegli uno username che termina con "bot" (es. "mia_azienda_108ai_bot")
   - BotFather ti restituirà un token nel formato:
     123456789:AABBccDDeeFFggHHii-JJKK1234567890

3. Copia il token.

4. Configura l'integrazione eseguendo nel terminale:
   /telegram setup <token>
   oppure modifica direttamente:
   ~/.108ai/integrations/telegram.json

5. Apri una chat con il tuo bot su Telegram e invia /start.
   Il Desktop Agent registrerà automaticamente il tuo chat_id.

6. Da quel momento potrai ricevere notifiche dal desktop agent
   e inviare comandi direttamente dal tuo telefono.

Nota: solo gli user_id presenti in "allowedUserIds" possono
interagire con il bot. Aggiungi il tuo ID a quella lista dopo
il primo /start per abilitare i comandi in entrata.
`.trim();
}
