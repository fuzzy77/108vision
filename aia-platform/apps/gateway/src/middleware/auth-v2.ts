import type { Context, Next } from 'hono';
import { AppError } from '@aia/shared';
import { type AuthUser } from '@aia/auth';
import * as jose from 'jose';
import { getEnv } from '../lib/env.js';
import { getDb } from '../lib/db.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Authentication middleware (v2) — Better Auth session validation.
 *
 * Validates the session token from:
 * 1. Authorization: Bearer <token> header (API clients)
 * 2. Cookie: aia_session=<token> (dashboard, SSR)
 *
 * On success, attaches the full AuthUser object to the Hono context:
 * - c.get('user')     → AuthUser
 * - c.get('userId')   → string
 * - c.get('userRole') → UserRole
 *
 * Token format: JWT signed with HS256 using JWT_SECRET.
 * Claims: { sub: userId, email, role, tenantId?, name?, iat, exp }
 */
export async function authMiddlewareV2(c: Context, next: Next): Promise<void | Response> {
  const token = extractToken(c);

  if (!token) {
    throw new AppError(
      'AUTH_REQUIRED',
      'Authentication required. Provide a Bearer token or session cookie.',
      401,
    );
  }

  const env = getEnv();
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  let payload: jose.JWTPayload;

  try {
    const result = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    payload = result.payload;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      throw new AppError('AUTH_TOKEN_EXPIRED', 'Session has expired. Please log in again.', 401);
    }
    if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      throw new AppError('AUTH_TOKEN_INVALID', 'Invalid session token.', 401);
    }
    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      throw new AppError('AUTH_TOKEN_INVALID', 'Token claims validation failed.', 401);
    }
    throw new AppError('AUTH_TOKEN_INVALID', 'Session token is invalid.', 401);
  }

  const userId = payload.sub;

  if (!userId) {
    throw new AppError('AUTH_INVALID_CLAIMS', 'Token missing required subject claim.', 401);
  }

  // Look up user from the database to get the latest role/tenant info.
  // This ensures revoked users are immediately denied access.
  const db = getDb();
  const userRecords = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      tenantId: users.tenantId,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRecords.length === 0) {
    throw new AppError('AUTH_USER_NOT_FOUND', 'Authenticated user no longer exists.', 401);
  }

  const userRecord = userRecords[0]!;

  const authUser: AuthUser = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.role as AuthUser['role'],
    tenantId: userRecord.tenantId,
    emailVerified: true, // If they have a valid session, email is considered verified
    lastLoginAt: userRecord.lastLoginAt,
    createdAt: userRecord.createdAt!,
  };

  // Attach to context
  c.set('user', authUser);
  c.set('userId', authUser.id);
  c.set('userRole', authUser.role);

  // For backwards compatibility with old middleware, also set jwtPayload
  c.set('jwtPayload', {
    sub: authUser.id,
    tenantId: authUser.tenantId ?? '',
    email: authUser.email,
    role: authUser.role,
    name: authUser.name ?? undefined,
    iat: payload.iat,
    exp: payload.exp,
  });

  await next();
}

/**
 * Optional auth middleware — does NOT throw if unauthenticated.
 * Sets user context if token is present and valid, otherwise continues without user.
 * Useful for routes that work for both authenticated and anonymous users.
 */
export async function optionalAuthMiddleware(c: Context, next: Next): Promise<void | Response> {
  const token = extractToken(c);

  if (!token) {
    await next();
    return;
  }

  try {
    await authMiddlewareV2(c, next);
  } catch (error) {
    // Token invalid/expired — continue as unauthenticated
    if (error instanceof AppError && error.statusCode === 401) {
      await next();
      return;
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header or cookie.
 * Priority: header > cookie (API clients typically use header, browsers use cookies).
 */
function extractToken(c: Context): string | null {
  // 1. Authorization header
  const authHeader = c.req.header('Authorization');
  if (authHeader) {
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.slice(7).trim();
    return token || null;
  }

  // 2. Session cookie
  const cookieHeader = c.req.header('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/aia_session=([^;]+)/);
    if (match) {
      return match[1] || null;
    }
  }

  return null;
}
