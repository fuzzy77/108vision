/**
 * @aia/ai-client — LiteLLM client wrapper for the AIA Platform.
 *
 * Provides a typed, tenant-aware interface to the AI gateway.
 */

import { type ModelTier, MODEL_TIERS, AppError } from '@aia/shared';

// --- Types ---

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: ModelTier;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  metadata?: Record<string, string>;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  data: Array<{
    index: number;
    embedding: number[];
  }>;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface AIClientConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel?: ModelTier;
  timeoutMs?: number;
  maxRetries?: number;
}

// --- Client ---

export class AIClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: ModelTier;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(config: AIClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel ?? MODEL_TIERS.FAST_CHEAP;
    this.timeoutMs = config.timeoutMs ?? 60_000;
    this.maxRetries = config.maxRetries ?? 2;
  }

  /**
   * Send a chat completion request to LiteLLM.
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const body = {
      model: request.model ?? this.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: request.stream ?? false,
      metadata: request.metadata,
    };

    const response = await this.fetch('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      id: data.id,
      model: data.model,
      choices: data.choices.map((c: any) => ({
        index: c.index,
        message: { role: c.message.role, content: c.message.content },
        finishReason: c.finish_reason,
      })),
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  /**
   * Generate embeddings for text input.
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const body = {
      model: request.model ?? MODEL_TIERS.EMBEDDING,
      input: request.input,
    };

    const response = await this.fetch('/v1/embeddings', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      data: data.data.map((d: any) => ({
        index: d.index,
        embedding: d.embedding,
      })),
      usage: {
        promptTokens: data.usage.prompt_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  /**
   * Check if LiteLLM is healthy.
   */
  async health(): Promise<boolean> {
    try {
      const response = await this.fetch('/health', { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models.
   */
  async listModels(): Promise<string[]> {
    const response = await this.fetch('/v1/models', { method: 'GET' });
    const data = await response.json();
    return data.data.map((m: any) => m.id);
  }

  // --- Private ---

  private async fetch(path: string, init: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await globalThis.fetch(url, {
          ...init,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          return response;
        }

        // Non-retryable errors
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          const errorBody = await response.json().catch(() => ({}));
          throw new AppError(
            'AI_CLIENT_ERROR',
            errorBody?.error?.message ?? `LiteLLM returned ${response.status}`,
            response.status,
          );
        }

        // Retryable: 429, 5xx
        lastError = new Error(`LiteLLM returned ${response.status}`);
      } catch (error) {
        if (error instanceof AppError) throw error;
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // Exponential backoff before retry
      if (attempt < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new AppError(
      'AI_GATEWAY_UNAVAILABLE',
      `Failed to reach AI gateway after ${this.maxRetries + 1} attempts: ${lastError?.message}`,
      503,
    );
  }
}

// --- Factory ---

export function createAIClient(config?: Partial<AIClientConfig>): AIClient {
  return new AIClient({
    baseUrl: config?.baseUrl ?? process.env.LITELLM_URL ?? 'http://litellm:4000',
    apiKey: config?.apiKey ?? process.env.LITELLM_MASTER_KEY ?? '',
    defaultModel: config?.defaultModel,
    timeoutMs: config?.timeoutMs,
    maxRetries: config?.maxRetries,
  });
}
