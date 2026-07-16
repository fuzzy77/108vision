import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { type ModelTier } from '@aia/shared';
import { budgetService } from '../../services/budget.service.js';
import { usageTrackingService } from '../../services/usage-tracking.service.js';
import { getEnv } from '../../lib/env.js';
import { mapModelToTier } from './model-mapping.js';
import { injectContext, injectGovernance } from './context-injection.js';
import type { ProxyConfig } from '../../middleware/proxy-auth.js';

const openaiProxy = new Hono();

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool', 'function']),
  content: z.union([z.string(), z.null(), z.array(z.any())]).optional(),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
  tool_calls: z.array(z.any()).optional(),
});

const chatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(messageSchema).min(1),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().positive().optional(),
  max_completion_tokens: z.number().int().positive().optional(),
  stream: z.boolean().optional().default(false),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  tools: z.array(z.any()).optional(),
  tool_choice: z.any().optional(),
  response_format: z.any().optional(),
  n: z.number().int().min(1).max(1).optional(),
  seed: z.number().int().optional(),
});

openaiProxy.post('/chat/completions', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const proxyConfig = c.get('proxyConfig' as never) as ProxyConfig;

  const body = await c.req.json();
  const input = chatCompletionSchema.parse(body);

  // Map model name to internal tier
  const requestedModel = input.model;
  let modelTier = mapModelToTier(requestedModel);

  // Budget enforcement
  const budgetStatus = await budgetService.getBudgetStatus(tenantId);
  modelTier = budgetService.resolveEffectiveTier(modelTier as ModelTier, budgetStatus);

  // Governance principles injection (always — core differentiator)
  let messages = injectGovernance(
    input.messages as Array<{ role: string; content: string | null | unknown[]; [key: string]: unknown }>,
  );

  // Optional RAG/memory injection
  if (proxyConfig.ragEnabled || proxyConfig.memoryEnabled) {
    messages = await injectContext(messages, tenantId, proxyConfig);
  }

  const env = getEnv();

  // Build the request to LiteLLM
  const litellmBody: Record<string, unknown> = {
    model: modelTier,
    messages,
    stream: input.stream,
    ...(input.stream ? { stream_options: { include_usage: true } } : {}),
  };

  if (input.temperature !== undefined) litellmBody['temperature'] = input.temperature;
  if (input.top_p !== undefined) litellmBody['top_p'] = input.top_p;
  if (input.max_tokens !== undefined) litellmBody['max_tokens'] = input.max_tokens;
  if (input.max_completion_tokens !== undefined) litellmBody['max_tokens'] = input.max_completion_tokens;
  if (input.stop !== undefined) litellmBody['stop'] = input.stop;
  if (input.presence_penalty !== undefined) litellmBody['presence_penalty'] = input.presence_penalty;
  if (input.frequency_penalty !== undefined) litellmBody['frequency_penalty'] = input.frequency_penalty;
  if (input.tools !== undefined) litellmBody['tools'] = input.tools;
  if (input.tool_choice !== undefined) litellmBody['tool_choice'] = input.tool_choice;
  if (input.response_format !== undefined) litellmBody['response_format'] = input.response_format;
  if (input.seed !== undefined) litellmBody['seed'] = input.seed;

  const litellmResponse = await fetch(`${env.LITELLM_URL}/v1/chat/completions`, {
    signal: AbortSignal.timeout(120_000),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LITELLM_MASTER_KEY}`,
    },
    body: JSON.stringify(litellmBody),
  });

  if (!litellmResponse.ok) {
    const errorText = await litellmResponse.text();
    console.error(JSON.stringify({ level: 'error', message: 'Proxy LLM error', status: litellmResponse.status, body: errorText.slice(0, 500) }));

    const status = litellmResponse.status >= 500 ? 502 : litellmResponse.status;
    return c.json(
      { error: { message: 'AI service temporarily unavailable', type: 'server_error', code: 'llm_error' } },
      status as 502,
    );
  }

  // Non-streaming response
  if (!input.stream) {
    const data = await litellmResponse.json() as Record<string, unknown>;

    // Track usage
    const usage = data['usage'] as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
    if (usage) {
      usageTrackingService.trackRequest({
        tenantId,
        model: String(modelTier),
        inputTokens: usage.prompt_tokens ?? 0,
        outputTokens: usage.completion_tokens ?? 0,
        requestType: 'proxy_openai',
      }).catch(() => {});
    }

    // Remap model name to what client sent
    data['model'] = requestedModel;

    return c.json(data);
  }

  // Streaming response
  if (!litellmResponse.body) {
    return c.json(
      { error: { message: 'No response body from AI service', type: 'server_error', code: 'no_stream' } },
      502,
    );
  }

  return streamSSE(c, async (stream) => {
    const reader = litellmResponse.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
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
            await stream.writeSSE({ data: '[DONE]' });
            break;
          }

          try {
            const parsed = JSON.parse(data) as Record<string, unknown>;

            // Remap model name
            parsed['model'] = requestedModel;

            // Extract usage from final chunk
            const usage = parsed['usage'] as { prompt_tokens?: number; completion_tokens?: number } | undefined;
            if (usage) {
              inputTokens = usage.prompt_tokens ?? inputTokens;
              outputTokens = usage.completion_tokens ?? outputTokens;
            }

            await stream.writeSSE({ data: JSON.stringify(parsed) });
          } catch {
            // Forward raw line if not valid JSON
            await stream.writeSSE({ data });
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Track usage after stream completes
    if (inputTokens > 0 || outputTokens > 0) {
      usageTrackingService.trackRequest({
        tenantId,
        model: String(modelTier),
        inputTokens,
        outputTokens,
        requestType: 'proxy_openai',
      }).catch(() => {});
    }
  });
});

export { openaiProxy };
