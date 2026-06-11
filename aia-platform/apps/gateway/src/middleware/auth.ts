import type { Context, Next } from 'hono';
import { AppError } from '@aia/shared';
import * as jose from 'jose';
import { getEnv } from '../lib/env.js';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
  name?: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT authentication middleware.
 * Validates Bearer token from Authorization header.
 * Extracts user information and attaches to context.
 *
 * Currently uses shared secret (HS256). Will be upgraded to OIDC/JWKS later.
 */
export async function authMiddleware(c: Context, next: Next): Promise<void | Response> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    throw new AppError(
      'AUTH_REQUIRED',
      'Authorization header is required',
      401,
    );
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError(
      'AUTH_INVALID_FORMAT',
      'Authorization header must use Bearer scheme',
      401,
    );
  }

  const token = authHeader.slice(7);

  if (!token) {
    throw new AppError(
      'AUTH_TOKEN_MISSING',
      'Bearer token is empty',
      401,
    );
  }

  try {
    const env = getEnv();
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    const jwtPayload: JwtPayload = {
      sub: payload.sub as string,
      tenantId: payload.tenantId as string,
      email: payload.email as string,
      role: payload.role as string,
      name: payload.name as string | undefined,
      iat: payload.iat,
      exp: payload.exp,
    };

    // Validate required claims
    if (!jwtPayload.sub || !jwtPayload.tenantId || !jwtPayload.role) {
      throw new AppError(
        'AUTH_INVALID_CLAIMS',
        'Token missing required claims (sub, tenantId, role)',
        401,
      );
    }

    c.set('jwtPayload', jwtPayload);
    c.set('userId', jwtPayload.sub);
    c.set('userRole', jwtPayload.role);

    await next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof jose.errors.JWTExpired) {
      throw new AppError('AUTH_TOKEN_EXPIRED', 'Token has expired', 401);
    }

    if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      throw new AppError('AUTH_TOKEN_INVALID', 'Token signature is invalid', 401);
    }

    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      throw new AppError('AUTH_TOKEN_INVALID', 'Token claims validation failed', 401);
    }

    throw new AppError('AUTH_TOKEN_INVALID', 'Token is invalid', 401);
  }
}

/**
 * Role guard middleware factory.
 * Restricts access to users with specific roles.
 */
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next): Promise<void | Response> => {
    const userRole = c.get('userRole') as string | undefined;

    if (!userRole || !roles.includes(userRole)) {
      throw new AppError(
        'FORBIDDEN',
        `Access denied. Required roles: ${roles.join(', ')}`,
        403,
      );
    }

    await next();
  };
}
