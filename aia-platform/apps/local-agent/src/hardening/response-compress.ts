/**
 * Truncate overly long assistant output before cache/history persistence.
 */

export function compressAssistantOutput(text: string, maxChars = 4_000): string {
  if (text.length <= maxChars) return text;

  const head = Math.floor(maxChars * 0.65);
  const tail = Math.floor(maxChars * 0.25);
  const omitted = text.length - head - tail;

  return `${text.slice(0, head)}\n\n[... ${omitted} caratteri omessi per budget ...]\n\n${text.slice(-tail)}`;
}
