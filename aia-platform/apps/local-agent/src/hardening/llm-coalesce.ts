/**
 * Deduplicate concurrent identical LLM requests (same cache key).
 */

const inflight = new Map<string, Promise<unknown>>();

export function coalesceByKey<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = factory().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

export function buildLlmCoalesceKey(
  message: string,
  model: string,
  systemPrompt?: string,
): string {
  const sys = systemPrompt?.slice(0, 200) ?? '';
  return `${model}::${sys}::${message.trim()}`;
}
