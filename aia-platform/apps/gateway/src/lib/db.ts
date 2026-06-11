import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { getEnv } from './env.js';
import * as schema from '../db/schema.js';
import * as integrationsSchema from '../db/schema-integrations.js';

const { Pool } = pg;

const combinedSchema = { ...schema, ...integrationsSchema };

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof combinedSchema>> | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    const env = getEnv();
    _pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return _pool;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema: combinedSchema });
  }
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}
