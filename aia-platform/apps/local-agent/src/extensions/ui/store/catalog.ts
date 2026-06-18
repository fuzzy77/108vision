import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { loadConfig } from '../../../config.js';

export interface StoreCatalogItem {
  id: string;
  type: 'command' | 'skill' | 'agent' | 'mcp';
  name: string;
  displayName: string;
  description: string;
  category: string;
  verified: boolean;
  author?: string;
  version?: string;
  signature?: string;
  installUrl?: string;
  /** Dev/test only — inline YAML content (avoid in production catalog) */
  inlineContent?: string;
  /** MCP preset id for /mcp install */
  mcpPreset?: string;
  rating?: number;
  installs?: number;
  bundled?: boolean;
  sourcePath?: string;
}

export interface StoreCatalog {
  version: 1;
  updatedAt: string;
  items: StoreCatalogItem[];
}

const BUNDLED_CATALOG: StoreCatalog = {
  version: 1,
  updatedAt: '2026-06-15',
  items: [
    {
      id: 'cmd-triage',
      type: 'command',
      name: 'triage',
      displayName: 'Daily Triage',
      description: 'Triage completo email, calendario, PEC e sistema',
      category: 'productivity',
      verified: true,
      rating: 4.9,
      installs: 1,
      bundled: true,
    },
    {
      id: 'cmd-job',
      type: 'command',
      name: 'job',
      displayName: 'Job Engine',
      description: 'Lista, esecuzione e gestione job schedulati',
      category: 'automation',
      verified: true,
      rating: 4.8,
      installs: 1,
      bundled: true,
    },
    {
      id: 'cmd-summarize-email',
      type: 'command',
      name: 'summarize-email',
      displayName: 'Riassunto Email',
      description: 'Riassumi le ultime email non lette in punti chiave',
      category: 'productivity',
      verified: true,
      rating: 4.8,
      installs: 1,
      bundled: true,
    },
    {
      id: 'skill-email-writer',
      type: 'skill',
      name: 'email-writer',
      displayName: 'Email Writer',
      description: 'Scrive email professionali nel tono appropriato',
      category: 'writing',
      verified: true,
      rating: 4.6,
      installs: 1,
      bundled: true,
    },
    {
      id: 'agent-assistant',
      type: 'agent',
      name: 'assistant',
      displayName: 'Assistente',
      description: 'Assistente generale per task quotidiani',
      category: 'professional',
      verified: true,
      rating: 4.9,
      installs: 1,
      bundled: true,
    },
    {
      id: 'agent-accountant',
      type: 'agent',
      name: 'accountant',
      displayName: 'Commercialista',
      description: 'Supporto IVA e adempimenti fiscali PMI',
      category: 'business-it',
      verified: true,
      rating: 4.7,
      installs: 1,
      bundled: true,
    },
    {
      id: 'mcp-everything',
      type: 'mcp',
      name: 'everything-demo',
      displayName: 'MCP Everything (demo)',
      description: 'Server MCP di test via npx @modelcontextprotocol/server-everything',
      category: 'development',
      verified: false,
      author: '108ai',
      version: '1',
      mcpPreset: 'everything-demo',
      rating: 4.0,
      installs: 0,
      bundled: false,
    },
  ],
};

let cached: StoreCatalog | null = null;

function getConfiguredOnlineUrl(): string {
  const fromEnv =
    process.env['AIA_STORE_CATALOG_ONLINE_URL'] ?? process.env['AIA_STORE_CATALOG_URL'] ?? '';
  if (fromEnv.trim()) return fromEnv.trim();

  const cfg = loadConfig();
  return cfg?.storeCatalogOnlineUrl ?? '';
}
const ONLINE_CACHE_DIR = join(homedir(), '.108ai', 'store');
const ONLINE_CACHE_FILE = join(ONLINE_CACHE_DIR, 'catalog-online.json');
const ONLINE_FETCH_TTL_MS = 12 * 60 * 60 * 1000; // 12h
let lastOnlineFetchAt = 0;

async function tryFetchOnlineCatalog(): Promise<void> {
  const onlineUrl = getConfiguredOnlineUrl();
  if (!onlineUrl) return;
  const now = Date.now();
  if (now - lastOnlineFetchAt < ONLINE_FETCH_TTL_MS) return;
  if (!onlineUrl.trim()) return;

  lastOnlineFetchAt = now;

  try {
    const res = await fetch(onlineUrl, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return;
    const doc = (await res.json()) as StoreCatalog;
    if (!doc || doc.version !== 1 || !Array.isArray(doc.items)) return;

    if (!existsSync(ONLINE_CACHE_DIR)) mkdirSync(ONLINE_CACHE_DIR, { recursive: true });
    writeFileSync(ONLINE_CACHE_FILE, JSON.stringify(doc, null, 2), 'utf-8');
  } catch {
    // best-effort: keep bundled catalog
  }
}

function catalogFilePath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, 'catalog.json');
}

export function loadStoreCatalog(): StoreCatalog {
  if (cached) return cached;

  // Fire-and-forget online refresh.
  void tryFetchOnlineCatalog();

  const path = catalogFilePath();
  if (existsSync(path)) {
    try {
      cached = JSON.parse(readFileSync(path, 'utf-8')) as StoreCatalog;
      return cached;
    } catch {
      // fall through
    }
  }

  // Prefer online cached catalog if present.
  if (existsSync(ONLINE_CACHE_FILE)) {
    try {
      cached = JSON.parse(readFileSync(ONLINE_CACHE_FILE, 'utf-8')) as StoreCatalog;
      return cached;
    } catch {
      // fall through
    }
  }

  cached = BUNDLED_CATALOG;
  return cached;
}

export function searchStoreCatalog(query: string, type?: string): StoreCatalogItem[] {
  const q = query.trim().toLowerCase();
  let items = loadStoreCatalog().items;
  if (type && type !== 'all') {
    items = items.filter((i) => i.type === type);
  }
  if (!q) return items;
  return items.filter((i) => {
    const hay = `${i.name} ${i.displayName} ${i.description} ${i.category}`.toLowerCase();
    return hay.includes(q);
  });
}

export function findStoreItemById(itemId: string): StoreCatalogItem | undefined {
  return loadStoreCatalog().items.find((i) => i.id === itemId);
}

export function invalidateStoreCatalogCache(): void {
  cached = null;
  lastOnlineFetchAt = 0;
}
