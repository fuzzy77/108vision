/**
 * @aia/auth — Permission system.
 *
 * Three-tier role model:
 *   CONSULTANT (platform_admin):
 *     Full access to everything — admin routes, all tenants, marketplace, billing.
 *     No tenant restriction (tenantId is null).
 *
 *   CLIENT_ADMIN (tenant_admin):
 *     Manage own tenant — agents, KB, users within tenant, conversations, settings, analytics.
 *     Cannot access other tenants. Cannot manage marketplace or billing at platform level.
 *
 *   CLIENT_USER (client_user):
 *     Chat only — use agents, view own conversations, upload documents to KB.
 *     Cannot manage users, agents, or tenant settings.
 */

import {
  AUTH_ROLES,
  type Action,
  type AuthUser,
  type PermissionContext,
  type Resource,
  type UserRole,
} from './types.js';

/**
 * Permission matrix defining what each role can do.
 * `true` means the action is allowed unconditionally within scope.
 */
const PERMISSION_MATRIX: Record<UserRole, Partial<Record<Resource, Set<Action>>>> = {
  [AUTH_ROLES.CONSULTANT]: {
    tenant: new Set(['create', 'read', 'update', 'delete', 'manage']),
    user: new Set(['create', 'read', 'update', 'delete', 'manage']),
    agent: new Set(['create', 'read', 'update', 'delete', 'manage']),
    conversation: new Set(['create', 'read', 'update', 'delete', 'manage']),
    knowledge_base: new Set(['create', 'read', 'update', 'delete', 'manage', 'upload']),
    billing: new Set(['create', 'read', 'update', 'delete', 'manage']),
    marketplace: new Set(['create', 'read', 'update', 'delete', 'manage']),
    api_key: new Set(['create', 'read', 'update', 'delete', 'manage']),
    invitation: new Set(['create', 'read', 'update', 'delete', 'manage']),
    analytics: new Set(['read', 'manage']),
    settings: new Set(['read', 'update', 'manage']),
  },
  [AUTH_ROLES.CLIENT_ADMIN]: {
    tenant: new Set(['read', 'update']),
    user: new Set(['create', 'read', 'update', 'delete', 'manage']),
    agent: new Set(['create', 'read', 'update', 'delete', 'manage']),
    conversation: new Set(['create', 'read', 'update', 'delete', 'manage']),
    knowledge_base: new Set(['create', 'read', 'update', 'delete', 'manage', 'upload']),
    billing: new Set(['read']),
    marketplace: new Set(['read', 'use']),
    api_key: new Set(['create', 'read', 'update', 'delete', 'manage']),
    invitation: new Set(['create', 'read', 'update', 'delete']),
    analytics: new Set(['read']),
    settings: new Set(['read', 'update']),
  },
  [AUTH_ROLES.CLIENT_USER]: {
    tenant: new Set([]),
    user: new Set(['read']),
    agent: new Set(['read', 'use']),
    conversation: new Set(['create', 'read']),
    knowledge_base: new Set(['read', 'upload']),
    billing: new Set([]),
    marketplace: new Set(['read']),
    api_key: new Set([]),
    invitation: new Set([]),
    analytics: new Set([]),
    settings: new Set([]),
  },
};

/**
 * Check if a user has permission to perform an action on a resource.
 *
 * For CONSULTANT: always allowed (no tenant restriction).
 * For CLIENT_ADMIN: allowed if the resource belongs to their tenant.
 * For CLIENT_USER: allowed if permitted by matrix AND resource is in their tenant,
 *   and for conversations, only their own.
 */
export function can(
  user: AuthUser,
  action: Action,
  resource: Resource,
  context?: PermissionContext,
): boolean {
  const rolePermissions = PERMISSION_MATRIX[user.role];
  if (!rolePermissions) {
    return false;
  }

  const resourceActions = rolePermissions[resource];
  if (!resourceActions || !resourceActions.has(action)) {
    return false;
  }

  // CONSULTANT has global access — no tenant scoping needed.
  if (user.role === AUTH_ROLES.CONSULTANT) {
    return true;
  }

  // Non-consultant roles must have a tenant assignment.
  if (!user.tenantId) {
    return false;
  }

  // If a resource tenant is specified, enforce tenant isolation.
  if (context?.resourceTenantId && context.resourceTenantId !== user.tenantId) {
    return false;
  }

  // CLIENT_USER additional constraint: can only access own conversations.
  if (
    user.role === AUTH_ROLES.CLIENT_USER &&
    resource === 'conversation' &&
    context?.resourceOwnerId &&
    context.resourceOwnerId !== user.id
  ) {
    return false;
  }

  return true;
}

/**
 * Check if a user can access a specific tenant's data.
 * CONSULTANT can access all tenants. Others can only access their own.
 */
export function canAccessTenant(user: AuthUser, tenantId: string): boolean {
  if (user.role === AUTH_ROLES.CONSULTANT) {
    return true;
  }
  return user.tenantId === tenantId;
}

/**
 * Check if a user has one of the specified roles.
 */
export function hasRole(user: AuthUser, ...roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if the user is a platform admin (consultant).
 */
export function isConsultant(user: AuthUser): boolean {
  return user.role === AUTH_ROLES.CONSULTANT;
}
