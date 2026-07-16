/**
 * Transforms between Anthropic Messages API format and OpenAI Chat Completions format.
 * The gateway always calls LiteLLM in OpenAI format — this module handles translation at the edges.
 */

// --- Request: Anthropic → OpenAI ---

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

interface AnthropicContentBlock {
  type: 'text' | 'image' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string | AnthropicContentBlock[];
  source?: { type: string; media_type: string; data: string };
}

interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  system?: string | Array<{ type: 'text'; text: string }>;
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  stop_sequences?: string[];
  tools?: unknown[];
  tool_choice?: unknown;
  metadata?: unknown;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null | OpenAIContentPart[];
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

interface OpenAIContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream: boolean;
  stop?: string[];
  tools?: unknown[];
  tool_choice?: unknown;
}

export function anthropicToOpenAI(req: AnthropicRequest): OpenAIRequest {
  const messages: OpenAIMessage[] = [];

  // System prompt
  if (req.system) {
    const systemText = typeof req.system === 'string'
      ? req.system
      : req.system.map((b) => b.text).join('\n\n');
    messages.push({ role: 'system', content: systemText });
  }

  // Messages
  for (const msg of req.messages) {
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') {
        messages.push({ role: 'user', content: msg.content });
      } else {
        // Convert content blocks
        const hasToolResult = msg.content.some((b) => b.type === 'tool_result');
        if (hasToolResult) {
          // tool_result blocks become separate tool role messages
          for (const block of msg.content) {
            if (block.type === 'tool_result') {
              const resultContent = typeof block.content === 'string'
                ? block.content
                : (block.content as AnthropicContentBlock[] | undefined)?.map((b) => b.text ?? '').join('') ?? '';
              messages.push({ role: 'tool', content: resultContent, tool_call_id: block.tool_use_id ?? '' });
            } else if (block.type === 'text' && block.text) {
              messages.push({ role: 'user', content: block.text });
            }
          }
        } else {
          const parts: OpenAIContentPart[] = [];
          for (const block of msg.content) {
            if (block.type === 'text' && block.text) {
              parts.push({ type: 'text', text: block.text });
            } else if (block.type === 'image' && block.source) {
              parts.push({
                type: 'image_url',
                image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` },
              });
            }
          }
          messages.push({ role: 'user', content: parts.length === 1 && parts[0]!.type === 'text' ? parts[0]!.text! : parts });
        }
      }
    } else if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        messages.push({ role: 'assistant', content: msg.content });
      } else {
        // Check for tool_use blocks
        const toolUseBlocks = msg.content.filter((b) => b.type === 'tool_use');
        const textBlocks = msg.content.filter((b) => b.type === 'text');
        const textContent = textBlocks.map((b) => b.text ?? '').join('');

        if (toolUseBlocks.length > 0) {
          const toolCalls: OpenAIToolCall[] = toolUseBlocks.map((b) => ({
            id: b.id ?? '',
            type: 'function' as const,
            function: { name: b.name ?? '', arguments: JSON.stringify(b.input ?? {}) },
          }));
          messages.push({ role: 'assistant', content: textContent || null, tool_calls: toolCalls });
        } else {
          messages.push({ role: 'assistant', content: textContent || null });
        }
      }
    }
  }

  const result: OpenAIRequest = {
    model: req.model,
    messages,
    stream: req.stream ?? false,
  };

  if (req.max_tokens) result.max_tokens = req.max_tokens;
  if (req.temperature !== undefined) result.temperature = req.temperature;
  if (req.top_p !== undefined) result.top_p = req.top_p;
  if (req.stop_sequences) result.stop = req.stop_sequences;
  if (req.tools) result.tools = req.tools;
  if (req.tool_choice) result.tool_choice = req.tool_choice;

  return result;
}

// --- Response: OpenAI → Anthropic (non-streaming) ---

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: OpenAIToolCall[];
    };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicResponseBlock[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

interface AnthropicResponseBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
}

export function openaiToAnthropic(resp: OpenAIResponse, requestedModel: string): AnthropicResponse {
  const choice = resp.choices[0];
  const content: AnthropicResponseBlock[] = [];

  if (choice?.message.content) {
    content.push({ type: 'text', text: choice.message.content });
  }

  if (choice?.message.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      content.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments || '{}'),
      });
    }
  }

  let stopReason: string | null = null;
  if (choice?.finish_reason === 'stop') stopReason = 'end_turn';
  else if (choice?.finish_reason === 'tool_calls') stopReason = 'tool_use';
  else if (choice?.finish_reason === 'length') stopReason = 'max_tokens';

  return {
    id: `msg_${resp.id}`,
    type: 'message',
    role: 'assistant',
    content,
    model: requestedModel,
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: resp.usage?.prompt_tokens ?? 0,
      output_tokens: resp.usage?.completion_tokens ?? 0,
    },
  };
}

// --- Streaming: OpenAI chunks → Anthropic SSE events ---

interface AnthropicStreamEvent {
  event: string;
  data: string;
}

export function openaiStreamStartEvents(requestedModel: string, inputTokens: number): AnthropicStreamEvent[] {
  return [
    {
      event: 'message_start',
      data: JSON.stringify({
        type: 'message_start',
        message: {
          id: `msg_${Date.now().toString(36)}`,
          type: 'message',
          role: 'assistant',
          content: [],
          model: requestedModel,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: inputTokens, output_tokens: 0 },
        },
      }),
    },
    {
      event: 'content_block_start',
      data: JSON.stringify({
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'text', text: '' },
      }),
    },
  ];
}

export function openaiChunkToAnthropicDelta(content: string): AnthropicStreamEvent {
  return {
    event: 'content_block_delta',
    data: JSON.stringify({
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text: content },
    }),
  };
}

export function openaiStreamStopEvents(stopReason: string, outputTokens: number): AnthropicStreamEvent[] {
  return [
    {
      event: 'content_block_stop',
      data: JSON.stringify({ type: 'content_block_stop', index: 0 }),
    },
    {
      event: 'message_delta',
      data: JSON.stringify({
        type: 'message_delta',
        delta: { stop_reason: stopReason, stop_sequence: null },
        usage: { output_tokens: outputTokens },
      }),
    },
    {
      event: 'message_stop',
      data: JSON.stringify({ type: 'message_stop' }),
    },
  ];
}
