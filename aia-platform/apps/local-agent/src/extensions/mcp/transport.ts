export interface McpToolListItem {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpToolCallPayload {
  content: string;
  isError: boolean;
}

/** Common surface for stdio and remote (SSE/HTTP) MCP transports. */
export interface McpTransportClient {
  readonly pid?: number;
  start(): Promise<void>;
  stop(): Promise<void>;
  listTools(): Promise<McpToolListItem[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallPayload>;
  ping(): Promise<boolean>;
}
