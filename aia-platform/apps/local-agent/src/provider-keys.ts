import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ModelTier } from '@aia/shared';
import { decryptSecret, encryptSecret, isEncryptedSecret } from './hardening/key-vault.js';

export interface ProviderConfig {
  id: string;
  name: string;
  type:
    | 'deepseek'
    | 'alibaba'
    | 'openai'
    | 'anthropic'
    | 'mistral'
    | 'groq'
    | 'ollama'
    | 'custom';
  apiKey: string;
  baseUrl: string;
  models: Record<ModelTier, string>;
  enabled: boolean;
  priority: number;
  limits?: {
    maxTokensPerDay?: number;
    maxRequestsPerMinute?: number;
  };
}

export interface ProvidersStore {
  providers: ProviderConfig[];
  defaultTier: Record<ModelTier, string>;
  updatedAt: string;
}

const CONFIG_DIR = join(homedir(), '.108ai');
const PROVIDERS_FILE = join(CONFIG_DIR, 'providers.json');

const EMPTY_STORE: ProvidersStore = {
  providers: [],
  defaultTier: {
    'fast-cheap': '',
    balanced: '',
    powerful: '',
    embedding: '',
  },
  updatedAt: new Date().toISOString(),
};

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function decryptProvider(provider: ProviderConfig): ProviderConfig {
  return {
    ...provider,
    apiKey: decryptSecret(provider.apiKey),
  };
}

function encryptProvider(provider: ProviderConfig): ProviderConfig {
  return {
    ...provider,
    apiKey: isEncryptedSecret(provider.apiKey) ? provider.apiKey : encryptSecret(provider.apiKey),
  };
}

export function loadProviders(): ProvidersStore {
  if (!existsSync(PROVIDERS_FILE)) {
    return structuredClone(EMPTY_STORE);
  }

  try {
    const raw = readFileSync(PROVIDERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as ProvidersStore;
    return {
      ...parsed,
      providers: parsed.providers.map(decryptProvider),
    };
  } catch {
    return structuredClone(EMPTY_STORE);
  }
}

export function saveProviders(store: ProvidersStore): void {
  ensureConfigDir();
  const data: ProvidersStore = {
    ...store,
    providers: store.providers.map(encryptProvider),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(PROVIDERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function addProvider(config: Omit<ProviderConfig, 'id'>): ProviderConfig {
  const store = loadProviders();
  const provider: ProviderConfig = { ...config, id: crypto.randomUUID() };
  store.providers.push(provider);
  saveProviders(store);
  return provider;
}

export function removeProvider(id: string): boolean {
  const store = loadProviders();
  const index = store.providers.findIndex((p) => p.id === id);

  if (index === -1) return false;

  store.providers.splice(index, 1);

  for (const tier of Object.keys(store.defaultTier) as ModelTier[]) {
    if (store.defaultTier[tier] === id) {
      store.defaultTier[tier] = '';
    }
  }

  saveProviders(store);
  return true;
}

export function updateProvider(
  id: string,
  update: Partial<ProviderConfig>,
): ProviderConfig | null {
  const store = loadProviders();
  const index = store.providers.findIndex((p) => p.id === id);

  if (index === -1) return null;

  const updated: ProviderConfig = { ...store.providers[index]!, ...update, id };
  store.providers[index] = updated;
  saveProviders(store);
  return updated;
}

export function listProviders(): ProviderConfig[] {
  return loadProviders().providers;
}

export function getProviderForTier(tier: ModelTier): ProviderConfig | null {
  const store = loadProviders();

  const explicit = store.defaultTier[tier];
  if (explicit) {
    const found = store.providers.find((p) => p.id === explicit && p.enabled);
    if (found) return found;
  }

  const candidates = store.providers
    .filter((p) => p.enabled && p.models[tier])
    .sort((a, b) => a.priority - b.priority);

  return candidates[0] ?? null;
}

export function resolveModelConfig(
  tier: ModelTier,
): { baseUrl: string; apiKey: string; model: string } | null {
  const provider = getProviderForTier(tier);
  if (!provider) return null;

  const model = provider.models[tier];
  if (!model) return null;

  return {
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    model,
  };
}

export async function testProvider(
  id: string,
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const store = loadProviders();
  const provider = store.providers.find((p) => p.id === id);

  if (!provider) {
    return { ok: false, latencyMs: 0, error: 'Provider not found' };
  }

  const baseUrl = provider.baseUrl.replace(/\/$/, '');
  const probeUrl =
    provider.type === 'ollama'
      ? `${baseUrl.replace('/v1', '')}/health`
      : `${baseUrl}/models`;

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const response = await fetch(probeUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return {
        ok: false,
        latencyMs,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { ok: true, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, latencyMs, error: message };
  }
}

export function getProviderTemplates(): Array<Omit<ProviderConfig, 'id' | 'apiKey'>> {
  return [
    {
      name: 'DeepSeek',
      type: 'deepseek',
      baseUrl: 'https://api.deepseek.com',
      models: {
        'fast-cheap': 'deepseek-chat',
        balanced: 'deepseek-reasoner',
        powerful: 'deepseek-reasoner',
        embedding: 'deepseek-chat',
      },
      enabled: false,
      priority: 10,
    },
    {
      name: 'Alibaba / Qwen',
      type: 'alibaba',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      models: {
        'fast-cheap': 'qwen-turbo-latest',
        balanced: 'qwen-plus-latest',
        powerful: 'qwen-max-latest',
        embedding: 'text-embedding-v3',
      },
      enabled: false,
      priority: 20,
    },
    {
      name: 'OpenAI',
      type: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      models: {
        'fast-cheap': 'gpt-4o-mini',
        balanced: 'gpt-4o',
        powerful: 'gpt-4o',
        embedding: 'text-embedding-3-small',
      },
      enabled: false,
      priority: 30,
    },
    {
      name: 'Anthropic',
      type: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      models: {
        'fast-cheap': 'claude-haiku-4-5-20251001',
        balanced: 'claude-sonnet-4-6-20250514',
        powerful: 'claude-opus-4-8-20250610',
        embedding: 'claude-haiku-4-5-20251001',
      },
      enabled: false,
      priority: 40,
    },
    {
      name: 'Mistral',
      type: 'mistral',
      baseUrl: 'https://api.mistral.ai/v1',
      models: {
        'fast-cheap': 'mistral-small-latest',
        balanced: 'mistral-medium-latest',
        powerful: 'mistral-large-latest',
        embedding: 'mistral-embed',
      },
      enabled: false,
      priority: 50,
    },
    {
      name: 'Groq',
      type: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      models: {
        'fast-cheap': 'llama-3.1-8b-instant',
        balanced: 'llama-3.3-70b-versatile',
        powerful: 'llama-3.1-405b-reasoning',
        embedding: 'llama-3.1-8b-instant',
      },
      enabled: false,
      priority: 60,
    },
    {
      name: 'Ollama (local)',
      type: 'ollama',
      baseUrl: 'http://localhost:11434/v1',
      models: {
        'fast-cheap': 'llama3.2',
        balanced: 'llama3.1',
        powerful: 'deepseek-r1:70b',
        embedding: 'nomic-embed-text',
      },
      enabled: false,
      priority: 70,
    },
  ];
}
