/**
 * Triage CLI — Formatting and command handling for the daily triage system.
 *
 * Consumed by:
 *  - shell.ts slash commands: /triage, /morning, /standup
 *  - Direct invocation: handleTriageCommand(args)
 *
 * Color scheme:
 *  - URGENT   [!] → red    \x1b[31m
 *  - IMPORTANT [>] → yellow \x1b[33m
 *  - INFO     [i] → gray   \x1b[90m
 *  - Headers       → bold  \x1b[1m
 *  - Footer        → gray  \x1b[90m
 */

import { runTriage, loadTriageConfig, resolveTriageTokens } from './engine.js';
import type { TriageReport, TriageItem, TriageUrgency } from './engine.js';

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
} as const;

function bold(s: string): string { return `${C.bold}${s}${C.reset}`; }
function red(s: string): string { return `${C.red}${s}${C.reset}`; }
function yellow(s: string): string { return `${C.yellow}${s}${C.reset}`; }
function gray(s: string): string { return `${C.gray}${s}${C.reset}`; }

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

const DAYS_IT = [
  'Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato',
] as const;

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
] as const;

function formatDateIT(iso: string): string {
  const d = new Date(iso);
  const day = DAYS_IT[d.getDay()];
  const num = d.getDate();
  const month = MONTHS_IT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${num} ${month} ${year}`;
}

function formatTimeRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'adesso';
  if (diffMin < 60) return `${diffMin} min fa`;
  if (diffH < 24) return `${diffH} ore fa`;
  if (diffD === 1) return '1 giorno fa';
  return `${diffD} giorni fa`;
}

// ---------------------------------------------------------------------------
// Item rendering helpers
// ---------------------------------------------------------------------------

const URGENCY_PREFIX: Record<TriageUrgency, string> = {
  urgent: red('[!]'),
  important: yellow('[>]'),
  informative: gray('[i]'),
};

const URGENCY_LABEL: Record<TriageUrgency, string> = {
  urgent: red('URGENTE'),
  important: yellow('IMPORTANTE'),
  informative: gray('INFORMATIVO'),
};

function renderItemFull(item: TriageItem, indent = '  '): string {
  const prefix = URGENCY_PREFIX[item.urgency];
  const when = formatTimeRelative(item.timestamp);
  const lines: string[] = [];

  lines.push(`${indent}${prefix} ${bold(item.source)}: ${item.title} ${gray(`(${when})`)}`);

  if (item.detail && item.detail !== item.title) {
    lines.push(`${indent}    ${gray(item.detail)}`);
  }

  if (item.actionSuggestion) {
    lines.push(`${indent}    ${yellow('→')} ${item.actionSuggestion}`);
  }

  return lines.join('\n');
}

function renderItemCompact(item: TriageItem): string {
  const prefix = URGENCY_PREFIX[item.urgency];
  const when = formatTimeRelative(item.timestamp);
  return `  ${prefix} ${item.source}: ${item.title} ${gray(`(${when})`)}`;
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function renderFooter(report: TriageReport): string {
  const sources = report.sources.join(', ');
  const execSec = (report.stats.executionMs / 1000).toFixed(1);
  const tokens = report.stats.tokensUsed;
  const tokenStr = tokens === 0 ? '0 token' : `${tokens} token`;
  const srcInfo = `Fonti: ${sources} | ${tokenStr} | ${execSec}s`;
  return gray(`--- ${srcInfo} ---`);
}

// ---------------------------------------------------------------------------
// Public formatters
// ---------------------------------------------------------------------------

/**
 * Format a full triage report for terminal display.
 *
 * Example:
 * --- TRIAGE GIORNALIERO — Lunedì 16 Giugno 2026 ---
 *
 * URGENTE (3):
 *   [!] Email: Fattura scaduta da cliente Rossi (2 giorni fa)
 *       → Suggerimento: Sollecita pagamento
 *
 * IMPORTANTE (4):
 *   [>] ...
 *
 * INFORMATIVO (12):
 *   [i] ...
 *
 * --- Fonti: email, calendar | 0 token | 1.2s ---
 */
export function formatTriageReport(report: TriageReport): string {
  const lines: string[] = [];
  const dateStr = formatDateIT(report.generatedAt);

  lines.push('');
  lines.push(bold(`--- TRIAGE GIORNALIERO — ${dateStr} ---`));
  lines.push('');

  const urgencies: TriageUrgency[] = ['urgent', 'important', 'informative'];

  for (const urgency of urgencies) {
    const items = report.items.filter(i => i.urgency === urgency);
    if (items.length === 0) continue;

    const label = URGENCY_LABEL[urgency];
    lines.push(`${label} ${gray(`(${items.length}):`)} `);

    for (const item of items) {
      lines.push(renderItemFull(item));
    }

    lines.push('');
  }

  lines.push(renderFooter(report));
  lines.push('');

  return lines.join('\n');
}

/**
 * Format a compact triage — one-liner per item, no details or suggestions.
 *
 * Useful for quick morning overview or when piped.
 */
export function formatTriageCompact(report: TriageReport): string {
  const lines: string[] = [];
  const dateStr = formatDateIT(report.generatedAt);

  lines.push('');
  lines.push(bold(`TRIAGE — ${dateStr}`));
  lines.push('');

  if (report.items.length === 0) {
    lines.push(gray('  Nessun elemento da revisionare.'));
    lines.push('');
    lines.push(renderFooter(report));
    lines.push('');
    return lines.join('\n');
  }

  const urgencies: TriageUrgency[] = ['urgent', 'important', 'informative'];
  for (const urgency of urgencies) {
    const items = report.items.filter(i => i.urgency === urgency);
    for (const item of items) {
      lines.push(renderItemCompact(item));
    }
  }

  lines.push('');
  lines.push(renderFooter(report));
  lines.push('');

  return lines.join('\n');
}

/**
 * Format as standup — done yesterday / doing today / blocked.
 *
 * Maps triage items to standup buckets:
 *  - urgent     → BLOCCHI (azioni immediate)
 *  - important  → FOCUS OGGI
 *  - informative → IERI / CONTESTO
 */
export function formatTriageStandup(report: TriageReport): string {
  const lines: string[] = [];
  const dateStr = formatDateIT(report.generatedAt);

  lines.push('');
  lines.push(bold(`STANDUP — ${dateStr}`));
  lines.push('');

  // IERI — informative items (what happened / context)
  const doneItems = report.items.filter(i => i.urgency === 'informative');
  lines.push(bold('IERI:'));
  if (doneItems.length === 0) {
    lines.push(gray('  Nessun aggiornamento.'));
  } else {
    for (const item of doneItems) {
      lines.push(`  ${gray('[i]')} ${item.title}`);
    }
  }
  lines.push('');

  // OGGI — important items
  const focusItems = report.items.filter(i => i.urgency === 'important');
  lines.push(bold('OGGI:'));
  if (focusItems.length === 0) {
    lines.push(gray('  Nessun task prioritario.'));
  } else {
    for (const item of focusItems) {
      const suggestion = item.actionSuggestion ? gray(` → ${item.actionSuggestion}`) : '';
      lines.push(`  ${yellow('[>]')} ${item.title}${suggestion}`);
    }
  }
  lines.push('');

  // BLOCCHI — urgent items
  const blockedItems = report.items.filter(i => i.urgency === 'urgent');
  lines.push(bold('BLOCCHI:'));
  if (blockedItems.length === 0) {
    lines.push(gray('  Nessun blocco. ') + '\x1b[32m✓\x1b[0m');
  } else {
    for (const item of blockedItems) {
      const suggestion = item.actionSuggestion ? gray(` → ${item.actionSuggestion}`) : '';
      lines.push(`  ${red('[!]')} ${item.title}${suggestion}`);
    }
  }
  lines.push('');

  lines.push(renderFooter(report));
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Args parsing
// ---------------------------------------------------------------------------

type OutputFormat = 'full' | 'compact' | 'standup';

interface ParsedArgs {
  sources: string[] | null;      // null = all sources
  urgency: TriageUrgency | null; // null = all urgency levels
  format: OutputFormat;
  since: string | null;          // ISO timestamp or natural string
  morning: boolean;              // greeting line
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    sources: null,
    urgency: null,
    format: 'full',
    since: null,
    morning: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--source':
      case '-s': {
        const val = args[++i];
        if (val) result.sources = val.split(',').map(s => s.trim()).filter(Boolean);
        break;
      }

      case '--urgency':
      case '-u': {
        const val = args[++i]?.toLowerCase();
        if (val === 'high' || val === 'urgent') result.urgency = 'urgent';
        else if (val === 'medium' || val === 'important') result.urgency = 'important';
        else if (val === 'low' || val === 'informative') result.urgency = 'informative';
        break;
      }

      case '--format':
      case '-f': {
        const val = args[++i]?.toLowerCase();
        if (val === 'compact') result.format = 'compact';
        else if (val === 'standup') result.format = 'standup';
        else result.format = 'full';
        break;
      }

      case '--since': {
        const val = args[++i];
        if (val) result.since = normalizeSince(val);
        break;
      }

      case '--morning': {
        result.morning = true;
        break;
      }

      // Format shorthands
      case 'compact': result.format = 'compact'; break;
      case 'standup': result.format = 'standup'; break;
      case 'full': result.format = 'full'; break;

      default:
        // Ignore unknown args silently
        break;
    }
  }

  return result;
}

/** Convert natural time strings to ISO timestamp */
function normalizeSince(val: string): string {
  const lower = val.toLowerCase();
  const now = new Date();

  if (lower === 'yesterday' || lower === 'ieri') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  if (lower === 'today' || lower === 'oggi') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  if (lower === 'this-week' || lower === 'settimana') {
    const d = new Date(now);
    const dayOfWeek = d.getDay();
    d.setDate(d.getDate() - dayOfWeek);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  // Try to parse as-is (ISO or date string)
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();

  // Fallback: last 24h
  return new Date(now.getTime() - 86_400_000).toISOString();
}

// ---------------------------------------------------------------------------
// Greeting (for /morning)
// ---------------------------------------------------------------------------

function buildGreeting(): string {
  const hour = new Date().getHours();
  let greeting: string;

  if (hour < 12) greeting = 'Buongiorno';
  else if (hour < 18) greeting = 'Buon pomeriggio';
  else greeting = 'Buonasera';

  const dateStr = formatDateIT(new Date().toISOString());
  return `\n  ${C.green}${C.bold}${greeting}!${C.reset} ${gray(dateStr)}\n`;
}

// ---------------------------------------------------------------------------
// Urgency filter
// ---------------------------------------------------------------------------

function filterByUrgency(report: TriageReport, urgency: TriageUrgency): TriageReport {
  const items = report.items.filter(i => i.urgency === urgency);
  const stats = {
    ...report.stats,
    urgent: urgency === 'urgent' ? report.stats.urgent : 0,
    important: urgency === 'important' ? report.stats.important : 0,
    informative: urgency === 'informative' ? report.stats.informative : 0,
  };
  return { ...report, items, stats };
}

// ---------------------------------------------------------------------------
// Main command handler
// ---------------------------------------------------------------------------

/**
 * Main entry point called by the shell's slash command handler.
 *
 * Handles:
 *  /triage [--source ...] [--urgency ...] [--format ...] [--since ...]
 *  /morning  → full triage + greeting
 *  /standup  → standup format
 *
 * The shell passes args as string[] (everything after the slash command name).
 * For aliased commands (/morning, /standup), the shell is expected to inject
 * the appropriate args before delegating here.
 *
 * @returns Formatted string ready to write to process.stdout
 */
export async function handleTriageCommand(args: string[]): Promise<string> {
  const parsed = parseArgs(args);

  // Load config
  const config = loadTriageConfig();

  // Override sources from args (disable sources not in filter)
  if (parsed.sources !== null) {
    const allowed = new Set(parsed.sources);
    if (!allowed.has('email')) config.sources.email.enabled = false;
    if (!allowed.has('calendar')) config.sources.calendar.enabled = false;
    if (!allowed.has('pec')) config.sources.pec.enabled = false;
    if (!allowed.has('billing')) config.sources.billing.enabled = false;
    if (!allowed.has('system')) config.sources.system.enabled = false;
  }

  let report: TriageReport;
  try {
    const tokens = await resolveTriageTokens();
    report = await runTriage(config, tokens);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `\n  ${red('[ERR]')} Triage fallito: ${msg}\n`;
  }

  // Filter by urgency if requested
  if (parsed.urgency !== null) {
    report = filterByUrgency(report, parsed.urgency);
  }

  // Build output
  let output = '';

  // Prepend greeting for /morning
  if (parsed.morning) {
    output += buildGreeting();
  }

  // Format
  switch (parsed.format) {
    case 'compact':
      output += formatTriageCompact(report);
      break;
    case 'standup':
      output += formatTriageStandup(report);
      break;
    case 'full':
    default:
      output += formatTriageReport(report);
      break;
  }

  return output;
}

// ---------------------------------------------------------------------------
// Shell alias helpers (called directly from shell.ts for /morning, /standup)
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper for /morning — full triage with greeting line.
 */
export async function handleMorningCommand(args: string[]): Promise<string> {
  return handleTriageCommand(['--morning', '--format', 'full', ...args]);
}

/**
 * Convenience wrapper for /standup — standup format, no extra args needed.
 */
export async function handleStandupCommand(args: string[]): Promise<string> {
  return handleTriageCommand(['--format', 'standup', ...args]);
}
