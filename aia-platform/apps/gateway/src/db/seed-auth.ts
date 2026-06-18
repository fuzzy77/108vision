/**
 * Auth seed script — creates initial users for development/testing.
 *
 * Creates:
 * 1. Consultant (platform_admin): admin@108labs.it
 * 2. Demo tenant: "Demo Azienda S.r.l." with starter plan
 * 3. CLIENT_ADMIN for demo tenant: admin@demo-azienda.it
 * 4. CLIENT_USER for demo tenant: mario.rossi@demo-azienda.it
 *
 * Usage:
 *   npx tsx apps/gateway/src/db/seed-auth.ts
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING for idempotency.
 */

import pg from 'pg';
import * as bcrypt from 'bcrypt';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://aia:aia_dev_password@localhost:5432/aia_platform';
const BCRYPT_ROUNDS = 10;

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: string;
  tenantId: string | null;
}

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed script cannot run in production environment');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('[seed-auth] Connecting to database...');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // --- 1. Ensure a plan exists for the demo tenant ---
      console.log('[seed-auth] Ensuring starter plan exists...');
      const planResult = await client.query(
        `SELECT id FROM shared.plans WHERE name = 'starter' LIMIT 1`,
      );

      let planId: string;
      if (planResult.rows.length > 0) {
        planId = planResult.rows[0].id;
      } else {
        const insertPlan = await client.query(
          `INSERT INTO shared.plans (name, max_conversations_month, max_kb_documents, max_kb_size_mb, allowed_models, price_eur_month, features)
           VALUES ('starter', 200, 100, 256, ARRAY['fast-cheap'], 300.00, '{"support": "email", "custom_branding": false}')
           RETURNING id`,
        );
        planId = insertPlan.rows[0].id;
      }

      // --- 2. Create demo tenant ---
      console.log('[seed-auth] Creating demo tenant...');
      const tenantResult = await client.query(
        `INSERT INTO shared.tenants (name, slug, config, plan_id, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [
          'Demo Azienda S.r.l.',
          'demo-azienda',
          JSON.stringify({ sector: 'manufacturing', plan: 'factory' }),
          planId,
          'active',
        ],
      );

      const tenantId = tenantResult.rows[0].id;
      console.log(`[seed-auth] Demo tenant ID: ${tenantId}`);

      // --- 3. Create users ---
      const seedUsers: SeedUser[] = [
        {
          email: 'admin@108labs.it',
          password: 'changeme108!',
          name: 'Admin 108 Labs',
          role: 'platform_admin',
          tenantId: null,
        },
        {
          email: 'admin@demo-azienda.it',
          password: 'changeme108!',
          name: 'Admin Demo Azienda',
          role: 'tenant_admin',
          tenantId: tenantId,
        },
        {
          email: 'mario.rossi@demo-azienda.it',
          password: 'changeme108!',
          name: 'Mario Rossi',
          role: 'client_user',
          tenantId: tenantId,
        },
      ];

      for (const user of seedUsers) {
        console.log(`[seed-auth] Creating user: ${user.email} (${user.role})...`);

        const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

        await client.query(
          `INSERT INTO shared.users (email, password_hash, name, role, tenant_id, email_verified, last_login_at)
           VALUES ($1, $2, $3, $4, $5, true, NULL)
           ON CONFLICT (email) DO NOTHING`,
          [user.email, passwordHash, user.name, user.role, user.tenantId],
        );
      }

      await client.query('COMMIT');
      console.log('[seed-auth] Seed completed successfully.');
      console.log('');
      console.log('  Credentials: see .env or seed script source (not logged for security)');
      console.log('');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[seed-auth] Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
