/**
 * Small SSE stream reader for the gateway /api/chat/quick endpoint.
 *
 * Assumptions (based on existing local logic):
 * - Lines are framed as `data: <payload>` (SSE style)
 * - Payload is either:
 *   - JSON with { content?: string; text?: string; tokens?: number; usage?: { total_tokens?: number } }
 *   - or plain text
 * - `[DONE]` marks end.
 *
 * We also tolerate `event:` and comment frames.
 */

export interface SseReadResult {
  content: string;
  tokensUsed: number;
}

function extractTokens(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return 0;
  const p = payload as Record<string, unknown>;

  const direct = typeof p['tokens'] === 'number' ? (p['tokens'] as number) : 0;
  if (direct > 0) return direct;

  // common OpenAI-like naming
  const totalTokens =
    typeof p['total_tokens'] === 'number'
      ? (p['total_tokens'] as number)
      : 0;
  if (totalTokens > 0) return totalTokens;

  const usage = p['usage'] as unknown;
  if (usage && typeof usage === 'object') {
    const u = usage as Record<string, unknown>;
    const fromUsage = typeof u['total_tokens'] === 'number' ? (u['total_tokens'] as number) : 0;
    if (fromUsage > 0) return fromUsage;
  }

  return 0;
}

export async function readSseTextStream(
  response: globalThis.Response,
  onText?: (text: string) => void,
): Promise<SseReadResult> {
  const body = response.body;
  if (!body) return { content: '', tokensUsed: 0 };

  const reader = body.getReader();
  const decoder = new TextDecoder();

  let full = '';
  let tokensUsed = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data) as unknown;
          const p = parsed as { content?: string; text?: string };
          const text = (p?.content ?? p?.text ?? '') as string;
          if (text) {
            full += text;
            onText?.(text);
          } else {
            // still consider tokens if present
            const t = extractTokens(parsed);
            if (t > 0) tokensUsed = Math.max(tokensUsed, t);
          }

          const t = extractTokens(parsed);
          if (t > 0) tokensUsed = Math.max(tokensUsed, t);
        } catch {
          full += data;
          onText?.(data);
        }
        continue;
      }

      // tolerate server frames like `event: ...` or `: comment`
      if (line.startsWith('event:') || line.startsWith(':')) continue;

      // fallback: treat remaining frames as text
      full += line;
      onText?.(line);
    }
  }

  return { content: full, tokensUsed };
}

