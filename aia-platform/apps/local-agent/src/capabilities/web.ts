/**
 * Web capabilities — fetch with SSRF protections.
 */

import { isIP } from 'node:net';

import type { AgentConfig } from '../config.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const USER_AGENT = '108AI-Desktop/0.3';

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

export interface WebFetchResult {
  url: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  truncated: boolean;
  contentType: string;
}

function isPrivateIp(hostname: string): boolean {
  if (!isIP(hostname)) return false;
  if (hostname === '127.0.0.1' || hostname === '::1') return true;
  if (hostname.startsWith('10.')) return true;
  if (hostname.startsWith('192.168.')) return true;
  const parts = hostname.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) return true;
  return false;
}

export function assertSafeUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http/https URLs are allowed');
  }

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local')) {
    throw new Error(`Blocked host: ${host}`);
  }

  if (isPrivateIp(host)) {
    throw new Error(`Private/reserved IP blocked: ${host}`);
  }

  return parsed;
}

export async function webFetch(
  params: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    maxSize?: number;
  },
  _config: AgentConfig,
): Promise<WebFetchResult> {
  const parsed = assertSafeUrl(params.url);
  const maxSize = Math.min(params.maxSize ?? DEFAULT_MAX_BYTES, DEFAULT_MAX_BYTES);
  const method = (params.method ?? 'GET').toUpperCase();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      method,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/json,text/plain,*/*',
        ...params.headers,
      },
      body: method === 'GET' || method === 'HEAD' ? undefined : params.body,
      signal: controller.signal,
      redirect: 'follow',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const truncated = buffer.length > maxSize;
    const slice = truncated ? buffer.subarray(0, maxSize) : buffer;

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      url: parsed.toString(),
      status: response.status,
      headers,
      body: slice.toString('utf-8'),
      truncated,
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function webSearch(
  params: { query: string; count?: number },
  _config: AgentConfig,
): Promise<{ query: string; results: Array<{ title: string; url: string; snippet: string }> }> {
  const apiKey = process.env['BRAVE_SEARCH_API_KEY'] ?? process.env['AIA_BRAVE_SEARCH_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'web.search requires BRAVE_SEARCH_API_KEY or AIA_BRAVE_SEARCH_API_KEY environment variable',
    );
  }

  const count = Math.min(Math.max(params.count ?? 5, 1), 20);
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(params.query)}&count=${count}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': apiKey,
      'User-Agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Brave search failed: HTTP ${response.status}`);
  }

  const doc = (await response.json()) as {
    web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
  };

  const results = (doc.web?.results ?? []).map((item) => ({
    title: item.title ?? '',
    url: item.url ?? '',
    snippet: item.description ?? '',
  }));

  return { query: params.query, results };
}
