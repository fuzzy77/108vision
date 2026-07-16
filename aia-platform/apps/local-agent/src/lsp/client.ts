/**
 * LSP Client — Spawns language servers and communicates via JSON-RPC over stdio.
 *
 * Provides: initialize, open/close documents, get diagnostics, definition, references.
 * Uses Content-Length framing (LSP protocol standard).
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { Transform } from 'node:stream';
import { type LspServerConfig } from './servers.js';

export interface LspDiagnostic {
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  severity: number;
  code?: string | number;
  source?: string;
  message: string;
}

export interface LspLocation {
  uri: string;
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class LspClient {
  private process: ChildProcess | null = null;
  private reader: LspFrameReader | null = null;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private diagnosticsHandlers = new Map<string, (diags: LspDiagnostic[]) => void>();
  private initialized = false;

  constructor(
    private config: LspServerConfig,
    private rootUri: string,
  ) {}

  async start(): Promise<void> {
    const [cmd, ...args] = this.config.command;
    if (!cmd) throw new Error(`No command for LSP server ${this.config.id}`);

    this.process = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' },
    });

    this.process.on('error', (err) => {
      this.rejectAll(new Error(`LSP server ${this.config.id} error: ${err.message}`));
    });

    this.process.on('exit', (code) => {
      this.rejectAll(new Error(`LSP server ${this.config.id} exited with code ${code}`));
      this.initialized = false;
    });

    this.reader = new LspFrameReader();
    this.process.stdout!.pipe(this.reader);
    this.reader.on('data', (buf: Buffer) => this.handleMessage(buf));

    await this.initialize();
  }

  async stop(): Promise<void> {
    if (this.process) {
      await this.request('shutdown', null);
      this.notify('exit', null);
      this.process.kill();
      this.process = null;
      this.initialized = false;
    }
  }

  isRunning(): boolean {
    return this.initialized && this.process !== null && !this.process.killed;
  }

  async openDocument(uri: string, languageId: string, text: string): Promise<void> {
    this.notify('textDocument/didOpen', {
      textDocument: { uri, languageId, version: 1, text },
    });
  }

  async changeDocument(uri: string, version: number, text: string): Promise<void> {
    this.notify('textDocument/didChange', {
      textDocument: { uri, version },
      contentChanges: [{ text }],
    });
  }

  async closeDocument(uri: string): Promise<void> {
    this.notify('textDocument/didClose', {
      textDocument: { uri },
    });
  }

  onDiagnostics(uri: string, handler: (diags: LspDiagnostic[]) => void): () => void {
    this.diagnosticsHandlers.set(uri, handler);
    return () => { this.diagnosticsHandlers.delete(uri); };
  }

  async waitForDiagnostics(uri: string, timeoutMs = 5000): Promise<LspDiagnostic[]> {
    return new Promise((resolve, _reject) => {
      const timer = setTimeout(() => {
        this.diagnosticsHandlers.delete(uri);
        resolve([]);
      }, timeoutMs);

      this.diagnosticsHandlers.set(uri, (diags) => {
        clearTimeout(timer);
        this.diagnosticsHandlers.delete(uri);
        resolve(diags);
      });
    });
  }

  async definition(uri: string, line: number, character: number): Promise<LspLocation[]> {
    const result = await this.request('textDocument/definition', {
      textDocument: { uri },
      position: { line, character },
    });
    if (!result) return [];
    return Array.isArray(result) ? result as LspLocation[] : [result as LspLocation];
  }

  async references(uri: string, line: number, character: number): Promise<LspLocation[]> {
    const result = await this.request('textDocument/references', {
      textDocument: { uri },
      position: { line, character },
      context: { includeDeclaration: true },
    });
    return Array.isArray(result) ? result : [];
  }

  async hover(uri: string, line: number, character: number): Promise<string | null> {
    const result = (await this.request('textDocument/hover', {
      textDocument: { uri },
      position: { line, character },
    })) as { contents?: { value?: string } | string } | null;

    if (!result || !result.contents) return null;
    if (typeof result.contents === 'string') return result.contents;
    return result.contents.value ?? null;
  }

  // --- Private ---

  private async initialize(): Promise<void> {
    await this.request('initialize', {
      processId: process.pid,
      clientInfo: { name: '108ai-lsp', version: '1.0.0' },
      rootUri: this.rootUri,
      capabilities: {
        textDocument: {
          publishDiagnostics: { relatedInformation: true },
          definition: { linkSupport: false },
          references: {},
          hover: { contentFormat: ['plaintext', 'markdown'] },
        },
      },
    });
    this.notify('initialized', {});
    this.initialized = true;
  }

  private request(method: string, params: unknown, timeoutMs = 30_000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin?.writable) {
        return reject(new Error('LSP server not running'));
      }

      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`LSP request ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.writeMessage({ jsonrpc: '2.0', id, method, params });
    });
  }

  private notify(method: string, params: unknown): void {
    this.writeMessage({ jsonrpc: '2.0', method, params });
  }

  private writeMessage(msg: object): void {
    const body = JSON.stringify(msg);
    const byteLen = Buffer.byteLength(body, 'utf8');
    this.process!.stdin!.write(`Content-Length: ${byteLen}\r\n\r\n${body}`, 'utf8');
  }

  private handleMessage(buf: Buffer): void {
    let msg: any;
    try {
      msg = JSON.parse(buf.toString('utf8'));
    } catch {
      return;
    }

    // Response to a request
    if ('id' in msg && msg.id !== null) {
      const pending = this.pending.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(msg.id);
        if (msg.error) {
          pending.reject(new Error(`LSP error ${msg.error.code}: ${msg.error.message}`));
        } else {
          pending.resolve(msg.result);
        }
      }
      return;
    }

    // Notification (no id)
    if (msg.method === 'textDocument/publishDiagnostics') {
      const uri = msg.params?.uri;
      const handler = this.diagnosticsHandlers.get(uri);
      if (handler) {
        handler(msg.params.diagnostics ?? []);
      }
    }
  }

  private rejectAll(error: Error): void {
    for (const [_id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}

// --- Content-Length frame reader ---

class LspFrameReader extends Transform {
  private buffer = Buffer.alloc(0);

  override _transform(chunk: Buffer, _encoding: string, done: () => void): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (true) {
      const sepIdx = this.buffer.indexOf('\r\n\r\n');
      if (sepIdx === -1) break;

      const header = this.buffer.subarray(0, sepIdx).toString('utf8');
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        this.buffer = this.buffer.subarray(sepIdx + 4);
        continue;
      }

      const bodyLen = parseInt(match[1]!, 10);
      const bodyStart = sepIdx + 4;

      if (this.buffer.length < bodyStart + bodyLen) break;

      this.push(this.buffer.subarray(bodyStart, bodyStart + bodyLen));
      this.buffer = this.buffer.subarray(bodyStart + bodyLen);
    }

    done();
  }
}
