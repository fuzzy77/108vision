import type { McpToolCallPayload, McpToolListItem, McpTransportClient } from './transport.js';

const PROTOCOL_VERSION = '2024-11-05';
const CLIENT_INFO = { name: '108ai-desktop', version: '0.3.0' };

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface SseMcpClientOptions {
  url: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

/**
 * Remote MCP via HTTP JSON-RPC POST (transport: sse + url in mcp.yml).
 * Compatible with MCP streamable HTTP gateways that accept POST JSON-RPC.
 */
export class SseMcpClient implements McpTransportClient {
  private initialized = false;
  private readonly timeoutMs: number;
  private nextId = 1;

  constructor(private readonly options: SseMcpClientOptions) {
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  get pid(): undefined {
    return undefined;
  }

  async start(): Promise<void> {
    await this.initialize();
  }

  async stop(): Promise<void> {
    this.initialized = false;
  }

  private async request(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++;
    const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });

    const response = await fetch(this.options.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        ...this.options.headers,
      },
      body,
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`MCP HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const raw = await response.text();

    if (contentType.includes('text/event-stream')) {
      const dataLine = raw
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('data:'));
      if (!dataLine) throw new Error('MCP SSE: nessun evento data');
      const msg = JSON.parse(dataLine.slice(5).trim()) as JsonRpcResponse;
      if (msg.error) throw new Error(msg.error.message);
      return msg.result;
    }

    const msg = JSON.parse(raw) as JsonRpcResponse;
    if (msg.error) throw new Error(msg.error.message);
    return msg.result;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: CLIENT_INFO,
    });
    this.initialized = true;
  }

  async listTools(): Promise<McpToolListItem[]> {
    const result = (await this.request('tools/list', {})) as {
      tools?: McpToolListItem[];
    };
    return result.tools ?? [];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallPayload> {
    const result = (await this.request('tools/call', { name, arguments: args })) as {
      content?: Array<{ type: string; text?: string }>;
      isError?: boolean;
    };
    const text = (result.content ?? [])
      .map((c) => (c.type === 'text' ? c.text ?? '' : JSON.stringify(c)))
      .join('\n');
    return { content: text, isError: result.isError === true };
  }

  async ping(): Promise<boolean> {
    try {
      await this.listTools();
      return true;
    } catch {
      return false;
    }
  }
}
