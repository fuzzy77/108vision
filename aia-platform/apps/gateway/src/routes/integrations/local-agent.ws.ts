/**
 * Local Agent WebSocket Handler — Manages connections from on-premise local agents.
 *
 * Protocol:
 * - Local agents connect via WebSocket to /ws/local-agent
 * - Authentication via token in query param (?token=xxx) or first message
 * - Once connected, agents register their capabilities
 * - Gateway routes action requests from chat/API to the connected agent
 * - Agents respond with results that are forwarded back to the caller
 *
 * Connection lifecycle:
 * 1. WebSocket upgrade request with auth token
 * 2. Agent sends 'register' message with capabilities list
 * 3. Gateway sends 'request' messages for actions
 * 4. Agent sends 'response' messages with results
 * 5. Heartbeat ping/pong every 30s to detect disconnection
 */

import { nanoid } from 'nanoid';
import { z } from 'zod';

// --- Incoming message schema ------------------------------------------------
// Validates structure and sizes of every message received from a local agent.
// Uses .passthrough() so the switch-case below can still access known fields
// while unknown extra fields are carried through without rejection.

const AgentMessageSchema = z.object({
  id: z.string().max(100),
  type: z.enum(['request', 'response', 'event', 'heartbeat', 'register']),
  action: z.string().max(200).optional(),
  params: z.record(z.unknown()).optional(),
  result: z.unknown().optional(),
  error: z.string().max(1000).optional(),
  capabilities: z.array(z.string().max(100)).max(100).optional(),
}).passthrough();

// --- Types ---

export interface AgentMessage {
  id: string;
  type: 'request' | 'response' | 'event' | 'heartbeat' | 'register';
  action?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  capabilities?: string[];
}

interface ConnectedAgent {
  id: string;
  tenantId: string;
  capabilities: string[];
  connectedAt: number;
  lastHeartbeat: number;
  ws: WebSocketLike;
  pendingRequests: Map<string, PendingRequest>;
}

interface PendingRequest {
  id: string;
  action: string;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  createdAt: number;
}

interface WebSocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  readyState: number;
}

// --- Agent Registry (Singleton) ---

class LocalAgentRegistry {
  private agents = new Map<string, ConnectedAgent>();
  private tenantAgentMap = new Map<string, Set<string>>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private static readonly HEARTBEAT_INTERVAL_MS = 30_000;
  private static readonly HEARTBEAT_TIMEOUT_MS = 45_000;
  private static readonly REQUEST_TIMEOUT_MS = 30_000;

  constructor() {
    this.heartbeatInterval = setInterval(
      () => this.checkHeartbeats(),
      LocalAgentRegistry.HEARTBEAT_INTERVAL_MS,
    );
  }

  /**
   * Register a new agent connection.
   */
  registerAgent(tenantId: string, ws: WebSocketLike): string {
    const agentId = nanoid(21);
    const agent: ConnectedAgent = {
      id: agentId,
      tenantId,
      capabilities: [],
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      ws,
      pendingRequests: new Map(),
    };

    this.agents.set(agentId, agent);

    if (!this.tenantAgentMap.has(tenantId)) {
      this.tenantAgentMap.set(tenantId, new Set());
    }
    this.tenantAgentMap.get(tenantId)!.add(agentId);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Local agent connected',
      agentId,
      tenantId,
    }));

    return agentId;
  }

  /**
   * Update agent capabilities (called when agent sends 'register' message).
   */
  setCapabilities(agentId: string, capabilities: string[]): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.capabilities = capabilities;
      console.log(JSON.stringify({
        level: 'info',
        message: 'Local agent capabilities registered',
        agentId,
        tenantId: agent.tenantId,
        capabilities,
      }));
    }
  }

  /**
   * Handle an incoming message from a local agent.
   */
  handleMessage(agentId: string, raw: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.lastHeartbeat = Date.now();

    let message: AgentMessage;
    try {
      const parsed = AgentMessageSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        console.log(JSON.stringify({
          level: 'warn',
          message: 'Rejected message from local agent: schema validation failed',
          agentId,
          errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        }));
        // Send a structured error back so the agent can surface it
        agent.ws.send(JSON.stringify({ error: 'Invalid message format' }));
        return;
      }
      message = parsed.data as AgentMessage;
    } catch {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Invalid message from local agent (JSON parse error)',
        agentId,
      }));
      return;
    }

    switch (message.type) {
      case 'register':
        if (message.capabilities) {
          this.setCapabilities(agentId, message.capabilities);
        }
        break;

      case 'response': {
        const pending = agent.pendingRequests.get(message.id);
        if (pending) {
          clearTimeout(pending.timeout);
          agent.pendingRequests.delete(message.id);

          if (message.error) {
            pending.reject(new Error(message.error));
          } else {
            pending.resolve(message.result);
          }
        }
        break;
      }

      case 'heartbeat':
        // Send pong
        this.sendToAgent(agentId, {
          id: message.id,
          type: 'heartbeat',
        });
        break;

      case 'event':
        // Agent-initiated events (e.g., file change notifications)
        // For now, log them — future: push to SSE or event bus
        console.log(JSON.stringify({
          level: 'info',
          message: 'Local agent event',
          agentId,
          tenantId: agent.tenantId,
          action: message.action,
        }));
        break;

      default:
        break;
    }
  }

  /**
   * Send an action request to the agent for a given tenant.
   * Returns a promise that resolves with the agent's response.
   */
  async executeAction(
    tenantId: string,
    action: string,
    params: Record<string, unknown>,
    timeoutMs = LocalAgentRegistry.REQUEST_TIMEOUT_MS,
  ): Promise<unknown> {
    const agentId = this.getActiveAgentForTenant(tenantId);
    if (!agentId) {
      throw new Error('No local agent connected for this tenant');
    }

    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent disconnected');
    }

    const requestId = nanoid(21);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        agent.pendingRequests.delete(requestId);
        reject(new Error(`Agent did not respond within ${timeoutMs / 1000}s`));
      }, timeoutMs);

      const pending: PendingRequest = {
        id: requestId,
        action,
        resolve,
        reject,
        timeout,
        createdAt: Date.now(),
      };

      agent.pendingRequests.set(requestId, pending);

      const message: AgentMessage = {
        id: requestId,
        type: 'request',
        action,
        params,
      };

      this.sendToAgent(agentId, message);
    });
  }

  /**
   * Check if a tenant has a connected local agent.
   */
  isAgentConnected(tenantId: string): boolean {
    return this.getActiveAgentForTenant(tenantId) !== null;
  }

  /**
   * Get capabilities of the connected agent for a tenant.
   */
  getAgentCapabilities(tenantId: string): string[] {
    const agentId = this.getActiveAgentForTenant(tenantId);
    if (!agentId) return [];

    const agent = this.agents.get(agentId);
    return agent?.capabilities ?? [];
  }

  /**
   * Get connection status for a tenant.
   */
  getAgentStatus(tenantId: string): {
    connected: boolean;
    agentId: string | null;
    capabilities: string[];
    connectedAt: number | null;
    lastHeartbeat: number | null;
  } {
    const agentId = this.getActiveAgentForTenant(tenantId);
    if (!agentId) {
      return {
        connected: false,
        agentId: null,
        capabilities: [],
        connectedAt: null,
        lastHeartbeat: null,
      };
    }

    const agent = this.agents.get(agentId)!;
    return {
      connected: true,
      agentId: agent.id,
      capabilities: agent.capabilities,
      connectedAt: agent.connectedAt,
      lastHeartbeat: agent.lastHeartbeat,
    };
  }

  /**
   * Disconnect an agent (called on WebSocket close).
   */
  disconnectAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Reject all pending requests
    for (const [, pending] of agent.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Agent disconnected'));
    }
    agent.pendingRequests.clear();

    // Remove from maps
    const tenantAgents = this.tenantAgentMap.get(agent.tenantId);
    if (tenantAgents) {
      tenantAgents.delete(agentId);
      if (tenantAgents.size === 0) {
        this.tenantAgentMap.delete(agent.tenantId);
      }
    }

    this.agents.delete(agentId);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Local agent disconnected',
      agentId,
      tenantId: agent.tenantId,
    }));
  }

  /**
   * Shutdown the registry (cleanup on server stop).
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const [agentId, agent] of this.agents) {
      try {
        agent.ws.close(1001, 'Server shutting down');
      } catch {
        // Ignore close errors
      }
      this.disconnectAgent(agentId);
    }
  }

  // --- Private ---

  private getActiveAgentForTenant(tenantId: string): string | null {
    const agentIds = this.tenantAgentMap.get(tenantId);
    if (!agentIds || agentIds.size === 0) return null;

    // Return the first connected agent
    for (const id of agentIds) {
      const agent = this.agents.get(id);
      if (agent && agent.ws.readyState === 1) {
        return id;
      }
    }

    return null;
  }

  private sendToAgent(agentId: string, message: AgentMessage): void {
    const agent = this.agents.get(agentId);
    if (!agent || agent.ws.readyState !== 1) {
      return;
    }

    try {
      agent.ws.send(JSON.stringify(message));
    } catch (error) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Failed to send message to local agent',
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  private checkHeartbeats(): void {
    const now = Date.now();
    const staleAgents: string[] = [];

    for (const [agentId, agent] of this.agents) {
      if (now - agent.lastHeartbeat > LocalAgentRegistry.HEARTBEAT_TIMEOUT_MS) {
        staleAgents.push(agentId);
      } else {
        // Send heartbeat ping
        this.sendToAgent(agentId, {
          id: nanoid(10),
          type: 'heartbeat',
        });
      }
    }

    for (const agentId of staleAgents) {
      const agent = this.agents.get(agentId);
      if (agent) {
        try {
          agent.ws.close(4001, 'Heartbeat timeout');
        } catch {
          // Ignore
        }
        this.disconnectAgent(agentId);
      }
    }
  }
}

// Singleton instance
let registryInstance: LocalAgentRegistry | null = null;

export function getLocalAgentRegistry(): LocalAgentRegistry {
  if (!registryInstance) {
    registryInstance = new LocalAgentRegistry();
  }
  return registryInstance;
}

export function shutdownLocalAgentRegistry(): void {
  if (registryInstance) {
    registryInstance.shutdown();
    registryInstance = null;
  }
}
