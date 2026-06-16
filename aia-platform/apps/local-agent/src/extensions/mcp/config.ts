import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { MCP_CONFIG_FILE } from '../paths.js';
import { parseMcpConfig } from '../schemas.js';
import type { McpConfigDocument, McpServerDefinition } from '../types.js';
import { resolveSecretRecord, resolveSecretString } from '../security/secrets.js';

const DEFAULT_MCP_YAML = `# 108ai — MCP Servers
# Vedi: https://modelcontextprotocol.io

mcp_servers: []
`;

export function ensureMcpConfig(): void {
  if (!existsSync(MCP_CONFIG_FILE)) {
    writeFileSync(MCP_CONFIG_FILE, DEFAULT_MCP_YAML, 'utf-8');
  }
}

export function loadMcpConfig(forceReload = false): McpConfigDocument {
  void forceReload;
  ensureMcpConfig();

  try {
    const raw = readFileSync(MCP_CONFIG_FILE, 'utf-8');
    const doc = parseYaml(raw) as unknown;
    return parseMcpConfig(doc ?? { mcp_servers: [] });
  } catch {
    return { mcp_servers: [] };
  }
}

export function saveMcpConfig(servers: McpServerDefinition[]): void {
  const doc = { mcp_servers: servers };
  writeFileSync(MCP_CONFIG_FILE, stringifyYaml(doc), 'utf-8');
}

export function resolveMcpServerEnv(
  definition: McpServerDefinition,
): Record<string, string> {
  const env = resolveSecretRecord(definition.env) ?? {};
  if (definition.auth?.type === 'bearer') {
    env['MCP_AUTH_TOKEN'] = resolveSecretString(definition.auth.token);
  }
  return env;
}

export function parseDurationMs(value?: string, fallbackMs = 5_000): number {
  if (!value?.trim()) return fallbackMs;
  const match = value.trim().match(/^(\d+)(ms|s|m)?$/i);
  if (!match) return fallbackMs;
  const amount = Number.parseInt(match[1] ?? '0', 10);
  const unit = (match[2] ?? 's').toLowerCase();
  if (unit === 'ms') return amount;
  if (unit === 'm') return amount * 60_000;
  return amount * 1_000;
}
