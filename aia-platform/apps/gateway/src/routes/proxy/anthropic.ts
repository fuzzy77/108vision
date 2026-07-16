import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import type { ModelTier } from '@aia/shared';
import { budgetService } from '../../services/budget.service.js';
import { usageTrackingService } from '../../services/usage-tracking.service.js';
import { getEnv } from '../../lib/env.js';
import { mapModelToTier } from './model-mapping.js';
import { injectContext, injectGovernance } from './context-injection.js';
import type { ProxyConfig } from '../../middleware/proxy-auth.js';
import {
  anthropicToOpenAI,
  openaiToAnthropic,
  openaiStreamStartEvents,
  openaiChunkToAnthropicDelta,
  openaiStreamStopEvents,
} from './anthropic-transform.js';

const anthropicProxy = new Hono();

const contentBlockSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  input: z.any().optional(),
  tool_use_id: z.string().optional(),
  content: z.any().optional(),
  source: z.object({
    type: z.string(),
    media_type: z.string(),
    data: z.string(),
  }).optional(),
});

const anthropicMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([z.string(), z.array(contentBlockSchema)]),
});

const anthropicRequestSchema = z.object({
  model: z.string(),
  messages: z.array(anthropicMessageSchema).min(1),
  system: z.union([z.string(), z.array(z.object({ type: z.literal('text'), text: z.string() }))]).optional(),
  max_tokens: z.number().int().positive(),
  temperature: z.number().min(0).max(1).optional(),
  top_p: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional().default(false),
  stop_sequences: z.array(z.string()).optional(),
  tools: z.array(z.any()).optional(),
  tool_choice: z.any().optional(),
  metadata: z.any().optional(),
});

anthropicProxy.post('/messages', async (c) => {
  const tenantId = c.get('tenantId' as never) as string;
  const proxyConfig = c.get('proxyConfig' as never) as ProxyConfig;

  const body = await c.req.json();
  const input = anthropicRequestSchema.parse(body);

  // Map model to tier
  const requestedModel = input.model;
  let modelTier = mapModelToTier(requestedModel);

  // Budget enforcement
  const budgetStatus = await budgetService.getBudgetStatus(tenantId);
  modelTier = budgetService.resolveEffectiveTier(modelTier as ModelTier, budgetStatus);

  // Transform Anthropic request → OpenAI format
  const openaiReq = anthropicToOpenAI(input as Parameters<typeof anthropicToOpenAI>[0]);
  openaiReq.model = modelTier;

  // Governance principles injection (always — core differentiator)
  openaiReq.messages = injectGovernance(
    openaiReq.messages as Array<{ role: string; content: string | null | unknown[]; [key: string]: unknown }>,
  ) as typeof openaiReq.messages;

  // Optional RAG/memory injection
  if (proxyConfig.ragEnabled || proxyConfig.memoryEnabled) {
    const injected = await injectContext(
      openaiReq.messages as Array<{ role: string; content: string | null | unknown[]; [key: string]: unknown }>,
      tenantId,
      proxyConfig,
    );
    openaiReq.messages = injected as typeof openaiReq.messages;
  }

  const env = getEnv();

  // Add stream_options to get usage in streaming responses
  const requestBody = openaiReq.stream
    ? { ...openaiReq, stream_options: { include_usage: true } }
    : openaiReq;

  const litellmResponse = await fetch(`${env.LITELLM_URL}/v1/chat/completions`, {
    signal: AbortSignal.timeout(120_000),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.LITELLM_MASTER_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!litellmResponse.ok) {
    const errorText = await litellmResponse.text();
    console.error(JSON.stringify({ level: 'error', message: 'Proxy Anthropic LLM error', status: litellmResponse.status, body: errorText.slice(0, 500) }));

    const status = litellmResponse.status >= 500 ? 502 : litellmResponse.status;
    return c.json(
      { type: 'error', error: { type: 'api_error', message: 'AI service temporarily unavailable' } },
      status as 502,
    );
  }

  // Non-streaming
  if (!input.stream) {
    const openaiData = await litellmResponse.json() as Parameters<typeof openaiToAnthropic>[0];

    // Track usage
    const usage = openaiData.usage;
    if (usage) {
      usageTrackingService.trackRequest({
        tenantId,
        model: String(modelTier),
        inputTokens: usage.prompt_tokens ?? 0,
        outputTokens: usage.completion_tokens ?? 0,
        requestType: 'proxy_anthropic',
      }).catch(() => {});
    }

    const anthropicResp = openaiToAnthropic(openaiData, requestedModel);
    return c.json(anthropicResp);
  }

  // Streaming
  if (!litellmResponse.body) {
    return c.json(
      { type: 'error', error: { type: 'api_error', message: 'No response stream from AI service' } },
      502,
    );
  }

  return streamSSE(c, async (stream) => {
    const reader = litellmResponse.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let startEventsSent = false;
    let finishReason = 'end_turn';

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
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data) as Record<string, unknown>;

            // Send start events on first chunk
            if (!startEventsSent) {
              startEventsSent = true;
              const startEvents = openaiStreamStartEvents(requestedModel, 0);
              for (const evt of startEvents) {
                await stream.writeSSE({ event: evt.event, data: evt.data });
              }
            }

            const choices = parsed['choices'] as Array<{ delta?: { content?: string }; finish_reason?: string }> | undefined;
            const delta = choices?.[0]?.delta;
            const content = delta?.content;

            if (content) {
              const evt = openaiChunkToAnthropicDelta(content);
              await stream.writeSSE({ event: evt.event, data: evt.data });
            }

            if (choices?.[0]?.finish_reason) {
              const fr = choices[0].finish_reason;
              if (fr === 'stop') finishReason = 'end_turn';
              else if (fr === 'tool_calls') finishReason = 'tool_use';
              else if (fr === 'length') finishReason = 'max_tokens';
            }

            // Extract usage
            const usage = parsed['usage'] as { prompt_tokens?: number; completion_tokens?: number } | undefined;
            if (usage) {
              inputTokens = usage.prompt_tokens ?? inputTokens;
              outputTokens = usage.completion_tokens ?? outputTokens;
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Send stop events
    if (startEventsSent) {
      const stopEvents = openaiStreamStopEvents(finishReason, outputTokens);
      for (const evt of stopEvents) {
        await stream.writeSSE({ event: evt.event, data: evt.data });
      }
    }

    // Track usage
    if (inputTokens > 0 || outputTokens > 0) {
      usageTrackingService.trackRequest({
        tenantId,
        model: String(modelTier),
        inputTokens,
        outputTokens,
        requestType: 'proxy_anthropic',
      }).catch(() => {});
    }
  });
});

export { anthropicProxy };
