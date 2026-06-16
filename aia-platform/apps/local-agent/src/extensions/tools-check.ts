import { getMcpRuntime } from './mcp/manager.js';
import { parseMcpToolRef } from './agents/mcp-tools.js';

export function assertToolsRequired(tools: string[] | undefined): void {
  if (!tools?.length) return;

  for (const tool of tools) {
    if (tool === 'gmail' && !process.env['GOOGLE_CLIENT_ID']) {
      throw new Error('Tool gmail richiesto. Configura OAuth e /connect gmail');
    }

    const mcpRef = tool.startsWith('mcp:') ? parseMcpToolRef(tool) : null;
    if (mcpRef && !getMcpRuntime(mcpRef.server)) {
      throw new Error(`MCP server non configurato in mcp.yml: ${mcpRef.server}`);
    }
  }
}
