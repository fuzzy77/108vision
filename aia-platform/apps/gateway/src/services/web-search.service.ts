import { createHash } from 'node:crypto';
import { type Result, success, failure, AppError } from '@aia/shared';
import { getRedis } from '../lib/redis.js';
import { getEnv } from '../lib/env.js';

const CACHE_PREFIX = 'web_search';
const CACHE_TTL_SECONDS = 3600;
const MAX_RESULTS = 5;
const TIMEOUT_MS = 5000;

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

function buildCacheKey(query: string): string {
  const hash = createHash('sha256').update(query.toLowerCase().trim()).digest('hex').slice(0, 32);
  return `${CACHE_PREFIX}:${hash}`;
}

async function getCached(query: string): Promise<WebSearchResult[] | null> {
  const redis = getRedis();
  try {
    const cached = await redis.get(buildCacheKey(query));
    if (!cached) return null;
    return JSON.parse(cached) as WebSearchResult[];
  } catch {
    return null;
  }
}

async function setCached(query: string, results: WebSearchResult[]): Promise<void> {
  const redis = getRedis();
  try {
    await redis.setex(buildCacheKey(query), CACHE_TTL_SECONDS, JSON.stringify(results));
  } catch {
    // Non-critical
  }
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function searchBrave(query: string, apiKey: string): Promise<Result<WebSearchResult[]>> {
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(MAX_RESULTS));
  url.searchParams.set('text_decorations', 'false');

  let response: Response;
  try {
    response = await fetchWithTimeout(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });
  } catch (err) {
    return failure(new AppError('WEB_SEARCH_TIMEOUT', `Brave search timed out or failed: ${err instanceof Error ? err.message : String(err)}`, 502));
  }

  if (!response.ok) {
    return failure(new AppError('WEB_SEARCH_ERROR', `Brave API returned ${response.status}`, 502));
  }

  const data = await response.json() as {
    web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
  };

  const results: WebSearchResult[] = (data.web?.results ?? [])
    .slice(0, MAX_RESULTS)
    .map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      snippet: r.description ?? '',
    }));

  return success(results);
}

async function searchTavily(query: string, apiKey: string): Promise<Result<WebSearchResult[]>> {
  let response: Response;
  try {
    response = await fetchWithTimeout('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: MAX_RESULTS,
        search_depth: 'basic',
        include_answer: false,
      }),
    });
  } catch (err) {
    return failure(new AppError('WEB_SEARCH_TIMEOUT', `Tavily search timed out or failed: ${err instanceof Error ? err.message : String(err)}`, 502));
  }

  if (!response.ok) {
    return failure(new AppError('WEB_SEARCH_ERROR', `Tavily API returned ${response.status}`, 502));
  }

  const data = await response.json() as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };

  const results: WebSearchResult[] = (data.results ?? [])
    .slice(0, MAX_RESULTS)
    .map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      snippet: r.content ?? '',
    }));

  return success(results);
}

export const webSearchService = {
  /**
   * Search the web using the configured provider (Brave or Tavily).
   * Results are cached in Redis for 1 hour.
   * If search fails for any reason, returns an empty array (graceful fallback).
   */
  async search(query: string): Promise<WebSearchResult[]> {
    const cached = await getCached(query);
    if (cached) return cached;

    const env = getEnv();
    let result: Result<WebSearchResult[]>;

    if (env.BRAVE_SEARCH_API_KEY) {
      result = await searchBrave(query, env.BRAVE_SEARCH_API_KEY);
    } else if (env.TAVILY_API_KEY) {
      result = await searchTavily(query, env.TAVILY_API_KEY);
    } else {
      return [];
    }

    if (!result.success) {
      console.error(JSON.stringify({
        level: 'warn',
        message: 'Web search failed — continuing without web context',
        error: result.error.message,
        code: result.error.code,
      }));
      return [];
    }

    await setCached(query, result.data);
    return result.data;
  },

  /**
   * Determine whether the user message likely requires fresh/recent information
   * that the KB might not contain.
   */
  queryNeedsWebSearch(message: string): boolean {
    const lower = message.toLowerCase();
    const triggers = ['oggi', '2024', '2025', '2026', 'recente', 'recenti', 'ultimo', 'ultima', 'news', 'prezzo', 'prezzi'];
    return triggers.some((t) => lower.includes(t));
  },
};
