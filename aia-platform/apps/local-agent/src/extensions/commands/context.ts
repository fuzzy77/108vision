import type { CommandContextSource, CommandParamDef, ExtensionShellContext } from '../types.js';
import { commandsAllowNetwork } from '../permissions.js';
import { resolveTemplateValue } from './template.js';

export interface ParsedCommandArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

/** Parse `/cmd --count 5 foo` into positional args and named flags */
export function parseCommandArgs(rawArgs: string[]): ParsedCommandArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < rawArgs.length; i++) {
    const token = rawArgs[i];
    if (!token) continue;

    if (token.startsWith('--')) {
      const eqIdx = token.indexOf('=');
      if (eqIdx > 2) {
        const key = token.slice(2, eqIdx);
        flags[key] = token.slice(eqIdx + 1);
        continue;
      }

      const key = token.slice(2);
      const next = rawArgs[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
      continue;
    }

    if (token.startsWith('-') && token.length > 1) {
      const key = token.slice(1);
      const next = rawArgs[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
      continue;
    }

    positional.push(token);
  }

  return { positional, flags };
}

/** Merge declared params with CLI args */
export function resolveCommandParams(
  defs: CommandParamDef[] | undefined,
  rawArgs: string[],
): Record<string, string | number | boolean> {
  const parsed = parseCommandArgs(rawArgs);
  const resolved: Record<string, string | number | boolean> = {};

  for (const def of defs ?? []) {
    const flagValue = parsed.flags[def.name];
    if (flagValue !== undefined) {
      resolved[def.name] = coerceParamValue(def, flagValue);
      continue;
    }

    if (def.default !== undefined) {
      resolved[def.name] = def.default;
    } else if (def.required) {
      throw new Error(`Parametro obbligatorio mancante: --${def.name}`);
    }
  }

  // Positional args fill missing params in declaration order
  let posIdx = 0;
  for (const def of defs ?? []) {
    if (resolved[def.name] !== undefined) continue;
    const positional = parsed.positional[posIdx];
    if (positional !== undefined) {
      resolved[def.name] = coerceParamValue(def, positional);
      posIdx++;
    }
  }

  return resolved;
}

function coerceParamValue(
  def: CommandParamDef,
  raw: string | boolean,
): string | number | boolean {
  if (def.type === 'boolean') {
    if (typeof raw === 'boolean') return raw;
    const lower = raw.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'si';
  }

  if (def.type === 'number') {
    const num = Number(raw);
    if (Number.isNaN(num)) {
      throw new Error(`Parametro "${def.name}" deve essere un numero`);
    }
    return num;
  }

  return String(raw);
}

/** Fetch integration context for command execution */
export async function buildCommandContext(
  sources: CommandContextSource[] | undefined,
  params: Record<string, string | number | boolean>,
  _ctx: ExtensionShellContext,
): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {};

  if (!sources?.length) {
    return context;
  }

  if (!commandsAllowNetwork()) {
    throw new Error(
      'Questo command richiede accesso rete (integrazioni). ' +
        'Abilita commands.allow_network in ~/.108ai/permissions.yml',
    );
  }

  for (const source of sources) {
    if (source.source !== 'integration') continue;

    const limitRaw = resolveTemplateValue(source.limit, params);
    const limit = typeof limitRaw === 'number' ? limitRaw : Number(limitRaw ?? 10);

    if (source.name === 'gmail' && source.action === 'list_unread') {
      const emails = await fetchGmailUnread(Math.min(Math.max(limit, 1), 20));
      context.emails = emails;
      continue;
    }

    throw new Error(`Context integration non supportata: ${source.name}.${source.action}`);
  }

  return context;
}

interface EmailContextItem {
  from: string;
  subject: string;
  body: string;
  date: string;
}

async function fetchGmailUnread(limit: number): Promise<EmailContextItem[]> {
  const clientId = process.env['GOOGLE_CLIENT_ID'];
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

  if (!clientId || !clientSecret) {
    throw new Error(
      'Gmail non configurato. Imposta GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET, poi /connect gmail',
    );
  }

  const { getValidAccessToken } = await import('../../integrations/google-auth.js');
  const { listMessages, getMessage } = await import('../../integrations/gmail.js');

  const accessToken = await getValidAccessToken({
    clientId,
    clientSecret,
    scopes: [],
  });

  if (!accessToken) {
    throw new Error('Token Google assente o scaduto. Esegui /connect gmail');
  }

  const listed = await listMessages(accessToken, {
    query: 'is:unread in:inbox',
    maxResults: limit,
  });

  const emails: EmailContextItem[] = [];

  for (const meta of listed.messages) {
    const full = await getMessage(accessToken, meta.id);
    emails.push({
      from: full.from,
      subject: full.subject,
      body: full.body.slice(0, 4000),
      date: full.date,
    });
  }

  return emails;
}
