/**
 * Provider Transform — Message normalization pipeline per provider LLM.
 *
 * Handles provider-specific quirks that cause silent failures if not addressed:
 * - Anthropic: empty content blocks, cache hints
 * - OpenAI: tool call ID scrubbing, schema sanitization
 * - Google/Gemini: integer enums → strings, type arrays → anyOf
 * - Universal: surrogate character sanitization
 *
 * Extracted patterns from OpenCode (MIT, sst/opencode).
 */

export type ProviderID =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'deepseek'
  | 'ollama'
  | 'bedrock'
  | 'vertex';

export interface TransformOptions {
  provider: ProviderID;
  caching?: boolean;
  modelId?: string;
}

export interface MessagePart {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface TransformableMessage {
  role: string;
  content: string | MessagePart[];
  [key: string]: unknown;
}

export function transformMessages(
  messages: TransformableMessage[],
  opts: TransformOptions,
): TransformableMessage[] {
  let result = messages.map((m) => ({ ...m }));

  // Universal: sanitize surrogates
  result = result.map(sanitizeSurrogatesInMessage);

  // Provider-specific transforms
  switch (opts.provider) {
    case 'anthropic':
    case 'bedrock':
      result = filterEmptyContent(result);
      if (opts.caching) result = applyCaching(result);
      break;

    case 'openai':
      result = scrubToolCallIds(result);
      break;

    case 'google':
    case 'vertex':
      // Schema transforms happen at tool definition level, not message level
      break;
  }

  return result;
}

// --- Anthropic: Filter empty content ---

function filterEmptyContent(messages: TransformableMessage[]): TransformableMessage[] {
  return messages
    .map((msg) => {
      if (typeof msg.content === 'string') {
        return msg.content.trim() ? msg : null;
      }
      if (Array.isArray(msg.content)) {
        const filtered = (msg.content as MessagePart[]).filter((part) => {
          if (part.type === 'text') return (part.text ?? '').trim().length > 0;
          if (part.type === 'reasoning') return (part.text ?? '').trim().length > 0;
          return true;
        });
        if (filtered.length === 0) return null;
        return { ...msg, content: filtered };
      }
      return msg;
    })
    .filter((m): m is TransformableMessage => m !== null);
}

// --- Anthropic: Cache hints ---

function applyCaching(messages: TransformableMessage[]): TransformableMessage[] {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystem = messages.filter((m) => m.role !== 'system');

  // Cache last 2 system messages
  const lastSys = systemMessages.slice(-2);
  for (const msg of lastSys) {
    (msg as any).providerOptions = {
      ...(msg as any).providerOptions,
      anthropic: { cacheControl: { type: 'ephemeral' } },
    };
  }

  // Cache last 2 non-system messages
  const lastNonSys = nonSystem.slice(-2);
  for (const msg of lastNonSys) {
    (msg as any).providerOptions = {
      ...(msg as any).providerOptions,
      anthropic: { cacheControl: { type: 'ephemeral' } },
    };
  }

  return messages;
}

// --- OpenAI: Tool call ID scrubbing ---

function scrubToolCallIds(messages: TransformableMessage[]): TransformableMessage[] {
  return messages.map((msg) => {
    if (!Array.isArray(msg.content)) return msg;

    const content = (msg.content as MessagePart[]).map((part) => {
      if ((part.type === 'tool-call' || part.type === 'tool-result') && part['toolCallId']) {
        return {
          ...part,
          toolCallId: String(part['toolCallId']).replace(/[^a-zA-Z0-9_-]/g, '_'),
        };
      }
      return part;
    });

    return { ...msg, content };
  });
}

// --- Universal: Surrogate sanitization ---

const LONE_SURROGATE_RE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

function sanitizeSurrogatesInMessage(msg: TransformableMessage): TransformableMessage {
  if (typeof msg.content === 'string') {
    return { ...msg, content: sanitizeSurrogates(msg.content) };
  }
  if (Array.isArray(msg.content)) {
    const content = (msg.content as MessagePart[]).map((part) => {
      if (part.text) {
        return { ...part, text: sanitizeSurrogates(part.text) };
      }
      return part;
    });
    return { ...msg, content };
  }
  return msg;
}

export function sanitizeSurrogates(content: string): string {
  return content.replace(LONE_SURROGATE_RE, '�');
}

// --- Gemini: Schema sanitization (for tool definitions) ---

export function sanitizeGeminiSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const result = { ...schema };

  // Integer enum values → stringified
  if (Array.isArray(result['enum']) && result['type'] === 'integer') {
    result['enum'] = (result['enum'] as unknown[]).map(String);
    result['type'] = 'string';
  }

  // Type arrays → anyOf + nullable
  if (Array.isArray(result['type'])) {
    const types = result['type'] as string[];
    const hasNull = types.includes('null');
    const nonNullTypes = types.filter((t) => t !== 'null');

    if (nonNullTypes.length === 1) {
      result['type'] = nonNullTypes[0];
      if (hasNull) result['nullable'] = true;
    } else {
      result['anyOf'] = nonNullTypes.map((t) => ({ type: t }));
      delete result['type'];
      if (hasNull) result['nullable'] = true;
    }
  }

  // Recurse into properties
  if (result['properties'] && typeof result['properties'] === 'object') {
    const props = result['properties'] as Record<string, unknown>;
    result['properties'] = Object.fromEntries(
      Object.entries(props).map(([k, v]) => [
        k,
        typeof v === 'object' && v !== null ? sanitizeGeminiSchema(v as Record<string, unknown>) : v,
      ]),
    );
  }

  // Boolean schema → {type: "string"}
  if (typeof result['type'] === 'boolean') {
    return { type: 'string' };
  }

  // const → enum
  if ('const' in result) {
    result['enum'] = [result['const']];
    delete result['const'];
  }

  return result;
}

// --- Reasoning effort normalization ---

export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export function normalizeReasoningEffort(
  effort: ReasoningEffort,
  provider: ProviderID,
): string | undefined {
  switch (provider) {
    case 'anthropic':
    case 'bedrock':
      // Anthropic supports: low, medium, high, xhigh, max (Opus 4.7+)
      if (effort === 'none') return 'low';
      return effort;

    case 'openai':
      // OpenAI supports: none, low, medium, high, xhigh (newer models)
      return effort === 'max' ? 'xhigh' : effort;

    case 'google':
    case 'vertex':
      // Gemini supports: low, high (binary)
      if (effort === 'none' || effort === 'low') return 'low';
      return 'high';

    default:
      return effort === 'none' ? undefined : effort;
  }
}
