import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';

import { COMMANDS_DIR } from '../paths.js';
import type { ImportResult } from './claude.js';

interface N8nWorkflow {
  name?: string;
  nodes?: Array<{ name?: string; type?: string; parameters?: Record<string, unknown> }>;
}

export function importN8nWorkflow(filePath: string): ImportResult {
  const imported: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(filePath)) {
    return { ok: false, message: `File non trovato: ${filePath}`, imported, warnings };
  }

  let workflow: N8nWorkflow;
  try {
    workflow = JSON.parse(readFileSync(filePath, 'utf-8')) as N8nWorkflow;
  } catch {
    return { ok: false, message: 'JSON workflow n8n non valido', imported, warnings };
  }

  const baseName = (workflow.name ?? basename(filePath, '.json'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const httpNodes = (workflow.nodes ?? []).filter((n) =>
    (n.type ?? '').toLowerCase().includes('http'),
  );

  const nodeSummary = httpNodes
    .map((n) => `- ${n.name ?? 'node'} (${n.type})`)
    .join('\n');

  const commandName = `n8n-${baseName}`.slice(0, 48);
  const target = join(COMMANDS_DIR, `${commandName}.yml`);

  const def = {
    name: commandName,
    description: `Importato da workflow n8n: ${workflow.name ?? baseName}`,
    version: 1,
    params: [{ name: 'payload', type: 'string', required: false }],
    prompt: `Workflow n8n importato (${workflow.name ?? baseName}).

Nodi HTTP rilevati:
${nodeSummary || '(nessun nodo HTTP)'}

Input utente:
{{params.payload}}

Genera un piano operativo per eseguire manualmente o automatizzare questo flusso in 108 AI.`,
    output: { model: 'balanced', max_tokens: 2000 },
  };

  if (!existsSync(COMMANDS_DIR)) mkdirSync(COMMANDS_DIR, { recursive: true });
  writeFileSync(target, stringifyYaml(def), 'utf-8');
  imported.push(target);

  if (httpNodes.length === 0) {
    warnings.push('Nessun nodo HTTP trovato — generato solo command stub');
  }

  return {
    ok: true,
    message: `Import n8n completato (${imported.length} file)`,
    imported,
    warnings,
  };
}
