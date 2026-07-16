/**
 * Agent Chat Service — Orchestrates the full chat pipeline for Desktop Agent shell sessions.
 *
 * This service extracts the chat logic from the HTTP route so it can be driven
 * by WebSocket messages (desktop agent shell) or HTTP (web UI).
 *
 * Flow: message → RAG → memory → LLM (streaming) → tool_call loop → done
 */

import { eq, and } from 'drizzle-orm';
import { type ModelTier, MODEL_TIERS } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { agents, tenants, plans } from '../db/schema.js';
import { conversationService } from './conversation.service.js';
import { hybridRagService, type HybridRetrievalResult } from './hybrid-rag.service.js';
import { ragService, type RetrievedChunk } from './rag.service.js';
import { budgetService } from './budget.service.js';
import { classifyMessageTier } from './model-router.service.js';
import { usageTrackingService } from './usage-tracking.service.js';
import { principlesService } from './principles.service.js';
import { memoryService } from './memory.service.js';
import { webSearchService, type WebSearchResult } from './web-search.service.js';
import { getEnv } from '../lib/env.js';

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant. Answer questions clearly and concisely. If you don't know the answer, say so honestly. Do not make up information.`;

export interface ChatStreamCallbacks {
  onToken: (content: string) => void;
  onToolCall: (id: string, tool: string, params: Record<string, unknown>) => Promise<unknown>;
  onDone: (usage: { totalTokens: number; model: string; conversationId?: string }) => void;
  onError: (error: string) => void;
}

export interface AgentChatOptions {
  tenantId: string;
  userId?: string;
  message: string;
  agentId?: string;
  model?: ModelTier;
  conversationId?: string;
}

interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const DESKTOP_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'filesystem_readFile',
      description: 'Read a file from the local filesystem. Returns the file content as text.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the file to read' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'filesystem_writeFile',
      description: 'Write content to a file. Creates directories if needed.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the file to write' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'filesystem_listDirectory',
      description: 'List files and directories at the given path.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to list' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'shell_execute',
      description: 'Execute a shell command and return stdout/stderr.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The command to execute' },
          cwd: { type: 'string', description: 'Working directory (optional)' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'filesystem_grep',
      description: 'Search for a pattern in files. Returns matching lines with file paths.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex or string pattern to search for' },
          path: { type: 'string', description: 'Directory to search in' },
          include: { type: 'string', description: 'Glob pattern for files to include (e.g. "*.ts")' },
        },
        required: ['pattern', 'path'],
      },
    },
  },
];

function toolNameToWire(name: string): string {
  return name.replace(/_/g, '.');
}

// --- Context Window Management ---

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}


const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  'fast-cheap': 56_000,   // DeepSeek V3: 64K context, reserve 8K for output
  'balanced': 56_000,     // DeepSeek R1: 64K context, reserve 8K for output
  'powerful': 120_000,    // Qwen3-235B: 128K context, reserve 8K output
  'coding': 56_000,       // DeepSeek V3: 64K
  'vision': 28_000,       // Qwen-VL: 32K, reserve 4K
};

interface ContextBudget {
  maxInputTokens: number;
  systemTokens: number;
  userMessageTokens: number;
  remainingForContext: number;
}

function computeContextBudget(
  systemPrompt: string,
  userMessage: string,
  modelTier: string,
): ContextBudget {
  const maxInputTokens = MODEL_CONTEXT_LIMITS[modelTier] ?? 56_000;
  const systemTokens = estimateTokens(systemPrompt) + 4;
  const userMessageTokens = estimateTokens(userMessage) + 4;
  const remainingForContext = Math.max(0, maxInputTokens - systemTokens - userMessageTokens - 500); // 500 overhead buffer
  return { maxInputTokens, systemTokens, userMessageTokens, remainingForContext };
}

function trimHistoryToFit(
  history: Array<{ role: string | null; content: string }>,
  maxTokens: number,
): Array<{ role: string | null; content: string }> {
  if (maxTokens <= 0) return [];

  let total = 0;
  const kept: Array<{ role: string | null; content: string }> = [];

  // Keep recent messages first (history is chronological, most recent = last)
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]!;
    const msgTokens = estimateTokens(msg.content) + 4;
    if (total + msgTokens > maxTokens) break;
    total += msgTokens;
    kept.unshift(msg);
  }
  return kept;
}

function trimRagChunks(chunks: RetrievedChunk[], maxTokens: number): RetrievedChunk[] {
  if (maxTokens <= 0) return [];

  let total = 0;
  const kept: RetrievedChunk[] = [];
  for (const chunk of chunks) {
    const tokens = estimateTokens(chunk.content) + 20; // metadata overhead
    if (total + tokens > maxTokens) break;
    total += tokens;
    kept.push(chunk);
  }
  return kept;
}

function trimTextBlock(text: string, maxTokens: number): string {
  if (maxTokens <= 0) return '';
  const tokens = estimateTokens(text);
  if (tokens <= maxTokens) return text;
  // Truncate to approximate char limit
  const maxChars = Math.floor(maxTokens * 3.5);
  return text.slice(0, maxChars) + '\n[...truncated]';
}


/**
 * Run a full chat turn with streaming tokens and tool-call loop.
 *
 * The tool-call loop works as follows:
 * 1. Send message + tools to LLM
 * 2. If LLM responds with tool_calls → invoke onToolCall callback (agent executes locally)
 * 3. Append tool results to messages, call LLM again
 * 4. Repeat until LLM gives a final text response (no more tool calls)
 */
export async function runAgentChat(
  options: AgentChatOptions,
  callbacks: ChatStreamCallbacks,
  agentCapabilities: string[] = [],
): Promise<void> {
  const { tenantId, userId, message, agentId, model } = options;

  // --- Step 1: Load agent configuration ---
  let systemPrompt = DEFAULT_SYSTEM_PROMPT;
  let modelTier: ModelTier = model ?? MODEL_TIERS.BALANCED as ModelTier;
  let agentConfig: Record<string, unknown> = {};

  {
    const db = getDb();
    let effectiveAgentId = agentId;

    // If no agent specified, auto-select the tenant's default (or only) agent
    if (!effectiveAgentId) {
      const [defaultAgent] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(and(eq(agents.tenantId, tenantId), eq(agents.isActive, true)))
        .limit(1);
      if (defaultAgent) effectiveAgentId = defaultAgent.id;
    }

    if (effectiveAgentId) {
      const [fetchedAgent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, effectiveAgentId), eq(agents.tenantId, tenantId), eq(agents.isActive, true)))
        .limit(1);

      if (fetchedAgent) {
        systemPrompt = fetchedAgent.systemPrompt;
        modelTier = model ?? (fetchedAgent.model as ModelTier) ?? MODEL_TIERS.BALANCED as ModelTier;
        agentConfig = (fetchedAgent.config ?? {}) as Record<string, unknown>;
      }
    }
  }

  // --- Step 2: Prepend principles ---
  const principlesBlock = principlesService.compilePrinciplesPrompt(agentConfig);
  if (principlesBlock) {
    systemPrompt = principlesBlock + '\n\n---\n\n' + systemPrompt;
  }

  // Add desktop-agent context to system prompt
  systemPrompt += `\n\n---\nYou have access to the user's local computer via tool calls. You can read/write files, execute shell commands, and search through code. Use tools when the user asks you to interact with their filesystem or run commands. Always confirm before destructive operations (delete, overwrite).`;

  // --- Step 3: Budget + plan enforcement ---
  const db = getDb();
  const [budgetStatus, tenantPlanRows] = await Promise.all([
    budgetService.getBudgetStatus(tenantId),
    db.select({ planId: tenants.planId, allowedModels: plans.allowedModels })
      .from(tenants)
      .leftJoin(plans, eq(tenants.planId, plans.id))
      .where(eq(tenants.id, tenantId))
      .limit(1),
  ]);

  const tenantPlan = tenantPlanRows[0];
  const allowed = (tenantPlan?.allowedModels ?? []) as string[];
  const effectiveAllowed = allowed.length > 0 ? allowed : ['fast-cheap', 'balanced', 'powerful', 'coding', 'vision'];

  if (modelTier === 'auto' as ModelTier) {
    modelTier = await classifyMessageTier(message, effectiveAllowed);
  }
  modelTier = budgetService.resolveEffectiveTier(modelTier, budgetStatus);
  if (allowed.length > 0 && !allowed.includes(modelTier)) {
    const PRIORITY: ModelTier[] = [MODEL_TIERS.POWERFUL as ModelTier, MODEL_TIERS.BALANCED as ModelTier, MODEL_TIERS.FAST_CHEAP as ModelTier];
    modelTier = PRIORITY.find((t) => allowed.includes(t)) ?? MODEL_TIERS.FAST_CHEAP as ModelTier;
  }

  // --- Step 4: RAG + memory + web search ---
  let context: RetrievedChunk[] = [];
  let hybridResult: HybridRetrievalResult | null = null;

  const ragResult = await hybridRagService.retrieveHybridContext(message, tenantId, {
    vectorTopK: 8,
    minVectorScore: 0.6,
    useGraph: true,
  });

  if (ragResult.success) {
    hybridResult = ragResult.data;
    context = hybridResult.vectorChunks;
  } else {
    const vectorFallback = await ragService.retrieveContext(message, tenantId, { limit: 5, threshold: 0.7 });
    if (vectorFallback.success) context = vectorFallback.data;
  }

  let memoryBlock: string | null = null;
  try {
    memoryBlock = await memoryService.getRelevantForChat(tenantId, message);
  } catch { /* non-critical */ }

  let webResults: WebSearchResult[] = [];
  if (context.length < 2 && webSearchService.queryNeedsWebSearch(message)) {
    webResults = await webSearchService.search(message);
  }

  // --- Step 5: Build prompt with context budget management ---
  let conversationId = options.conversationId;
  if (!conversationId) {
    const createResult = await conversationService.create({
      tenantId,
      userId,
      title: message.slice(0, 100),
      channel: 'api',
    });
    if (createResult.success) conversationId = createResult.data.id;
  }

  // Load more history but trim based on token budget
  let history: Array<{ role: string | null; content: string }> = [];
  if (conversationId) {
    const historyResult = await conversationService.getHistory(conversationId, 30, tenantId);
    if (historyResult.success) history = historyResult.data;
  }

  // Compute context budget based on model tier
  const budget = computeContextBudget(systemPrompt, message, modelTier);

  // Allocate budget by priority: history 50%, RAG 30%, memory 10%, web 10%
  const historyBudget = Math.floor(budget.remainingForContext * 0.50);
  const ragBudget = Math.floor(budget.remainingForContext * 0.30);
  const memoryBudget = Math.floor(budget.remainingForContext * 0.10);
  const webBudget = Math.floor(budget.remainingForContext * 0.10);

  // Trim each source to fit its budget
  const trimmedHistory = trimHistoryToFit(history, historyBudget);
  const trimmedContext = trimRagChunks(context, ragBudget);
  const trimmedMemory = memoryBlock ? trimTextBlock(memoryBlock, memoryBudget) : null;
  const trimmedWebResults = webResults.length > 0
    ? trimRagChunks(
        webResults.map((r, i) => ({ id: `web-${i}`, content: `[Result ${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`, metadata: {}, score: 1 })),
        webBudget,
      ).map((c) => c.content)
    : [];

  const graphContext = hybridResult?.graphContext ?? null;
  let prompt = hybridRagService.buildHybridPrompt(systemPrompt, trimmedContext, graphContext, trimmedHistory, message);

  if (trimmedMemory && prompt[0]?.role === 'system') {
    prompt = [{ ...prompt[0], content: `${prompt[0].content}\n\n---\n${trimmedMemory}` }, ...prompt.slice(1)];
  }
  if (trimmedWebResults.length > 0 && prompt[0]?.role === 'system') {
    const webBlock = trimmedWebResults.join('\n\n');
    prompt = [{ ...prompt[0], content: `${prompt[0].content}\n\n---\n**[Web Search Results]**\n${webBlock}` }, ...prompt.slice(1)];
  }

  // --- Step 6: Tool-call loop with streaming ---
  const env = getEnv();
  const hasToolCapabilities = agentCapabilities.length > 0;
  const tools = hasToolCapabilities ? DESKTOP_TOOLS : undefined;

  let messages: Array<Record<string, unknown>> = [...prompt as unknown as Array<Record<string, unknown>>];
  let totalTokens = 0;
  let modelUsed = modelTier as string;
  let fullResponse = '';
  const MAX_TOOL_ROUNDS = 10;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const requestBody: Record<string, unknown> = {
      model: modelTier,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    };
    if (tools && round === 0) {
      // Only send tools if agent has capabilities
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    } else if (tools) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    const response = await fetch(`${env.LITELLM_URL}/v1/chat/completions`, {
      signal: AbortSignal.timeout(90_000),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.LITELLM_MASTER_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[AGENT_CHAT_ERROR] URL=${env.LITELLM_URL} Model=${modelTier} Status=${response.status}: ${errorBody}`);
      callbacks.onError(`AI service error (${response.status}): ${errorBody.slice(0, 200)}`);
      return;
    }

    if (!response.body) {
      callbacks.onError('No response body from LLM');
      return;
    }

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let roundContent = '';
    let toolCalls: Array<{ id: string; function: { name: string; arguments: string } }> = [];

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
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          const choice = parsed.choices?.[0];
          const delta = choice?.delta;

          if (delta?.content) {
            roundContent += delta.content;
            callbacks.onToken(delta.content);
          }

          // Accumulate tool calls from streaming deltas
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCalls[idx]) {
                toolCalls[idx] = { id: tc.id ?? '', function: { name: '', arguments: '' } };
              }
              if (tc.id) toolCalls[idx].id = tc.id;
              if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
              if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
            }
          }

          if (parsed.model) modelUsed = parsed.model;
          if (parsed.usage) {
            totalTokens += parsed.usage.total_tokens ?? 0;
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    // If we got tool calls, execute them and continue the loop
    if (toolCalls.length > 0 && toolCalls.some(tc => tc.function.name)) {
      // Add assistant message with tool_calls to conversation
      messages.push({
        role: 'assistant',
        content: roundContent || '',
        tool_calls: toolCalls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      });

      // Execute each tool call
      for (const tc of toolCalls) {
        if (!tc.function.name) continue;

        let params: Record<string, unknown> = {};
        try {
          params = JSON.parse(tc.function.arguments);
        } catch { /* use empty params */ }

        try {
          const result = await callbacks.onToolCall(tc.id, toolNameToWire(tc.function.name), params);
          messages.push({
            role: 'tool' as const,
            tool_call_id: tc.id,
            content: typeof result === 'string' ? result : JSON.stringify(result),
          });
        } catch (err) {
          messages.push({
            role: 'tool' as const,
            tool_call_id: tc.id,
            content: `Error: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      // Continue the loop — LLM will see tool results and continue
      continue;
    }

    // No tool calls → final response
    fullResponse += roundContent;
    break;
  }

  // --- Step 7: Save messages + track usage ---
  if (conversationId) {
    await conversationService.addMessage({ conversationId, role: 'user', content: message });
    await conversationService.addMessage({
      conversationId,
      role: 'assistant',
      content: fullResponse,
      modelUsed,
      tokensUsed: totalTokens,
      metadata: { desktop: true, contextChunks: context.length },
    });
  }

  const estimatedInput = Math.ceil(totalTokens * 0.6);
  const estimatedOutput = totalTokens - estimatedInput;
  await usageTrackingService.trackRequest({
    tenantId,
    userId,
    model: modelUsed,
    inputTokens: estimatedInput,
    outputTokens: estimatedOutput,
  });

  callbacks.onDone({ totalTokens, model: modelUsed, conversationId });
}

/**
 * Get the list of agents configured for a tenant (for shell /agent list).
 */
export async function getTenantAgents(tenantId: string): Promise<Array<{ id: string; name: string; description: string | null; model: string | null }>> {
  const db = getDb();
  const rows = await db
    .select({ id: agents.id, name: agents.name, description: agents.description, model: agents.model })
    .from(agents)
    .where(and(eq(agents.tenantId, tenantId), eq(agents.isActive, true)));
  return rows;
}
