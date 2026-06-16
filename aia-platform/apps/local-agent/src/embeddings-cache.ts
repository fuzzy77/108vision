import { homedir } from 'node:os';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { resolveModelConfig } from './provider-keys.js';

export interface CachedEmbedding {
  textHash: string;
  model: string;
  embedding: number[];
  cachedAt: number;
  ttlMs: number;
  hits: number;
}

const CACHE_DIR = join(homedir(), '.108ai', 'cache');
const CACHE_FILE = join(CACHE_DIR, 'embeddings.json');

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_ENTRIES = 5_000;
const LRU_HIT_BONUS_MS = 60 * 60 * 1000; // each hit counts as +1h freshness

const cache = new Map<string, CachedEmbedding>();

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function buildTextHash(text: string): string {
  return hashString(normalizeText(text));
}

function buildKey(model: string, textHash: string): string {
  return `${model}:${textHash}`;
}

function evictLRU(): void {
  let lowest = Infinity;
  let evictKey: string | null = null;
  for (const [key, entry] of cache.entries()) {
    const score = entry.cachedAt + entry.hits * LRU_HIT_BONUS_MS;
    if (score < lowest) {
      lowest = score;
      evictKey = key;
    }
  }
  if (evictKey) cache.delete(evictKey);
}

function loadFromDisk(): void {
  if (!existsSync(CACHE_FILE)) return;
  try {
    const raw = readFileSync(CACHE_FILE, 'utf8');
    const entries = JSON.parse(raw) as CachedEmbedding[];
    const now = Date.now();
    for (const e of entries) {
      if (now < e.cachedAt + e.ttlMs) {
        cache.set(buildKey(e.model, e.textHash), e);
      }
    }
  } catch {
    // best-effort
  }
}

export function initEmbeddingsCache(): void {
  ensureCacheDir();
  loadFromDisk();

  process.on('exit', flushEmbeddingsCache);
  process.on('SIGINT', () => {
    flushEmbeddingsCache();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    flushEmbeddingsCache();
    process.exit(0);
  });
}

export function flushEmbeddingsCache(): void {
  ensureCacheDir();
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(Array.from(cache.values()), null, 2), 'utf8');
  } catch {
    // best-effort
  }
}

function getCachedEmbedding(model: string, text: string): CachedEmbedding | null {
  const textHash = buildTextHash(text);
  const key = buildKey(model, textHash);
  const entry = cache.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (now >= entry.cachedAt + entry.ttlMs) {
    cache.delete(key);
    return null;
  }
  entry.hits++;
  return entry;
}

function setCachedEmbedding(model: string, text: string, embedding: number[], ttlMs = DEFAULT_TTL_MS): void {
  const textHash = buildTextHash(text);
  const key = buildKey(model, textHash);
  if (!cache.has(key) && cache.size >= MAX_ENTRIES) evictLRU();
  cache.set(key, {
    model,
    textHash,
    embedding,
    cachedAt: Date.now(),
    ttlMs,
    hits: 0,
  });
}

export async function getTextEmbedding(text: string): Promise<number[] | null> {
  const modelConfig = resolveModelConfig('embedding');
  if (modelConfig === null) return null;

  const cached = getCachedEmbedding(modelConfig.model, text);
  if (cached) return cached.embedding;

  const response = await fetch(`${modelConfig.baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: modelConfig.model,
      input: text,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const embedding = data.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) return null;

  setCachedEmbedding(modelConfig.model, text, embedding);
  return embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

