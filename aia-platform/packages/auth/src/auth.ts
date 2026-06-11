/**
 * @aia/auth — Better Auth configuration.
 *
 * Provides the core auth instance with:
 * - Email + password authentication
 * - Session management (JWT tokens, 7-day expiry)
 * - Roles: platform_admin (CONSULTANT), tenant_admin (CLIENT_ADMIN), client_user (CLIENT_USER)
 * - Organization support (tenant association)
 *
 * Better Auth handles password hashing (bcrypt) internally.
 */

import { betterAuth } from 'better-auth';
import type { AuthUser, Session, UserRole } from './types.js';
import { AUTH_ROLES } from './types.js';

export interface AuthConfig {
  /** PostgreSQL connection string. */
  databaseUrl: string;
  /** Secret used to sign JWT session tokens (min 32 chars recommended). */
  jwtSecret: string;
  /** Base URL of the application (used for callback URLs). */
  baseUrl: string;
  /** Session token expiry in seconds. Default: 7 days. */
  sessionMaxAge?: number;
  /** Whether to trust the proxy X-Forwarded-For header. Default: true. */
  trustProxy?: boolean;
}

const SESSION_MAX_AGE_DEFAULT = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Create a configured Better Auth instance.
 *
 * Better Auth manages:
 * - Password hashing with bcrypt (10 rounds)
 * - Session token generation (JWT signed with jwtSecret)
 * - Token refresh logic
 * - CSRF protection for cookie-based auth
 */
export function createAuth(config: AuthConfig) {
  const auth = betterAuth({
    database: {
      type: 'postgres',
      url: config.databaseUrl,
    },
    secret: config.jwtSecret,
    baseURL: config.baseUrl,
    trustedOrigins: [config.baseUrl],
    session: {
      expiresIn: config.sessionMaxAge ?? SESSION_MAX_AGE_DEFAULT,
      updateAge: 60 * 60, // Refresh session if older than 1 hour
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Can be enabled later when email service is ready
      autoSignIn: true,
    },
    advanced: {
      generateId: undefined, // Use default (nanoid)
    },
  });

  return auth;
}

/**
 * Map a raw database user record to the AuthUser type.
 */
export function mapToAuthUser(raw: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenant_id: string | null;
  email_verified?: boolean;
  last_login_at: Date | null;
  created_at: Date;
}): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    role: (raw.role as UserRole) || AUTH_ROLES.CLIENT_USER,
    tenantId: raw.tenant_id,
    emailVerified: raw.email_verified ?? false,
    lastLoginAt: raw.last_login_at,
    createdAt: raw.created_at,
  };
}

/**
 * Map a raw database session record to the Session type.
 */
export function mapToSession(raw: {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  ip_address: string | null;
  user_agent: string | null;
}): Session {
  return {
    id: raw.id,
    userId: raw.user_id,
    token: raw.token,
    expiresAt: raw.expires_at,
    createdAt: raw.created_at,
    ipAddress: raw.ip_address,
    userAgent: raw.user_agent,
  };
}

export type { AuthUser, Session, UserRole };
