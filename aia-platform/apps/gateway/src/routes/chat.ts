import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { AppError, type ModelTier, MODEL_TIERS } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { agents, tenants, plans } from '../db/schema.js';
import { conversationService } from '../services/conversation.service.js';
import { ragService, type RetrievedChunk } from '../services/rag.service.js';
import { hybridRagService, type HybridRetrievalResult } from '../services/hybrid-rag.service.js';
import { cacheService } from '../services/cache.service.js';
import { budgetService } from '../services/budget.service.js';
import { classifyMessageTier } from '../services/model-router.service.js';
import { usageTrackingService } from '../services/usage-tracking.service.js';
import { webSearchService, type WebSearchResult } from '../services/web-search.service.js';
import { getEnv } from '../lib/env.js';
import { principlesService } from '../services/principles.service.js';
import { memoryService } from '../services/memory.service.js';

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
  // Hoisted so Step 3a can reuse it without a second DB query.
  let agent: { systemPrompt: string; model: string | null; knowledgeBaseIds: unknown; config: unknown } | undefined;

  if (input.agentId) {
    const db = getDb();
    const [fetchedAgent] = await db
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

    if (!fetchedAgent) {
      throw new AppError('AGENT_NOT_FOUND', 'Agent not found or inactive', 404);
    }

    agent = fetchedAgent;
    systemPrompt = agent.systemPrompt;
    modelTier = (input.model as ModelTier) ?? (agent.model as ModelTier) ?? MODEL_TIERS.BALANCED;
    agentKbIds = (agent.knowledgeBaseIds ?? []) as string[];
  }

  // Step 3a: Prepend AI governance principles to system prompt
  // Reuse the agent object already fetched in Step 3 — no second DB round-trip.
  const agentConfig = agent?.config ?? {};
  const principlesBlock = principlesService.compilePrinciplesPrompt(agentConfig as Record<string, unknown>);
  if (principlesBlock) {
    systemPrompt = principlesBlock + '\n\n---\n\n' + systemPrompt;
  }

  // Step 3b+3c: Fetch budget status and tenant plan in parallel (independent I/O).
  // resolveEffectiveTier and model-downgrade are applied after both resolve.
  const PLAN_TIER_PRIORITY: ModelTier[] = [
    MODEL_TIERS.POWERFUL as ModelTier,
    MODEL_TIERS.BALANCED as ModelTier,
    MODEL_TIERS.FAST_CHEAP as ModelTier,
  ];

  const db = getDb();
  const [budgetStatus, tenantPlanRows] = await Promise.all([
    budgetService.getBudgetStatus(tenantId),
    db
      .select({ planId: tenants.planId, allowedModels: plans.allowedModels })
      .from(tenants)
      .leftJoin(plans, eq(tenants.planId, plans.id))
      .where(eq(tenants.id, tenantId))
      .limit(1),
  ]);

  // Plan-level allowed_models
  const tenantPlan = tenantPlanRows[0];
  const allowed = (tenantPlan?.allowedModels ?? []) as string[];
  const effectiveAllowed = allowed.length > 0 ? allowed : ['fast-cheap', 'balanced', 'powerful', 'coding', 'vision'];

  // Auto-routing: classify message complexity and pick the best tier
  if (modelTier === 'auto' as ModelTier) {
    modelTier = await classifyMessageTier(input.message, effectiveAllowed);
  }

  // Budget-aware tier enforcement
  modelTier = budgetService.resolveEffectiveTier(modelTier, budgetStatus);

  // Plan-level allowed_models enforcement
  if (allowed.length > 0 && !allowed.includes(modelTier)) {
    const fallback = PLAN_TIER_PRIORITY.find((t) => allowed.includes(t));
    modelTier = fallback ?? MODEL_TIERS.FAST_CHEAP as ModelTier;
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

  // Step 4b: Retrieve persistent memories relevant to this message
  let memoryBlock: string | null = null;
  try {
    memoryBlock = await memoryService.getRelevantForChat(tenantId, input.message);
  } catch {
    // Memory retrieval is non-critical
  }

  // Step 4c: Web search fallback when RAG context is sparse and query needs fresh data
  let webResults: WebSearchResult[] = [];
  if (context.length < 2 && webSearchService.queryNeedsWebSearch(input.message)) {
    webResults = await webSearchService.search(input.message);
  }

  // Step 5: Load conversation history
  const historyResult = await conversationService.getHistory(conversationId, 10, tenantId);
  const history = historyResult.success ? historyResult.data : [];

  // Build prompt (hybrid with graph context or vector-only fallback)
  const graphContext = hybridResult?.graphContext ?? null;
  let basePrompt = hybridRagService.buildHybridPrompt(
    systemPrompt,
    context,
    graphContext,
    history,
    input.message,
  );

  // Inject persistent memories into the system message
  if (memoryBlock) {
    const systemMsg = basePrompt[0];
    if (systemMsg && systemMsg.role === 'system') {
      basePrompt = [
        { ...systemMsg, content: `${systemMsg.content}\n\n---\n${memoryBlock}` },
        ...basePrompt.slice(1),
      ];
    }
  }

  // Inject web search results into the system message when available
  if (webResults.length > 0) {
    const webBlock = webResults
      .map((r, i) => `[Result ${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
      .join('\n\n');

    const systemMsg = basePrompt[0];
    if (systemMsg && systemMsg.role === 'system') {
      basePrompt = [
        { ...systemMsg, content: `${systemMsg.content}\n\n---\n**[Web Search Results]**\n${webBlock}` },
        ...basePrompt.slice(1),
      ];
    }
  }

  const prompt = basePrompt;

  // Step 5b: Check LLM response cache
  const contextTexts = context.map(c => c.content);
  const cachedResponse = await cacheService.get(
    tenantId, modelTier, systemPrompt, input.message, contextTexts,
  );

  if (cachedResponse) {
    // Save user message
    await conversationService.addMessage({
      conversationId,
      role: 'user',
      content: input.message,
    });

    // Save cached assistant response
    await conversationService.addMessage({
      conversationId: conversationId!,
      role: 'assistant',
      content: cachedResponse.content,
      modelUsed: cachedResponse.model,
      tokensUsed: 0,
      metadata: { cached: true },
    });

    // Track as cached (zero-cost to LLM, but record the hit)
    await usageTrackingService.trackRequest({
      tenantId,
      userId,
      model: cachedResponse.model,
      inputTokens: 0,
      outputTokens: 0,
      cached: true,
    });

    // Return cached response as SSE
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        event: 'metadata',
        data: JSON.stringify({ conversationId, model: cachedResponse.model, cached: true, budgetAlert: budgetStatus.alert, webSearchUsed: false }),
      });
      await stream.writeSSE({
        event: 'token',
        data: JSON.stringify({ content: cachedResponse.content }),
      });
      await stream.writeSSE({ event: 'done', data: '[DONE]' });
      await stream.writeSSE({
        event: 'usage',
        data: JSON.stringify({ totalTokens: 0, model: cachedResponse.model, cached: true }),
      });
    });
  }

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
      // Send conversation ID + budget alert
      await stream.writeSSE({
        event: 'metadata',
        data: JSON.stringify({ conversationId, model: modelTier, budgetAlert: budgetStatus.alert, budgetUsage: Math.round(budgetStatus.usageRatio * 100), webSearchUsed: webResults.length > 0 }),
      });

      // Call LiteLLM with streaming via fetch (the ai-client doesn't support streaming natively)
      const response = await fetch(`${env.LITELLM_URL}/v1/chat/completions`, {
        signal: AbortSignal.timeout(90_000),
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
        console.error(`[LLM_ERROR] Status ${response.status}: ${errorBody}`);
        throw new AppError(
          'LLM_ERROR',
          'AI service temporarily unavailable',
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
      // Actual per-direction token counts from the final SSE usage chunk (preferred over estimate).
      let streamInputTokens: number | undefined;
      let streamOutputTokens: number | undefined;

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
              if (parsed.usage.prompt_tokens) {
                streamInputTokens = parsed.usage.prompt_tokens;
                streamOutputTokens = parsed.usage.completion_tokens;
              }
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
          webSearchUsed: webResults.length > 0,
          webResultsCount: webResults.length,
        },
      });

      // Track per-request usage and update daily aggregate.
      // Use actual prompt/completion counts from the stream's usage chunk when available;
      // fall back to a 60/40 input/output estimate only when the LLM omits them.
      const estimatedInputTokens = streamInputTokens ?? Math.ceil(totalTokens * 0.6);
      const estimatedOutputTokens = streamOutputTokens ?? (totalTokens - estimatedInputTokens);
      await usageTrackingService.trackRequest({
        tenantId,
        userId,
        model: String(modelUsed),
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
      });

      // Cache the response for future identical requests
      await cacheService.set(
        tenantId, modelTier, systemPrompt, input.message, contextTexts,
        {
          content: fullResponse,
          model: String(modelUsed),
          inputTokens: estimatedInputTokens,
          outputTokens: estimatedOutputTokens,
          cachedAt: Date.now(),
        },
      );

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
          budgetAlert: budgetStatus.alert,
          budgetUsagePercent: Math.round(budgetStatus.usageRatio * 100),
          webSearchUsed: webResults.length > 0,
          webResultsCount: webResults.length,
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

/**
 * POST /api/chat/quick — One-shot (non-streaming) chat for CLI usage.
 *
 * Returns a plain text response without SSE.
 * Used by: 108ai CLI ("108ai 'domanda qui'")
 */
chat.post('/quick', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const userId = c.get('userId') as string;

  const body = await c.req.json();
  const input = z.object({ message: z.string().min(1).max(32000) }).parse(body);

  // Load default agent system prompt + principles
  let systemPrompt = DEFAULT_SYSTEM_PROMPT;
  const principlesBlock = principlesService.compilePrinciplesPrompt({});
  if (principlesBlock) {
    systemPrompt = principlesBlock + '\n\n---\n\n' + systemPrompt;
  }

  // Retrieve context from knowledge base
  let context: RetrievedChunk[] = [];
  const ragResult = await hybridRagService.retrieveHybridContext(input.message, tenantId, {
    vectorTopK: 5,
    minVectorScore: 0.65,
    useGraph: true,
  });

  if (ragResult.success) {
    context = ragResult.data.vectorChunks;
  }

  // Retrieve persistent memories
  let memoryBlock: string | null = null;
  try {
    memoryBlock = await memoryService.getRelevantForChat(tenantId, input.message);
  } catch { /* non-critical */ }

  // Build prompt (no history for one-shot)
  const prompt = hybridRagService.buildHybridPrompt(
    systemPrompt,
    context,
    ragResult.success ? ragResult.data.graphContext : null,
    [],
    input.message,
  );

  // Inject memory
  if (memoryBlock && prompt[0]?.role === 'system') {
    prompt[0] = { ...prompt[0], content: `${prompt[0].content}\n\n---\n${memoryBlock}` };
  }

  // Call LiteLLM (non-streaming)
  const env = getEnv();
  const modelTier = 'fast-cheap';

  const response = await fetch(`${env.LITELLM_URL}/v1/chat/completions`, {
    signal: AbortSignal.timeout(90_000),
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
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[LLM_ERROR] /quick status ${response.status}: ${errorBody}`);
    throw new AppError('LLM_ERROR', 'AI service temporarily unavailable', 502);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };

  const content = data.choices?.[0]?.message?.content ?? '';
  const totalTokens = data.usage?.total_tokens ?? 0;
  const modelUsed = data.model ?? modelTier;

  // Use actual per-direction counts when available; fall back to 60/40 estimate.
  const estimatedInputTokens = data.usage?.prompt_tokens ?? Math.ceil(totalTokens * 0.6);
  const estimatedOutputTokens = data.usage?.completion_tokens ?? (totalTokens - estimatedInputTokens);
  await usageTrackingService.trackRequest({
    tenantId,
    userId,
    model: modelUsed,
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens,
  });

  return c.json({ content, model: modelUsed, tokens: totalTokens });
});

export { chat };
