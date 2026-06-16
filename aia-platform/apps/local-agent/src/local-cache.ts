import { homedir } from 'node:os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CachedResponse {
  query: string;       // original query
  queryHash: string;   // normalized hash for lookup
  response: string;    // LLM response text
  model: string;       // which model answered
  tokens: number;      // tokens used
  cachedAt: number;    // timestamp ms
  ttl: number;         // time-to-live in ms
  hits: number;        // how many times served from cache
}

interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  savedTokens: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_DIR = join(homedir(), '.108ai', 'cache');
const CACHE_FILE = join(CACHE_DIR, 'responses.json');
const STATS_FILE = join(CACHE_DIR, 'stats.json');

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;          // 24 hours
const TIME_SENSITIVE_TTL_MS = 5 * 60 * 1000;          // 5 minutes
const MAX_ENTRIES = 500;
const LRU_HIT_BONUS_MS = 10 * 60 * 1000;              // each hit adds 10 min to effective age

const TIME_SENSITIVE_KEYWORDS = ['oggi', 'adesso', 'now', 'current', 'attuale'];

const FILLER_WORDS = [
  'per favore', 'please', 'puoi', 'can you', 'potresti', 'could you',
  'ti chiedo di', 'mi puoi', 'vorrei che tu',
];

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

const cache = new Map<string, CachedResponse>();

let stats: CacheStats = {
  entries: 0,
  hits: 0,
  misses: 0,
  savedTokens: 0,
};

// ---------------------------------------------------------------------------
// Normalization & hashing
// ---------------------------------------------------------------------------

/**
 * Normalizes a query string for cache key generation:
 * - lowercase
 * - strip filler words
 * - collapse whitespace
 * - remove trailing punctuation
 */
function normalizeQuery(query: string): string {
  let normalized = query.toLowerCase();

  for (const filler of FILLER_WORDS) {
    // remove whole-phrase filler words (global, case already lowered)
    normalized = normalized.split(filler).join('');
  }

  // remove trailing punctuation
  normalized = normalized.replace(/[.,!?;:]+$/, '');

  // collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Fast djb2-style string hash — speed over collision resistance is intentional.
 * Returns a hex string.
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash.toString(16).padStart(8, '0');
}

function buildHash(query: string): string {
  return hashString(normalizeQuery(query));
}

// ---------------------------------------------------------------------------
// Time-sensitivity detection
// ---------------------------------------------------------------------------

function isTimeSensitive(query: string): boolean {
  const lower = query.toLowerCase();
  return TIME_SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Eviction
// ---------------------------------------------------------------------------

/**
 * Evicts the least-recently-used entry based on effective score:
 *   score = cachedAt + hits * LRU_HIT_BONUS_MS
 * Lower score → older/less-used → evicted first.
 */
function evictLRU(): void {
  let lowestScore = Infinity;
  let evictKey: string | null = null;

  for (const [key, entry] of cache.entries()) {
    const score = entry.cachedAt + entry.hits * LRU_HIT_BONUS_MS;
    if (score < lowestScore) {
      lowestScore = score;
      evictKey = key;
    }
  }

  if (evictKey !== null) {
    cache.delete(evictKey);
  }
}

// ---------------------------------------------------------------------------
// Disk persistence
// ---------------------------------------------------------------------------

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function loadCacheFromDisk(): void {
  if (!existsSync(CACHE_FILE)) return;
  try {
    const raw = readFileSync(CACHE_FILE, 'utf8');
    const entries: CachedResponse[] = JSON.parse(raw);
    const now = Date.now();
    for (const entry of entries) {
      if (now < entry.cachedAt + entry.ttl) {
        cache.set(entry.queryHash, entry);
      }
    }
  } catch {
    // corrupted cache — start fresh
  }
}

function loadStatsFromDisk(): void {
  if (!existsSync(STATS_FILE)) return;
  try {
    const raw = readFileSync(STATS_FILE, 'utf8');
    const persisted: CacheStats = JSON.parse(raw);
    stats = { ...stats, ...persisted };
  } catch {
    // start fresh
  }
}

/**
 * Writes current in-memory state to disk.
 * Call on process exit or after significant mutations.
 */
export function flushToDisk(): void {
  ensureCacheDir();
  try {
    const entries = Array.from(cache.values());
    writeFileSync(CACHE_FILE, JSON.stringify(entries, null, 2), 'utf8');
  } catch {
    // non-fatal — cache is best-effort
  }
  try {
    const liveStats: CacheStats = { ...stats, entries: cache.size };
    writeFileSync(STATS_FILE, JSON.stringify(liveStats, null, 2), 'utf8');
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load cache from disk into memory. Must be called once at startup.
 */
export function initCache(): void {
  ensureCacheDir();
  loadStatsFromDisk();
  loadCacheFromDisk();
  stats.entries = cache.size;

  // Flush on clean exit
  process.on('exit', flushToDisk);
  process.on('SIGINT', () => {
    flushToDisk();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    flushToDisk();
    process.exit(0);
  });
}

/**
 * Returns a cached response for the given query, or null on miss/expiry.
 */
export function getCached(query: string): CachedResponse | null {
  const hash = buildHash(query);
  const entry = cache.get(hash);

  if (!entry) {
    stats.misses++;
    return null;
  }

  const now = Date.now();
  if (now >= entry.cachedAt + entry.ttl) {
    // expired
    cache.delete(hash);
    stats.misses++;
    return null;
  }

  // cache hit
  entry.hits++;
  stats.hits++;
  stats.savedTokens += entry.tokens;

  return entry;
}

const SEMANTIC_MIN_SCORE = 0.82;
const SEMANTIC_MIN_TOKENS = 3;

function queryTokenSet(query: string): Set<string> {
  const normalized = normalizeQuery(query);
  return new Set(normalized.split(' ').filter((t) => t.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Fuzzy cache lookup via token Jaccard similarity (lite semantic cache).
 * Call only after exact `getCached` miss to avoid double miss accounting.
 */
export function getSemanticCached(
  query: string,
  minScore = SEMANTIC_MIN_SCORE,
): CachedResponse | null {
  const qTokens = queryTokenSet(query);
  if (qTokens.size < SEMANTIC_MIN_TOKENS) return null;

  const now = Date.now();
  let best: { entry: CachedResponse; score: number } | null = null;

  for (const entry of cache.values()) {
    if (now >= entry.cachedAt + entry.ttl) continue;
    if (isTimeSensitive(query) !== isTimeSensitive(entry.query)) continue;

    const score = jaccardSimilarity(qTokens, queryTokenSet(entry.query));
    if (score >= minScore && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  if (!best) return null;

  best.entry.hits++;
  stats.hits++;
  stats.savedTokens += best.entry.tokens;
  return best.entry;
}

/**
 * Stores a response in the cache.
 *
 * @param query    The original query string
 * @param response The LLM response text
 * @param model    Model identifier (e.g. "claude-3-haiku")
 * @param tokens   Number of tokens consumed by the LLM call
 * @param ttl      Optional TTL override in ms; auto-detected if omitted
 */
export function setCached(
  query: string,
  response: string,
  model: string,
  tokens: number,
  ttl?: number,
): void {
  const hash = buildHash(query);

  // Evict before inserting if we are at capacity (and entry is not an update)
  if (!cache.has(hash) && cache.size >= MAX_ENTRIES) {
    evictLRU();
  }

  const resolvedTtl = ttl ?? (isTimeSensitive(query) ? TIME_SENSITIVE_TTL_MS : DEFAULT_TTL_MS);

  const entry: CachedResponse = {
    query,
    queryHash: hash,
    response,
    model,
    tokens,
    cachedAt: Date.now(),
    ttl: resolvedTtl,
    hits: 0,
  };

  cache.set(hash, entry);
  stats.entries = cache.size;
}

/**
 * Removes all expired entries from the in-memory cache.
 * Returns the number of entries removed.
 */
export function clearExpired(): number {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of cache.entries()) {
    if (now >= entry.cachedAt + entry.ttl) {
      cache.delete(key);
      removed++;
    }
  }

  stats.entries = cache.size;
  return removed;
}

/**
 * Clears all cache entries and resets in-memory stats.
 */
export function clearAll(): void {
  cache.clear();
  stats = { entries: 0, hits: 0, misses: 0, savedTokens: 0 };
  flushToDisk();
}

/**
 * Returns a snapshot of current cache statistics.
 */
export function getCacheStats(): CacheStats {
  return { ...stats, entries: cache.size };
}
