import { handleJobCommand } from '../../jobs/cli.js';
import {
  handleMorningCommand,
  handleStandupCommand,
  handleTriageCommand,
} from '../../triage/cli.js';
import {
  enableSchedule,
  getScheduleStatus,
  setSchedule,
} from '../../triage/scheduler.js';
import type { ExtensionShellContext, RegisteredCommand } from '../types.js';
import { registerCommand, resolveCommand } from '../registry.js';

export type BuiltinCommandId = 'triage' | 'morning' | 'standup' | 'job' | 'schedule';

type BuiltinHandler = (
  args: string[],
  ctx: ExtensionShellContext,
) => Promise<string>;

const C = {
  ok: '\x1b[32m[OK]\x1b[0m',
  err: '\x1b[31m[ERR]\x1b[0m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
} as const;

async function handleScheduleBuiltin(args: string[]): Promise<string> {
  const sub = args[0]?.toLowerCase();

  if (!sub || sub === 'status') {
    const status = getScheduleStatus();
    return [
      '',
      `  ${C.bold}Triage Scheduler:${C.reset}`,
      `  Attivo:     ${status.enabled ? `${C.green}si${C.reset}` : `${C.gray}no${C.reset}`}`,
      `  Cron:       ${status.cron}`,
      `  Ultimo run: ${status.lastRun ?? 'mai'}`,
      `  Prossimo:   ${status.nextRun ?? 'n/a'}`,
      '',
    ].join('\n');
  }

  if (sub === 'on') {
    enableSchedule(true);
    return `  ${C.ok} Scheduler attivato.\n`;
  }

  if (sub === 'off') {
    enableSchedule(false);
    return `  ${C.ok} Scheduler disattivato.\n`;
  }

  if (sub === 'set') {
    const cron = args.slice(1).join(' ');
    if (!cron) {
      return [
        '  Uso: /schedule set <cron-expression>',
        '  Es: /schedule set 0 7 * * 1-5  (lun-ven ore 7:00)',
        '',
      ].join('\n');
    }
    try {
      setSchedule(cron);
      return `  ${C.ok} Schedule impostato: ${cron}\n`;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `  ${C.err} ${message}\n`;
    }
  }

  return '  Sub-comandi: status, on, off, set <cron>\n';
}

const BUILTIN_HANDLERS: Record<BuiltinCommandId, BuiltinHandler> = {
  triage: async (args) => handleTriageCommand(args),
  morning: async (args) => handleMorningCommand(args),
  standup: async (args) => handleStandupCommand(args),
  job: async (args) => handleJobCommand(args),
  schedule: async (args) => handleScheduleBuiltin(args),
};

/** Resolve a builtin handler by id (from YAML `builtin:` field or fallback registry). */
export function resolveBuiltinHandler(id: string): BuiltinHandler | undefined {
  const key = id.toLowerCase() as BuiltinCommandId;
  return BUILTIN_HANDLERS[key];
}

export function isBuiltinCommandId(id: string): id is BuiltinCommandId {
  return id.toLowerCase() in BUILTIN_HANDLERS;
}

interface BuiltinFallbackDef {
  name: string;
  description: string;
  aliases?: string[];
  builtin: BuiltinCommandId;
}

const BUILTIN_FALLBACKS: BuiltinFallbackDef[] = [
  {
    name: 'triage',
    description: 'Triage completo (email, calendar, PEC, sistema)',
    builtin: 'triage',
  },
  {
    name: 'morning',
    description: 'Morning briefing con greeting e triage completo',
    aliases: ['mattina'],
    builtin: 'morning',
  },
  {
    name: 'standup',
    description: 'Formato standup per daily meeting',
    builtin: 'standup',
  },
  {
    name: 'job',
    description: 'Job engine — lista, esecuzione e gestione job',
    aliases: ['jobs'],
    builtin: 'job',
  },
  {
    name: 'schedule',
    description: 'Scheduler triage automatico (status, on, off, set cron)',
    builtin: 'schedule',
  },
];

/**
 * Register platform builtins when seed YAML files are missing or deleted.
 * File-based definitions in ~/.108ai/commands/ take precedence.
 */
export function registerBuiltinCommandFallbacks(): void {
  for (const def of BUILTIN_FALLBACKS) {
    if (resolveCommand(def.name)) continue;

    const handler = BUILTIN_HANDLERS[def.builtin];
    registerCommand({
      definition: {
        name: def.name,
        description: def.description,
        aliases: def.aliases,
        version: 1,
        builtin: def.builtin,
      },
      origin: 'builtin',
      handler,
    });
  }
}

export function attachBuiltinHandler(
  definition: RegisteredCommand['definition'],
): RegisteredCommand['handler'] | undefined {
  if (!definition.builtin) return undefined;
  return resolveBuiltinHandler(definition.builtin);
}
