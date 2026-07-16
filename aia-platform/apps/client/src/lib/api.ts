import { getToken } from './auth';

export interface Conversation {
  id: string;
  title?: string;
  agentId?: string;
  agentName?: string;
  lastMessageAt?: string;
  messageCount?: number;
  createdAt: string;
  updatedAt?: string;
  channel?: string;
  status?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  tokenCount?: number;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  capabilities?: string[];
  defaultModel?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: string;
  maxTokens?: number;
  knowledgeBaseIds?: string[];
  config?: Record<string, unknown>;
}

export interface Document {
  id: string;
  title: string;
  name?: string;
  sizeBytes?: number;
  size?: number;
  sourceType?: string;
  mimeType?: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
  chunkCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface KnowledgeSearchResult {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'tenant_admin' | 'client_user';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: 'tenant_admin' | 'client_user';
}

export interface TenantInfo {
  id: string;
  name: string;
  slug?: string;
  plan?: string;
  planId?: string;
  status?: string;
  config?: Record<string, unknown>;
  usageThisMonth?: {
    conversations: number;
    tokens: number;
    estimatedCostUsd: number;
  };
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model?: string;
  modelTier?: string;
  icon?: string;
  temperature?: string;
  maxTokens?: number;
  config?: Record<string, unknown>;
}

export interface CreateAgentPayload {
  name: string;
  description?: string;
  systemPrompt: string;
  model?: string;
  modelTier?: string;
}

export interface UpdateAgentPayload extends Partial<CreateAgentPayload> {
  id: string;
}

interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) ?? {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody: ApiError = await response.json().catch(() => ({
        error: { code: 'UNKNOWN', message: `Request failed with status ${response.status}` },
      }));
      throw new Error(errorBody.error.message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  private async streamRequest(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Response> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody: ApiError = await response.json().catch(() => ({
        error: { code: 'UNKNOWN', message: `Stream request failed with status ${response.status}` },
      }));
      throw new Error(errorBody.error.message);
    }

    return response;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getConversations(): Promise<Conversation[]> {
    const data = await this.request<{ items: Conversation[] } | Conversation[]>('/conversations');
    return Array.isArray(data) ? data : (data?.items ?? []);
  }

  async getConversation(id: string): Promise<Conversation & { messages?: Message[] }> {
    return this.request<Conversation & { messages?: Message[] }>(`/conversations/${id}`);
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const data = await this.request<{ messages?: Message[] } & Record<string, unknown>>(`/conversations/${conversationId}`);
    return data.messages ?? [];
  }

  async deleteConversation(id: string): Promise<void> {
    return this.request<void>(`/conversations/${id}`, { method: 'DELETE' });
  }

  async sendMessage(
    conversationId: string | null,
    message: string,
    agentId: string,
    model: string,
  ): Promise<Response> {
    return this.streamRequest('/chat', {
      message,
      conversationId: conversationId ?? undefined,
      agentId,
      model,
    });
  }

  async getAgents(): Promise<Agent[]> {
    const data = await this.request<{ items: Agent[] } | Agent[]>('/agents');
    return Array.isArray(data) ? data : (data?.items ?? []);
  }

  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<Document>('/knowledge/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getDocuments(): Promise<Document[]> {
    const data = await this.request<{ items: Document[] } | Document[]>('/knowledge/documents');
    return Array.isArray(data) ? data : (data?.items ?? []);
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request<void>(`/knowledge/documents/${id}`, { method: 'DELETE' });
  }

  async searchKnowledge(query: string): Promise<KnowledgeSearchResult[]> {
    return this.request<KnowledgeSearchResult[]>(
      `/knowledge/search?q=${encodeURIComponent(query)}`,
    );
  }

  // --- Tenant admin endpoints ---

  async getTenantInfo(): Promise<TenantInfo> {
    return this.request<TenantInfo>('/tenant/me');
  }

  async updateTenantName(name: string): Promise<TenantInfo> {
    return this.request<TenantInfo>('/tenant/me', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  async getTenantUsers(): Promise<TenantUser[]> {
    const data = await this.request<{ items: TenantUser[] } | TenantUser[]>('/tenant/users');
    return Array.isArray(data) ? data : (data?.items ?? []);
  }

  async createTenantUser(payload: CreateUserPayload): Promise<TenantUser> {
    return this.request<TenantUser>('/tenant/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteTenantUser(userId: string): Promise<void> {
    return this.request<void>(`/tenant/users/${userId}`, { method: 'DELETE' });
  }

  async getAgentConfigs(): Promise<AgentConfig[]> {
    const data = await this.request<{ items: AgentConfig[] } | AgentConfig[]>('/agents');
    return Array.isArray(data) ? data : (data?.items ?? []);
  }

  async createAgent(payload: CreateAgentPayload): Promise<AgentConfig> {
    return this.request<AgentConfig>('/agents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAgent(payload: UpdateAgentPayload): Promise<AgentConfig> {
    const { id, ...body } = payload;
    return this.request<AgentConfig>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async deleteAgent(agentId: string): Promise<void> {
    return this.request<void>(`/agents/${agentId}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
