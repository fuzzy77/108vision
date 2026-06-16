import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';

import type { McpToolCallPayload, McpToolListItem, McpTransportClient } from './transport.js';

const PROTOCOL_VERSION = '2024-11-05';
const CLIENT_INFO = { name: '108ai-desktop', version: '0.3.0' };

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface StdioMcpClientOptions {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  timeoutMs?: number;
}

/**
 * Minimal MCP JSON-RPC client over stdio (newline-delimited JSON).
 */
export class StdioMcpClient implements McpTransportClient {
  private proc: ChildProcess | null = null;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private initialized = false;
  private readonly timeoutMs: number;

  constructor(private readonly options: StdioMcpClientOptions) {
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  get pid(): number | undefined {
    return this.proc?.pid;
  }

  async start(): Promise<void> {
    if (this.proc) return;

    this.proc = spawn(this.options.command, this.options.args ?? [], {
      env: { ...process.env, ...this.options.env },
      cwd: this.options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    const rl = createInterface({ input: this.proc.stdout! });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const msg = JSON.parse(trimmed) as JsonRpcResponse;
        if (msg.id !== undefined) {
          const pending = this.pending.get(msg.id);
          if (!pending) return;
          clearTimeout(pending.timer);
          this.pending.delete(msg.id);
          if (msg.error) {
            pending.reject(new Error(msg.error.message));
          } else {
            pending.resolve(msg.result);
          }
        }
      } catch {
        // ignore non-json noise
      }
    });

    this.proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString().trim();
      if (text) {
        console.error(`[mcp:${this.options.command}] ${text}`);
      }
    });

    this.proc.on('exit', (code) => {
      for (const [, pending] of this.pending) {
        clearTimeout(pending.timer);
        pending.reject(new Error(`MCP process exited (${code ?? 'signal'})`));
      }
      this.pending.clear();
      this.proc = null;
      this.initialized = false;
    });

    await this.initialize();
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    this.proc.kill();
    this.proc = null;
    this.initialized = false;
  }

  private send(message: JsonRpcRequest): void {
    if (!this.proc?.stdin?.writable) {
      throw new Error('MCP process stdin non disponibile');
    }
    this.proc.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private request(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP timeout (${method}) dopo ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.send({ jsonrpc: '2.0', id, method, params });
    });
  }

  private notify(method: string, params?: unknown): void {
    this.send({ jsonrpc: '2.0', method, params });
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: CLIENT_INFO,
    });

    this.notify('notifications/initialized');
    this.initialized = true;
  }

  async listTools(): Promise<McpToolListItem[]> {
    const result = (await this.request('tools/list', {})) as {
      tools?: McpToolListItem[];
    };
    return result.tools ?? [];
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpToolCallPayload> {
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
