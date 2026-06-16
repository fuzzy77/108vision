/**
 * Compress conversation context for token budget — keep tail + summary stub.
 */

export interface CompressibleMessage {
  role: string;
  content: string;
}

export function compressConversationMessages(
  messages: CompressibleMessage[],
  maxMessages = 12,
  maxCharsPerMessage = 800,
): string {
  if (messages.length === 0) return '';

  const tail = messages.slice(-maxMessages);
  const lines: string[] = [];

  if (messages.length > maxMessages) {
    lines.push(`[... ${messages.length - maxMessages} messaggi precedenti omessi ...]`);
  }

  for (const m of tail) {
    const label = m.role === 'user' ? 'U' : 'A';
    const content =
      m.content.length > maxCharsPerMessage
        ? `${m.content.slice(0, maxCharsPerMessage)}…`
        : m.content;
    lines.push(`${label}: ${content}`);
  }

  return lines.join('\n');
}
