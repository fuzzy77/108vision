import type { ExtensionShellContext } from './types.js';
import { sanitizeLlmInput } from '../hardening/llm-sanitize.js';
import { coalesceByKey, buildLlmCoalesceKey } from '../hardening/llm-coalesce.js';
import { compressAssistantOutput } from '../hardening/response-compress.js';
import { readSseTextStream } from '../hardening/sse-stream.js';
import { checkRateLimit } from '../security.js';
import { isLLMBlocked, isModelDowngraded } from '../resources/auto-healer.js';
import { trackTokens } from '../resources/config.js';

export interface GatewayChatOptions {
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export interface GatewayChatResult {
  content: string;
  model: string;
  tokens: number;
}

async function fetchGatewayChat(
  shellCtx: ExtensionShellContext,
  message: string,
  options?: GatewayChatOptions,
): Promise<GatewayChatResult> {
  if (!checkRateLimit(shellCtx.config)) {
    throw new Error(`Rate limit exceeded (max ${shellCtx.config.maxActionsPerMinute} actions/minute)`);
  }

  if (isLLMBlocked()) {
    throw new Error('LLM blocked by token emergency budget (auto-healer).');
  }

  const effectiveModel = isModelDowngraded()
    ? 'fast-cheap'
    : options?.model ?? 'fast-cheap';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${shellCtx.authToken}`,
    'X-Tenant-ID': shellCtx.tenantId,
  };

  const body: Record<string, unknown> = { message };
  body['model'] = effectiveModel;
  if (options?.maxTokens) body['max_tokens'] = options.maxTokens;
  if (options?.systemPrompt) body['system_prompt'] = options.systemPrompt;

  const response = await fetch(`${shellCtx.gatewayHttp}/api/chat/quick`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { detail?: string };
    const detail = errorData.detail ?? `HTTP ${response.status}`;
    throw new Error(detail);
  }

  if (response.body) {
    const { content, tokensUsed } = await readSseTextStream(response);
    const fullResponse = content;
    return {
      content: compressAssistantOutput(fullResponse.trim()),
      model: effectiveModel,
      tokens: tokensUsed,
    };
  }

  const data = (await response.json()) as {
    content?: string;
    model?: string;
    tokens?: number;
  };

  const tokensUsed = data.tokens ?? 0;
  const modelUsed = isModelDowngraded()
    ? 'fast-cheap'
    : (data.model ?? options?.model ?? 'fast-cheap');

  return {
    content: compressAssistantOutput(data.content ?? ''),
    model: modelUsed,
    tokens: tokensUsed,
  };
}

/**
 * Call the gateway quick-chat endpoint (non-streaming aggregation).
 * Used by YAML command executor for LLM steps.
 */
export async function callGatewayChat(
  shellCtx: ExtensionShellContext,
  message: string,
  options?: GatewayChatOptions,
): Promise<GatewayChatResult> {
  if (isLLMBlocked()) {
    throw new Error('LLM blocked by token emergency budget (auto-healer).');
  }

  const sanitize = sanitizeLlmInput(message);
  if (!sanitize.safe) {
    throw new Error(sanitize.warnings[0] ?? 'Input LLM bloccato da policy sicurezza');
  }

  const effectiveModel = isModelDowngraded()
    ? 'fast-cheap'
    : options?.model ?? 'fast-cheap';

  const key = buildLlmCoalesceKey(
    sanitize.sanitized,
    effectiveModel,
    options?.systemPrompt,
  );

  const res = await coalesceByKey(key, () =>
    fetchGatewayChat(shellCtx, sanitize.sanitized, { ...options, model: effectiveModel }),
  );

  if (res.tokens > 0) trackTokens(res.tokens);
  return res;
}
