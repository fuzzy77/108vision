import { readFileSync, writeFileSync } from 'node:fs';

import type { ExtensionShellContext } from '../types.js';
import { loadPersonasFromDisk } from './loader.js';
import { chatWithPersonaByName } from './executor.js';
import { askMultiplePersonas } from './multi.js';
import {
  getActivePersona,
  getActivePersonaName,
  resetActivePersonaHistory,
  setActivePersona,
} from './switcher.js';
import { listPersonaAgents, resolvePersonaAgent } from './registry.js';
import { clearPersonaHistory, loadPersonaHistory } from './history.js';

function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

function ok(text: string): string {
  return `\x1b[32m${text}\x1b[0m`;
}

function dim(text: string): string {
  return `\x1b[90m${text}\x1b[0m`;
}

function formatAgentList(): string {
  const agents = listPersonaAgents();
  const active = getActivePersonaName();
  const lines = [`  ${bold('Persona agents')} (~/.108ai/agents/)\n`];

  if (agents.length === 0) {
    lines.push('  (nessun agent caricato)\n');
    return lines.join('\n');
  }

  for (const agent of agents) {
    const d = agent.definition;
    const marker = d.name === active ? ok('*') : ' ';
    const avatar = d.avatar ?? '  ';
    const label = d.display_name ?? d.name;
    lines.push(`  ${marker} ${avatar} ${bold(label)} ${dim(`(@${d.name})`)}`);
    lines.push(`      ${dim(d.description)}`);
  }

  lines.push(`\n  Attivo: ${bold(active)} — usa ${dim('/agent use <nome>')}`);
  lines.push('');
  return lines.join('\n');
}

function formatAgentInfo(name: string): string {
  const agent = resolvePersonaAgent(name);
  if (!agent) return `  Agent non trovato: ${name}\n`;

  const d = agent.definition;
  const history = loadPersonaHistory(d.name);
  const lines = [
    `  ${bold(d.display_name ?? d.name)} ${dim(`(@${d.name})`)}`,
    `  ${d.description}`,
    '',
    `  Modello: ${d.model ?? 'balanced'} | max_tokens: ${d.max_tokens ?? 3000}`,
    `  File: ${dim(agent.filePath)}`,
    `  Messaggi in history: ${history.length}`,
  ];

  if (d.tools?.length) {
    lines.push(`  Tools: ${d.tools.join(', ')}`);
  }
  if (d.restrictions?.disclaimer_required) {
    lines.push(`  ${dim('Disclaimer obbligatorio in output')}`);
  }

  lines.push('');
  return lines.join('\n');
}

export async function handleAgentCli(
  args: string[],
  shellCtx: ExtensionShellContext,
  defaultMessage = '',
): Promise<string> {
  const sub = args[0]?.toLowerCase() ?? 'list';
  const rest = args.slice(1);

  switch (sub) {
    case 'list':
    case 'ls':
      return formatAgentList();

    case 'info': {
      const name = rest[0];
      if (!name) return '  Uso: /agent info <nome>\n';
      return formatAgentInfo(name);
    }

    case 'use': {
      const name = rest[0];
      if (!name) return '  Uso: /agent use <nome>\n';
      const result = setActivePersona(name);
      return result.ok
        ? `  ${ok('[OK]')} ${result.message}\n`
        : `  \x1b[31m[ERR]\x1b[0m ${result.message}\n`;
    }

    case 'current':
    case 'who':
      return `  Agent attivo: ${bold(getActivePersonaName())} — ${formatActiveLabel()}\n`;

    case 'clear-history': {
      const name = rest[0] ?? getActivePersonaName();
      clearPersonaHistory(name);
      if (name === getActivePersonaName()) {
        resetActivePersonaHistory();
      }
      return `  ${ok('[OK]')} History cancellata per @${name}\n`;
    }

    case 'test': {
      const name = rest[0];
      const message = rest.slice(1).join(' ') || 'Presentati in una frase.';
      if (!name) return '  Uso: /agent test <nome> [messaggio]\n';
      try {
        const result = await chatWithPersonaByName(name, message, shellCtx, {
          includeHistory: false,
          persistHistory: false,
        });
        return `${result.output}\n`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return `  \x1b[31m[ERR]\x1b[0m ${msg}\n`;
      }
    }

    case 'ask': {
      const agentsArg = rest[0];
      if (!agentsArg) {
        return '  Uso: /agent ask <agent1,agent2,...> <domanda...>\n';
      }

      const agentNames = agentsArg.split(',').map((n) => n.trim()).filter(Boolean);
      const query = rest.slice(1).join(' ') || defaultMessage;

      if (!query.trim()) {
        return '  Uso: /agent ask <agent1,agent2> <domanda...>\n';
      }

      try {
        const result = await askMultiplePersonas(agentNames, query);
        const header = `  ${dim(`Multi-agent: ${result.agents.join(', ')}`)}\n\n`;
        return header + result.output + '\n';
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return `  \x1b[31m[ERR]\x1b[0m ${msg}\n`;
      }
    }

    case 'clone': {
      const sourceName = rest[0];
      const targetName = rest[1];
      if (!sourceName || !targetName) {
        return '  Uso: /agent clone <sorgente> <nuovo-nome>\n';
      }
      const source = resolvePersonaAgent(sourceName);
      if (!source) return `  Agent sorgente non trovato: ${sourceName}\n`;
      if (resolvePersonaAgent(targetName)) {
        return `  Agent già esistente: ${targetName}\n`;
      }

      const targetPath = source.filePath.replace(
        `${source.definition.name}.yml`,
        `${targetName}.yml`,
      );

      try {
        const yaml = readFileSync(source.filePath, 'utf-8').replace(
          /^name:\s*.+$/m,
          `name: ${targetName}`,
        );
        writeFileSync(targetPath, yaml, 'utf-8');
        loadPersonasFromDisk();
        return `  ${ok('[OK]')} Clonato @${sourceName} → @${targetName}\n     File: ${targetPath}\n`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return `  \x1b[31m[ERR]\x1b[0m Clone fallito: ${msg}\n`;
      }
    }

    case 'reload': {
      const { loaded, errors } = loadPersonasFromDisk();
      const lines = [`  ${ok('[OK]')} Ricaricati ${loaded} agent.`];
      for (const e of errors) lines.push(`  \x1b[33m[WARN]\x1b[0m ${e}`);
      return lines.join('\n') + '\n';
    }

    default:
      return `  Sottocomando sconosciuto: ${sub}. Usa /agent list\n`;
  }
}

function formatActiveLabel(): string {
  const persona = getActivePersona();
  if (!persona) return '';
  const d = persona.definition;
  return d.display_name ?? d.name;
}

export interface PersonaOneShotResult {
  handled: boolean;
  output?: string;
  tokens?: number;
  agentName?: string;
}

/**
 * One-shot @agent query (does not switch active persona).
 */
export async function tryExecutePersonaOneShot(
  input: string,
  shellCtx: ExtensionShellContext,
): Promise<PersonaOneShotResult> {
  const match = input.match(/^@([a-z0-9][a-z0-9-]*)\s+(.+)$/i);
  if (!match) return { handled: false };

  const [, agentName, query] = match;
  if (!agentName || !query?.trim()) return { handled: false };

  try {
    const result = await chatWithPersonaByName(agentName, query.trim(), shellCtx, {
      includeHistory: true,
      persistHistory: true,
    });
    return {
      handled: true,
      output: result.output,
      tokens: result.tokens,
      agentName: result.agentName,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { handled: true, output: `\x1b[31m[ERR]\x1b[0m ${msg}\n` };
  }
}
