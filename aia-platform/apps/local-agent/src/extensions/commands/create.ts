import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';

import { COMMANDS_DIR } from '../paths.js';
import type { CommandDefinition } from '../types.js';

export interface CreateCommandResult {
  ok: boolean;
  path?: string;
  message: string;
}

export function buildCommandScaffold(
  name: string,
  description: string,
): CommandDefinition {
  return {
    name,
    description,
    version: 1,
    params: [
      {
        name: 'input',
        type: 'string',
        required: false,
        description: 'Input opzionale per il command',
      },
    ],
    prompt: `Sei un assistente 108 AI. Esegui il command "${name}".

Contesto utente:
{{params.input}}

Rispondi in italiano, in modo conciso e actionable.`,
    output: {
      format: 'markdown',
      model: 'fast-cheap',
      max_tokens: 1500,
    },
  };
}

export function createCommandFile(
  name: string,
  description: string,
  overwrite = false,
): CreateCommandResult {
  const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (!safeName) {
    return { ok: false, message: 'Nome command non valido' };
  }

  const filePath = join(COMMANDS_DIR, `${safeName}.yml`);
  if (existsSync(filePath) && !overwrite) {
    return { ok: false, message: `File già esistente: ${filePath}. Usa --force` };
  }

  const def = buildCommandScaffold(safeName, description || `Command ${safeName}`);
  writeFileSync(filePath, stringifyYaml(def), 'utf-8');

  return {
    ok: true,
    path: filePath,
    message: `Command creato: ${filePath}`,
  };
}
