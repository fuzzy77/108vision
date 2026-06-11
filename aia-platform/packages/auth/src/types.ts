/**
 * @aia/auth — Authentication types for the AIA Platform.
 *
 * Role mapping:
 *   CONSULTANT    = platform_admin  (full access, no tenant restriction)
 *   CLIENT_ADMIN  = tenant_admin    (manage own tenant)
 *   CLIENT_USER   = client_user     (chat-only access within own tenant)
 */

export const AUTH_ROLES = {
  CONSULTANT: 'platform_admin',
  CLIENT_ADMIN: 'tenant_admin',
  CLIENT_USER: 'client_user',
} as const;

export type UserRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];

export const ALL_ROLES: UserRole[] = [
  AUTH_ROLES.CONSULTANT,
  AUTH_ROLES.CLIENT_ADMIN,
  AUTH_ROLES.CLIENT_USER,
];

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  tenantId: string | null;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface EmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Actions supported by the permission system.
 */
export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'use'
  | 'upload';

/**
 * Resources protected by the permission system.
 */
export type Resource =
  | 'tenant'
  | 'user'
  | 'agent'
  | 'conversation'
  | 'knowledge_base'
  | 'billing'
  | 'marketplace'
  | 'api_key'
  | 'invitation'
  | 'analytics'
  | 'settings';

/**
 * Context for permission checks that require resource ownership validation.
 */
export interface PermissionContext {
  /** The tenant ID of the resource being accessed. */
  resourceTenantId?: string;
  /** The user ID of the resource owner (for ownership checks). */
  resourceOwnerId?: string;
}
