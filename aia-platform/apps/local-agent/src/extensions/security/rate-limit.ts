interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

function buildTenantKey(key: string, tenantId?: string): string {
  const t = tenantId?.trim();
  if (!t) return key;
  return `tenant:${t}:${key}`;
}

/**
 * Parse rate limit strings like "30/min" or "10/s".
 */
export function parseRateLimit(limit?: string): { max: number; windowMs: number } | null {
  if (!limit?.trim()) return null;
  const match = limit.trim().match(/^(\d+)\s*\/\s*(min|minute|s|sec|second)$/i);
  if (!match) return null;
  const max = Number.parseInt(match[1] ?? '0', 10);
  const unit = (match[2] ?? 'min').toLowerCase();
  const windowMs = unit.startsWith('s') ? 1_000 : 60_000;
  return max > 0 ? { max, windowMs } : null;
}

export function checkExtensionRateLimit(key: string, limit?: string, tenantId?: string): boolean {
  const parsed = parseRateLimit(limit);
  if (!parsed) return true;

  const scopedKey = buildTenantKey(key, tenantId);
  const now = Date.now();
  const bucket = buckets.get(scopedKey) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < parsed.windowMs);

  if (bucket.timestamps.length >= parsed.max) {
    buckets.set(scopedKey, bucket);
    return false;
  }

  bucket.timestamps.push(now);
  buckets.set(scopedKey, bucket);
  return true;
}

export function resetExtensionRateLimits(): void {
  buckets.clear();
}
