/**
 * AI SDK Direct — Native multi-turn tool-use loop via Vercel AI SDK.
 *
 * Replaces the gateway single-shot path for LOCAL tasks that don't need
 * server-side context (KB, persistent conversations). Provides:
 * - Direct LLM calls (no gateway hop)
 * - Native structured tool-use (Anthropic tool_use / OpenAI function calling)
 * - Multi-turn tool loops (read → edit → verify cycle)
 * - Model routing by tier
 * - Token tracking
 */

import { generateText, streamText, stepCountIs, type ModelMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { trackTokens } from '../resources/config.js';
import { transformMessages, type ProviderID, type TransformableMessage } from './provider-transform.js';

export type ModelTier = 'fast-cheap' | 'balanced' | 'powerful' | 'coding' | 'local';

export interface DirectLlmOptions {
  messages: ModelMessage[];
  system?: string;
  tier?: ModelTier;
  model?: string;
  tools?: Record<string, unknown>;
  maxTokens?: number;
  maxToolRoundtrips?: number;
  stream?: boolean;
  abortSignal?: AbortSignal;
}

export interface DirectLlmResult {
  text: string;
  toolCalls: Array<{ name: string; args: unknown; result: unknown }>;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  model: string;
  roundtrips: number;
}

const MODEL_MAP: Record<ModelTier, { provider: string; id: string }> = {
  'fast-cheap': { provider: 'anthropic', id: 'claude-haiku-4-5-20251001' },
  balanced: { provider: 'anthropic', id: 'claude-sonnet-4-6-20250514' },
  powerful: { provider: 'anthropic', id: 'claude-opus-4-8-20250609' },
  coding: { provider: 'anthropic', id: 'claude-sonnet-4-6-20250514' },
  local: { provider: 'ollama', id: 'qwen2.5-coder:7b' },
};

export async function callDirectLlm(opts: DirectLlmOptions): Promise<DirectLlmResult> {
  const tier = opts.tier ?? 'balanced';
  const modelSpec = opts.model ? parseModelSpec(opts.model) : MODEL_MAP[tier];
  const model = resolveModel(modelSpec.provider, modelSpec.id);
  const maxRoundtrips = opts.maxToolRoundtrips ?? 10;

  const transformedMessages = transformMessages(
    opts.messages as unknown as TransformableMessage[],
    { provider: modelSpec.provider as ProviderID, caching: modelSpec.provider === 'anthropic' },
  );

  const result = await generateText({
    model,
    system: opts.system,
    messages: transformedMessages as any,
    tools: opts.tools as any,
    maxOutputTokens: opts.maxTokens ?? 8192,
    stopWhen: stepCountIs(maxRoundtrips),
    abortSignal: opts.abortSignal ?? AbortSignal.timeout(300_000),
  });

  const inputTokens = result.usage.inputTokens ?? 0;
  const outputTokens = result.usage.outputTokens ?? 0;
  const usage = {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };

  if (usage.totalTokens > 0) {
    trackTokens(usage.totalTokens);
  }

  const toolCalls = (result.steps ?? []).flatMap((step: any) =>
    (step.toolCalls ?? []).map((tc: any, i: number) => ({
      name: tc.toolName,
      args: tc.args,
      result: step.toolResults?.[i]?.result ?? null,
    })),
  );

  return {
    text: result.text,
    toolCalls,
    usage,
    model: `${modelSpec.provider}/${modelSpec.id}`,
    roundtrips: (result.steps ?? []).length,
  };
}

export async function* streamDirectLlm(opts: DirectLlmOptions) {
  const tier = opts.tier ?? 'balanced';
  const modelSpec = opts.model ? parseModelSpec(opts.model) : MODEL_MAP[tier];
  const model = resolveModel(modelSpec.provider, modelSpec.id);

  const transformedMessages = transformMessages(
    opts.messages as unknown as TransformableMessage[],
    { provider: modelSpec.provider as ProviderID, caching: modelSpec.provider === 'anthropic' },
  );

  const result = streamText({
    model,
    system: opts.system,
    messages: transformedMessages as any,
    tools: opts.tools as any,
    maxOutputTokens: opts.maxTokens ?? 8192,
    stopWhen: stepCountIs(opts.maxToolRoundtrips ?? 10),
    abortSignal: opts.abortSignal ?? AbortSignal.timeout(300_000),
  });

  for await (const chunk of result.textStream) {
    yield chunk;
  }

  const finalResult = await result;
  const usage = await finalResult.usage;
  const total = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
  if (total > 0) {
    trackTokens(total);
  }
}

function parseModelSpec(spec: string): { provider: string; id: string } {
  const slash = spec.indexOf('/');
  if (slash > 0) {
    return { provider: spec.slice(0, slash), id: spec.slice(slash + 1) };
  }
  return { provider: 'anthropic', id: spec };
}

function resolveModel(provider: string, modelId: string) {
  switch (provider) {
    case 'anthropic':
      return anthropic(modelId);
    case 'openai':
      return openai(modelId);
    case 'google':
      return google(modelId);
    case 'ollama': {
      const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');
      return createOpenAICompatible({
        name: 'ollama',
        baseURL: process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434/v1',
      })(modelId);
    }
    case 'deepseek': {
      const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');
      return createOpenAICompatible({
        name: 'deepseek',
        baseURL: 'https://api.deepseek.com/v1',
        headers: { Authorization: `Bearer ${process.env['DEEPSEEK_API_KEY'] ?? ''}` },
      })(modelId);
    }
    default:
      return anthropic(modelId);
  }
}
