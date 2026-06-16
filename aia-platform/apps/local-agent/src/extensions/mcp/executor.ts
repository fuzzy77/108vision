import { auditLog } from '../../security.js';
import { loadConfig } from '../../config.js';
import { loadPermissions } from '../permissions.js';
import { checkExtensionRateLimit } from '../security/rate-limit.js';
import type { McpServerDefinition, McpToolCallResult } from '../types.js';
import { getMcpRuntime, startMcpServer } from './manager.js';
import { recordMcpToolUsage } from './usage.js';

function isToolWhitelisted(definition: McpServerDefinition, toolName: string): boolean {
  const list = definition.tools_exposed;
  if (!list || list.length === 0) return true;
  return list.includes(toolName);
}

function isWriteLikeTool(toolName: string): boolean {
  const lower = toolName.toLowerCase();
  return (
    lower.includes('create') ||
    lower.includes('update') ||
    lower.includes('delete') ||
    lower.includes('write') ||
    lower.includes('send')
  );
}

export async function callMcpTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<McpToolCallResult> {
  const started = Date.now();
  const perms = loadPermissions();

  const runtime = getMcpRuntime(serverName);
  if (!runtime) {
    throw new Error(`MCP server non configurato: ${serverName}`);
  }

  if (runtime.definition.enabled === false) {
    throw new Error(`MCP server disabilitato: ${serverName}`);
  }

  if (!isToolWhitelisted(runtime.definition, toolName)) {
    auditLog({
      timestamp: new Date().toISOString(),
      action: `mcp.${serverName}.${toolName}`,
      params: { tool: toolName },
      result: 'denied',
      reason: 'tool not in tools_exposed whitelist',
    });
    throw new Error(`Tool non autorizzato per ${serverName}: ${toolName}`);
  }

  if (runtime.definition.restrictions?.read_only && isWriteLikeTool(toolName)) {
    throw new Error(`Server ${serverName} è read-only: tool ${toolName} bloccato`);
  }

  const rateKey = `mcp:${serverName}`;
  const tenantId = loadConfig()?.tenantId ?? '';
  if (!checkExtensionRateLimit(rateKey, runtime.definition.restrictions?.rate_limit, tenantId)) {
    throw new Error(`Rate limit MCP superato per ${serverName}`);
  }

  if (runtime.status !== 'running') {
    await startMcpServer(serverName);
  }

  const active = getMcpRuntime(serverName);
  if (!active?.client) {
    throw new Error(`Impossibile avviare MCP server: ${serverName}`);
  }

  const timeoutMs = parseTimeout(runtime.definition);
  let result:
    | { content: string; isError: boolean }
    | undefined;
  let durationMs = 0;
  try {
    result = await Promise.race([
      active.client.callTool(toolName, args),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout tool MCP (${timeoutMs}ms)`)), timeoutMs),
      ),
    ]);
    durationMs = Date.now() - started;
    recordMcpToolUsage(serverName, toolName, { isError: result.isError, durationMs });
  } catch (err) {
    durationMs = Date.now() - started;
    recordMcpToolUsage(serverName, toolName, { isError: true, durationMs });
    throw err;
  }

  const payload: McpToolCallResult = {
    content: result!.content,
    isError: result!.isError,
    serverName,
    toolName,
    durationMs,
  };

  if (perms.mcp_servers.log_all_calls) {
    auditLog({
      timestamp: new Date().toISOString(),
      action: `mcp.${serverName}.${toolName}`,
      params: { args },
      result: result.isError ? 'error' : 'allowed',
      durationMs: payload.durationMs,
    });
  }

  return payload;
}

function parseTimeout(definition: McpServerDefinition): number {
  const fromRestrictions = definition.restrictions?.timeout;
  if (fromRestrictions) {
    const match = fromRestrictions.match(/^(\d+)(ms|s)?$/i);
    if (match) {
      const n = Number.parseInt(match[1] ?? '30', 10);
      return (match[2] ?? 's').toLowerCase() === 'ms' ? n : n * 1_000;
    }
  }
  return loadPermissions().mcp_servers.timeout_per_call_ms;
}
