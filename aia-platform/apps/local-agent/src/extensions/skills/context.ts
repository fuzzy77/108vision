import type { ExtensionShellContext, SkillContextSource, SkillParamDef } from '../types.js';
import { skillsAllowNetwork } from '../permissions.js';
import { renderTemplate, resolveTemplateValue } from '../commands/template.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface SkillRuntimeContext {
  params: Record<string, string | number | boolean>;
  files: Record<string, string>;
  integrations: Record<string, unknown>;
  detected_tone: string;
}

/** Heuristic tone detection from user message */
export function detectTone(userMessage: string): string {
  const q = userMessage.toLowerCase();
  if (/informal|informale|casual/.test(q)) return 'informal';
  if (/friendly|amichevole/.test(q)) return 'friendly';
  if (/cold|freddo|outreach/.test(q)) return 'cold';
  if (/follow-?up|sollecito|reminder/.test(q)) return 'follow-up';
  return 'formal';
}

export function resolveSkillParams(
  defs: SkillParamDef[] | undefined,
  flags: Record<string, string | number | boolean>,
  userMessage: string,
): Record<string, string | number | boolean> {
  const resolved: Record<string, string | number | boolean> = {
    detected_tone: detectTone(userMessage),
  };

  for (const def of defs ?? []) {
    const flag = flags[def.name];
    if (flag !== undefined) {
      resolved[def.name] = coerceSkillParam(def, flag);
      continue;
    }
    if (def.default !== undefined) {
      resolved[def.name] = def.default as string | number | boolean;
    } else if (def.required) {
      throw new Error(`Parametro skill obbligatorio: ${def.name}`);
    }
  }

  if (resolved['tone'] === undefined && typeof resolved['detected_tone'] === 'string') {
    resolved['tone'] = resolved['detected_tone'];
  }

  return resolved;
}

function coerceSkillParam(
  def: SkillParamDef,
  raw: string | number | boolean,
): string | number | boolean {
  if (def.type === 'boolean') {
    if (typeof raw === 'boolean') return raw;
    return String(raw).toLowerCase() === 'true';
  }
  if (def.type === 'number') {
    const num = Number(raw);
    if (Number.isNaN(num)) throw new Error(`"${def.name}" deve essere numerico`);
    return num;
  }
  if (def.type === 'enum' && def.values?.length) {
    const str = String(raw).toLowerCase();
    if (!def.values.includes(str)) {
      throw new Error(`"${def.name}" deve essere uno di: ${def.values.join(', ')}`);
    }
    return str;
  }
  return String(raw);
}

export async function buildSkillContext(
  sources: SkillContextSource[] | undefined,
  skillDir: string,
  params: Record<string, string | number | boolean>,
  userMessage: string,
  _shellCtx: ExtensionShellContext,
): Promise<SkillRuntimeContext> {
  const result: SkillRuntimeContext = {
    params,
    files: {},
    integrations: {},
    detected_tone: String(params['detected_tone'] ?? detectTone(userMessage)),
  };

  if (!sources?.length) return result;

  const needsNetwork = sources.some((s) => s.type === 'integration');
  if (needsNetwork && !skillsAllowNetwork()) {
    throw new Error(
      'Skill richiede rete (integrazioni). Abilita skills.allow_network in ~/.108ai/permissions.yml',
    );
  }

  for (const source of sources) {
    if (source.condition && !evaluateCondition(source.condition, userMessage)) {
      continue;
    }

    if (source.type === 'file') {
      const relPath = renderTemplate(source.path, {
        params,
        context: { detected_tone: result.detected_tone },
      });
      const absPath = join(skillDir, relPath.replace(/^\.\//, ''));
      if (existsSync(absPath)) {
        const key = relPath.split('/').pop()?.replace('.md', '') ?? 'template';
        result.files[key] = readFileSync(absPath, 'utf-8');
      }
      continue;
    }

    if (source.type === 'integration') {
      const limitRaw = resolveTemplateValue(source.limit, params);
      const limit = typeof limitRaw === 'number' ? limitRaw : Number(limitRaw ?? 5);

      if (source.name === 'gmail' && source.action === 'list_unread') {
        const emails = await fetchGmailUnread(Math.min(Math.max(limit, 1), 10));
        result.integrations.emails = emails;
        continue;
      }

      throw new Error(`Integration skill non supportata: ${source.name}.${source.action}`);
    }
  }

  return result;
}

function evaluateCondition(condition: string, userMessage: string): boolean {
  if (condition === 'when replying') {
    return /rispond|reply|re:\s/i.test(userMessage);
  }
  return true;
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
    throw new Error('Gmail non configurato (GOOGLE_CLIENT_ID/SECRET + /connect gmail)');
  }

  const { getValidAccessToken } = await import('../../integrations/google-auth.js');
  const { listMessages, getMessage } = await import('../../integrations/gmail.js');

  const accessToken = await getValidAccessToken({
    clientId,
    clientSecret,
    scopes: [],
  });

  if (!accessToken) {
    throw new Error('Token Google assente. Esegui /connect gmail');
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
      body: full.body.slice(0, 3000),
      date: full.date,
    });
  }

  return emails;
}

/** Format skill context for LLM user message appendix */
export function formatSkillContextBlock(ctx: SkillRuntimeContext): string {
  const parts: string[] = [];

  for (const [name, content] of Object.entries(ctx.files)) {
    parts.push(`### Template (${name})\n${content}`);
  }

  if (ctx.integrations.emails) {
    parts.push(`### Email recenti\n${JSON.stringify(ctx.integrations.emails, null, 2)}`);
  }

  if (Object.keys(ctx.params).length > 0) {
    parts.push(`### Parametri\n${JSON.stringify(ctx.params, null, 2)}`);
  }

  return parts.join('\n\n');
}
