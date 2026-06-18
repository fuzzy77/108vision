import { Hono } from 'hono';
import { getDb } from '../../lib/db.js';
import { sql } from 'drizzle-orm';

const adminActionsRouter = new Hono();

async function safeQuery(query: ReturnType<typeof sql>) {
  try {
    const db = getDb();
    return await db.execute(query);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('does not exist') || msg.includes('relation')) {
      return { rows: [] };
    }
    throw err;
  }
}

adminActionsRouter.get('/pending', async (c) => {
  const result = await safeQuery(
    sql`SELECT * FROM shared.action_requests WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50`,
  );
  return c.json({ items: result.rows ?? [], total: result.rows?.length ?? 0, page: 1, pageSize: 50 });
});

adminActionsRouter.get('/pending/count', async (c) => {
  const result = await safeQuery(
    sql`SELECT count(*)::int as count FROM shared.action_requests WHERE status = 'pending'`,
  );
  const count = (result.rows?.[0] as { count: number } | undefined)?.count ?? 0;
  return c.json({ count });
});

adminActionsRouter.get('/history', async (c) => {
  const result = await safeQuery(
    sql`SELECT * FROM shared.action_requests WHERE status != 'pending' ORDER BY updated_at DESC LIMIT 100`,
  );
  return c.json({ items: result.rows ?? [], total: result.rows?.length ?? 0, page: 1, pageSize: 50 });
});

adminActionsRouter.post('/batch-approve', async (c) => {
  const { actionIds } = await c.req.json() as { actionIds: string[] };
  const db = getDb();
  for (const actionId of actionIds) {
    await db.execute(
      sql`UPDATE shared.action_requests SET status = 'approved', updated_at = NOW() WHERE id = ${actionId}`,
    );
  }
  return c.json({ success: true, count: actionIds.length });
});

adminActionsRouter.post('/batch-reject', async (c) => {
  const { actionIds } = await c.req.json() as { actionIds: string[] };
  const db = getDb();
  for (const actionId of actionIds) {
    await db.execute(
      sql`UPDATE shared.action_requests SET status = 'rejected', updated_at = NOW() WHERE id = ${actionId}`,
    );
  }
  return c.json({ success: true, count: actionIds.length });
});

adminActionsRouter.post('/:actionId/approve', async (c) => {
  const actionId = c.req.param('actionId');
  const db = getDb();
  await db.execute(
    sql`UPDATE shared.action_requests SET status = 'approved', updated_at = NOW() WHERE id = ${actionId}`,
  );
  return c.json({ success: true });
});

adminActionsRouter.post('/:actionId/reject', async (c) => {
  const actionId = c.req.param('actionId');
  const db = getDb();
  await db.execute(
    sql`UPDATE shared.action_requests SET status = 'rejected', updated_at = NOW() WHERE id = ${actionId}`,
  );
  return c.json({ success: true });
});

export { adminActionsRouter };
