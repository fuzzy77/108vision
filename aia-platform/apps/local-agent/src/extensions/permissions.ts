import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

import { PERMISSIONS_FILE } from './paths.js';
import { parsePermissionsConfig } from './schemas.js';
import type { PermissionsConfig } from './types.js';

const DEFAULT_PERMISSIONS_YAML = `# 108ai — Extension permissions
# Review before enabling network/shell access on custom commands.

commands:
  allow_network: false
  allow_file_write: ask
  allow_shell: restricted

skills:
  allow_network: true
  allow_file_write: ask
  allow_llm: true
  require_review: true

mcp_servers:
  allow_write: per_server
  max_concurrent_calls: 10
  timeout_per_call_ms: 30000
  log_all_calls: true

agents:
  inherit_user_permissions: true
  max_conversation_length: 100
  allow_multi_agent: true
  max_agent_depth: 3
`;

let cachedPermissions: PermissionsConfig | null = null;

function toPermissionsConfig(parsed: ReturnType<typeof parsePermissionsConfig>): PermissionsConfig {
  return {
    commands: {
      allow_network: parsed.commands.allow_network,
      allow_file_write: parsed.commands.allow_file_write,
      allow_shell: parsed.commands.allow_shell,
    },
    skills: {
      allow_network: parsed.skills.allow_network,
      allow_file_write: parsed.skills.allow_file_write,
      allow_llm: parsed.skills.allow_llm,
      require_review: parsed.skills.require_review,
    },
    mcp_servers: {
      allow_write: parsed.mcp_servers.allow_write,
      max_concurrent_calls: parsed.mcp_servers.max_concurrent_calls,
      timeout_per_call_ms: parsed.mcp_servers.timeout_per_call_ms,
      log_all_calls: parsed.mcp_servers.log_all_calls,
    },
    agents: {
      inherit_user_permissions: parsed.agents.inherit_user_permissions,
      max_conversation_length: parsed.agents.max_conversation_length,
      allow_multi_agent: parsed.agents.allow_multi_agent,
      max_agent_depth: parsed.agents.max_agent_depth,
    },
  };
}

/** Create default permissions.yml if missing */
export function ensureDefaultPermissions(): void {
  if (!existsSync(PERMISSIONS_FILE)) {
    writeFileSync(PERMISSIONS_FILE, DEFAULT_PERMISSIONS_YAML, 'utf-8');
  }
}

/** Load and cache permissions from ~/.108ai/permissions.yml */
export function loadPermissions(forceReload = false): PermissionsConfig {
  if (cachedPermissions && !forceReload) {
    return cachedPermissions;
  }

  ensureDefaultPermissions();

  try {
    const raw = readFileSync(PERMISSIONS_FILE, 'utf-8');
    const doc = parseYaml(raw) as unknown;
    cachedPermissions = toPermissionsConfig(parsePermissionsConfig(doc ?? {}));
  } catch {
    cachedPermissions = toPermissionsConfig(parsePermissionsConfig({}));
  }

  return cachedPermissions;
}

export function commandsAllowNetwork(): boolean {
  return loadPermissions().commands.allow_network;
}

export function commandsAllowShell(): boolean {
  const mode = loadPermissions().commands.allow_shell;
  return mode === 'allow' || mode === 'restricted';
}

export function skillsAllowNetwork(): boolean {
  return loadPermissions().skills.allow_network;
}

export function skillsAllowLlm(): boolean {
  return loadPermissions().skills.allow_llm;
}

export function invalidatePermissionsCache(): void {
  cachedPermissions = null;
}
