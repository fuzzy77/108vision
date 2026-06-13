/**
 * WebSocket Connection — Manages the connection to the AIA Gateway.
 *
 * Features:
 * - Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
 * - Heartbeat ping/pong every 30s to detect disconnection
 * - Typed message protocol
 * - Event emitter pattern for incoming messages
 */

import WebSocket from 'ws';
import { nanoid } from 'nanoid';

export interface AgentMessage {
  id: string;
  type: 'request' | 'response' | 'event' | 'heartbeat' | 'register' | 'tool_call';
  action?: string;
  /** Tool name for tool_call messages, e.g. "filesystem.readFile" */
  tool?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  capabilities?: string[];
}

export type MessageHandler = (message: AgentMessage) => void;

interface ConnectionConfig {
  gatewayUrl: string;
  authToken: string;
  tenantId: string;
  capabilities: string[];
  onMessage: MessageHandler;
  onConnect: () => void;
  onDisconnect: () => void;
}

const HEARTBEAT_INTERVAL_MS = 30_000;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

export class AgentConnection {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private connected = false;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  /**
   * Establish the WebSocket connection.
   */
  connect(): void {
    this.intentionalClose = false;
    this.doConnect();
  }

  /**
   * Send a response message back to the gateway.
   */
  sendResponse(requestId: string, result: unknown, error?: string): void {
    const message: AgentMessage = {
      id: requestId,
      type: 'response',
      result: error ? undefined : result,
      error,
    };
    this.send(message);
  }

  /**
   * Send an event notification to the gateway (agent-initiated).
   */
  sendEvent(action: string, params: Record<string, unknown>): void {
    const message: AgentMessage = {
      id: nanoid(21),
      type: 'event',
      action,
      params,
    };
    this.send(message);
  }

  /**
   * Gracefully close the connection.
   */
  disconnect(): void {
    this.intentionalClose = true;
    this.stopHeartbeat();
    this.cancelReconnect();

    if (this.ws) {
      this.ws.close(1000, 'Agent shutting down');
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Check if currently connected.
   */
  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  // --- Private ---

  private doConnect(): void {
    // Build WebSocket URL with auth token
    const url = this.buildUrl();

    console.log(JSON.stringify({
      level: 'info',
      message: 'Connecting to gateway',
      url: this.config.gatewayUrl,
      attempt: this.reconnectAttempts + 1,
    }));

    this.ws = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${this.config.authToken}`,
        'X-Tenant-ID': this.config.tenantId,
      },
    });

    this.ws.on('open', () => this.handleOpen());
    this.ws.on('message', (data) => this.handleMessage(data));
    this.ws.on('close', (code, reason) => this.handleClose(code, reason.toString()));
    this.ws.on('error', (error) => this.handleError(error));
  }

  private handleOpen(): void {
    this.connected = true;
    this.reconnectAttempts = 0;

    console.log(JSON.stringify({
      level: 'info',
      message: 'Connected to gateway',
    }));

    // Register capabilities
    this.send({
      id: nanoid(21),
      type: 'register',
      capabilities: this.config.capabilities,
    });

    // Start heartbeat
    this.startHeartbeat();

    this.config.onConnect();
  }

  private handleMessage(data: WebSocket.RawData): void {
    let message: AgentMessage;
    try {
      message = JSON.parse(data.toString()) as AgentMessage;
    } catch {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Received invalid message from gateway',
      }));
      return;
    }

    // Handle heartbeat internally
    if (message.type === 'heartbeat') {
      this.send({ id: message.id, type: 'heartbeat' });
      return;
    }

    // Forward to handler
    this.config.onMessage(message);
  }

  private handleClose(code: number, reason: string): void {
    this.connected = false;
    this.stopHeartbeat();

    console.log(JSON.stringify({
      level: 'info',
      message: 'Disconnected from gateway',
      code,
      reason,
    }));

    this.config.onDisconnect();

    // Auto-reconnect unless intentionally closed
    if (!this.intentionalClose) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Error): void {
    console.log(JSON.stringify({
      level: 'error',
      message: 'WebSocket error',
      error: error.message,
    }));
  }

  private send(message: AgentMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.send({
        id: nanoid(10),
        type: 'heartbeat',
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.cancelReconnect();

    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_MS,
    );

    console.log(JSON.stringify({
      level: 'info',
      message: `Reconnecting in ${delay}ms`,
      attempt: this.reconnectAttempts + 1,
    }));

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.doConnect();
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private buildUrl(): string {
    // Convert http(s) URL to ws(s) if needed
    let wsUrl = this.config.gatewayUrl;
    if (wsUrl.startsWith('http://')) {
      wsUrl = 'ws://' + wsUrl.slice(7);
    } else if (wsUrl.startsWith('https://')) {
      wsUrl = 'wss://' + wsUrl.slice(8);
    }

    // Ensure path ends with /ws/local-agent
    if (!wsUrl.endsWith('/ws/local-agent')) {
      wsUrl = wsUrl.replace(/\/$/, '') + '/ws/local-agent';
    }

    // Add auth token as query param
    const separator = wsUrl.includes('?') ? '&' : '?';
    return `${wsUrl}${separator}token=${encodeURIComponent(this.config.authToken)}`;
  }
}
