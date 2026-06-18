import type { McpTransportClient } from './transport.js';
import { StdioMcpClient } from './stdio-client.js';
import { SseMcpClient } from './sse-client.js';
import { loadMcpConfig, resolveMcpServerEnv, parseDurationMs } from './config.js';
import type { McpServerDefinition, McpServerRuntime, McpToolDefinition } from '../types.js';

interface RuntimeEntry extends McpServerRuntime {
  client?: McpTransportClient;
}

const runtimes = new Map<string, RuntimeEntry>();

function key(name: string): string {
  return name.toLowerCase();
}

export function getMcpRuntime(name: string): RuntimeEntry | undefined {
  return runtimes.get(key(name));
}

export function listMcpRuntimes(): RuntimeEntry[] {
  return [...runtimes.values()].sort((a, b) =>
    a.definition.name.localeCompare(b.definition.name),
  );
}

export function loadMcpServersFromConfig(): { loaded: number; errors: string[] } {
  const errors: string[] = [];
  const doc = loadMcpConfig(true);

  runtimes.clear();

  for (const definition of doc.mcp_servers) {
    if (definition.enabled === false) continue;
    runtimes.set(key(definition.name), {
      definition,
      status: 'stopped',
      tools: [],
    });
  }

  return { loaded: runtimes.size, errors };
}

async function createMcpClient(def: McpServerDefinition): Promise<McpTransportClient> {
  const timeoutMs = parseDurationMs(def.health_check?.timeout, 30_000);

  if (def.transport === 'sse') {
    if (!def.url) {
      throw new Error(`MCP ${def.name}: transport sse richiede url`);
    }
    const headers: Record<string, string> = {};
    const env = resolveMcpServerEnv(def);
    if (env['MCP_AUTH_TOKEN']) {
      headers['Authorization'] = `Bearer ${env['MCP_AUTH_TOKEN']}`;
    }
    return new SseMcpClient({ url: def.url, headers, timeoutMs });
  }

  if (!def.command) {
    throw new Error(`MCP ${def.name}: command mancante per transport stdio`);
  }

  return new StdioMcpClient({
    command: def.command,
    args: def.args,
    cwd: def.cwd,
    env: resolveMcpServerEnv(def),
    timeoutMs,
  });
}

export async function startMcpServer(name: string): Promise<McpServerRuntime> {
  const entry = runtimes.get(key(name));
  if (!entry) {
    throw new Error(`MCP server non trovato: ${name}`);
  }

  if (entry.status === 'running' && entry.client) {
    return entry;
  }

  const def = entry.definition;
  entry.status = 'starting';

  const client = await createMcpClient(def);

  try {
    await client.start();
    const tools = await client.listTools();
    entry.client = client;
    entry.pid = client.pid;
    entry.tools = tools as McpToolDefinition[];
    entry.status = 'running';
    entry.lastError = undefined;
    entry.lastHealthCheckAt = Date.now();
    return entry;
  } catch (err) {
    entry.status = 'error';
    entry.lastError = err instanceof Error ? err.message : String(err);
    await client.stop().catch(() => undefined);
    throw err;
  }
}

export async function stopMcpServer(name: string): Promise<void> {
  const entry = runtimes.get(key(name));
  if (!entry) return;
  await entry.client?.stop().catch(() => undefined);
  entry.client = undefined;
  entry.pid = undefined;
  entry.status = 'stopped';
}

export async function stopAllMcpServers(): Promise<void> {
  for (const entry of runtimes.values()) {
    await entry.client?.stop().catch(() => undefined);
    entry.client = undefined;
    entry.status = 'stopped';
  }
}

export async function autoStartMcpServers(): Promise<string[]> {
  const started: string[] = [];
  for (const entry of runtimes.values()) {
    if (entry.definition.auto_start) {
      try {
        await startMcpServer(entry.definition.name);
        started.push(entry.definition.name);
      } catch {
        // auto-start failures are non-fatal
      }
    }
  }
  return started;
}

export async function healthCheckMcpServer(name: string): Promise<boolean> {
  const entry = runtimes.get(key(name));
  if (!entry?.client) return false;
  const ok = await entry.client.ping();
  entry.lastHealthCheckAt = Date.now();
  if (!ok) {
    entry.status = 'error';
    entry.lastError = 'Health check fallito';
  }
  return ok;
}

export function addMcpServerDefinition(definition: McpServerDefinition): void {
  runtimes.set(key(definition.name), {
    definition,
    status: 'stopped',
    tools: [],
  });
}

export function removeMcpServerDefinition(name: string): boolean {
  return runtimes.delete(key(name));
}
