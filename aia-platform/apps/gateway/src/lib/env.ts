import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '.env'), override: true });

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  QDRANT_URL: z.string().url(),
  LITELLM_URL: z.string().url(),
  LITELLM_MASTER_KEY: z.string().default(''),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  // Neo4j (optional: graph is supplementary, non-blocking if unavailable)
  NEO4J_URL: z.string().default('bolt://neo4j:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().default('neo4j_dev_password'),
  // Graph extraction settings
  GRAPH_EXTRACTION_ENABLED: z.enum(['true', 'false']).default('true'),
  GRAPH_EXTRACTION_MODEL: z.string().default('fast-cheap'),
  GRAPH_EXTRACTION_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.3),
  // Encryption key for credentials stored at rest (AES-256-GCM).
  // Must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32
  ENCRYPTION_KEY: z
    .string()
    .length(64)
    .regex(/^[0-9a-fA-F]+$/, 'ENCRYPTION_KEY must be 64 hexadecimal characters')
    .optional(),
  // Web search providers (at most one is required; both default to empty = disabled)
  BRAVE_SEARCH_API_KEY: z.string().default(''),
  TAVILY_API_KEY: z.string().default(''),
  // SMTP — leave SMTP_HOST empty to enable dev-mode email logging
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().email().default('noreply@108ai.dev'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  CORS_ALLOWED_ORIGINS: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function loadEnv(): Env {
  if (_env) return _env;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }

  _env = parsed.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) {
    return loadEnv();
  }
  return _env;
}
