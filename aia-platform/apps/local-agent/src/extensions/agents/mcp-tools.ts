import type { LoadedPersonaAgent } from '../types.js';
import { callMcpTool } from '../mcp/executor.js';
import { getMcpRuntime } from '../mcp/manager.js';

export interface ParsedMcpToolRef {
  server: string;
  tool: string;
}

export interface McpToolCallRequest {
  server: string;
  tool: string;
  args: Record<string, unknown>;
}

const MCP_BLOCK_RE = /```mcp\s*\n([^\s:]+):\s*(\S+)\s*\n([\s\S]*?)```/g;

/** Parse `mcp:server:tool` agent tool entries. */
export function parseMcpToolRef(tool: string): ParsedMcpToolRef | null {
  if (!tool.startsWith('mcp:')) return null;
  const rest = tool.slice(4);
  const colon = rest.indexOf(':');
  if (colon <= 0) return null;
  return {
    server: rest.slice(0, colon),
    tool: rest.slice(colon + 1),
  };
}

export function listAgentMcpTools(persona: LoadedPersonaAgent): ParsedMcpToolRef[] {
  return (persona.definition.tools ?? [])
    .map(parseMcpToolRef)
    .filter((t): t is ParsedMcpToolRef => t !== null);
}

export function buildAgentToolsSystemAppend(persona: LoadedPersonaAgent): string {
  const mcpTools = listAgentMcpTools(persona);
  const integrations = (persona.definition.tools ?? []).filter((t) => !t.startsWith('mcp:'));

  if (mcpTools.length === 0 && integrations.length === 0) return '';

  const lines: string[] = ['', 'Strumenti configurati per questo agent:'];

  for (const ref of mcpTools) {
    const runtime = getMcpRuntime(ref.server);
    const status = runtime?.status === 'running' ? 'online' : 'offline';
    lines.push(`- MCP ${ref.server}.${ref.tool} (${status})`);
  }

  for (const name of integrations) {
    lines.push(`- integrazione: ${name}`);
  }

  if (mcpTools.length > 0) {
    lines.push(
      '',
      'Per invocare un tool MCP autorizzato, includi un blocco:',
      '```mcp',
      'serverName: toolName',
      '{ "arg": "value" }',
      '```',
      'Solo tool elencati nella configurazione agent.',
    );
  }

  return lines.join('\n');
}

export function extractMcpToolCalls(content: string): McpToolCallRequest[] {
  const calls: McpToolCallRequest[] = [];
  let match: RegExpExecArray | null;

  while ((match = MCP_BLOCK_RE.exec(content)) !== null) {
    const server = match[1]?.trim();
    const tool = match[2]?.trim();
    const jsonRaw = match[3]?.trim() ?? '{}';
    if (!server || !tool) continue;

    let args: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(jsonRaw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        args = parsed as Record<string, unknown>;
      }
    } catch {
      args = {};
    }

    calls.push({ server, tool, args });
  }

  return calls;
}

export function stripMcpBlocks(content: string): string {
  return content.replace(MCP_BLOCK_RE, '').trim();
}

function isAllowedMcpCall(persona: LoadedPersonaAgent, server: string, tool: string): boolean {
  return listAgentMcpTools(persona).some(
    (t) => t.server.toLowerCase() === server.toLowerCase() && t.tool === tool,
  );
}

export async function executeAgentMcpCalls(
  persona: LoadedPersonaAgent,
  content: string,
): Promise<{ cleaned: string; toolLog: string; tokensExtra: number }> {
  const calls = extractMcpToolCalls(content);
  if (calls.length === 0) {
    return { cleaned: content, toolLog: '', tokensExtra: 0 };
  }

  const results: string[] = [];
  for (const call of calls) {
    if (!isAllowedMcpCall(persona, call.server, call.tool)) {
      results.push(`[${call.server}.${call.tool}] negato: non in tools agent`);
      continue;
    }

    try {
      const payload = await callMcpTool(call.server, call.tool, call.args);
      results.push(`[${call.server}.${call.tool}]\n${payload.content}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push(`[${call.server}.${call.tool}] errore: ${message}`);
    }
  }

  return {
    cleaned: stripMcpBlocks(content),
    toolLog: results.join('\n\n'),
    tokensExtra: 0,
  };
}
