import { getToken } from './auth';

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
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
  description: string;
  icon: string;
  capabilities: string[];
  defaultModel: string;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  errorMessage?: string;
  chunkCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSearchResult {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
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

  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/conversations');
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${id}`);
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.request<Message[]>(`/conversations/${conversationId}/messages`);
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
    const path = conversationId
      ? `/conversations/${conversationId}/messages`
      : '/conversations';

    return this.streamRequest(path, {
      content: message,
      agentId,
      model,
      stream: true,
    });
  }

  async getAgents(): Promise<Agent[]> {
    return this.request<Agent[]>('/agents');
  }

  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<Document>('/knowledge/documents', {
      method: 'POST',
      body: formData,
    });
  }

  async getDocuments(): Promise<Document[]> {
    return this.request<Document[]>('/knowledge/documents');
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request<void>(`/knowledge/documents/${id}`, { method: 'DELETE' });
  }

  async searchKnowledge(query: string): Promise<KnowledgeSearchResult[]> {
    return this.request<KnowledgeSearchResult[]>(
      `/knowledge/search?q=${encodeURIComponent(query)}`,
    );
  }
}

export const api = new ApiClient();
