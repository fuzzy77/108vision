/**
 * @aia/auth — Authentication package for the AIA Platform.
 *
 * Provides:
 * - Auth configuration and instance creation (Better Auth)
 * - Type definitions for users, sessions, roles
 * - Permission system (RBAC with tenant isolation)
 * - Client-side auth helper
 * - Reusable LoginForm React component
 */

// Types
export {
  AUTH_ROLES,
  ALL_ROLES,
  type AuthUser,
  type Session,
  type PasswordResetToken,
  type EmailVerificationToken,
  type UserRole,
  type Action,
  type Resource,
  type PermissionContext,
} from './types.js';

// Auth instance
export {
  createAuth,
  mapToAuthUser,
  mapToSession,
  type AuthConfig,
} from './auth.js';

// Permissions
export {
  can,
  canAccessTenant,
  hasRole,
  isConsultant,
} from './permissions.js';

// Client helper
export {
  createAuthClient,
  type AuthClient,
  type AuthClientConfig,
  type LoginResult,
  type AuthError,
} from './client.js';
