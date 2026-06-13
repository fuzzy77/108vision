import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '../../lib/db.js';
import { platformSettings } from '../../db/schema.js';
import { getEnv } from '../../lib/env.js';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const adminSettingsRouter = new Hono();

const SENSITIVE_KEYS = [
  'deepseek_api_key',
  'dashscope_api_key',
  'openai_api_key',
  'anthropic_api_key',
];

const ALL_SETTINGS_KEYS = [
  ...SENSITIVE_KEYS,
  'default_model',
  'budget_alert_eur',
  'backup_enabled',
  'email_notifications',
  'webhook_url',
  'custom_domain',
];

function encrypt(text: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(data: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const buf = Buffer.from(data, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

function maskKey(value: string): string {
  if (value.length <= 8) return '••••••••';
  return value.slice(0, 4) + '••••' + value.slice(-4);
}

const saveSettingsSchema = z.object({
  deepseek_api_key: z.string().optional(),
  dashscope_api_key: z.string().optional(),
  openai_api_key: z.string().optional(),
  anthropic_api_key: z.string().optional(),
  default_model: z.string().optional(),
  budget_alert_eur: z.string().optional(),
  backup_enabled: z.string().optional(),
  email_notifications: z.string().optional(),
  webhook_url: z.string().optional(),
  custom_domain: z.string().optional(),
});

/**
 * GET /api/admin/settings
 * Returns all platform settings. Sensitive keys are masked.
 */
adminSettingsRouter.get('/', async (c) => {
  const db = getDb();
  const rows = await db.select().from(platformSettings);
  const env = getEnv();
  const encKey = env.ENCRYPTION_KEY;

  const result: Record<string, { value: string; masked: boolean; updatedAt: Date | null }> = {};

  for (const row of rows) {
    const isSensitive = SENSITIVE_KEYS.includes(row.key);
    let displayValue = row.value;

    if (isSensitive && row.encrypted && encKey) {
      try {
        const decrypted = decrypt(row.value, encKey);
        displayValue = maskKey(decrypted);
      } catch {
        displayValue = '••••••••';
      }
    } else if (isSensitive) {
      displayValue = maskKey(row.value);
    }

    result[row.key] = {
      value: isSensitive ? displayValue : row.value,
      masked: isSensitive,
      updatedAt: row.updatedAt,
    };
  }

  // Show which keys come from .env (as fallback)
  const envKeys: Record<string, boolean> = {
    deepseek_api_key: !!process.env.DEEPSEEK_API_KEY,
    dashscope_api_key: !!process.env.DASHSCOPE_API_KEY,
    openai_api_key: !!process.env.OPENAI_API_KEY,
    anthropic_api_key: !!process.env.ANTHROPIC_API_KEY,
  };

  return c.json({ settings: result, envKeys });
});

/**
 * PUT /api/admin/settings
 * Save platform settings. Sensitive keys are encrypted at rest.
 * Empty strings for API keys are skipped (not overwritten).
 */
adminSettingsRouter.put('/', async (c) => {
  const body = await c.req.json();
  const input = saveSettingsSchema.parse(body);
  const db = getDb();
  const env = getEnv();
  const encKey = env.ENCRYPTION_KEY;
  const userId = (c.get('user') as { sub: string })?.sub;

  const saved: string[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === '') continue;

    const isSensitive = SENSITIVE_KEYS.includes(key);
    const storeValue = isSensitive && encKey ? encrypt(value, encKey) : value;
    const isEncrypted = isSensitive && !!encKey;

    await db
      .insert(platformSettings)
      .values({
        key,
        value: storeValue,
        encrypted: isEncrypted,
        updatedAt: new Date(),
        updatedBy: userId || null,
      })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: storeValue,
          encrypted: isEncrypted,
          updatedAt: new Date(),
          updatedBy: userId || null,
        },
      });

    saved.push(key);
  }

  return c.json({ message: 'Settings saved', keys: saved });
});

/**
 * GET /api/admin/settings/litellm-status
 * Check if LiteLLM is responding and which models are available.
 */
adminSettingsRouter.get('/litellm-status', async (c) => {
  const env = getEnv();
  try {
    const res = await fetch(`${env.LITELLM_URL}/health`, {
      headers: env.LITELLM_MASTER_KEY
        ? { Authorization: `Bearer ${env.LITELLM_MASTER_KEY}` }
        : {},
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return c.json({ status: 'healthy', data });
  } catch (err) {
    return c.json({ status: 'unreachable', error: String(err) }, 503);
  }
});

/**
 * POST /api/admin/settings/test-key
 * Test if an API key works by making a lightweight call to the provider.
 * Body: { provider: 'deepseek' | 'dashscope' | 'openai' | 'anthropic', apiKey: string }
 */
adminSettingsRouter.post('/test-key', async (c) => {
  const body = await c.req.json();
  const { provider, apiKey } = z
    .object({
      provider: z.enum(['deepseek', 'dashscope', 'openai', 'anthropic']),
      apiKey: z.string().min(1),
    })
    .parse(body);

  const testConfigs: Record<string, { url: string; headers: Record<string, string>; body: string }> = {
    deepseek: {
      url: 'https://api.deepseek.com/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: '',
    },
    dashscope: {
      url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: '',
    },
    openai: {
      url: 'https://api.openai.com/v1/models',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: '',
    },
    anthropic: {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    },
  };

  const config = testConfigs[provider];

  try {
    const fetchOpts: RequestInit = {
      headers: config.headers,
      signal: AbortSignal.timeout(10000),
    };

    if (config.body) {
      fetchOpts.method = 'POST';
      fetchOpts.body = config.body;
    }

    const res = await fetch(config.url, fetchOpts);

    if (res.ok || res.status === 200) {
      return c.json({ valid: true, status: res.status, message: 'Key is valid' });
    }

    const errorBody = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      return c.json({ valid: false, status: res.status, message: 'Invalid or expired key' });
    }

    return c.json({ valid: true, status: res.status, message: `Provider responded (${res.status}) — key accepted` });
  } catch (err) {
    return c.json({ valid: false, status: 0, message: `Connection failed: ${String(err)}` }, 502);
  }
});

export { adminSettingsRouter };
