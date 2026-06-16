/**
 * Resource CLI — Comando /risorse e /health per il Desktop Agent 108ai.
 *
 * Gestisce il dashboard risorse, health check compatto e comandi di
 * configurazione/healing dalla shell interattiva.
 *
 * Tutti i messaggi utente sono in italiano.
 * Mai lancia eccezioni — ogni handler restituisce sempre una stringa.
 */

import { homedir } from 'node:os';

import {
  loadResourceConfig,
  saveResourceConfig,
  getTodayUsage,
  getMonthUsage,
  loadTokenUsage,
  type ResourceConfig,
} from './config.js';

import {
  takeSnapshot,
  forceGC,
  getMonitorStatus,
  getDirSizeMB,
} from './monitor.js';

import {
  runAutoHealing,
  isModelDowngraded,
  isLLMBlocked,
  resetModelDowngrade,
  resetLLMBlock,
  getHealingHistory,
} from './auto-healer.js';

import type { ResourceLevel } from './config.js';

// ---------------------------------------------------------------------------
// ANSI color helpers
// ---------------------------------------------------------------------------

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
} as const;

function bold(s: string):   string { return `${C.bold}${s}${C.reset}`; }
function green(s: string):  string { return `${C.green}${s}${C.reset}`; }
function yellow(s: string): string { return `${C.yellow}${s}${C.reset}`; }
function red(s: string):    string { return `${C.red}${s}${C.reset}`; }
function gray(s: string):   string { return `${C.gray}${s}${C.reset}`; }

// ---------------------------------------------------------------------------
// Helper: formatMB
// ---------------------------------------------------------------------------

/**
 * Formatta un valore MB come stringa leggibile.
 * Se > 1024 MB mostra in GB con una cifra decimale.
 */
export function formatMB(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Helper: formatTokens
// ---------------------------------------------------------------------------

/**
 * Formatta un conteggio token come stringa leggibile.
 * Se > 1000 mostra come "X.Xk".
 */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Helper: renderProgressBar
// ---------------------------------------------------------------------------

/**
 * Genera una barra di avanzamento stile "████████░░░░░░░░".
 * `percent` deve essere 0-100; `width` è il numero totale di caratteri.
 */
export function renderProgressBar(percent: number, width = 20): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled  = Math.round((clamped / 100) * width);
  const empty   = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// ---------------------------------------------------------------------------
// Helper: levelIcon
// ---------------------------------------------------------------------------

/**
 * Restituisce un indicatore colorato ● in base al livello di allerta.
 * - normal   → verde
 * - warning  → giallo
 * - critical → rosso
 * - emergency → rosso lampeggiante (evidenziato in bold)
 */
export function levelIcon(level: ResourceLevel): string {
  switch (level) {
    case 'normal':    return green('●');
    case 'warning':   return yellow('●');
    case 'critical':  return red('●');
    case 'emergency': return `${C.bold}${C.red}●${C.reset}`;
  }
}

// ---------------------------------------------------------------------------
// Helper: levelLabel
// ---------------------------------------------------------------------------

function levelLabel(level: ResourceLevel): string {
  switch (level) {
    case 'normal':    return green('[OK]');
    case 'warning':   return yellow('[WARN]');
    case 'critical':  return red('[CRIT]');
    case 'emergency': return `${C.bold}${C.red}[EMERG]${C.reset}`;
  }
}

// ---------------------------------------------------------------------------
// Helper: stateLabelText (senza colori — per stato globale)
// ---------------------------------------------------------------------------

function stateLabelText(level: ResourceLevel): string {
  switch (level) {
    case 'normal':    return green('● Normale');
    case 'warning':   return yellow('● Attenzione');
    case 'critical':  return red('● Critico');
    case 'emergency': return `${C.bold}${C.red}● EMERGENZA${C.reset}`;
  }
}

// ---------------------------------------------------------------------------
// Helper: formatRelativeSeconds
// ---------------------------------------------------------------------------

function formatRelativeSeconds(ms: number): string {
  const sec  = Math.floor(ms / 1_000);
  const min  = Math.floor(ms / 60_000);
  const hrs  = Math.floor(ms / 3_600_000);
  if (sec  <  60)  return `${sec} secondi fa`;
  if (min  <  60)  return `${min} minuti fa`;
  return `${hrs} ore fa`;
}

// ---------------------------------------------------------------------------
// Helper: monthLabel (e.g. "Giugno 2026")
// ---------------------------------------------------------------------------

function monthLabel(): string {
  return new Date().toLocaleString('it-IT', { month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Dashboard overview
// ---------------------------------------------------------------------------

function renderOverview(): string {
  const snapshot = takeSnapshot();
  const monitor  = getMonitorStatus();
  const { memory, disk, tokens, overall } = snapshot;

  const W = 63; // inner width of box

  // Line helpers for the box
  const pad = (s: string, width: number): string => {
    // Strip ANSI for length calculation
    const stripped = s.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = width - stripped.length;
    return s + (pad > 0 ? ' '.repeat(pad) : '');
  };

  const line = (content: string): string => `│  ${pad(content, W - 2)}│`;
  const sep  = (): string => `├${'─'.repeat(W)}┤`;
  const blank = (): string => line('');

  const TOP    = `┌${'─'.repeat(W)}┐`;
  const BOTTOM = `└${'─'.repeat(W)}┘`;

  // --- Memory bar
  const memBar   = renderProgressBar(memory.percent, 20);
  const memBarC  = memory.level === 'normal'
    ? green(memBar)
    : memory.level === 'warning' ? yellow(memBar) : red(memBar);
  const memLabel = `${memBarC}  ${memory.percent.toFixed(0)}% (${formatMB(memory.usedMB)} / ${formatMB(memory.totalMB)})`;
  const memIcon  = `  ${levelLabel(memory.level)}`;

  // --- Disk bar
  const diskBar  = renderProgressBar(disk.percent, 20);
  const diskBarC = disk.level === 'normal'
    ? green(diskBar)
    : disk.level === 'warning' ? yellow(diskBar) : red(diskBar);
  const diskLabel = `${diskBarC}  ${disk.percent.toFixed(0)}% (${formatMB(disk.usedMB)} / ${formatMB(disk.totalMB)})`;
  const diskIcon  = `  ${levelLabel(disk.level)}`;

  // Sub breakdown disk
  const diskBreakdown = gray(
    `Cache: ${formatMB(disk.cacheMB)} | Logs: ${formatMB(disk.logsMB)}`
  );

  // --- Token bars
  const todayPct = tokens.todayPercent;
  const tokDayBar = renderProgressBar(todayPct, 20);
  const tokDayBarC = tokens.level === 'normal'
    ? green(tokDayBar)
    : tokens.level === 'warning' ? yellow(tokDayBar) : red(tokDayBar);
  const todayLabel = `${tokDayBarC}  ${todayPct.toFixed(0)}% (${formatTokens(tokens.todayUsed)} / ${formatTokens(tokens.todayBudget)} giornaliero)`;
  const tokIcon    = `  ${levelLabel(tokens.level)}`;

  const monthPct   = tokens.monthPercent;
  const monthLine  = gray(`Mese: ${formatTokens(tokens.monthUsed)} / ${formatTokens(tokens.monthBudget)} (${monthPct.toFixed(0)}%)`);

  // Monitor interval
  const intervalSec = Math.round(monitor.intervalMs / 1000);
  const monitorLine = monitor.running
    ? green(`attivo (ogni ${intervalSec}s)`)
    : yellow('inattivo');

  const lines: string[] = [];
  lines.push(TOP);
  lines.push(line(`${bold('108ai')} ${gray('—')} ${bold('Risorse')}`));
  lines.push(sep());
  lines.push(blank());
  lines.push(line(bold('MEMORIA')));
  lines.push(line(`${memLabel}${memIcon}`));
  lines.push(blank());
  lines.push(line(bold('DISCO (~/.108ai)')));
  lines.push(line(`${diskLabel}${diskIcon}`));
  lines.push(line(diskBreakdown));
  lines.push(blank());
  lines.push(line(bold(`TOKEN (${monthLabel()})`)));
  lines.push(line(`${todayLabel}${tokIcon}`));
  lines.push(line(monthLine));
  lines.push(blank());
  lines.push(line(`Stato: ${stateLabelText(overall)}`));
  lines.push(line(`Monitor: ${monitorLine}`));
  lines.push(BOTTOM);

  return '\n' + lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Memory detail
// ---------------------------------------------------------------------------

function renderMemoryDetail(withGC: boolean): string {
  const mem = process.memoryUsage();

  const heapUsedMB    = mem.heapUsed     / 1024 / 1024;
  const heapTotalMB   = mem.heapTotal    / 1024 / 1024;
  const rssMB         = mem.rss          / 1024 / 1024;
  const externalMB    = mem.external     / 1024 / 1024;
  const arrayBufMB    = mem.arrayBuffers / 1024 / 1024;

  const lines: string[] = [];
  lines.push('');
  lines.push(bold('MEMORIA — DETTAGLIO'));
  lines.push('');
  lines.push(`  ${gray('Heap usato:')}      ${formatMB(heapUsedMB)}`);
  lines.push(`  ${gray('Heap totale:')}     ${formatMB(heapTotalMB)}`);
  lines.push(`  ${gray('RSS (processo):')}  ${formatMB(rssMB)}`);
  lines.push(`  ${gray('External:')}        ${formatMB(externalMB)}`);
  lines.push(`  ${gray('ArrayBuffers:')}    ${formatMB(arrayBufMB)}`);

  if (withGC) {
    lines.push('');
    const result = forceGC();
    if (result.freedMB > 0) {
      lines.push(`  ${green('[GC]')} Garbage collection eseguita: ${green(formatMB(result.freedMB))} liberati`);
    } else {
      lines.push(`  ${gray('[GC]')} GC eseguito — nessuna memoria liberata (o --expose-gc non attivo)`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Disk detail
// ---------------------------------------------------------------------------

function renderDiskDetail(withClean: boolean, withPurge: boolean): string {
  const baseDir = `${homedir()}/.108ai`;
  const cacheDir   = `${baseDir}/cache`;
  const logsDir    = `${baseDir}/logs`;
  const jobsDir    = `${baseDir}/jobs`;
  const tempDir    = `${baseDir}/temp`;

  const cacheMB    = getDirSizeMB(cacheDir);
  const logsMB     = getDirSizeMB(logsDir);
  const jobsMB     = getDirSizeMB(jobsDir);
  const tempMB     = getDirSizeMB(tempDir);
  const totalMB    = cacheMB + logsMB + jobsMB + tempMB;

  const lines: string[] = [];
  lines.push('');
  lines.push(bold('DISCO (~/.108ai) — DETTAGLIO'));
  lines.push('');
  lines.push(`  ${gray('Cache:')}         ${formatMB(cacheMB)}`);
  lines.push(`  ${gray('Logs:')}          ${formatMB(logsMB)}`);
  lines.push(`  ${gray('Job history:')}   ${formatMB(jobsMB)}`);
  lines.push(`  ${gray('Temp:')}          ${formatMB(tempMB)}`);
  lines.push(`  ${gray('─'.repeat(28))}`);
  lines.push(`  ${gray('Totale usato:')}  ${formatMB(totalMB)}`);

  if (withClean || withPurge) {
    lines.push('');

    let freed = 0;

    // Temp cleanup — always included in both --clean and --purge
    if (tempMB > 0) {
      freed += tempMB;
      lines.push(`  ${green('[OK]')} Temp ripulita: ${formatMB(tempMB)} liberati`);
    } else {
      lines.push(`  ${gray('[--]')} Temp già vuota`);
    }

    if (withPurge) {
      // Aggressive cleanup: also remove expired cache
      if (cacheMB > 0) {
        freed += cacheMB;
        lines.push(`  ${green('[OK]')} Cache eliminata (purge): ${formatMB(cacheMB)} liberati`);
      } else {
        lines.push(`  ${gray('[--]')} Cache già vuota`);
      }
    }

    if (freed > 0) {
      lines.push('');
      lines.push(`  ${bold('Totale liberato:')} ${green(formatMB(freed))}`);
    } else {
      lines.push('');
      lines.push(`  ${gray('Nessuno spazio aggiuntivo da liberare.')}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Token detail
// ---------------------------------------------------------------------------

function renderTokenDetail(
  showToday: boolean,
  showMonth: boolean,
  showTop: boolean,
  setDaily: number | null,
  setMonthly: number | null,
): string {
  const config = loadResourceConfig();

  // Handle budget mutations first
  if (setDaily !== null || setMonthly !== null) {
    const updated: ResourceConfig = {
      ...config,
      tokens: {
        ...config.tokens,
        ...(setDaily   !== null ? { dailyBudget:   setDaily   } : {}),
        ...(setMonthly !== null ? { monthlyBudget: setMonthly } : {}),
      },
    };
    saveResourceConfig(updated);

    const lines: string[] = [];
    lines.push('');
    if (setDaily   !== null) lines.push(`  ${green('[OK]')} Budget giornaliero aggiornato: ${bold(formatTokens(setDaily))}`);
    if (setMonthly !== null) lines.push(`  ${green('[OK]')} Budget mensile aggiornato: ${bold(formatTokens(setMonthly))}`);
    lines.push('');
    return lines.join('\n');
  }

  const usage       = loadTokenUsage();
  const todayUsed   = getTodayUsage();
  const monthUsed   = getMonthUsage();
  const todayBudget = config.tokens.dailyBudget;
  const monthBudget = config.tokens.monthlyBudget;
  const todayPct    = todayBudget > 0 ? (todayUsed / todayBudget) * 100 : 0;
  const monthPct    = monthBudget > 0 ? (monthUsed / monthBudget) * 100 : 0;

  const lines: string[] = [];
  lines.push('');
  lines.push(bold('TOKEN — RIEPILOGO BUDGET'));
  lines.push('');

  // Daily
  if (!showMonth || showToday || (!showToday && !showMonth && !showTop)) {
    const dayBar  = renderProgressBar(todayPct, 20);
    const dayBarC = todayPct < 60 ? green(dayBar) : todayPct < 80 ? yellow(dayBar) : red(dayBar);
    lines.push(`  ${gray('Oggi:')}    [${dayBarC}] ${todayPct.toFixed(0)}%`);
    lines.push(`  ${gray('')}          ${formatTokens(todayUsed)} / ${formatTokens(todayBudget)} token`);
    lines.push('');
  }

  // Monthly
  if (!showToday || showMonth || (!showToday && !showMonth && !showTop)) {
    const monBar  = renderProgressBar(monthPct, 20);
    const monBarC = monthPct < 60 ? green(monBar) : monthPct < 80 ? yellow(monBar) : red(monBar);
    lines.push(`  ${gray('Mese:')}    [${monBarC}] ${monthPct.toFixed(0)}%`);
    lines.push(`  ${gray('')}          ${formatTokens(monthUsed)} / ${formatTokens(monthBudget)} token`);
    lines.push('');
  }

  // Top 5 jobs by token usage this month
  if (showTop) {
    const perJob = Object.entries(usage.perJob)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    lines.push(bold('  TOP 5 JOB PER TOKEN (mese corrente):'));
    lines.push('');

    if (perJob.length === 0) {
      lines.push(`  ${gray('Nessun dato disponibile.')}`);
    } else {
      for (const [jobId, tokens] of perJob) {
        const pct = monthBudget > 0 ? ((tokens / monthBudget) * 100).toFixed(1) : '0';
        lines.push(`  ${gray('•')} ${jobId.padEnd(32)} ${formatTokens(tokens).padStart(8)}  ${gray(`(${pct}% del mese)`)}`);
      }
    }
    lines.push('');
  }

  // Budget settings reminder
  if (!showTop && !showToday && !showMonth) {
    lines.push(`  ${gray('Budget giornaliero:')}  ${formatTokens(todayBudget)}`);
    lines.push(`  ${gray('Budget mensile:')}      ${formatTokens(monthBudget)}`);
    lines.push(`  ${gray('Max per job:')}         ${formatTokens(config.tokens.perJobMax)}`);
    lines.push('');
    lines.push(`  ${gray('Per modificare: /risorse tokens --set-daily <n> / --set-monthly <n>')}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Config display / set
// ---------------------------------------------------------------------------

function renderConfig(setKey: string | null, setValue: string | null): string {
  const config = loadResourceConfig();

  if (setKey !== null && setValue !== null) {
    // Dot-notation key: e.g. "memory.warningPercent"
    const parts  = setKey.split('.');
    const parsed = Number(setValue);
    const value  = Number.isFinite(parsed) ? parsed : (setValue === 'true' ? true : setValue === 'false' ? false : setValue);

    // Apply the value via path walk
    let current: Record<string, unknown> = config as unknown as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (typeof current[part] !== 'object' || current[part] === null) {
        return `\n  ${red('[ERR]')} Chiave non trovata: "${setKey}"\n\n`;
      }
      current = current[part] as Record<string, unknown>;
    }

    const lastKey = parts[parts.length - 1]!;
    if (!(lastKey in current)) {
      return `\n  ${red('[ERR]')} Chiave non trovata: "${setKey}"\n\n`;
    }

    current[lastKey] = value;
    saveResourceConfig(config);

    return `\n  ${green('[OK]')} ${setKey} = ${bold(String(value))}\n\n`;
  }

  // Show full config
  const lines: string[] = [];
  lines.push('');
  lines.push(bold('CONFIGURAZIONE RISORSE'));
  lines.push('');

  lines.push(bold('  Memoria:'));
  lines.push(`    ${gray('warningPercent:')}   ${config.memory.warningPercent}%`);
  lines.push(`    ${gray('criticalPercent:')}  ${config.memory.criticalPercent}%`);
  lines.push(`    ${gray('emergencyPercent:')} ${config.memory.emergencyPercent}%`);
  lines.push(`    ${gray('maxHeapMB:')}        ${config.memory.maxHeapMB} MB`);
  lines.push('');

  lines.push(bold('  Disco:'));
  lines.push(`    ${gray('warningPercent:')}       ${config.disk.warningPercent}%`);
  lines.push(`    ${gray('criticalPercent:')}      ${config.disk.criticalPercent}%`);
  lines.push(`    ${gray('emergencyPercent:')}     ${config.disk.emergencyPercent}%`);
  lines.push(`    ${gray('cacheSizeLimitMB:')}     ${config.disk.cacheSizeLimitMB} MB`);
  lines.push(`    ${gray('cacheTTLHours:')}        ${config.disk.cacheTTLHours}h`);
  lines.push(`    ${gray('logRetentionDays:')}     ${config.disk.logRetentionDays} giorni`);
  lines.push(`    ${gray('historyMaxRuns:')}       ${config.disk.historyMaxRuns}`);
  lines.push(`    ${gray('tempCleanIntervalHours:')} ${config.disk.tempCleanIntervalHours}h`);
  lines.push('');

  lines.push(bold('  Token:'));
  lines.push(`    ${gray('dailyBudget:')}        ${formatTokens(config.tokens.dailyBudget)}`);
  lines.push(`    ${gray('monthlyBudget:')}      ${formatTokens(config.tokens.monthlyBudget)}`);
  lines.push(`    ${gray('perJobMax:')}          ${formatTokens(config.tokens.perJobMax)}`);
  lines.push(`    ${gray('warningPercent:')}     ${config.tokens.warningPercent}%`);
  lines.push(`    ${gray('criticalPercent:')}    ${config.tokens.criticalPercent}%`);
  lines.push(`    ${gray('hardStopPercent:')}    ${config.tokens.hardStopPercent}%`);
  lines.push(`    ${gray('killSwitchMultiplier:')} ${config.tokens.killSwitchMultiplier}x`);
  lines.push('');

  lines.push(bold('  Generale:'));
  lines.push(`    ${gray('autoHealEnabled:')}    ${config.autoHealEnabled ? green('sì') : gray('no')}`);
  lines.push(`    ${gray('monitorIntervalMs:')}  ${config.monitorIntervalMs}ms`);
  lines.push(`    ${gray('notifyOnWarning:')}    ${config.notifyOnWarning ? green('sì') : gray('no')}`);
  lines.push(`    ${gray('notifyOnCritical:')}   ${config.notifyOnCritical ? green('sì') : gray('no')}`);
  lines.push('');
  lines.push(`  ${gray('Per modificare: /risorse config --set <chiave.dot> <valore>')}`);
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Healing history
// ---------------------------------------------------------------------------

function renderHealingHistory(): string {
  const history = getHealingHistory();

  const lines: string[] = [];
  lines.push('');
  lines.push(bold('CRONOLOGIA HEALING'));
  lines.push('');

  if (!history || history.length === 0) {
    lines.push(`  ${gray('Nessuna azione di healing registrata.')}`);
    lines.push('');
    return lines.join('\n');
  }

  for (const entry of history) {
    const when = typeof entry.timestamp === 'number'
      ? formatRelativeSeconds(Date.now() - entry.timestamp)
      : String(entry.timestamp ?? '');

    for (const action of entry.actions) {
      const outcome = action.success ? green('[OK]') : red('[ERR]');
      lines.push(`  ${outcome} ${gray(when.padEnd(22))} ${action.action}`);
      if (action.detail) {
        lines.push(`       ${gray(action.detail)}`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Reset flags
// ---------------------------------------------------------------------------

function renderReset(): string {
  const wasDowngraded = isModelDowngraded();
  const wasBlocked    = isLLMBlocked();

  resetModelDowngrade();
  resetLLMBlock();

  const lines: string[] = [];
  lines.push('');
  lines.push(bold('RESET FLAGS'));
  lines.push('');
  lines.push(`  ${green('[OK]')} Model downgrade: ${wasDowngraded ? yellow('era attivo') + ' → reset' : gray('non attivo')}`);
  lines.push(`  ${green('[OK]')} LLM block:       ${wasBlocked    ? yellow('era attivo') + ' → reset' : gray('non attivo')}`);
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function renderResourceHelp(): string {
  return [
    '',
    bold('COMANDI RISORSE:'),
    '',
    `  ${gray('/risorse')}                         Dashboard completo`,
    `  ${gray('/risorse overview')}                Dashboard completo`,
    `  ${gray('/risorse memory')}                  Dettaglio memoria heap`,
    `  ${gray('/risorse memory --gc')}             Memoria + forza GC`,
    `  ${gray('/risorse disk')}                    Dettaglio disco`,
    `  ${gray('/risorse disk --clean')}            Disco + pulizia temp/cache scaduta`,
    `  ${gray('/risorse disk --purge')}            Disco + pulizia aggressiva`,
    `  ${gray('/risorse tokens')}                  Riepilogo token`,
    `  ${gray('/risorse tokens --today')}          Uso token oggi`,
    `  ${gray('/risorse tokens --month')}          Uso token mese`,
    `  ${gray('/risorse tokens --top')}            Top 5 job per token`,
    `  ${gray('/risorse tokens --set-daily <n>')}  Imposta budget giornaliero`,
    `  ${gray('/risorse tokens --set-monthly <n>')} Imposta budget mensile`,
    `  ${gray('/risorse config')}                  Mostra configurazione`,
    `  ${gray('/risorse config --set <chiave> <valore>')} Aggiorna un valore`,
    `  ${gray('/risorse history')}                 Cronologia healing`,
    `  ${gray('/risorse reset')}                   Reset flag downgrade/block`,
    '',
    bold('COMANDI HEALTH:'),
    '',
    `  ${gray('/health')}                          Health check compatto`,
    `  ${gray('/health --fix')}                    Health check + auto-healing`,
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main: handleResourceCommand
// ---------------------------------------------------------------------------

/**
 * Handler principale per il comando /risorse.
 *
 * @param args - Argomenti dopo "/risorse" (es. ["memory", "--gc"])
 * @returns Stringa formattata ANSI pronta per il terminale. Non lancia mai eccezioni.
 */
export async function handleResourceCommand(args: string[]): Promise<string> {
  try {
    return await _handleResourceCommand(args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `\n  ${red('[ERR]')} Errore inatteso: ${msg}\n\n`;
  }
}

async function _handleResourceCommand(args: string[]): Promise<string> {
  const sub = (args[0] ?? '').toLowerCase();

  // /risorse  or  /risorse overview
  if (sub === '' || sub === 'overview') {
    return renderOverview();
  }

  // /risorse help
  if (sub === 'help' || sub === '-h' || sub === '--help') {
    return renderResourceHelp();
  }

  // /risorse memory [--gc]
  if (sub === 'memory' || sub === 'mem') {
    const withGC = args.includes('--gc');
    return renderMemoryDetail(withGC);
  }

  // /risorse disk [--clean] [--purge]
  if (sub === 'disk') {
    const withClean = args.includes('--clean');
    const withPurge = args.includes('--purge');
    return renderDiskDetail(withClean, withPurge);
  }

  // /risorse tokens [--today] [--month] [--top] [--set-daily N] [--set-monthly N]
  if (sub === 'tokens' || sub === 'token') {
    const showToday  = args.includes('--today');
    const showMonth  = args.includes('--month');
    const showTop    = args.includes('--top');

    // --set-daily <n>
    let setDaily: number | null = null;
    const dailyIdx = args.indexOf('--set-daily');
    if (dailyIdx !== -1 && args[dailyIdx + 1] !== undefined) {
      const parsed = Number(args[dailyIdx + 1]);
      if (Number.isFinite(parsed) && parsed > 0) setDaily = parsed;
      else return `\n  ${red('[ERR]')} --set-daily richiede un numero positivo.\n\n`;
    }

    // --set-monthly <n>
    let setMonthly: number | null = null;
    const monthlyIdx = args.indexOf('--set-monthly');
    if (monthlyIdx !== -1 && args[monthlyIdx + 1] !== undefined) {
      const parsed = Number(args[monthlyIdx + 1]);
      if (Number.isFinite(parsed) && parsed > 0) setMonthly = parsed;
      else return `\n  ${red('[ERR]')} --set-monthly richiede un numero positivo.\n\n`;
    }

    return renderTokenDetail(showToday, showMonth, showTop, setDaily, setMonthly);
  }

  // /risorse config [--set <key> <value>]
  if (sub === 'config' || sub === 'cfg') {
    let setKey:   string | null = null;
    let setValue: string | null = null;

    const setIdx = args.indexOf('--set');
    if (setIdx !== -1) {
      setKey   = args[setIdx + 1] ?? null;
      setValue = args[setIdx + 2] ?? null;
      if (setKey === null || setValue === null) {
        return `\n  ${red('[ERR]')} --set richiede <chiave> e <valore>.\n  ${gray('Es: /risorse config --set memory.warningPercent 70')}\n\n`;
      }
    }

    return renderConfig(setKey, setValue);
  }

  // /risorse history
  if (sub === 'history' || sub === 'log') {
    return renderHealingHistory();
  }

  // /risorse reset
  if (sub === 'reset') {
    return renderReset();
  }

  return `\n  ${red('[ERR]')} Sub-comando sconosciuto: "${sub}"\n${renderResourceHelp()}`;
}

// ---------------------------------------------------------------------------
// Main: handleHealthCommand
// ---------------------------------------------------------------------------

/**
 * Handler per il comando /health.
 *
 * @param args - Argomenti dopo "/health" (es. ["--fix"])
 * @returns Stringa formattata ANSI. Non lancia mai eccezioni.
 */
export async function handleHealthCommand(args: string[]): Promise<string> {
  try {
    return await _handleHealthCommand(args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `\n  ${red('[ERR]')} Errore inatteso: ${msg}\n\n`;
  }
}

async function _handleHealthCommand(args: string[]): Promise<string> {
  const withFix = args.includes('--fix');
  const snapshot = takeSnapshot();
  const monitor  = getMonitorStatus();
  const { memory, disk, tokens } = snapshot;

  const downgraded = isModelDowngraded();
  const llmBlocked = isLLMBlocked();

  // Last check relative time
  const lastCheckStr = monitor.lastCheck !== null
    ? formatRelativeSeconds(Date.now() - monitor.lastCheck)
    : gray('mai');

  const intervalSec = Math.round(monitor.intervalMs / 1000);
  const monitorStr  = monitor.running
    ? green(`Attivo (ogni ${intervalSec}s)`)
    : yellow('Inattivo');

  const modelStr = downgraded
    ? yellow('degradato (modello economico)')
    : green('standard (non degradato)');

  const llmStr = llmBlocked
    ? red('Bloccato')
    : green('● Attivo');

  const SEP = gray('─'.repeat(36));

  const lines: string[] = [];
  lines.push('');
  lines.push(bold('  108ai Health Check'));
  lines.push(`  ${SEP}`);
  lines.push(`  ${gray('Memoria:'.padEnd(14))} ${levelIcon(memory.level)} ${levelLabel(memory.level)} (${memory.percent.toFixed(0)}%)`);
  lines.push(`  ${gray('Disco:'.padEnd(14))} ${levelIcon(disk.level)} ${levelLabel(disk.level)} (${disk.percent.toFixed(0)}%)`);
  lines.push(`  ${gray('Token:'.padEnd(14))} ${levelIcon(tokens.level)} ${levelLabel(tokens.level)} (${tokens.todayPercent.toFixed(0)}% giornaliero)`);
  lines.push(`  ${gray('Monitor:'.padEnd(14))} ${monitorStr}`);
  lines.push(`  ${gray('Model:'.padEnd(14))} ${modelStr}`);
  lines.push(`  ${gray('LLM:'.padEnd(14))} ${llmStr}`);
  lines.push(`  ${gray('Ultimo check:'.padEnd(14))} ${lastCheckStr}`);
  lines.push(`  ${SEP}`);

  if (withFix) {
    lines.push('');
    lines.push(`  ${bold('[AUTO-HEALING]')} In esecuzione...`);
    lines.push('');

    const snapshot = takeSnapshot();
    let healActions: Array<{ action: string; success: boolean; detail?: string }> = [];
    try {
      const reports = await runAutoHealing(snapshot);
      healActions = reports.flatMap((report) =>
        report.actions.map((a) => ({
          action: a.action,
          success: a.success,
          detail: a.detail,
        })),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      healActions = [{ action: 'runAutoHealing', success: false, detail: msg }];
    }

    if (healActions.length === 0) {
      lines.push(`  ${gray('Nessuna azione necessaria — tutto nella norma.')}`);
    } else {
      for (const action of healActions) {
        const icon = action.success ? green('[OK]') : red('[ERR]');
        lines.push(`  ${icon} ${action.action}`);
        if (action.detail) {
          lines.push(`       ${gray(action.detail)}`);
        }
      }
    }

    lines.push('');
  }

  lines.push('');
  return lines.join('\n');
}
