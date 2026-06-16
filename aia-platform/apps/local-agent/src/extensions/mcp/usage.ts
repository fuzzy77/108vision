import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface ToolUsageEntry {
  calls: number;
  errors: number;
  lastDurationMs: number;
  lastAt: number;
}

export interface McpUsageState {
  version: 1;
  updatedAt: string;
  servers: Record<
    string,
    {
      tools: Record<string, ToolUsageEntry>;
    }
  >;
}

const USAGE_FILE = join(homedir(), '.108ai', 'mcp-usage.json');
const EMPTY: McpUsageState = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  servers: {},
};

function loadState(): McpUsageState {
  if (!existsSync(USAGE_FILE)) return { ...EMPTY, servers: {} };
  try {
    const raw = readFileSync(USAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as McpUsageState;
    if (!parsed || parsed.version !== 1 || !parsed.servers) return { ...EMPTY, servers: {} };
    return parsed;
  } catch {
    return { ...EMPTY, servers: {} };
  }
}

function saveState(state: McpUsageState): void {
  try {
    writeFileSync(USAGE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // best-effort
  }
}

export function recordMcpToolUsage(
  serverName: string,
  toolName: string,
  outcome: { isError: boolean; durationMs: number },
): void {
  const state = loadState();
  const serverKey = serverName.toLowerCase();
  const toolKey = toolName;

  const server = state.servers[serverKey] ?? { tools: {} };
  const prev = server.tools[toolKey] ?? {
    calls: 0,
    errors: 0,
    lastDurationMs: 0,
    lastAt: 0,
  };

  const next: ToolUsageEntry = {
    calls: prev.calls + 1,
    errors: prev.errors + (outcome.isError ? 1 : 0),
    lastDurationMs: outcome.durationMs,
    lastAt: Date.now(),
  };

  server.tools[toolKey] = next;
  state.servers[serverKey] = server;
  state.updatedAt = new Date().toISOString();

  saveState(state);
}

export function getMcpUsageSnapshot(): McpUsageState {
  return loadState();
}

