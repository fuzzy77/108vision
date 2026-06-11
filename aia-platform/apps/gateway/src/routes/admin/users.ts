import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { AppError } from '@aia/shared';
import { getDb } from '../../lib/db.js';
import { tenants, users } from '../../db/schema.js';

const adminUsersRouter = new Hono();

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['platform_admin', 'tenant_admin', 'tenant_operator', 'client_user']).default('client_user'),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['platform_admin', 'tenant_admin', 'tenant_operator', 'client_user']).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

/**
 * GET /api/admin/tenants/:tenantId/users — List users for a tenant.
 */
adminUsersRouter.get('/', async (c) => {
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const query = listUsersQuerySchema.parse({
    page: c.req.query('page'),
    pageSize: c.req.query('pageSize'),
  });

  const db = getDb();

  // Verify tenant exists
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  const offset = (query.page - 1) * query.pageSize;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.tenantId, tenantId));

  const total = countResult?.count ?? 0;

  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(sql`${users.createdAt} DESC`)
    .limit(query.pageSize)
    .offset(offset);

  return c.json({
    items: userRows,
    total,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: offset + userRows.length < total,
  });
});

/**
 * POST /api/admin/tenants/:tenantId/users — Invite/create a user for a tenant.
 */
adminUsersRouter.post('/', async (c) => {
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    throw new AppError('INVALID_ID', 'Tenant ID is required', 400);
  }

  const body = await c.req.json();
  const input = createUserSchema.parse(body);

  const db = getDb();

  // Verify tenant exists
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  // Check if email is already used
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser) {
    throw new AppError('USER_EMAIL_EXISTS', 'A user with this email already exists', 409);
  }

  const [user] = await db
    .insert(users)
    .values({
      tenantId,
      email: input.email,
      name: input.name ?? null,
      role: input.role,
      passwordHash: null, // Will be set during invitation acceptance
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    });

  if (!user) {
    throw new AppError('USER_CREATE_FAILED', 'Failed to create user', 500);
  }

  // In production, this would trigger an invitation email.
  console.log(JSON.stringify({
    level: 'info',
    message: 'User created via admin',
    tenantId,
    userId: user.id,
    role: input.role,
  }));

  return c.json(user, 201);
});

/**
 * PUT /api/admin/tenants/:tenantId/users/:userId — Update user role/status.
 */
adminUsersRouter.put('/:userId', async (c) => {
  const tenantId = c.req.param('tenantId');
  const userId = c.req.param('userId');

  if (!tenantId || !userId) {
    throw new AppError('INVALID_ID', 'Tenant ID and User ID are required', 400);
  }

  const body = await c.req.json();
  const input = updateUserSchema.parse(body);

  const db = getDb();

  // Verify user belongs to tenant
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new AppError('USER_NOT_FOUND', 'User not found in this tenant', 404);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData['name'] = input.name;
  if (input.role !== undefined) updateData['role'] = input.role;
  if (input.avatarUrl !== undefined) updateData['avatarUrl'] = input.avatarUrl;

  if (Object.keys(updateData).length <= 1) {
    throw new AppError('NO_UPDATES', 'No fields to update', 400);
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(
      and(
        eq(users.id, userId),
        eq(users.tenantId, tenantId),
      ),
    )
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      updatedAt: users.updatedAt,
    });

  return c.json(updated);
});

/**
 * DELETE /api/admin/tenants/:tenantId/users/:userId — Deactivate a user (remove from tenant).
 */
adminUsersRouter.delete('/:userId', async (c) => {
  const tenantId = c.req.param('tenantId');
  const userId = c.req.param('userId');

  if (!tenantId || !userId) {
    throw new AppError('INVALID_ID', 'Tenant ID and User ID are required', 400);
  }

  const db = getDb();

  // Verify user belongs to tenant
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new AppError('USER_NOT_FOUND', 'User not found in this tenant', 404);
  }

  // Soft-delete: set tenantId to null (orphan the user record)
  // This preserves audit trail while removing access.
  await db
    .update(users)
    .set({ tenantId: null, updatedAt: new Date() })
    .where(
      and(
        eq(users.id, userId),
        eq(users.tenantId, tenantId),
      ),
    );

  return c.json({ message: 'User removed from tenant', userId });
});

export { adminUsersRouter };
