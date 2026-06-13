import { Hono } from 'hono';
import { getDb } from '../../lib/db.js';
import { sql } from 'drizzle-orm';

const adminActionsRouter = new Hono();

adminActionsRouter.get('/pending', async (c) => {
  const db = getDb();
  const result = await db.execute(
    sql`SELECT * FROM shared.action_requests WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50`,
  );
  return c.json({ items: result.rows ?? [], total: result.rows?.length ?? 0 });
});

adminActionsRouter.get('/pending/count', async (c) => {
  const db = getDb();
  const result = await db.execute(
    sql`SELECT count(*)::int as count FROM shared.action_requests WHERE status = 'pending'`,
  );
  const count = (result.rows?.[0] as { count: number } | undefined)?.count ?? 0;
  return c.json({ count });
});

adminActionsRouter.get('/history', async (c) => {
  const db = getDb();
  const result = await db.execute(
    sql`SELECT * FROM shared.action_requests WHERE status != 'pending' ORDER BY updated_at DESC LIMIT 100`,
  );
  return c.json({ items: result.rows ?? [], total: result.rows?.length ?? 0 });
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
