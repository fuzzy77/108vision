import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';

import { COMMANDS_DIR } from '../paths.js';
import { reloadExtensions } from '../loader.js';
import { createCommandFile } from './create.js';
import {
  listRegisteredCommands,
  resolveCommand,
  unregisterCommand,
} from '../registry.js';
import { parseCommandFile, isCommandFile } from './parser.js';

function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

function ok(text: string): string {
  return `\x1b[32m${text}\x1b[0m`;
}

function err(text: string): string {
  return `\x1b[31m${text}\x1b[0m`;
}

function dim(text: string): string {
  return `\x1b[90m${text}\x1b[0m`;
}

export async function handleCommandCli(args: string[]): Promise<string> {
  const sub = args[0]?.toLowerCase() ?? 'list';
  const rest = args.slice(1);

  switch (sub) {
    case 'list':
    case 'ls':
      return formatCommandList();

    case 'info': {
      const name = rest[0];
      if (!name) return '  Uso: /command info <nome>\n';
      const entry = resolveCommand(name);
      if (!entry) return `  Command non trovato: ${name}\n`;
      return formatCommandInfo(entry.definition.name, entry);
    }

    case 'reload': {
      const result = reloadExtensions();
      const lines = [
        `  ${ok('[OK]')} Ricaricati ${result.commandsLoaded} command, ${result.skillsLoaded} skill, ${result.agentsLoaded} agent, ${result.mcpLoaded} mcp.`,
      ];
      for (const warning of result.warnings) {
        lines.push(`  ${err('[WARN]')} ${warning}`);
      }
      return lines.join('\n') + '\n';
    }

    case 'import': {
      const sourcePath = rest[0];
      if (!sourcePath) return '  Uso: /command import <path.yml>\n';
      return importCommandFile(sourcePath);
    }

    case 'export': {
      const name = rest[0];
      const dest = rest[1] ?? '.';
      if (!name) return '  Uso: /command export <nome> [directory]\n';
      return exportCommand(name, dest);
    }

    case 'delete':
    case 'remove': {
      const name = rest[0];
      if (!name) return '  Uso: /command delete <nome>\n';
      const entry = resolveCommand(name);
      if (!entry || entry.origin !== 'file' || !entry.filePath) {
        return `  Solo i command custom (file) possono essere eliminati: ${name}\n`;
      }
      unregisterCommand(name);
      try {
        const { unlinkSync } = await import('node:fs');
        unlinkSync(entry.filePath);
      } catch {
        return `  ${err('[ERR]')} Rimosso dal registry ma file non cancellato.\n`;
      }
      return `  ${ok('[OK]')} Command eliminato: ${name}\n`;
    }

    case 'search': {
      const query = rest.join(' ').toLowerCase();
      if (!query) return '  Uso: /command search <keyword>\n';
      const matches = listRegisteredCommands().filter((entry) => {
        const hay = [
          entry.definition.name,
          entry.definition.description,
          ...(entry.definition.aliases ?? []),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(query);
      });
      if (matches.length === 0) return `  Nessun command per "${query}".\n`;
      return formatCommandList(matches);
    }

    case 'create': {
      const name = rest[0];
      const description = rest.slice(1).join(' ') || `Command ${name ?? ''}`.trim();
      const force = rest.includes('--force');
      if (!name) return '  Uso: /command create <nome> [descrizione] [--force]\n';
      const result = createCommandFile(name, description, force);
      if (!result.ok) return `  ${err('[ERR]')} ${result.message}\n`;
      reloadExtensions();
      return `  ${ok('[OK]')} ${result.message}\n  ${dim('Modifica il file e usa /command reload')}\n`;
    }

    default:
      return `  Sub-comandi: list, info, reload, import, export, delete, search, create\n`;
  }
}

function formatCommandList(entries = listRegisteredCommands()): string {
  const lines: string[] = ['', `  ${bold('Commands registrati')}`, ''];

  if (entries.length === 0) {
    lines.push('  Nessun command. Aggiungi file in ~/.108ai/commands/');
    lines.push('');
    return lines.join('\n');
  }

  const builtins = entries.filter((e) => e.origin === 'builtin');
  const files = entries.filter((e) => e.origin === 'file');

  if (files.length > 0) {
    lines.push(`  ${bold('Custom')} (${files.length})`);
    for (const entry of files) {
      const aliases = entry.definition.aliases?.length
        ? dim(` [${entry.definition.aliases.join(', ')}]`)
        : '';
      const kind = entry.handler ? dim(' [builtin]') : '';
      lines.push(`  /${entry.definition.name}${aliases}${kind}`);
      lines.push(`    ${dim(entry.definition.description)}`);
    }
    lines.push('');
  }

  if (builtins.length > 0) {
    lines.push(`  ${bold('Built-in')} (${builtins.length}) — usa /help per dettagli`);
    for (const entry of builtins.slice(0, 8)) {
      lines.push(`  /${entry.definition.name} — ${dim(entry.definition.description)}`);
    }
    if (builtins.length > 8) {
      lines.push(`  ${dim(`... e altri ${builtins.length - 8}`)}`);
    }
    lines.push('');
  }

  lines.push(`  ${dim('Gestione: /command list | reload | import <file> | info <nome>')}`);
  lines.push('');
  return lines.join('\n');
}

function formatCommandInfo(
  name: string,
  entry: NonNullable<ReturnType<typeof resolveCommand>>,
): string {
  const def = entry.definition;
  const lines = [
    '',
    `  ${bold(`Command: /${name}`)}`,
    `  Origine:   ${entry.origin}`,
    `  Desc:      ${def.description}`,
  ];

  if (def.aliases?.length) {
    lines.push(`  Alias:     ${def.aliases.join(', ')}`);
  }
  if (entry.filePath) {
    lines.push(`  File:      ${entry.filePath}`);
  }
  if (def.builtin) {
    lines.push(`  Builtin:   ${def.builtin}`);
  }
  if (entry.handler) {
    lines.push(`  Handler:   platform (no LLM)`);
  }
  if (def.params?.length) {
    lines.push('  Parametri:');
    for (const p of def.params) {
      const req = p.required ? ' (required)' : '';
      const defVal = p.default !== undefined ? ` default=${String(p.default)}` : '';
      lines.push(`    --${p.name} [${p.type}]${req}${defVal}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function importCommandFile(sourcePath: string): string {
  if (!existsSync(sourcePath)) {
    return `  ${err('[ERR]')} File non trovato: ${sourcePath}\n`;
  }

  if (!isCommandFile(sourcePath)) {
    return `  ${err('[ERR]')} Estensione non supportata (usa .yml, .yaml, .json)\n`;
  }

  try {
    const definition = parseCommandFile(sourcePath);
    const dest = join(COMMANDS_DIR, `${definition.name}.yml`);
    writeFileSync(dest, stringifyYaml(definition), 'utf-8');
    reloadExtensions();
    return `  ${ok('[OK]')} Importato come /${definition.name} → ${dest}\n`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `  ${err('[ERR]')} ${message}\n`;
  }
}

function exportCommand(name: string, destDir: string): string {
  const entry = resolveCommand(name);
  if (!entry || entry.origin !== 'file' || !entry.filePath) {
    return `  ${err('[ERR]')} Export disponibile solo per command file-based.\n`;
  }

  const raw = readFileSync(entry.filePath, 'utf-8');
  const outPath = join(destDir, `${name}.yml`);
  writeFileSync(outPath, raw, 'utf-8');
  return `  ${ok('[OK]')} Esportato in ${outPath}\n`;
}
