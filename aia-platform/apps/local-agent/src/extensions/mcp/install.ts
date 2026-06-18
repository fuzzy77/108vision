/**
 * Generic MCP install — npm (npx) and git sources.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';

import { EXTENSIONS_BASE_DIR } from '../paths.js';
import { parseMcpConfig } from '../schemas.js';
import type { McpServerDefinition } from '../types.js';

const MCP_SERVERS_DIR = join(EXTENSIONS_BASE_DIR, 'mcp-servers');

const PRESETS: Record<string, McpServerDefinition> = {
  'everything-demo': {
    name: 'everything-demo',
    description: 'MCP Everything (demo) via npx @modelcontextprotocol/server-everything',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-everything'],
    env: {},
    auto_start: false,
    enabled: true,
    tools_exposed: [],
  },
};

export interface ParsedMcpInstall {
  name: string;
  definition: McpServerDefinition;
}

export interface McpInstallFlags {
  name?: string;
  command?: string;
  args?: string[];
  description?: string;
  ref?: string;
}

function sanitizeServerName(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').slice(0, 48);
}

function parseFlags(tokens: string[]): { positional: string[]; flags: McpInstallFlags } {
  const positional: string[] = [];
  const flags: McpInstallFlags = {};

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if (t === '--name' && tokens[i + 1]) {
      flags.name = tokens[++i];
    } else if (t === '--command' && tokens[i + 1]) {
      flags.command = tokens[++i];
    } else if (t === '--args' && tokens[i + 1]) {
      flags.args = (tokens[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    } else if (t === '--description' && tokens[i + 1]) {
      flags.description = tokens[++i];
    } else if (t === '--ref' && tokens[i + 1]) {
      flags.ref = tokens[++i];
    } else if (!t.startsWith('--')) {
      positional.push(t);
    }
  }

  return { positional, flags };
}

function assertSafeGitUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`URL git non valido: ${url}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Solo repository git HTTPS sono supportati');
  }
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) {
    throw new Error(`Host git bloccato: ${host}`);
  }
}

function cloneGitRepository(url: string, targetDir: string, ref?: string): void {
  assertSafeGitUrl(url);
  if (!existsSync(MCP_SERVERS_DIR)) {
    mkdirSync(MCP_SERVERS_DIR, { recursive: true });
  }
  if (existsSync(targetDir)) {
    return;
  }

  const cloneArgs = ['clone', '--depth', '1'];
  if (ref) cloneArgs.push('--branch', ref);
  cloneArgs.push(url, targetDir);

  execFileSync('git', cloneArgs, {
    stdio: 'pipe',
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
  });
}

function defaultNameFromNpmPackage(pkg: string): string {
  const base = pkg.split('/').pop() ?? pkg;
  return sanitizeServerName(base.replace(/^@/, '').replace(/^server-/, ''));
}

function defaultNameFromGitUrl(url: string): string {
  const clean = url.replace(/\.git$/, '');
  return sanitizeServerName(basename(clean));
}

export function parseMcpInstall(tokens: string[]): ParsedMcpInstall {
  const { positional, flags } = parseFlags(tokens);
  if (positional.length === 0) {
    throw new Error('Specifica sorgente: npm <pkg> | git <url> | <preset>');
  }

  const head = positional[0]!.toLowerCase();

  if (PRESETS[head]) {
    const def = { ...PRESETS[head]! };
    if (flags.name) def.name = sanitizeServerName(flags.name);
    return { name: def.name, definition: def };
  }

  if (head === 'npm') {
    const pkg = positional[1];
    if (!pkg) throw new Error('Uso: /mcp install npm <package> [--name x] [--args a,b]');

    const name = sanitizeServerName(flags.name ?? defaultNameFromNpmPackage(pkg));
    const extraArgs = flags.args ?? [];
    const def: McpServerDefinition = {
      name,
      description: flags.description ?? `MCP npm package ${pkg}`,
      transport: 'stdio',
      command: 'npx',
      args: ['-y', pkg, ...extraArgs],
      auto_start: false,
      enabled: true,
      tools_exposed: [],
    };
    parseMcpConfig({ mcp_servers: [def] });
    return { name, definition: def };
  }

  if (head === 'git') {
    const url = positional[1];
    if (!url) throw new Error('Uso: /mcp install git <https-url> --command <cmd> [--args a,b]');

    const name = sanitizeServerName(flags.name ?? defaultNameFromGitUrl(url));
    const repoDir = join(MCP_SERVERS_DIR, name);
    cloneGitRepository(url, repoDir, flags.ref);

    const command = flags.command;
    if (!command) {
      throw new Error('Per install git è obbligatorio --command (es. node, python)');
    }

    const def: McpServerDefinition = {
      name,
      description: flags.description ?? `MCP git ${url}`,
      transport: 'stdio',
      command,
      args: flags.args ?? [],
      cwd: repoDir,
      auto_start: false,
      enabled: true,
      tools_exposed: [],
    };
    parseMcpConfig({ mcp_servers: [def] });
    return { name, definition: def };
  }

  // Legacy preset alias
  const presetKey = Object.keys(PRESETS).find(
    (k) => k === head || k.replace('-demo', '') === head,
  );
  if (presetKey) {
    return parseMcpInstall([presetKey]);
  }

  throw new Error(`Sorgente MCP non supportata: ${positional.join(' ')}`);
}

export function getMcpPresetDefinition(preset: string): McpServerDefinition | null {
  return PRESETS[preset] ?? null;
}
