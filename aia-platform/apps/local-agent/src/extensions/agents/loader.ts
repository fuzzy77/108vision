import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { AGENTS_DIR, ensureExtensionDirs } from '../paths.js';
import { parsePersonaAgentDefinition } from '../schemas.js';
import type { LoadedPersonaAgent, PersonaAgentDefinition } from '../types.js';
import { clearPersonaAgents, registerPersonaAgent } from './registry.js';
import { initActivePersona } from './switcher.js';

const ASSISTANT_YAML = `name: assistant
display_name: Assistente
description: "Assistente generale per task quotidiani e produttività"
version: "1.0.0"
avatar: "🤖"

system_prompt: |
  Sei 108 AI, assistente desktop per professionisti e PMI italiane.
  Rispondi in modo conciso, pratico e orientato all'azione.
  Usa l'italiano salvo diversa richiesta esplicita.
  Non inventare dati; se mancano informazioni, chiedi chiarimenti.

model: balanced
temperature: 0.7
max_tokens: 3000

context_window:
  strategy: sliding
  max_messages: 20
`;

const ACCOUNTANT_YAML = `name: accountant
display_name: Commercialista
description: "Supporto su IVA, fatturazione e adempimenti fiscali per PMI italiane"
version: "1.0.0"
avatar: "📊"

system_prompt: |
  Sei un assistente specializzato in fiscalità e contabilità per PMI italiane.
  Fornisci orientamento su IVA, fatturazione elettronica, scadenze fiscali e adempimenti comuni.
  Non sostituisci un commercialista abilitato: evidenzia quando serve un professionista.
  Cita normative o riferimenti solo se sei ragionevolmente sicuro; altrimenti indica incertezza.

model: balanced
temperature: 0.4
max_tokens: 3000

restrictions:
  disclaimer_required: true
  no_pii_in_output: true
  max_conversation_length: 50

context_window:
  strategy: sliding
  max_messages: 15
`;

function isAgentFile(name: string): boolean {
  return name.endsWith('.yml') || name.endsWith('.yaml');
}

function seedDefaultPersonas(): void {
  const assistantPath = join(AGENTS_DIR, 'assistant.yml');
  const accountantPath = join(AGENTS_DIR, 'accountant.yml');

  if (!existsSync(assistantPath)) {
    writeFileSync(assistantPath, ASSISTANT_YAML, 'utf-8');
  }
  if (!existsSync(accountantPath)) {
    writeFileSync(accountantPath, ACCOUNTANT_YAML, 'utf-8');
  }
}

function loadPersonaFromFile(filePath: string, isDefault = false): LoadedPersonaAgent {
  const raw = parseYaml(readFileSync(filePath, 'utf-8'));
  const definition = parsePersonaAgentDefinition(raw) as PersonaAgentDefinition;
  return {
    definition,
    filePath,
    isDefault,
  };
}

export function loadPersonasFromDisk(): { loaded: number; errors: string[] } {
  ensureExtensionDirs();
  seedDefaultPersonas();
  clearPersonaAgents();

  const errors: string[] = [];
  let loaded = 0;

  let entries: string[] = [];
  try {
    entries = readdirSync(AGENTS_DIR);
  } catch {
    return { loaded: 0, errors: ['Impossibile leggere directory agents'] };
  }

  for (const entry of entries) {
    if (!isAgentFile(entry)) continue;

    const filePath = join(AGENTS_DIR, entry);
    try {
      const isDefault = entry.toLowerCase().startsWith('assistant.');
      const persona = loadPersonaFromFile(filePath, isDefault);
      registerPersonaAgent(persona);
      loaded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${entry}: ${message}`);
    }
  }

  initActivePersona();
  return { loaded, errors };
}
