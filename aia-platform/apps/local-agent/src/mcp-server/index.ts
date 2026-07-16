/**
 * 108ai MCP Server — Exposes unique 108ai capabilities as a standard MCP server.
 *
 * This allows Claude Desktop, Cursor, Goose, OpenCode, or any MCP client to
 * consume 108ai's unique capabilities:
 * - Desktop automation (screenshot, click, type, window management)
 * - Daily Triage (email + calendar cross-reference brief)
 * - Italian SME integrations (PEC, Fatture in Cloud)
 * - Token-saving pipeline (local execution without LLM)
 *
 * Transport: stdio (standard for MCP servers)
 * Protocol: MCP 2024-11-05
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOLS, executeToolCall } from './tools.js';

export async function startMcpServer(): Promise<void> {
  const server = new Server(
    { name: '108ai-capabilities', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const result = await executeToolCall(name, args ?? {});
      return {
        content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
