import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { AppError } from '@aia/shared';
import { getDb } from '../lib/db.js';
import { users, tenants } from '../db/schema.js';
import { requireRole } from '../middleware/auth.js';
import * as bcrypt from 'bcrypt';

const tenantRouter = new Hono();

// All routes require tenant_admin or platform_admin
tenantRouter.use('*', requireRole('platform_admin', 'tenant_admin'));

/**
 * GET /api/tenant/users — List users in the caller's tenant.
 */
tenantRouter.get('/users', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const db = getDb();

  const userList = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(users.createdAt);

  return c.json({ items: userList, total: userList.length });
});

/**
 * POST /api/tenant/users — Invite/create a user in the caller's tenant.
 */
tenantRouter.post('/users', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = await c.req.json();

  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(1).max(255),
    role: z.enum(['tenant_admin', 'tenant_operator', 'client_user']),
    password: z.string().min(8).optional(),
  });

  const input = schema.parse(body);
  const db = getDb();

  // Check email uniqueness
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) {
    throw new AppError('EMAIL_EXISTS', 'Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(input.password ?? 'changeme108!', 10);

  const [newUser] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      role: input.role,
      tenantId,
      passwordHash,
      emailVerified: true,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    });

  console.log(JSON.stringify({
    level: 'info',
    message: 'User created via tenant self-service',
    tenantId,
    userId: newUser?.id,
    role: input.role,
  }));

  return c.json(newUser, 201);
});

/**
 * PUT /api/tenant/users/:userId — Update name or role of a user in the caller's tenant.
 */
tenantRouter.put('/users/:userId', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const userId = c.req.param('userId');
  const body = await c.req.json();

  const schema = z.object({
    name: z.string().min(1).max(255).optional(),
    role: z.enum(['tenant_admin', 'tenant_operator', 'client_user']).optional(),
  });

  const input = schema.parse(body);
  const db = getDb();

  // Verify user belongs to this tenant
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .limit(1);

  if (!existing) {
    throw new AppError('USER_NOT_FOUND', 'User not found in this tenant', 404);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData['name'] = input.name;
  if (input.role !== undefined) updateData['role'] = input.role;

  if (Object.keys(updateData).length <= 1) {
    throw new AppError('NO_UPDATES', 'No fields to update', 400);
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
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
 * DELETE /api/tenant/users/:userId — Remove a user from the caller's tenant (soft delete).
 */
tenantRouter.delete('/users/:userId', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const userId = c.req.param('userId');
  const currentUserId = c.get('userId') as string;
  const db = getDb();

  if (userId === currentUserId) {
    throw new AppError('CANNOT_REMOVE_SELF', 'You cannot remove yourself from the tenant', 400);
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .limit(1);

  if (!existing) {
    throw new AppError('USER_NOT_FOUND', 'User not found in this tenant', 404);
  }

  // Soft delete: detach user from tenant, preserving the record for audit
  await db
    .update(users)
    .set({ tenantId: null, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return c.json({ message: 'User removed from tenant', userId });
});

/**
 * GET /api/tenant/me — Get the caller's tenant configuration.
 */
tenantRouter.get('/me', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new AppError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  return c.json(tenant);
});

/**
 * PATCH /api/tenant/me — Update limited fields of the caller's tenant configuration.
 */
tenantRouter.patch('/me', async (c) => {
  const tenantId = c.get('tenantId') as string;
  const body = await c.req.json();

  const schema = z.object({
    name: z.string().min(1).max(255).optional(),
    config: z.record(z.unknown()).optional(),
  });

  const input = schema.parse(body);
  const db = getDb();

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData['name'] = input.name;
  if (input.config !== undefined) updateData['config'] = input.config;

  if (Object.keys(updateData).length <= 1) {
    throw new AppError('NO_UPDATES', 'No fields to update', 400);
  }

  const [updated] = await db
    .update(tenants)
    .set(updateData)
    .where(eq(tenants.id, tenantId))
    .returning();

  return c.json(updated);
});

export { tenantRouter };
