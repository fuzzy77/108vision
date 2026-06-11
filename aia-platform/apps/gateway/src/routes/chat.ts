import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { AppError, type ModelTier, MODEL_TIERS } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { agents } from '../db/schema.js';
import { conversationService } from '../services/conversation.service.js';
import { ragService, type RetrievedChunk } from '../services/rag.service.js';
import { hybridRagService, type HybridRetrievalResult } from '../services/hybrid-rag.service.js';
import { getEnv } from '../lib/env.js';

const chat = new Hono();

const chatRequestSchema = z.object({
  message: z.string().min(1).max(32000),
  conversationId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  model: z.enum(['fast-cheap', 'balanced', 'powerful']).optional(),
  useGraph: z.boolean().optional(),
});

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Answer questions clearly and concisely. If you don't know the answer, say so honestly. Do not make up information.`;

/**
 * POST /api/chat — Send a message and receive a streaming response via SSE.
 *
 * Flow:
 * 1. Validate input
 * 2. Get or create conversation
 * 3. Load agent configuration (if agentId provided)
 * 4. Retrieve relevant context from knowledge base
 * 5. Build prompt (system + context + history + user message)
 * 6. Call LiteLLM and stream tokens back via SSE
 * 7. Save message pair to database
 */
chat.post('/', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const userId = c.get('userId') as string;

  const body = await c.req.json();
  const input = chatRequestSchema.parse(body);

  // Step 2: Get or create conversation
  let conversationId = input.conversationId;

  if (!conversationId) {
    const createResult = await conversationService.create({
      tenantId,
      userId,
      title: input.message.slice(0, 100),
      channel: 'api',
    });

    if (!createResult.success) {
      throw createResult.error;
    }

    conversationId = createResult.data.id;
  } else {
    // Verify conversation exists and belongs to this tenant
    const convResult = await conversationService.getById(conversationId, tenantId);
    if (!convResult.success) {
      throw convResult.error;
    }
  }

  // Step 3: Load agent configuration
  let systemPrompt = DEFAULT_SYSTEM_PROMPT;
  let modelTier: ModelTier = (input.model as ModelTier) ?? MODEL_TIERS.BALANCED;
  let agentKbIds: string[] = [];

  if (input.agentId) {
    const db = getDb();
    const [agent] = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.id, input.agentId),
          eq(agents.tenantId, tenantId),
          eq(agents.isActive, true),
        ),
      )
      .limit(1);

    if (!agent) {
      throw new AppError('AGENT_NOT_FOUND', 'Agent not found or inactive', 404);
    }

    systemPrompt = agent.systemPrompt;
    modelTier = (input.model as ModelTier) ?? (agent.model as ModelTier) ?? MODEL_TIERS.BALANCED;
    agentKbIds = (agent.knowledgeBaseIds ?? []) as string[];
  }

  // Step 4: Retrieve context from knowledge base (hybrid: vector + graph)
  const useGraph = input.useGraph !== false; // default true
  let context: RetrievedChunk[] = [];
  let hybridResult: HybridRetrievalResult | null = null;

  const ragResult = await hybridRagService.retrieveHybridContext(input.message, tenantId, {
    vectorTopK: 8,
    minVectorScore: 0.6,
    useGraph,
  });

  if (ragResult.success) {
    hybridResult = ragResult.data;
    context = hybridResult.vectorChunks;
  } else {
    // Fallback to vector-only if hybrid fails entirely
    const vectorFallback = await ragService.retrieveContext(input.message, tenantId, {
      limit: 5,
      threshold: 0.7,
    });
    if (vectorFallback.success) {
      context = vectorFallback.data;
    }
  }

  // Step 5: Load conversation history
  const historyResult = await conversationService.getHistory(conversationId, 10);
  const history = historyResult.success ? historyResult.data : [];

  // Build prompt (hybrid with graph context or vector-only fallback)
  const graphContext = hybridResult?.graphContext ?? null;
  const prompt = hybridRagService.buildHybridPrompt(
    systemPrompt,
    context,
    graphContext,
    history,
    input.message,
  );

  // Save user message
  await conversationService.addMessage({
    conversationId,
    role: 'user',
    content: input.message,
  });

  // Step 6: Stream response via SSE
  const env = getEnv();

  return streamSSE(c, async (stream) => {
    let fullResponse = '';
    let totalTokens = 0;
    let modelUsed = modelTier;

    try {
      // Send conversation ID first
      await stream.writeSSE({
        event: 'metadata',
        data: JSON.stringify({ conversationId, model: modelTier }),
      });

      // Call LiteLLM with streaming via fetch (the ai-client doesn't support streaming natively)
      const response = await fetch(`${env.LITELLM_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.LITELLM_MASTER_KEY}`,
        },
        body: JSON.stringify({
          model: modelTier,
          messages: prompt,
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new AppError(
          'LLM_ERROR',
          `LLM request failed with status ${response.status}: ${errorBody}`,
          502,
        );
      }

      if (!response.body) {
        throw new AppError('LLM_ERROR', 'No response body from LLM', 502);
      }

      // Process SSE stream from LiteLLM
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            await stream.writeSSE({ event: 'done', data: '[DONE]' });
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            const content = delta?.content;

            if (content) {
              fullResponse += content;
              await stream.writeSSE({
                event: 'token',
                data: JSON.stringify({ content }),
              });
            }

            // Extract model and usage info
            if (parsed.model) {
              modelUsed = parsed.model;
            }
            if (parsed.usage) {
              totalTokens = parsed.usage.total_tokens ?? 0;
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      // Step 7: Save assistant message
      await conversationService.addMessage({
        conversationId: conversationId!,
        role: 'assistant',
        content: fullResponse,
        modelUsed: String(modelUsed),
        tokensUsed: totalTokens,
        metadata: {
          contextChunks: context.length,
          graphEntities: hybridResult?.graphContext?.entities.length ?? 0,
          graphAvailable: hybridResult?.graphAvailable ?? false,
          historyMessages: history.length,
        },
      });

      // Update conversation title if this is the first exchange
      if (!input.conversationId && fullResponse) {
        const title = input.message.slice(0, 100);
        await conversationService.updateTitle(conversationId!, title);
      }

      // Send final usage event
      await stream.writeSSE({
        event: 'usage',
        data: JSON.stringify({
          totalTokens,
          model: modelUsed,
          contextChunks: context.length,
          graphEntities: hybridResult?.graphContext?.entities.length ?? 0,
          graphAvailable: hybridResult?.graphAvailable ?? false,
        }),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stream processing failed';
      console.error(JSON.stringify({
        level: 'error',
        message: 'Chat stream error',
        conversationId,
        tenantId,
        error: errorMessage,
      }));

      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({
          code: error instanceof AppError ? error.code : 'STREAM_ERROR',
          message: errorMessage,
        }),
      });
    }
  });
});

export { chat };
