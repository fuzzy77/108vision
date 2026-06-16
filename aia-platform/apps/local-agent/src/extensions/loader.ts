import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { COMMANDS_DIR, ensureExtensionDirs } from './paths.js';
import { ensureDefaultPermissions } from './permissions.js';
import { clearFileCommands, registerCommand } from './registry.js';
import { isCommandFile, parseCommandFile } from './commands/parser.js';
import { loadSkillsFromDisk } from './skills/loader.js';
import { loadPersonasFromDisk } from './agents/loader.js';
import { loadMcpServersFromConfig, autoStartMcpServers } from './mcp/manager.js';
import { ensureMcpConfig } from './mcp/config.js';

const SUMMARIZE_EMAIL_YAML = `name: summarize-email
description: "Riassumi le ultime email non lette in punti chiave"
aliases:
  - se
  - riassumi-email
version: 1

params:
  - name: count
    type: number
    default: 1
    description: "Quante email riassumere"

context:
  - source: integration
    name: gmail
    action: list_unread
    limit: "{{params.count}}"

prompt: |
  Riassumi le seguenti email non lette.
  {{#each context.emails}}
  Da: {{from}} — Oggetto: {{subject}} — Data: {{date}}
  Corpo:
  {{body}}

  {{/each}}

  Per ciascuna email fornisci:
  1. Chi scrive e perché
  2. Azione richiesta (se presente)
  3. Urgenza (alta/media/bassa)

  Rispondi in italiano, formato markdown conciso.

output:
  format: markdown
  max_tokens: 1200
  model: fast-cheap
`;

function seedDefaultCommands(): void {
  const summarizePath = join(COMMANDS_DIR, 'summarize-email.yml');
  if (!existsSync(summarizePath)) {
    writeFileSync(summarizePath, SUMMARIZE_EMAIL_YAML, 'utf-8');
  }
}

export function loadCommandsFromDisk(): { loaded: number; errors: string[] } {
  ensureExtensionDirs();
  seedDefaultCommands();
  clearFileCommands();

  const errors: string[] = [];
  let loaded = 0;

  let entries: string[] = [];
  try {
    entries = readdirSync(COMMANDS_DIR);
  } catch {
    return { loaded: 0, errors: ['Impossibile leggere directory commands'] };
  }

  for (const entry of entries) {
    if (!isCommandFile(entry)) continue;

    const filePath = join(COMMANDS_DIR, entry);
    try {
      const definition = parseCommandFile(filePath);
      registerCommand({
        definition,
        origin: 'file',
        filePath,
      });
      loaded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${entry}: ${message}`);
    }
  }

  return { loaded, errors };
}

export interface ExtensionInitResult {
  commandsLoaded: number;
  skillsLoaded: number;
  agentsLoaded: number;
  mcpLoaded: number;
  mcpAutoStarted: string[];
  warnings: string[];
}

async function initMcpLayer(): Promise<{ loaded: number; autoStarted: string[]; errors: string[] }> {
  ensureMcpConfig();
  const mcp = loadMcpServersFromConfig();
  let autoStarted: string[] = [];
  try {
    autoStarted = await autoStartMcpServers();
  } catch {
    autoStarted = [];
  }
  return { loaded: mcp.loaded, autoStarted, errors: mcp.errors };
}

export async function initExtensionsAsync(): Promise<ExtensionInitResult> {
  ensureExtensionDirs();
  ensureDefaultPermissions();

  const cmd = loadCommandsFromDisk();
  const skl = loadSkillsFromDisk();
  const agt = loadPersonasFromDisk();
  const mcp = await initMcpLayer();

  return {
    commandsLoaded: cmd.loaded,
    skillsLoaded: skl.loaded,
    agentsLoaded: agt.loaded,
    mcpLoaded: mcp.loaded,
    mcpAutoStarted: mcp.autoStarted,
    warnings: [...cmd.errors, ...skl.errors, ...agt.errors, ...mcp.errors],
  };
}

export function initExtensions(): ExtensionInitResult {
  ensureExtensionDirs();
  ensureDefaultPermissions();

  const cmd = loadCommandsFromDisk();
  const skl = loadSkillsFromDisk();
  const agt = loadPersonasFromDisk();
  ensureMcpConfig();
  const mcp = loadMcpServersFromConfig();

  return {
    commandsLoaded: cmd.loaded,
    skillsLoaded: skl.loaded,
    agentsLoaded: agt.loaded,
    mcpLoaded: mcp.loaded,
    mcpAutoStarted: [],
    warnings: [...cmd.errors, ...skl.errors, ...agt.errors, ...mcp.errors],
  };
}

export function reloadExtensions(): ExtensionInitResult {
  const cmd = loadCommandsFromDisk();
  const skl = loadSkillsFromDisk();
  const agt = loadPersonasFromDisk();
  const mcp = loadMcpServersFromConfig();
  return {
    commandsLoaded: cmd.loaded,
    skillsLoaded: skl.loaded,
    agentsLoaded: agt.loaded,
    mcpLoaded: mcp.loaded,
    mcpAutoStarted: [],
    warnings: [...cmd.errors, ...skl.errors, ...agt.errors, ...mcp.errors],
  };
}
