/**
 * Notification Channel — Unified notification interface.
 *
 * Routes notification payloads to any configured channel:
 * console | desktop | file | telegram | whatsapp-business | whatsapp | email | none
 *
 * Config:    ~/.108ai/notifications.json
 * History:   ~/.108ai/notifications-history.json  (last 50 entries)
 * Quiet hrs: configurable per-config, overnight-safe (22:00–07:00)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONFIG_DIR = join(homedir(), '.108ai');
const NOTIFICATIONS_CONFIG_FILE = join(CONFIG_DIR, 'notifications.json');
const NOTIFICATIONS_HISTORY_FILE = join(CONFIG_DIR, 'notifications-history.json');
const NOTIFICATIONS_LOG_FILE = join(CONFIG_DIR, 'notifications.log');
const HISTORY_MAX_ENTRIES = 50;

// ANSI color codes
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
} as const;

// Priority emoji prefixes for channels that don't support rich formatting
const PRIORITY_EMOJI: Record<NotificationPriority, string> = {
  critical: '🔴',
  high: '🟡',
  normal: '🟢',
  low: '⚪',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationChannel =
  | 'console'
  | 'desktop'
  | 'file'
  | 'telegram'
  | 'whatsapp-business'
  | 'whatsapp'
  | 'email'
  | 'none';

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

export type NotificationCategory =
  | 'triage'
  | 'job-complete'
  | 'job-failed'
  | 'system-alert'
  | 'reminder'
  | 'message'
  | 'custom';

export interface NotificationPayload {
  title: string;
  body: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  metadata?: Record<string, unknown>;
  /** Deep link or URL */
  actionUrl?: string;
  /** Action buttons (rendered as inline keyboard for Telegram/WA) */
  actions?: Array<{ id: string; label: string }>;
}

export interface NotificationConfig {
  defaultChannel: NotificationChannel;
  channels: {
    telegram: { enabled: boolean };
    whatsappBusiness: { enabled: boolean; defaultRecipient?: string };
    whatsapp: { enabled: boolean; defaultRecipient?: string };
    email: { enabled: boolean; defaultRecipient?: string };
    desktop: { enabled: boolean };
    file: { enabled: boolean; path?: string };
  };
  /** Priority-based routing rules — first match wins */
  routing: NotificationRoute[];
  /** Suppress non-critical notifications during quiet hours */
  quietHours: {
    enabled: boolean;
    /** "HH:mm" format, e.g. "22:00" */
    start: string;
    /** "HH:mm" format, e.g. "07:00" */
    end: string;
    allowCritical: boolean;
  };
}

export interface NotificationRoute {
  category: NotificationCategory | '*';
  priority: NotificationPriority | '*';
  channel: NotificationChannel;
}

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
  messageId?: string;
}

export interface NotificationHistoryEntry {
  payload: NotificationPayload;
  results: NotificationResult[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Default routing rules
// ---------------------------------------------------------------------------

const DEFAULT_ROUTES: NotificationRoute[] = [
  { category: '*', priority: 'critical', channel: 'telegram' },
  { category: '*', priority: 'high', channel: 'desktop' },
  { category: 'job-complete', priority: '*', channel: 'console' },
  { category: 'job-failed', priority: '*', channel: 'telegram' },
  { category: 'triage', priority: '*', channel: 'desktop' },
  { category: '*', priority: '*', channel: 'console' },
];

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

export function getDefaultNotificationConfig(): NotificationConfig {
  return {
    defaultChannel: 'console',
    channels: {
      telegram: { enabled: false },
      whatsappBusiness: { enabled: false },
      whatsapp: { enabled: false },
      email: { enabled: false },
      desktop: { enabled: true },
      file: { enabled: false, path: NOTIFICATIONS_LOG_FILE },
    },
    routing: DEFAULT_ROUTES,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
      allowCritical: true,
    },
  };
}

export function loadNotificationConfig(): NotificationConfig {
  try {
    if (!existsSync(NOTIFICATIONS_CONFIG_FILE)) {
      return getDefaultNotificationConfig();
    }
    const raw = readFileSync(NOTIFICATIONS_CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<NotificationConfig>;
    // Deep merge with defaults so new fields always exist
    const defaults = getDefaultNotificationConfig();
    return {
      ...defaults,
      ...parsed,
      channels: { ...defaults.channels, ...(parsed.channels ?? {}) },
      routing: parsed.routing ?? defaults.routing,
      quietHours: { ...defaults.quietHours, ...(parsed.quietHours ?? {}) },
    };
  } catch {
    return getDefaultNotificationConfig();
  }
}

export function saveNotificationConfig(config: NotificationConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(NOTIFICATIONS_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Quiet hours
// ---------------------------------------------------------------------------

/**
 * Parse "HH:mm" into total minutes from midnight.
 */
function parseTimeToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  return h * 60 + m;
}

/**
 * Returns true if `now` falls within the configured quiet window.
 * Handles overnight ranges (e.g. 22:00–07:00 spans midnight).
 */
export function isQuietHours(now: Date = new Date()): boolean {
  const config = loadNotificationConfig();
  if (!config.quietHours.enabled) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeToMinutes(config.quietHours.start);
  const endMinutes = parseTimeToMinutes(config.quietHours.end);

  if (startMinutes < endMinutes) {
    // Same-day window (e.g. 08:00–20:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight window (e.g. 22:00–07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

function resolveChannel(
  payload: NotificationPayload,
  config: NotificationConfig,
): NotificationChannel {
  for (const route of config.routing) {
    const categoryMatch = route.category === '*' || route.category === payload.category;
    const priorityMatch = route.priority === '*' || route.priority === payload.priority;
    if (categoryMatch && priorityMatch) {
      return route.channel;
    }
  }
  return config.defaultChannel;
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export function getNotificationHistory(): NotificationHistoryEntry[] {
  try {
    if (!existsSync(NOTIFICATIONS_HISTORY_FILE)) return [];
    const raw = readFileSync(NOTIFICATIONS_HISTORY_FILE, 'utf-8');
    return JSON.parse(raw) as NotificationHistoryEntry[];
  } catch {
    return [];
  }
}

export function appendToHistory(
  payload: NotificationPayload,
  results: NotificationResult[],
): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const history = getNotificationHistory();
    history.push({ payload, results, timestamp: new Date().toISOString() });
    // Keep only the last N entries
    const trimmed = history.slice(-HISTORY_MAX_ENTRIES);
    writeFileSync(NOTIFICATIONS_HISTORY_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch {
    // History write failure is non-fatal — swallow silently
  }
}

// ---------------------------------------------------------------------------
// Channel availability
// ---------------------------------------------------------------------------

export function getAvailableChannels(): Array<{
  channel: NotificationChannel;
  configured: boolean;
  enabled: boolean;
}> {
  const config = loadNotificationConfig();

  return [
    {
      channel: 'console',
      configured: true,
      enabled: true,
    },
    {
      channel: 'desktop',
      configured: true,
      enabled: config.channels.desktop.enabled,
    },
    {
      channel: 'file',
      configured: !!config.channels.file.path,
      enabled: config.channels.file.enabled,
    },
    {
      channel: 'telegram',
      configured: _isTelegramConfigured(),
      enabled: config.channels.telegram.enabled,
    },
    {
      channel: 'whatsapp-business',
      configured: !!config.channels.whatsappBusiness.defaultRecipient,
      enabled: config.channels.whatsappBusiness.enabled,
    },
    {
      channel: 'whatsapp',
      configured: !!config.channels.whatsapp.defaultRecipient,
      enabled: config.channels.whatsapp.enabled,
    },
    {
      channel: 'email',
      configured: !!config.channels.email.defaultRecipient,
      enabled: config.channels.email.enabled,
    },
    {
      channel: 'none',
      configured: true,
      enabled: true,
    },
  ];
}

/** Peeks at the Telegram config file without importing the full module. */
function _isTelegramConfigured(): boolean {
  try {
    const telegramConfigFile = join(CONFIG_DIR, 'telegram.json');
    if (!existsSync(telegramConfigFile)) return false;
    const raw = readFileSync(telegramConfigFile, 'utf-8');
    const cfg = JSON.parse(raw) as Record<string, unknown>;
    return !!(cfg['botToken'] && cfg['chatId']);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Channel dispatch
// ---------------------------------------------------------------------------

/**
 * Send a notification to a specific channel, bypassing routing.
 */
export async function sendToChannel(
  channel: NotificationChannel,
  payload: NotificationPayload,
): Promise<NotificationResult> {
  switch (channel) {
    case 'console':
      return _sendConsole(payload);

    case 'desktop':
      return _sendDesktop(payload);

    case 'file':
      return _sendFile(payload);

    case 'telegram':
      return _sendTelegram(payload);

    case 'whatsapp-business':
      return _sendWhatsAppBusiness(payload);

    case 'whatsapp':
      return _sendWhatsApp(payload);

    case 'email':
      return _sendEmail(payload);

    case 'none':
      return { channel: 'none', success: true };

    default: {
      // Exhaustiveness guard
      const _exhaustive: never = channel;
      return {
        channel: _exhaustive,
        success: false,
        error: `Unknown channel: ${String(_exhaustive)}`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Main public API
// ---------------------------------------------------------------------------

/**
 * Route and dispatch a notification according to config.
 * Quiet-hours suppression applies (critical always passes through if allowCritical=true).
 */
export async function notify(payload: NotificationPayload): Promise<NotificationResult[]> {
  const config = loadNotificationConfig();

  // Quiet-hours check
  if (isQuietHours()) {
    const isCritical = payload.priority === 'critical';
    const criticalAllowed = config.quietHours.allowCritical;
    if (!isCritical || !criticalAllowed) {
      const silentResult: NotificationResult = { channel: 'none', success: true };
      appendToHistory(payload, [silentResult]);
      return [silentResult];
    }
  }

  const channel = resolveChannel(payload, config);
  const result = await sendToChannel(channel, payload);
  appendToHistory(payload, [result]);
  return [result];
}

/**
 * Broadcast a notification to multiple channels simultaneously.
 * Useful for morning triage results that need to reach several recipients.
 */
export async function notifyAll(
  channels: NotificationChannel[],
  payload: NotificationPayload,
): Promise<NotificationResult[]> {
  const results = await Promise.all(
    channels.map((ch) => sendToChannel(ch, payload)),
  );
  appendToHistory(payload, results);
  return results;
}

// ---------------------------------------------------------------------------
// Individual channel implementations
// ---------------------------------------------------------------------------

function _priorityAnsiColor(priority: NotificationPriority): string {
  switch (priority) {
    case 'critical': return ANSI.red;
    case 'high':     return ANSI.yellow;
    case 'normal':   return ANSI.green;
    case 'low':      return ANSI.gray;
  }
}

async function _sendConsole(payload: NotificationPayload): Promise<NotificationResult> {
  const color = _priorityAnsiColor(payload.priority);
  const prefix = `${color}${ANSI.bold}[${payload.priority.toUpperCase()}]${ANSI.reset}`;
  const categoryTag = `${ANSI.cyan}[${payload.category}]${ANSI.reset}`;
  const line = `${prefix} ${categoryTag} ${ANSI.bold}${payload.title}${ANSI.reset}\n  ${payload.body}`;
  process.stdout.write(line + '\n');
  return { channel: 'console', success: true };
}

async function _sendDesktop(payload: NotificationPayload): Promise<NotificationResult> {
  try {
    const notifier = await import('node-notifier');
    notifier.default.notify({
      title: `${PRIORITY_EMOJI[payload.priority]} ${payload.title}`,
      message: payload.body.slice(0, 200),
      sound: payload.priority === 'critical',
      wait: false,
    });
    return { channel: 'desktop', success: true };
  } catch (err) {
    return {
      channel: 'desktop',
      success: false,
      error: err instanceof Error ? err.message : 'Module not available',
    };
  }
}

async function _sendFile(payload: NotificationPayload): Promise<NotificationResult> {
  const config = loadNotificationConfig();
  const filePath = config.channels.file.path ?? NOTIFICATIONS_LOG_FILE;
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const entry =
      JSON.stringify({
        timestamp: new Date().toISOString(),
        priority: payload.priority,
        category: payload.category,
        title: payload.title,
        body: payload.body,
        metadata: payload.metadata,
        actionUrl: payload.actionUrl,
      }) + '\n';
    appendFileSync(filePath, entry, 'utf-8');
    return { channel: 'file', success: true };
  } catch (err) {
    return {
      channel: 'file',
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function _sendTelegram(payload: NotificationPayload): Promise<NotificationResult> {
  try {
    const tg = await import('../integrations/telegram-bot.js');

    // Build Markdown message: bold title + body
    const priorityLine = payload.priority !== 'normal'
      ? `${PRIORITY_EMOJI[payload.priority]} *${_escapeMarkdown(payload.title)}*`
      : `*${_escapeMarkdown(payload.title)}*`;
    const categoryLine = `_[${payload.category}]_`;
    const text = `${priorityLine}\n${categoryLine}\n\n${payload.body}`;

    // Build inline keyboard from actions
    let inlineKeyboard: Array<Array<{ text: string; callbackData: string }>> | undefined;
    if (payload.actions && payload.actions.length > 0) {
      inlineKeyboard = [
        payload.actions.map((a) => ({ text: a.label, callbackData: a.id })),
      ];
    }

    const result = await tg.sendMessage(text, {
      parseMode: 'Markdown',
      inlineKeyboard,
    });

    if (result.ok) {
      return {
        channel: 'telegram',
        success: true,
        messageId: result.messageId != null ? String(result.messageId) : undefined,
      };
    }
    return { channel: 'telegram', success: false, error: result.error };
  } catch (err) {
    return {
      channel: 'telegram',
      success: false,
      error: err instanceof Error ? err.message : 'Module not available',
    };
  }
}

async function _sendWhatsAppBusiness(payload: NotificationPayload): Promise<NotificationResult> {
  try {
    const wa = await import('../integrations/whatsapp-business.js');
    const config = loadNotificationConfig();
    const recipient = config.channels.whatsappBusiness.defaultRecipient;

    if (!recipient) {
      return {
        channel: 'whatsapp-business',
        success: false,
        error: 'No defaultRecipient configured for whatsapp-business channel',
      };
    }

    const prefix =
      payload.priority === 'critical' || payload.priority === 'high'
        ? `${PRIORITY_EMOJI[payload.priority]} `
        : '';
    const text = `${prefix}*${payload.title}*\n${payload.body}`;

    const result = await wa.sendTextMessage(recipient, text);
    return {
      channel: 'whatsapp-business',
      success: result.ok,
      error: result.error,
      messageId: result.messageId,
    };
  } catch (err) {
    return {
      channel: 'whatsapp-business',
      success: false,
      error: err instanceof Error ? err.message : 'Module not available',
    };
  }
}

async function _sendWhatsApp(payload: NotificationPayload): Promise<NotificationResult> {
  try {
    const wa = await import('../integrations/whatsapp-baileys.js');
    const config = loadNotificationConfig();
    const jid = config.channels.whatsapp.defaultRecipient;

    if (!jid) {
      return {
        channel: 'whatsapp',
        success: false,
        error: 'No defaultRecipient (JID) configured for whatsapp channel',
      };
    }

    const prefix =
      payload.priority === 'critical' || payload.priority === 'high'
        ? `${PRIORITY_EMOJI[payload.priority]} `
        : '';
    // WhatsApp personal: plain text, no markdown support
    const text = `${prefix}${payload.title}\n${payload.body}`;

    const result = await wa.sendText(jid, text);
    return {
      channel: 'whatsapp',
      success: result.ok,
      error: result.error,
      messageId: result.messageId,
    };
  } catch (err) {
    return {
      channel: 'whatsapp',
      success: false,
      error: err instanceof Error ? err.message : 'Module not available',
    };
  }
}

async function _sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
  try {
    const gmail = await import('../integrations/gmail.js');
    const googleAuth = await import('../integrations/google-auth.js');
    const config = loadNotificationConfig();
    const recipient = config.channels.email.defaultRecipient;

    if (!recipient) {
      return {
        channel: 'email',
        success: false,
        error: 'No defaultRecipient configured for email channel',
      };
    }

    // Load saved Google tokens — do NOT trigger an OAuth flow from a notification.
    // If the token is missing or expired, fail gracefully.
    const tokens = googleAuth.loadGoogleTokens();
    if (!tokens) {
      return {
        channel: 'email',
        success: false,
        error: 'Google not authenticated — run `108ai google auth` first',
      };
    }
    if (googleAuth.isGoogleTokenExpired(tokens)) {
      return {
        channel: 'email',
        success: false,
        error: 'Google access token expired — run `108ai google auth` to refresh',
      };
    }

    // Build minimal HTML body
    const priorityColor: Record<NotificationPriority, string> = {
      critical: '#dc2626',
      high: '#d97706',
      normal: '#16a34a',
      low: '#6b7280',
    };
    const color = priorityColor[payload.priority];
    const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:${color};border-bottom:2px solid ${color};padding-bottom:8px">
    ${PRIORITY_EMOJI[payload.priority]} ${_escapeHtml(payload.title)}
  </h2>
  <p style="color:#374151;font-size:14px">
    <strong>Category:</strong> ${payload.category} &nbsp;|&nbsp;
    <strong>Priority:</strong> ${payload.priority}
  </p>
  <div style="background:#f9fafb;border-left:4px solid ${color};padding:12px 16px;margin:16px 0">
    <p style="margin:0;white-space:pre-wrap">${_escapeHtml(payload.body)}</p>
  </div>
  ${payload.actionUrl ? `<p><a href="${payload.actionUrl}" style="color:#2563eb">Open →</a></p>` : ''}
  ${
    payload.actions && payload.actions.length > 0
      ? `<p>${payload.actions.map((a) => `<a href="#${a.id}" style="margin-right:8px;color:#2563eb">${_escapeHtml(a.label)}</a>`).join(' ')}</p>`
      : ''
  }
  <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:24px">
  <p style="color:#9ca3af;font-size:12px">108 AI Desktop Agent &bull; ${new Date().toISOString()}</p>
</body>
</html>`.trim();

    await gmail.sendEmail(tokens.accessToken, {
      to: recipient,
      subject: `${PRIORITY_EMOJI[payload.priority]} ${payload.title}`,
      body: htmlBody,
    });

    return { channel: 'email', success: true };
  } catch (err) {
    return {
      channel: 'email',
      success: false,
      error: err instanceof Error ? err.message : 'Module not available',
    };
  }
}

// ---------------------------------------------------------------------------
// Formatting utilities
// ---------------------------------------------------------------------------

/**
 * Escape characters that would break Telegram Markdown (v1) formatting.
 */
function _escapeMarkdown(text: string): string {
  // Telegram Markdown v1: escape *, _, `, [
  return text.replace(/([*_`[\]])/g, '\\$1');
}

/**
 * Escape HTML special characters for safe email body insertion.
 */
function _escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
