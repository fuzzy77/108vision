import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';

import { AGENTS_DIR } from '../paths.js';
import { parsePersonaAgentDefinition } from '../schemas.js';
import type { ImportResult } from './claude.js';

interface ChatGptExport {
  name?: string;
  description?: string;
  instructions?: string;
  model?: string;
  tools?: string[];
}

export function importChatGptConfig(filePath: string): ImportResult {
  const imported: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(filePath)) {
    return { ok: false, message: `File non trovato: ${filePath}`, imported, warnings };
  }

  let doc: ChatGptExport;
  try {
    doc = JSON.parse(readFileSync(filePath, 'utf-8')) as ChatGptExport;
  } catch {
    return { ok: false, message: 'JSON export ChatGPT non valido', imported, warnings };
  }

  const name = (doc.name ?? basename(filePath, '.json'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  if (!name) {
    return { ok: false, message: 'Nome agent non derivabile dal export', imported, warnings };
  }

  const agentDef = {
    name,
    display_name: doc.name ?? name,
    description: doc.description ?? `Importato da ChatGPT export`,
    version: '1.0.0',
    system_prompt: doc.instructions?.trim() || 'Assistente importato da ChatGPT.',
    model: doc.model?.includes('gpt-4') ? 'powerful' : 'balanced',
    max_tokens: 3000,
    tools: doc.tools,
    context_window: { strategy: 'sliding', max_messages: 20 },
  };

  parsePersonaAgentDefinition(agentDef);

  if (!existsSync(AGENTS_DIR)) mkdirSync(AGENTS_DIR, { recursive: true });
  const target = join(AGENTS_DIR, `${name}.yml`);
  if (existsSync(target)) {
    warnings.push(`Sovrascritto agent esistente: ${target}`);
  }

  writeFileSync(target, stringifyYaml(agentDef), 'utf-8');
  imported.push(target);

  return {
    ok: true,
    message: `Agent importato da ChatGPT: ${name}`,
    imported,
    warnings,
  };
}
