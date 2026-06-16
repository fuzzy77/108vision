/**
 * Triage Engine — 108 AI Desktop Agent
 *
 * Fetches data from all connected sources (Gmail, Google Calendar, Outlook, PEC),
 * classifies items by urgency using heuristics (no LLM), and produces a
 * structured TriageReport.
 *
 * Pattern: functional, no classes. Uses Promise.allSettled so one failing
 * source does not break the whole triage.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { statfsSync } from 'node:fs';

import type { GmailMessage } from '../integrations/gmail.js';
import type { CalendarEvent } from '../integrations/google-calendar.js';
import type { OutlookEmail, OutlookCalendarEvent } from '../integrations/office-outlook.js';
import type { ImapMessage } from '../integrations/imap-client.js';
import { loadIntegration } from '../integrations/lazy-loader.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type TriageUrgency = 'urgent' | 'important' | 'informative';

export interface TriageItem {
  id: string;
  source: string;           // 'email' | 'calendar' | 'pec' | 'task' | 'system'
  urgency: TriageUrgency;
  title: string;
  detail: string;
  timestamp: string;        // ISO
  actionSuggestion?: string;
  metadata?: Record<string, unknown>;
}

export interface TriageReport {
  generatedAt: string;
  sources: string[];         // which sources were successfully checked
  items: TriageItem[];
  stats: {
    urgent: number;
    important: number;
    informative: number;
    sourcesChecked: number;
    sourcesAvailable: number;
    executionMs: number;
    tokensUsed: number;     // always 0 — no LLM used in this phase
  };
}

export interface TriageConfig {
  sources: {
    email: {
      enabled: boolean;
      prioritySenders: string[];
      ignoreLabels: string[];
    };
    calendar: {
      enabled: boolean;
      prepAlertMinutes: number;
    };
    pec: {
      enabled: boolean;
    };
    billing: {
      enabled: boolean;
      overdueDaysImportant: number;
    };
    system: {
      enabled: boolean;
      diskAlertPercent: number;
    };
  };
  rules: TriageRule[];
  notification: {
    channel: string;
    format: 'compact' | 'full' | 'standup';
  };
}

export interface TriageRule {
  condition: string;  // descriptive label — evaluated via built-in heuristics
  then: TriageUrgency;
}

// ---------------------------------------------------------------------------
// Tokens input shape
// ---------------------------------------------------------------------------

export interface TriageTokens {
  google?: string;    // OAuth2 access token for Gmail + Google Calendar
  outlook?: boolean;  // true = use COM-based Outlook (no token needed)
}

// ---------------------------------------------------------------------------
// Config paths
// ---------------------------------------------------------------------------

const CONFIG_DIR = join(homedir(), '.108ai');
const CONFIG_PATH = join(CONFIG_DIR, 'triage.json');

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

export function getDefaultTriageConfig(): TriageConfig {
  return {
    sources: {
      email: {
        enabled: true,
        prioritySenders: [],
        ignoreLabels: ['newsletter', 'promo', 'social', 'promotions'],
      },
      calendar: {
        enabled: true,
        prepAlertMinutes: 120,
      },
      pec: {
        enabled: true,
      },
      billing: {
        enabled: true,
        overdueDaysImportant: 7,
      },
      system: {
        enabled: true,
        diskAlertPercent: 90,
      },
    },
    rules: [
      { condition: 'email.unread AND email.priority_sender', then: 'urgent' },
      { condition: 'email.unread AND email.age > 24h AND email.needs_reply', then: 'urgent' },
      { condition: 'calendar.starts_in < 2h AND calendar.has_prep', then: 'urgent' },
      { condition: 'pec.unread', then: 'urgent' },
      { condition: 'billing.overdue > 30d', then: 'urgent' },
      { condition: 'billing.overdue', then: 'important' },
      { condition: 'system.disk > 90%', then: 'urgent' },
      { condition: 'email.unread AND email.age > 48h', then: 'important' },
      { condition: 'calendar.today OR calendar.tomorrow', then: 'important' },
      { condition: 'system.disk > disk_alert_percent', then: 'important' },
    ],
    notification: {
      channel: 'tray',
      format: 'standup',
    },
  };
}

export function loadTriageConfig(): TriageConfig {
  if (!existsSync(CONFIG_PATH)) {
    return getDefaultTriageConfig();
  }
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<TriageConfig>;
    // Merge with defaults to ensure all fields are present
    const defaults = getDefaultTriageConfig();
    return deepMerge(defaults, parsed);
  } catch {
    return getDefaultTriageConfig();
  }
}

export function saveTriageConfig(config: TriageConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function resolveTriageTokens(): Promise<TriageTokens> {
  try {
    const { loadGoogleTokens, isGoogleTokenExpired } = await import('../integrations/google-auth.js');
    const gt = loadGoogleTokens();
    return {
      google: gt && !isGoogleTokenExpired(gt) ? gt.accessToken : undefined,
      outlook: true,
    };
  } catch {
    return {};
  }
}

export async function runTriage(
  config: TriageConfig,
  tokens: TriageTokens,
): Promise<TriageReport> {
  const startMs = Date.now();
  const generatedAt = new Date().toISOString();

  // --- Fetch phase: all sources in parallel, resilient to failures ---
  const [
    gmailResult,
    gCalResult,
    outlookEmailResult,
    outlookCalResult,
    pecResult,
    billingResult,
    systemResult,
  ] = await Promise.allSettled([
    config.sources.email.enabled && tokens.google
      ? fetchGmail(tokens.google, config)
      : Promise.resolve([] as TriageItem[]),

    config.sources.calendar.enabled && tokens.google
      ? fetchGoogleCalendar(tokens.google, config)
      : Promise.resolve([] as TriageItem[]),

    config.sources.email.enabled && tokens.outlook
      ? fetchOutlookEmail(config)
      : Promise.resolve([] as TriageItem[]),

    config.sources.calendar.enabled && tokens.outlook
      ? fetchOutlookCalendar(config)
      : Promise.resolve([] as TriageItem[]),

    config.sources.pec.enabled
      ? fetchPec(config)
      : Promise.resolve([] as TriageItem[]),

    config.sources.billing?.enabled
      ? fetchBillingOverdue(config)
      : Promise.resolve([] as TriageItem[]),

    config.sources.system.enabled
      ? fetchSystemItems(config)
      : Promise.resolve([] as TriageItem[]),
  ]);

  // Collect successful items and track which sources were checked
  const allItems: TriageItem[] = [];
  const successfulSources: string[] = [];
  const failedSources: string[] = [];

  function collect(
    result: PromiseSettledResult<TriageItem[]>,
    sourceName: string,
    enabled: boolean,
  ): void {
    if (!enabled) return;
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
      if (result.value.length >= 0) successfulSources.push(sourceName);
    } else {
      failedSources.push(sourceName);
    }
  }

  collect(gmailResult, 'gmail', config.sources.email.enabled && Boolean(tokens.google));
  collect(gCalResult, 'google-calendar', config.sources.calendar.enabled && Boolean(tokens.google));
  collect(outlookEmailResult, 'outlook-email', config.sources.email.enabled && Boolean(tokens.outlook));
  collect(outlookCalResult, 'outlook-calendar', config.sources.calendar.enabled && Boolean(tokens.outlook));
  collect(pecResult, 'pec', config.sources.pec.enabled);
  collect(
    billingResult,
    'fatture-in-cloud',
    Boolean(config.sources.billing?.enabled),
  );
  collect(systemResult, 'system', config.sources.system.enabled);

  // --- Sort phase: urgent → important → informative, then by timestamp ---
  const urgencyOrder: Record<TriageUrgency, number> = { urgent: 0, important: 1, informative: 2 };
  allItems.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return a.timestamp.localeCompare(b.timestamp);
  });

  // --- Stats ---
  const urgent = allItems.filter((i) => i.urgency === 'urgent').length;
  const important = allItems.filter((i) => i.urgency === 'important').length;
  const informative = allItems.filter((i) => i.urgency === 'informative').length;

  const sourcesAvailable =
    (config.sources.email.enabled ? 1 : 0) +
    (config.sources.calendar.enabled ? 1 : 0) +
    (config.sources.pec.enabled ? 1 : 0) +
    (config.sources.billing?.enabled ? 1 : 0) +
    (config.sources.system.enabled ? 1 : 0);

  return {
    generatedAt,
    sources: successfulSources,
    items: allItems,
    stats: {
      urgent,
      important,
      informative,
      sourcesChecked: successfulSources.length,
      sourcesAvailable,
      executionMs: Date.now() - startMs,
      tokensUsed: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Source fetchers
// ---------------------------------------------------------------------------

async function fetchGmail(token: string, config: TriageConfig): Promise<TriageItem[]> {
  const gmail = await loadIntegration<typeof import('../integrations/gmail.js')>('gmail');
  const result = await gmail.listMessages(token, {
    query: 'is:unread in:inbox',
    maxResults: 50,
  });

  const items: TriageItem[] = [];
  const now = Date.now();

  for (const msg of result.messages) {
    const isIgnored = isIgnoredLabel(msg.labels, config.sources.email.ignoreLabels);
    if (isIgnored) continue;

    const urgency = classifyGmailMessage(msg, config, now);
    items.push(gmailToTriageItem(msg, urgency));
  }

  return items;
}

async function fetchGoogleCalendar(token: string, config: TriageConfig): Promise<TriageItem[]> {
  const now = new Date();
  const tomorrowEnd = new Date(now);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const gcal = await loadIntegration<typeof import('../integrations/google-calendar.js')>('googleCalendar');
  const events = await gcal.listEvents(token, {
    timeMin: now.toISOString(),
    timeMax: tomorrowEnd.toISOString(),
    maxResults: 50,
  });

  return events
    .filter((e) => e.status !== 'cancelled')
    .map((e) => calEventToTriageItem(e, config, now.getTime()));
}

async function fetchOutlookEmail(config: TriageConfig): Promise<TriageItem[]> {
  const outlook = await loadIntegration<typeof import('../integrations/office-outlook.js')>('officeOutlook');
  const emails = await outlook.listInbox(50, true);
  const items: TriageItem[] = [];
  const now = Date.now();

  for (const email of emails) {
    const urgency = classifyOutlookEmail(email, config, now);
    items.push(outlookEmailToTriageItem(email, urgency));
  }

  return items;
}

async function fetchOutlookCalendar(config: TriageConfig): Promise<TriageItem[]> {
  const now = new Date();
  const tomorrowEnd = new Date(now);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const outlook = await loadIntegration<typeof import('../integrations/office-outlook.js')>('officeOutlook');
  const events = await outlook.listEvents(
    now.toISOString(),
    tomorrowEnd.toISOString(),
  );

  return events.map((e) => outlookCalEventToTriageItem(e, config, now.getTime()));
}

async function fetchPec(_config: TriageConfig): Promise<TriageItem[]> {
  const imap = await loadIntegration<typeof import('../integrations/imap-client.js')>('imapClient');
  const imapConfig = imap.loadImapConfig();
  if (!imapConfig) return [];

  const messages = await imap.listMessages(imapConfig, {
    folder: 'INBOX',
    limit: 30,
    unreadOnly: true,
  });

  return messages.map((msg) => pecToTriageItem(msg));
}

async function fetchBillingOverdue(config: TriageConfig): Promise<TriageItem[]> {
  const fic = await loadIntegration<typeof import('../integrations/fatture-in-cloud.js')>(
    'fattureInCloud',
  );
  if (!fic.isFattureInCloudConfigured()) return [];

  const { invoices } = await fic.listOverdueInvoices(25);
  const importantThreshold = config.sources.billing?.overdueDaysImportant ?? 7;

  return invoices.map((inv) => {
    const urgency =
      inv.daysOverdue > 30 ? 'urgent' : inv.daysOverdue >= importantThreshold ? 'important' : 'informative';

    return {
      id: `fic-invoice-${inv.id}`,
      source: 'billing',
      urgency,
      title: `Fattura scaduta ${inv.number} — ${inv.clientName}`,
      detail: `Importo ${inv.amountGross.toFixed(2)} ${inv.currency}, scadenza ${inv.dueDate} (${inv.daysOverdue}g fa)`,
      timestamp: new Date().toISOString(),
      actionSuggestion: 'Invia sollecito o verifica pagamento su Fatture in Cloud',
      metadata: {
        invoiceId: inv.id,
        clientName: inv.clientName,
        daysOverdue: inv.daysOverdue,
        amountGross: inv.amountGross,
      },
    } satisfies TriageItem;
  });
}

function fetchSystemItems(config: TriageConfig): Promise<TriageItem[]> {
  const items: TriageItem[] = [];

  try {
    const stats = statfsSync(homedir());
    const usedPercent = Math.round((1 - stats.bavail / stats.blocks) * 100);
    const threshold = config.sources.system.diskAlertPercent;

    if (usedPercent >= 90) {
      items.push({
        id: `system-disk-${Date.now()}`,
        source: 'system',
        urgency: 'urgent',
        title: `Disk space critical: ${usedPercent}% used`,
        detail: `Disk utilization has reached ${usedPercent}%. Immediate action required to free space.`,
        timestamp: new Date().toISOString(),
        actionSuggestion: 'Run disk cleanup or delete large unused files.',
        metadata: { usedPercent, threshold },
      });
    } else if (usedPercent >= threshold) {
      items.push({
        id: `system-disk-${Date.now()}`,
        source: 'system',
        urgency: 'important',
        title: `Disk space warning: ${usedPercent}% used`,
        detail: `Disk utilization is at ${usedPercent}%, above the configured threshold of ${threshold}%.`,
        timestamp: new Date().toISOString(),
        actionSuggestion: 'Consider cleaning up disk space to avoid issues.',
        metadata: { usedPercent, threshold },
      });
    }
  } catch {
    // statfsSync may fail on some platforms — skip silently
  }

  return Promise.resolve(items);
}

// ---------------------------------------------------------------------------
// Classification heuristics (zero LLM)
// ---------------------------------------------------------------------------

const MS_1H = 60 * 60 * 1000;
const MS_24H = 24 * MS_1H;
const MS_48H = 48 * MS_1H;

/**
 * Returns true if the email is from a priority sender.
 * Matches against the email address (case-insensitive substring match).
 */
function isPrioritySender(from: string, prioritySenders: string[]): boolean {
  if (prioritySenders.length === 0) return false;
  const lowerFrom = from.toLowerCase();
  return prioritySenders.some((s) => lowerFrom.includes(s.toLowerCase()));
}

/**
 * Returns true if the email is likely a newsletter or promotional content.
 * Heuristics: unsubscribe link in body, or label contains promo/newsletter/social.
 */
function isNewsletterGmail(msg: GmailMessage): boolean {
  const body = msg.body.toLowerCase();
  const snippet = msg.snippet.toLowerCase();
  if (body.includes('unsubscribe') || snippet.includes('unsubscribe')) return true;
  const newsletterLabels = ['newsletter', 'promotions', 'promo', 'social'];
  return msg.labels.some((l) => newsletterLabels.some((nl) => l.toLowerCase().includes(nl)));
}

/**
 * Returns true if this email needs a reply.
 * Heuristic: question mark in subject, or the last visible message came from someone else.
 * We use the snippet to check for question marks as a lightweight proxy.
 */
function needsReplyGmail(msg: GmailMessage): boolean {
  if (msg.subject.includes('?')) return true;
  if (msg.snippet.includes('?')) return true;
  // If the sender is not "me" (we have no "me" info here, use from as proxy)
  // This is a conservative heuristic: the presence of a From address implies
  // the last message came from someone else unless it's a "Sent" label
  if (msg.labels.includes('SENT')) return false;
  if (msg.labels.includes('INBOX')) return true;
  return false;
}

function isIgnoredLabel(labels: string[], ignoreLabels: string[]): boolean {
  return labels.some((l) =>
    ignoreLabels.some((il) => l.toLowerCase().includes(il.toLowerCase())),
  );
}

function classifyGmailMessage(
  msg: GmailMessage,
  config: TriageConfig,
  nowMs: number,
): TriageUrgency {
  if (!msg.isUnread) return 'informative';

  // Newsletters are always informative regardless of age
  if (isNewsletterGmail(msg)) return 'informative';

  const ageMs = nowMs - new Date(msg.date).getTime();
  const isPriority = isPrioritySender(msg.from, config.sources.email.prioritySenders);
  const needsReply = needsReplyGmail(msg);

  // URGENT: from a priority sender (any age)
  if (isPriority) return 'urgent';

  // URGENT: unread for more than 24h AND needs a reply
  if (ageMs > MS_24H && needsReply) return 'urgent';

  // IMPORTANT: unread for more than 48h
  if (ageMs > MS_48H) return 'important';

  // IMPORTANT: has attachments (likely a document requiring action)
  if (msg.hasAttachments) return 'important';

  return 'informative';
}

function classifyOutlookEmail(
  email: OutlookEmail,
  config: TriageConfig,
  nowMs: number,
): TriageUrgency {
  if (email.isRead) return 'informative';

  const ageMs = nowMs - new Date(email.receivedAt).getTime();
  const isPriority = isPrioritySender(email.from, config.sources.email.prioritySenders);

  const body = email.body.toLowerCase();
  const isNewsletter = body.includes('unsubscribe');

  if (isNewsletter) return 'informative';
  if (email.importance === 'high') return 'urgent';
  if (isPriority) return 'urgent';

  const needsReply = email.subject.includes('?') || email.bodyPreview.includes('?');
  if (ageMs > MS_24H && needsReply) return 'urgent';
  if (ageMs > MS_48H) return 'important';
  if (email.hasAttachments) return 'important';

  return 'informative';
}

function classifyCalendarEvent(
  startIso: string,
  isAllDay: boolean,
  hasPrep: boolean,
  config: TriageConfig,
  nowMs: number,
): TriageUrgency {
  if (isAllDay) return 'informative';

  const startMs = new Date(startIso).getTime();
  const minutesUntilStart = (startMs - nowMs) / (60 * 1000);

  // URGENT: starts in less than `prepAlertMinutes` AND has a prep context
  if (minutesUntilStart > 0 && minutesUntilStart < config.sources.calendar.prepAlertMinutes && hasPrep) {
    return 'urgent';
  }

  // IMPORTANT: happens today or tomorrow
  const msTilStart = startMs - nowMs;
  if (msTilStart >= 0 && msTilStart <= 48 * MS_1H) return 'important';

  return 'informative';
}

function hasCalendarPrep(event: CalendarEvent): boolean {
  return (
    (event.description?.trim().length > 0) ||
    event.attendees.length > 0 ||
    Boolean(event.meetLink)
  );
}

function hasOutlookCalendarPrep(event: OutlookCalendarEvent): boolean {
  return (
    (event.body?.trim().length > 0) ||
    event.attendees.length > 0
  );
}

// ---------------------------------------------------------------------------
// Item mappers
// ---------------------------------------------------------------------------

function gmailToTriageItem(msg: GmailMessage, urgency: TriageUrgency): TriageItem {
  return {
    id: `gmail-${msg.id}`,
    source: 'email',
    urgency,
    title: msg.subject || '(no subject)',
    detail: `From: ${msg.from} — ${msg.snippet}`,
    timestamp: msg.date,
    metadata: {
      provider: 'gmail',
      messageId: msg.id,
      threadId: msg.threadId,
      isUnread: msg.isUnread,
      hasAttachments: msg.hasAttachments,
      labels: msg.labels,
    },
  };
}

function outlookEmailToTriageItem(email: OutlookEmail, urgency: TriageUrgency): TriageItem {
  return {
    id: `outlook-email-${email.id}`,
    source: 'email',
    urgency,
    title: email.subject || '(no subject)',
    detail: `From: ${email.from} — ${email.bodyPreview}`,
    timestamp: email.receivedAt,
    metadata: {
      provider: 'outlook',
      entryId: email.id,
      importance: email.importance,
      hasAttachments: email.hasAttachments,
    },
  };
}

function calEventToTriageItem(
  event: CalendarEvent,
  config: TriageConfig,
  nowMs: number,
): TriageItem {
  const hasPrep = hasCalendarPrep(event);
  const urgency = classifyCalendarEvent(event.start, event.isAllDay, hasPrep, config, nowMs);

  const startLabel = event.isAllDay
    ? event.start
    : new Date(event.start).toLocaleString('it-IT', { timeZone: 'Europe/Rome' });

  const attendeeCount = event.attendees.length;
  const detail = [
    `Start: ${startLabel}`,
    event.location ? `Location: ${event.location}` : null,
    attendeeCount > 0 ? `Attendees: ${attendeeCount}` : null,
    event.meetLink ? 'Video meeting' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    id: `gcal-${event.id}`,
    source: 'calendar',
    urgency,
    title: event.title || '(no title)',
    detail,
    timestamp: event.start,
    metadata: {
      provider: 'google-calendar',
      eventId: event.id,
      isAllDay: event.isAllDay,
      hasPrep,
      meetLink: event.meetLink,
      status: event.status,
    },
  };
}

function outlookCalEventToTriageItem(
  event: OutlookCalendarEvent,
  config: TriageConfig,
  nowMs: number,
): TriageItem {
  const hasPrep = hasOutlookCalendarPrep(event);
  const urgency = classifyCalendarEvent(event.start, event.isAllDay, hasPrep, config, nowMs);

  const startLabel = event.isAllDay
    ? event.start
    : new Date(event.start).toLocaleString('it-IT', { timeZone: 'Europe/Rome' });

  const attendeeCount = event.attendees.length;
  const detail = [
    `Start: ${startLabel}`,
    event.location ? `Location: ${event.location}` : null,
    attendeeCount > 0 ? `Attendees: ${attendeeCount}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    id: `outlook-cal-${event.id}`,
    source: 'calendar',
    urgency,
    title: event.subject || '(no title)',
    detail,
    timestamp: event.start,
    metadata: {
      provider: 'outlook-calendar',
      entryId: event.id,
      isAllDay: event.isAllDay,
      hasPrep,
      organizer: event.organizer,
    },
  };
}

function pecToTriageItem(msg: ImapMessage): TriageItem {
  // PEC = legal communication — always at least "urgent" when unread
  const urgency: TriageUrgency = 'urgent';

  const dateIso = msg.date ? new Date(msg.date).toISOString() : new Date().toISOString();

  return {
    id: `pec-${msg.uid}`,
    source: 'pec',
    urgency,
    title: msg.subject || '(no subject)',
    detail: `PEC from: ${msg.from} — ${msg.body.slice(0, 200)}`,
    timestamp: dateIso,
    actionSuggestion: 'PEC è comunicazione legalmente valida. Verificare e rispondere entro i termini.',
    metadata: {
      provider: 'pec-imap',
      uid: msg.uid,
      folder: msg.folder,
      isRead: msg.isRead,
    },
  };
}

// ---------------------------------------------------------------------------
// Utility: deep merge (minimal implementation, no external deps)
// ---------------------------------------------------------------------------

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    const srcVal = source[key as keyof T];
    const tgtVal = target[key as keyof T];
    if (
      srcVal !== null &&
      srcVal !== undefined &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === 'object' &&
      tgtVal !== null &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else if (srcVal !== undefined) {
      result[key] = srcVal;
    }
  }
  return result as T;
}
