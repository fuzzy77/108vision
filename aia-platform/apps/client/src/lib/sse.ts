export interface SSEEvent {
  event: string;
  data: string;
}

export async function* parseSSEStream(
  response: Response,
): AsyncGenerator<SSEEvent, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is not readable');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      let currentEvent = 'message';
      let currentData = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            return;
          }
          currentData += data;
        } else if (line === '') {
          if (currentData) {
            yield { event: currentEvent, data: currentData };
            currentEvent = 'message';
            currentData = '';
          }
        }
      }

      if (currentData) {
        yield { event: currentEvent, data: currentData };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface StreamToken {
  content: string;
  done: boolean;
  metadata?: ChatMetadata;
}

export interface ChatMetadata {
  conversationId?: string;
  model?: string;
  cached?: boolean;
  budgetAlert?: string | null;
  webSearchUsed?: boolean;
}

export async function* streamTokens(
  response: Response,
): AsyncGenerator<StreamToken, void, unknown> {
  for await (const event of parseSSEStream(response)) {
    if (event.event === 'done' || event.event === 'error') {
      if (event.event === 'error') {
        throw new Error(event.data);
      }
      yield { content: '', done: true };
      return;
    }

    if (event.event === 'metadata') {
      try {
        const metadata = JSON.parse(event.data) as ChatMetadata;
        yield { content: '', done: false, metadata };
      } catch {
        // skip malformed metadata
      }
      continue;
    }

    try {
      const parsed = JSON.parse(event.data) as { content?: string; done?: boolean };
      if (parsed.done) {
        yield { content: '', done: true };
        return;
      }
      if (parsed.content) {
        yield { content: parsed.content, done: false };
      }
    } catch {
      yield { content: event.data, done: false };
    }
  }
}
