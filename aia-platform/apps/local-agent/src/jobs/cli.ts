/**
 * Job CLI — Formatting and command handling for the job engine.
 *
 * Consumed by:
 *  - shell.ts slash commands: /job, /job list, /job run, etc.
 *  - Direct invocation: handleJobCommand(args)
 *
 * Color scheme:
 *  - OK / running   [>]  → green   \x1b[32m
 *  - warning / err  [!]  → yellow  \x1b[33m  / red  \x1b[31m
 *  - paused         [||] → gray    \x1b[90m
 *  - manual / idle  [·]  → gray    \x1b[90m
 *  - headers             → bold    \x1b[1m
 *  - meta / secondary    → gray    \x1b[90m
 *  - info / cyan         → cyan    \x1b[36m
 */

import {
  loadAllJobs,
  findJobByName,
  saveJob,
  deleteJob,
  setJobEnabled,
  getRecentRunsForJob,
  getJobStats,
  generateJobId,
} from './store.js';
import { executeJob } from './executor.js';
import {
  getJobSchedulerStatus,
  getCircuitBreakerState,
  resetCircuitBreaker,
} from './scheduler.js';
import type { Job, JobRun, JobStats, JobDefinition } from './types.js';
import { isJobRunSuccess } from './types.js';

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  gray:   '\x1b[90m',
  cyan:   '\x1b[36m',
} as const;

function bold(s: string):   string { return `${C.bold}${s}${C.reset}`; }
function green(s: string):  string { return `${C.green}${s}${C.reset}`; }
function yellow(s: string): string { return `${C.yellow}${s}${C.reset}`; }
function red(s: string):    string { return `${C.red}${s}${C.reset}`; }
function gray(s: string):   string { return `${C.gray}${s}${C.reset}`; }
function cyan(s: string):   string { return `${C.cyan}${s}${C.reset}`; }

// ---------------------------------------------------------------------------
// Formatting utilities
// ---------------------------------------------------------------------------

function formatCost(usd: number): string {
  if (usd === 0) return gray('$0.00/run');
  return gray(`$${usd.toFixed(2)}/run`);
}

function formatDuration(ms: number): string {
  if (ms < 1000)  return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}

function formatTokens(n: number): string {
  if (n === 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatRelativeTime(isoOrMs: string | number): string {
  const ts = typeof isoOrMs === 'number' ? isoOrMs : new Date(isoOrMs).getTime();
  const diffMs = Date.now() - ts;
  const sec  = Math.floor(diffMs / 1_000);
  const min  = Math.floor(diffMs / 60_000);
  const hrs  = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (sec  <  60) return `${sec}s fa`;
  if (min  <  60) return `${min}min fa`;
  if (hrs  <  24) return `${hrs}h fa`;
  if (days ===  1) return '1 giorno fa';
  return `${days} giorni fa`;
}

function formatAbsoluteTime(isoOrMs: string | number): string {
  const d = typeof isoOrMs === 'number' ? new Date(isoOrMs) : new Date(isoOrMs);
  return d.toLocaleString('it-IT', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function formatFutureTime(isoOrMs: string | number): string {
  const ts = typeof isoOrMs === 'number' ? isoOrMs : new Date(isoOrMs).getTime();
  const diffMs = ts - Date.now();
  if (diffMs <= 0) return 'imminente';
  const min  = Math.floor(diffMs / 60_000);
  const hrs  = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  if (min  <  60) return `tra ${min} min`;
  if (hrs  <  24) return `tra ${hrs}h`;
  return `tra ${days} giorni`;
}

/**
 * Human-readable cron expression in Italian.
 * Best-effort: covers common patterns without a full cron parser.
 */
function describeCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return cron;

  const [min, hour, , , dow] = parts as [string, string, string, string, string];

  // Every N minutes: * /N * * *
  if (min.startsWith('*/') && hour === '*') {
    const n = min.slice(2);
    return `ogni ${n} min`;
  }

  // Every N hours: 0 */N * * *
  if (min === '0' && hour.startsWith('*/')) {
    const n = hour.slice(2);
    return n === '1' ? 'ogni ora' : `ogni ${n}h`;
  }

  // Specific time every day: M H * * *
  if (!min.includes('/') && !hour.includes('/') && !hour.includes(',') && dow === '*') {
    return `${hour.padStart(2, '0')}:${min.padStart(2, '0')}/gg`;
  }

  // Specific time on day of week: M H * * DOW
  if (!min.includes('/') && !hour.includes('/') && dow !== '*') {
    const DAYS_IT: Record<string, string> = {
      '0': 'dom', '1': 'lun', '2': 'mar', '3': 'mer',
      '4': 'gio', '5': 'ven', '6': 'sab',
    };
    const dayName = DAYS_IT[dow] ?? dow;
    return `${dayName} ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
  }

  return cron;
}

function describeTrigger(job: Job): string {
  if (job.trigger.type === 'manual') return 'manual';
  if (job.trigger.type === 'cron' && (job.trigger.schedule ?? job.trigger.cron)) {
    return `cron: ${describeCron(job.trigger.schedule ?? job.trigger.cron!)}`;
  }
  return job.trigger.type;
}

// ---------------------------------------------------------------------------
// Status indicators
// ---------------------------------------------------------------------------

type JobStatus = 'running' | 'ok' | 'error' | 'paused' | 'never';

function getJobStatus(job: Job, lastRun: JobRun | undefined): JobStatus {
  if (!job.enabled) return 'paused';
  if (!lastRun)     return 'never';
  return isJobRunSuccess(lastRun) ? 'ok' : 'error';
}

function statusIndicator(status: JobStatus): string {
  switch (status) {
    case 'running': return green('[>]');
    case 'ok':      return green('[>]');
    case 'error':   return red('[!]');
    case 'paused':  return gray('[||]');
    case 'never':   return gray('[·]');
  }
}

function lastRunLabel(run: JobRun | undefined): string {
  if (!run) return gray('mai eseguito');
  return isJobRunSuccess(run) ? green('OK') : red('ERR');
}

// ---------------------------------------------------------------------------
// /job list
// ---------------------------------------------------------------------------

function renderJobList(jobs: Job[]): string {
  if (jobs.length === 0) {
    return `\n  ${gray('Nessun job configurato.')}\n  ${gray('Crea il primo con: /job create <nome>')}\n\n`;
  }

  const lines: string[] = [];
  lines.push('');
  lines.push(bold(`JOB CONFIGURATI (${jobs.length}):`));
  lines.push('');

  for (const job of jobs) {
    const recentRuns = getRecentRunsForJob(job.id, 1);
    const lastRun    = recentRuns[0];
    const status     = getJobStatus(job, lastRun);
    const indicator  = statusIndicator(status);
    const trigger    = describeTrigger(job);
    const lastLabel  = lastRunLabel(lastRun);
    const stats = getJobStats(job.id);
    const cost = stats.totalRuns > 0
      ? formatCost(stats.totalCost / stats.totalRuns)
      : gray('$-.--/run');

    const namePart    = `${job.name}${status === 'paused' ? gray(' (pausa)') : ''}`;
    const triggerPart = gray(trigger);
    const lastPart    = gray('ultimo:') + ' ' + lastLabel;

    // Fixed-width columns: indicator(5) name(26) trigger(20) last(14) cost
    const nameCol    = namePart.padEnd(26);
    const triggerCol = triggerPart.padEnd(22);

    lines.push(`  ${indicator} ${nameCol} ${triggerCol} ${lastPart.padEnd(16)} ${cost}`);
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// /job status <name>
// ---------------------------------------------------------------------------

function renderJobStatus(job: Job): string {
  const recentRuns = getRecentRunsForJob(job.id, 1);
  const lastRun    = recentRuns[0];
  const status     = getJobStatus(job, lastRun);
  const cbState    = getCircuitBreakerState(job.id);
  const schedStatus = getJobSchedulerStatus();

  const lines: string[] = [];
  lines.push('');
  lines.push(bold(`JOB: ${job.name}`));
  lines.push('');

  // General info
  lines.push(`  ${gray('ID:')}          ${job.id}`);
  lines.push(`  ${gray('Stato:')}       ${statusIndicator(status)} ${status === 'paused' ? 'in pausa' : status === 'never' ? 'mai eseguito' : status}`);
  lines.push(`  ${gray('Trigger:')}     ${describeTrigger(job)}`);
  lines.push(`  ${gray('Abilitato:')}   ${job.enabled ? green('sì') : gray('no')}`);

  // Last run
  if (lastRun) {
    lines.push('');
    lines.push(bold('  Ultimo run:'));
    lines.push(`    ${gray('Quando:')}  ${formatRelativeTime(lastRun.startedAt)} (${formatAbsoluteTime(lastRun.startedAt)})`);
    lines.push(`    ${gray('Esito:')}   ${isJobRunSuccess(lastRun) ? green('OK') : red('ERRORE')}`);
    lines.push(`    ${gray('Durata:')}  ${formatDuration(lastRun.durationMs)}`);
    lines.push(`    ${gray('Token:')}   ${formatTokens(lastRun.totalTokens)}`);
    lines.push(`    ${gray('Costo:')}   $${lastRun.totalCost.toFixed(4)}`);
    if (!isJobRunSuccess(lastRun) && lastRun.error) {
      lines.push(`    ${gray('Errore:')}  ${red(lastRun.error)}`);
    }
  } else {
    lines.push(`  ${gray('Nessun run precedente.')}`);
  }

  // Next scheduled run
  if (schedStatus?.nextFiring) {
    lines.push('');
    lines.push(`  ${gray('Prossimo run:')} ${cyan(formatFutureTime(schedStatus.nextFiring))} (${formatAbsoluteTime(schedStatus.nextFiring)})`);
  }

  if (job.budget) {
    const monthlyCap = job.budget.monthlyCap ?? 0;
    const usedPct = monthlyCap > 0
      ? Math.round(((job.budget.costUsedThisMonth ?? 0) / monthlyCap) * 100)
      : 0;
    lines.push('');
    lines.push(bold('  Budget mensile:'));
    lines.push(`    ${gray('Limite:')}  $${monthlyCap.toFixed(2)}`);
    lines.push(`    ${gray('Usato:')}   $${(job.budget.costUsedThisMonth ?? 0).toFixed(2)} (${usedPct}%)`);
    const barFill   = Math.round(usedPct / 5);
    const bar       = '█'.repeat(barFill) + '░'.repeat(20 - barFill);
    const barColored = usedPct >= 90 ? red(bar) : usedPct >= 70 ? yellow(bar) : green(bar);
    lines.push(`    [${barColored}] ${usedPct}%`);
  }

  // Circuit breaker
  if (cbState) {
    lines.push('');
    const cbLabel = cbState.open
      ? red('APERTO (job bloccato)')
      : green('CHIUSO (normale)');
    lines.push(`  ${gray('Circuit Breaker:')} ${cbLabel}`);
    if (cbState.open && cbState.failures > 0) {
      lines.push(`    ${gray('Fallimenti:')} ${cbState.failures}`);
    }
  }

  const stats = getJobStats(job.id);
  if (stats.totalRuns > 0) {
    lines.push('');
    lines.push(bold('  Statistiche:'));
    lines.push(`    ${gray('Esecuzioni totali:')}  ${stats.totalRuns}`);
    lines.push(`    ${gray('Successi:')}           ${Math.round(stats.totalRuns * stats.successRate)} (${(stats.successRate * 100).toFixed(1)}%)`);
    lines.push(`    ${gray('Token totali:')}       ${formatTokens(stats.totalTokens)}`);
    lines.push(`    ${gray('Costo totale:')}       $${stats.totalCost.toFixed(4)}`);
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// /job history <name>
// ---------------------------------------------------------------------------

function renderJobHistory(job: Job): string {
  const runs = getRecentRunsForJob(job.id, 10);

  const lines: string[] = [];
  lines.push('');
  lines.push(bold(`STORIA JOB: ${job.name}`));
  lines.push('');

  if (runs.length === 0) {
    lines.push(`  ${gray('Nessuna esecuzione registrata.')}`);
    lines.push('');
    return lines.join('\n');
  }

  // Header row
  lines.push(
    `  ${gray('Data'.padEnd(18))} ${gray('Esito'.padEnd(7))} ${gray('Durata'.padEnd(8))} ${gray('Token'.padEnd(8))} ${gray('Costo')}`
  );
  lines.push(`  ${gray('─'.repeat(52))}`);

  for (const run of runs) {
    const date     = formatAbsoluteTime(run.startedAt);
    const outcome  = isJobRunSuccess(run) ? green('OK ') : red('ERR');
    const duration = formatDuration(run.durationMs);
    const tokens   = formatTokens(run.totalTokens);
    const cost     = `$${run.totalCost.toFixed(4)}`;
    const errNote  = !isJobRunSuccess(run) && run.error ? `  ${gray(run.error.slice(0, 45))}` : '';

    lines.push(
      `  ${date.padEnd(18)} ${outcome.padEnd(7)} ${duration.padEnd(8)} ${tokens.padEnd(8)} ${cost}${errNote}`
    );
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// /job budget
// ---------------------------------------------------------------------------

function renderBudgetOverview(jobs: Job[]): string {
  const jobsWithBudget = jobs.filter((j) => (j.budget?.monthlyCap ?? 0) > 0);

  const lines: string[] = [];
  lines.push('');
  lines.push(bold('BUDGET JOB — MESE CORRENTE:'));
  lines.push('');

  if (jobsWithBudget.length === 0) {
    lines.push(`  ${gray('Nessun job ha un budget configurato.')}`);
    lines.push('');
    return lines.join('\n');
  }

  // Header
  lines.push(
    `  ${'Job'.padEnd(26)} ${'Usato'.padEnd(12)} ${'Limite'.padEnd(10)} ${'%'.padEnd(6)} Barra`
  );
  lines.push(`  ${gray('─'.repeat(68))}`);

  let totalUsed  = 0;
  let totalLimit = 0;

  for (const job of jobsWithBudget) {
    const used  = job.budget!.costUsedThisMonth ?? 0;
    const limit = job.budget!.monthlyCap ?? 0;
    const pct   = limit > 0 ? Math.round((used / limit) * 100) : 0;

    totalUsed  += used;
    totalLimit += limit;

    const fill    = Math.round(pct / 10);
    const bar     = '█'.repeat(fill) + '░'.repeat(10 - fill);
    const barCol  = pct >= 90 ? red(bar) : pct >= 70 ? yellow(bar) : green(bar);

    lines.push(
      `  ${job.name.padEnd(26)} ${'$' + used.toFixed(2).padEnd(11)} ${'$' + limit.toFixed(2).padEnd(9)} ${String(pct).padStart(3)}%  ${barCol}`
    );
  }

  // Totals
  const totalPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
  lines.push(`  ${gray('─'.repeat(68))}`);
  lines.push(
    `  ${'TOTALE'.padEnd(26)} ${'$' + totalUsed.toFixed(2).padEnd(11)} ${'$' + totalLimit.toFixed(2).padEnd(9)} ${String(totalPct).padStart(3)}%`
  );
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// /job stats
// ---------------------------------------------------------------------------

function renderAggregateStats(jobs: Job[], stats: JobStats): string {
  const active  = jobs.filter(j => j.enabled && j.trigger.type !== 'manual').length;
  const paused  = jobs.filter(j => !j.enabled).length;
  const manual  = jobs.filter(j => j.trigger.type === 'manual').length;

  // Find job with next scheduled run
  let nextJobName: string | undefined;
  let nextRunAt:   string | undefined;

  const sched = getJobSchedulerStatus();
  if (sched.nextFiring) {
    nextRunAt = sched.nextFiring;
    nextJobName = jobs.find((j) => j.enabled && j.trigger.type === 'cron')?.name;
  }

  const successRate = stats.totalRuns > 0
    ? ((stats.successRuns / stats.totalRuns) * 100).toFixed(1)
    : '0.0';

  const lines: string[] = [];
  lines.push('');
  lines.push(bold('STATISTICHE JOB:'));
  lines.push('');
  lines.push(`  ${gray('Totale job:')}        ${jobs.length} (${active} attivi, ${paused} pausa, ${manual} manuali)`);
  lines.push(`  ${gray('Esecuzioni totali:')}   ${stats.totalRuns} | ${gray('Successo:')} ${stats.successRuns} (${successRate}%)`);
  lines.push(`  ${gray('Token totali:')}        ${formatTokens(stats.totalTokens)} | ${gray('Costo:')} $${stats.totalCostUsd.toFixed(2)}`);

  if (nextJobName && nextRunAt) {
    lines.push(`  ${gray('Prossima esecuzione:')} ${cyan(nextJobName)} (${formatFutureTime(nextRunAt)})`);
  } else {
    lines.push(`  ${gray('Prossima esecuzione:')} ${gray('nessuna pianificata')}`);
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// /job run <name> [--dry-run]
// ---------------------------------------------------------------------------

async function runJobCommand(nameArg: string, dryRun: boolean): Promise<string> {
  const job = findJobByName(nameArg);
  if (!job) {
    return `\n  ${red('[ERR]')} Job non trovato: "${nameArg}"\n  ${gray('Usa /job list per vedere i job disponibili.')}\n\n`;
  }

  if (dryRun) {
    return renderDryRun(job);
  }

  const lines: string[] = [];
  lines.push('');
  lines.push(`  ${cyan('[>]')} Esecuzione in corso: ${bold(job.name)}`);
  lines.push('');

  // Show steps as they are defined
  if (job.steps && job.steps.length > 0) {
    for (const step of job.steps) {
      lines.push(`  ${gray('•')} ${step.description ?? step.id}...`);
    }
    lines.push('');
  }

  // Execute job directly for full run details
  let run: JobRun;
  try {
    run = await executeJob(job, 'manual');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return lines.join('\n') + `  ${red('[ERR]')} ${msg}\n\n`;
  }

  lines.push(
    isJobRunSuccess(run)
      ? `  ${green('[OK]')} Completato in ${formatDuration(run.durationMs)}`
      : `  ${red('[ERR]')} Fallito dopo ${formatDuration(run.durationMs)}`
  );
  lines.push(`  ${gray('Token:')} ${formatTokens(run.totalTokens)}   ${gray('Costo:')} $${run.totalCost.toFixed(4)}`);

  if (!isJobRunSuccess(run) && run.error) {
    lines.push(`  ${gray('Errore:')} ${red(run.error)}`);
  }

  lines.push('');
  return lines.join('\n');
}

function renderDryRun(job: Job): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(bold(`DRY-RUN: ${job.name}`));
  lines.push(gray('  (nessuna esecuzione reale — solo simulazione)'));
  lines.push('');

  if (!job.steps || job.steps.length === 0) {
    lines.push(`  ${gray('Nessuno step definito.')}`);
    lines.push('');
    return lines.join('\n');
  }

  lines.push(`  ${gray('Step che verrebbero eseguiti:')}`);
  lines.push('');

  for (let i = 0; i < job.steps.length; i++) {
    const step = job.steps[i]!;
    lines.push(`  ${gray(String(i + 1) + '.')} ${bold(step.description ?? step.id)}`);
    lines.push(`     ${gray('Tipo:')}    ${step.type}`);
    if (step.prompt) {
      // Show prompt with resolved template variables (best-effort: show raw template)
      const preview = step.prompt.slice(0, 120).replace(/\n/g, ' ');
      lines.push(`     ${gray('Prompt:')}  ${preview}${step.prompt.length > 120 ? '...' : ''}`);
    }
    if (step.model) {
      lines.push(`     ${gray('Modello:')} ${step.model}`);
    }
    lines.push(`     ${gray('Output:')}  → {{steps.${step.id}.output}}`);
    lines.push('');
  }

  if (job.budget) {
    const limit = job.budget.monthlyCap ?? 0;
    const used  = job.budget.costUsedThisMonth ?? 0;
    const remaining = limit - used;
    lines.push(`  ${gray('Budget disponibile:')} $${remaining.toFixed(2)} di $${limit.toFixed(2)} mensile`);
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// /job create <name>
// ---------------------------------------------------------------------------

function createJobCommand(nameArg: string): string {
  if (!nameArg.trim()) {
    return `\n  ${red('[ERR]')} Specifica un nome per il job.\n  ${gray('Es: /job create "Report Settimanale"')}\n\n`;
  }

  const existing = findJobByName(nameArg);
  if (existing) {
    return `\n  ${yellow('[!]')} Esiste già un job con nome "${existing.name}" (${existing.id}).\n\n`;
  }

  const id = generateJobId(nameArg.trim());
  const now = new Date().toISOString();
  const newJob: JobDefinition = {
    id,
    name: nameArg.trim(),
    description: '',
    version: 1,
    enabled: true,
    trigger: { type: 'manual' },
    steps: [],
    budget: { maxTokensPerRun: 5_000 },
    onFailure: { strategy: 'abort' },
    metadata: { created: now, updated: now, tags: [] },
  };

  try {
    saveJob(newJob);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `\n  ${red('[ERR]')} Salvataggio fallito: ${msg}\n\n`;
  }

  const jobsDir = `~/.108ai/jobs`;
  return [
    '',
    `  ${green('[OK]')} Job creato: ${bold(newJob.name)}`,
    `  ${gray('ID:')} ${id}`,
    '',
    `  ${gray('Modifica il file per configurare steps e trigger:')}`,
    `  ${cyan(`${jobsDir}/${id}.json`)}`,
    '',
    `  ${gray('Esempio minimo:')}\n${gray('  {\n    "trigger": { "type": "cron", "cron": "0 17 * * 5" },\n    "steps": [{ "type": "llm", "name": "Genera report", "prompt": "..." }]\n  }')}`,
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// /job delete <name>
// ---------------------------------------------------------------------------

function deleteJobCommand(nameArg: string): string {
  const job = findJobByName(nameArg);
  if (!job) {
    return `\n  ${red('[ERR]')} Job non trovato: "${nameArg}"\n\n`;
  }

  try {
    deleteJob(job.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `\n  ${red('[ERR]')} Eliminazione fallita: ${msg}\n\n`;
  }

  return `\n  ${green('[OK]')} Job eliminato: ${bold(job.name)} (${job.id})\n\n`;
}

// ---------------------------------------------------------------------------
// /job pause <name> / /job resume <name>
// ---------------------------------------------------------------------------

function toggleJobEnabled(nameArg: string, enable: boolean): string {
  const job = findJobByName(nameArg);
  if (!job) {
    return `\n  ${red('[ERR]')} Job non trovato: "${nameArg}"\n\n`;
  }

  if (job.enabled === enable) {
    const stato = enable ? 'già abilitato' : 'già in pausa';
    return `\n  ${yellow('[!]')} ${bold(job.name)} è ${stato}.\n\n`;
  }

  try {
    setJobEnabled(job.id, enable);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `\n  ${red('[ERR]')} ${msg}\n\n`;
  }

  const action = enable ? `${green('[OK]')} ripreso` : `${yellow('[||]')} messo in pausa`;
  return `\n  ${action}: ${bold(job.name)}\n\n`;
}

// ---------------------------------------------------------------------------
// /job reset-cb <name>
// ---------------------------------------------------------------------------

function resetCbCommand(nameArg: string): string {
  const job = findJobByName(nameArg);
  if (!job) {
    return `\n  ${red('[ERR]')} Job non trovato: "${nameArg}"\n\n`;
  }

  try {
    resetCircuitBreaker(job.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `\n  ${red('[ERR]')} ${msg}\n\n`;
  }

  return `\n  ${green('[OK]')} Circuit breaker resettato: ${bold(job.name)}\n\n`;
}

function aggregateJobStats(jobs: JobDefinition[]): JobStats {
  let totalRuns = 0;
  let successRuns = 0;
  let totalTokens = 0;
  let totalCost = 0;

  for (const job of jobs) {
    const s = getJobStats(job.id);
    totalRuns += s.totalRuns;
    successRuns += Math.round(s.totalRuns * s.successRate);
    totalTokens += s.totalTokens;
    totalCost += s.totalCost;
  }

  return {
    totalRuns,
    successRuns,
    successRate: totalRuns > 0 ? (successRuns / totalRuns) * 100 : 0,
    totalTokens,
    totalCostUsd: totalCost,
    avgDurationMs: 0,
  };
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function renderHelp(): string {
  return [
    '',
    bold('COMANDI JOB:'),
    '',
    `  ${cyan('/job')}                    Lista tutti i job`,
    `  ${cyan('/job list')}               Lista tutti i job`,
    `  ${cyan('/job run <nome>')}         Esegui un job immediatamente`,
    `  ${cyan('/job run <nome> --dry-run')} Simula senza eseguire`,
    `  ${cyan('/job status <nome>')}      Stato dettagliato di un job`,
    `  ${cyan('/job history <nome>')}     Ultimi 10 run di un job`,
    `  ${cyan('/job create <nome>')}      Crea un nuovo job (trigger: manual)`,
    `  ${cyan('/job delete <nome>')}      Elimina un job`,
    `  ${cyan('/job pause <nome>')}       Metti in pausa un job`,
    `  ${cyan('/job resume <nome>')}      Riabilita un job in pausa`,
    `  ${cyan('/job budget')}             Budget mensile di tutti i job`,
    `  ${cyan('/job stats')}              Statistiche aggregate`,
    `  ${cyan('/job reset-cb <nome>')}    Resetta circuit breaker`,
    '',
    gray('  I nomi job accettano corrispondenze parziali (case-insensitive).'),
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main command handler
// ---------------------------------------------------------------------------

/**
 * Main entry point called by shell.ts for /job commands.
 *
 * Handles: /job [list|run|status|history|create|delete|pause|resume|budget|stats|reset-cb]
 *
 * @param args string[] — everything after "/job" (e.g. ["run", "Report Vendite", "--dry-run"])
 * @returns Formatted string ready to write to process.stdout. Never throws.
 */
export async function handleJobCommand(args: string[]): Promise<string> {
  try {
    return await _handleJobCommand(args);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `\n  ${red('[ERR]')} Errore inatteso: ${msg}\n\n`;
  }
}

async function _handleJobCommand(args: string[]): Promise<string> {
  const sub = (args[0] ?? '').toLowerCase();

  // /job  or  /job list
  if (sub === '' || sub === 'list') {
    const jobs = loadAllJobs();
    return renderJobList(jobs);
  }

  // /job help
  if (sub === 'help' || sub === '-h' || sub === '--help') {
    return renderHelp();
  }

  // /job stats
  if (sub === 'stats') {
    const jobs  = loadAllJobs();
    const stats = aggregateJobStats(jobs);
    return renderAggregateStats(jobs, stats);
  }

  // /job budget
  if (sub === 'budget') {
    const jobs = loadAllJobs();
    return renderBudgetOverview(jobs);
  }

  // /job create <name>
  if (sub === 'create') {
    const nameArg = args.slice(1).join(' ');
    return createJobCommand(nameArg);
  }

  // Commands that require <name> arg
  const nameArg = args.slice(1).filter(a => !a.startsWith('--')).join(' ');

  if (!nameArg.trim()) {
    return `\n  ${red('[ERR]')} Specifica il nome del job.\n  ${gray('Es: /job ' + sub + ' "Nome Job"')}\n${renderHelp()}`;
  }

  // /job run <name> [--dry-run]
  if (sub === 'run') {
    const dryRun = args.includes('--dry-run');
    return runJobCommand(nameArg, dryRun);
  }

  // /job status <name>
  if (sub === 'status') {
    const job = findJobByName(nameArg);
    if (!job) {
      return `\n  ${red('[ERR]')} Job non trovato: "${nameArg}"\n  ${gray('Usa /job list per vedere i job disponibili.')}\n\n`;
    }
    return renderJobStatus(job);
  }

  // /job history <name>
  if (sub === 'history') {
    const job = findJobByName(nameArg);
    if (!job) {
      return `\n  ${red('[ERR]')} Job non trovato: "${nameArg}"\n  ${gray('Usa /job list per vedere i job disponibili.')}\n\n`;
    }
    return renderJobHistory(job);
  }

  // /job delete <name>
  if (sub === 'delete' || sub === 'del' || sub === 'rm') {
    return deleteJobCommand(nameArg);
  }

  // /job pause <name>
  if (sub === 'pause') {
    return toggleJobEnabled(nameArg, false);
  }

  // /job resume <name>
  if (sub === 'resume' || sub === 'enable') {
    return toggleJobEnabled(nameArg, true);
  }

  // /job reset-cb <name>
  if (sub === 'reset-cb' || sub === 'reset') {
    return resetCbCommand(nameArg);
  }

  return `\n  ${red('[ERR]')} Sub-comando sconosciuto: "${sub}"\n${renderHelp()}`;
}
