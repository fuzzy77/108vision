import type { Context, Next } from 'hono';
import { AppError } from '@aia/shared';
import {
  type AuthUser,
  type UserRole,
  type Action,
  type Resource,
  AUTH_ROLES,
  can,
  canAccessTenant as canAccessTenantCheck,
  hasRole as hasRoleCheck,
} from '@aia/auth';

/**
 * Permission middleware factories for the AIA Platform gateway.
 *
 * Usage:
 *   app.use('/admin/*', requireRole('platform_admin'));
 *   app.use('/api/*', requireTenantAccess());
 *   app.delete('/agents/:id', requirePermission('delete', 'agent'));
 */

/**
 * Get the authenticated user from context.
 * Throws 401 if user is not set (auth middleware did not run or failed).
 */
function getUser(c: Context): AuthUser {
  const user = c.get('user') as AuthUser | undefined;
  if (!user) {
    throw new AppError(
      'AUTH_REQUIRED',
      'Authentication required. No user in context.',
      401,
    );
  }
  return user;
}

/**
 * Role guard middleware factory.
 * Restricts access to users with one of the specified roles.
 *
 * @example
 *   // Only platform admins (consultants)
 *   app.use('/admin/*', requireRole('platform_admin'));
 *
 *   // Admins at any level
 *   app.use('/manage/*', requireRole('platform_admin', 'tenant_admin'));
 */
export function requireRole(...roles: UserRole[]) {
  return async (c: Context, next: Next): Promise<void | Response> => {
    const user = getUser(c);

    if (!hasRoleCheck(user, ...roles)) {
      throw new AppError(
        'FORBIDDEN',
        `Access denied. Required role: ${roles.join(' or ')}.`,
        403,
      );
    }

    await next();
  };
}

/**
 * Tenant access guard middleware.
 * Ensures the user can access the tenant specified in context.
 *
 * Resolution order for tenant ID:
 * 1. c.get('tenantId') — set by tenant middleware
 * 2. Route param :tenantId
 * 3. Header X-Tenant-ID
 *
 * CONSULTANT (platform_admin) can access all tenants.
 * Other roles can only access their own tenant.
 *
 * @example
 *   app.use('/api/*', requireTenantAccess());
 */
export function requireTenantAccess() {
  return async (c: Context, next: Next): Promise<void | Response> => {
    const user = getUser(c);

    // Consultants can access everything — skip tenant check.
    if (user.role === AUTH_ROLES.CONSULTANT) {
      await next();
      return;
    }

    // Resolve the target tenant ID from context, route params, or header.
    const targetTenantId =
      (c.get('tenantId') as string | undefined) ||
      c.req.param('tenantId') ||
      c.req.header('X-Tenant-ID');

    if (!targetTenantId) {
      throw new AppError(
        'TENANT_REQUIRED',
        'Tenant identification required for this operation.',
        400,
      );
    }

    if (!canAccessTenantCheck(user, targetTenantId)) {
      throw new AppError(
        'FORBIDDEN_TENANT',
        'You do not have access to this tenant.',
        403,
      );
    }

    await next();
  };
}

/**
 * Fine-grained permission check middleware factory.
 * Uses the permission matrix to verify the user can perform the action on the resource.
 *
 * Optionally extracts resource ownership context from:
 * - Route params (tenantId, userId)
 * - Context variables
 *
 * @example
 *   app.delete('/agents/:id', requirePermission('delete', 'agent'));
 *   app.post('/knowledge/upload', requirePermission('upload', 'knowledge_base'));
 */
export function requirePermission(action: Action, resource: Resource) {
  return async (c: Context, next: Next): Promise<void | Response> => {
    const user = getUser(c);

    // Build permission context from available information.
    const resourceTenantId =
      (c.get('tenantId') as string | undefined) ||
      c.req.param('tenantId') ||
      c.req.header('X-Tenant-ID') ||
      undefined;

    const resourceOwnerId =
      c.req.param('userId') || undefined;

    const allowed = can(user, action, resource, {
      resourceTenantId,
      resourceOwnerId,
    });

    if (!allowed) {
      throw new AppError(
        'FORBIDDEN',
        `You do not have permission to ${action} this ${resource}.`,
        403,
      );
    }

    await next();
  };
}

/**
 * Convenience: require that the user is a platform admin (consultant).
 */
export function requireConsultant() {
  return requireRole(AUTH_ROLES.CONSULTANT);
}

/**
 * Convenience: require that the user is at least a tenant admin.
 */
export function requireAdmin() {
  return requireRole(AUTH_ROLES.CONSULTANT, AUTH_ROLES.CLIENT_ADMIN);
}
