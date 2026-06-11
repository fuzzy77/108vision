import type { JwtPayload } from './middleware/auth.js';
import type { AuthUser } from '@aia/auth';

/**
 * Hono context variable declarations.
 * These are the values stored via c.set() and retrieved via c.get().
 */
export interface AppVariables {
  requestId: string;
  jwtPayload: JwtPayload;
  /** Full authenticated user object (set by auth-v2 middleware). */
  user: AuthUser;
  userId: string;
  userRole: string;
  tenantId: string;
  tenantSlug: string;
  tenantStatus: string;
}

/**
 * Environment bindings for Hono (not used with Node.js adapter, but declared for completeness).
 */
export interface AppBindings {
  Variables: AppVariables;
}
