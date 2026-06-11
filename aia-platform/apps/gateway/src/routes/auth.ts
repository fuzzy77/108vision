import { Hono } from 'hono';
import { z } from 'zod';
import { AppError } from '@aia/shared';
import { AUTH_ROLES, type AuthUser } from '@aia/auth';
import * as jose from 'jose';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { getEnv } from '../lib/env.js';
import { getDb } from '../lib/db.js';
import { users, invitations, sessions, passwordResetTokens } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddlewareV2 } from '../middleware/auth-v2.js';

const auth = new Hono();

// --- Zod Schemas ---

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(255),
  inviteToken: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  name: z.string().min(1, 'Name is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// --- Constants ---

const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const BCRYPT_ROUNDS = 10;

// --- Helper Functions ---

async function createSessionToken(user: {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
  name: string | null;
}): Promise<{ token: string; expiresAt: Date }> {
  const env = getEnv();
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_EXPIRY_SECONDS;

  const token = await new jose.SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? '',
    name: user.name ?? undefined,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setIssuer('aia-platform')
    .setAudience('aia-platform')
    .sign(secret);

  return {
    token,
    expiresAt: new Date(exp * 1000),
  };
}

function setSessionCookie(c: any, token: string, expiresAt: Date): void {
  const env = getEnv();
  const secure = env.NODE_ENV === 'production';
  const sameSite = secure ? 'Strict' : 'Lax';
  c.header(
    'Set-Cookie',
    `aia_session=${token}; HttpOnly; Path=/; Expires=${expiresAt.toUTCString()}; SameSite=${sameSite}${secure ? '; Secure' : ''}`,
  );
}

function clearSessionCookie(c: any): void {
  c.header(
    'Set-Cookie',
    'aia_session=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
  );
}

async function storeSession(
  db: ReturnType<typeof getDb>,
  userId: string,
  token: string,
  expiresAt: Date,
  c: any,
): Promise<void> {
  const ipAddress =
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
    c.req.header('X-Real-IP') ||
    null;
  const userAgent = c.req.header('User-Agent') || null;

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  });
}

function buildAuthUserResponse(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenantId: string | null;
  createdAt: Date | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AuthUser['role'],
    tenantId: user.tenantId,
    emailVerified: true,
    lastLoginAt: new Date(),
    createdAt: user.createdAt ?? new Date(),
  };
}

// --- Routes ---

/**
 * POST /api/auth/login — Authenticate with email + password.
 *
 * Returns a JWT session token (also set as httpOnly cookie for dashboard use).
 */
auth.post('/login', async (c) => {
  const body = loginSchema.parse(await c.req.json());

  const db = getDb();
  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email.toLowerCase()))
    .limit(1);

  if (userRecords.length === 0) {
    throw new AppError(
      'AUTH_INVALID_CREDENTIALS',
      'Invalid email or password.',
      401,
    );
  }

  const user = userRecords[0]!;

  if (!user.passwordHash) {
    throw new AppError(
      'AUTH_NO_PASSWORD',
      'This account does not have a password set. Use the invitation link to set one.',
      401,
    );
  }

  const passwordValid = await bcrypt.compare(body.password, user.passwordHash);

  if (!passwordValid) {
    throw new AppError(
      'AUTH_INVALID_CREDENTIALS',
      'Invalid email or password.',
      401,
    );
  }

  // Update last_login_at
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  // Create session token
  const session = await createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    name: user.name,
  });

  // Also set as cookie for browser-based clients
  setSessionCookie(c, session.token, session.expiresAt);

  // Store session in DB for tracking/revocation
  await storeSession(db, user.id, session.token, session.expiresAt, c);

  return c.json({
    success: true,
    user: buildAuthUserResponse(user),
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
  });
});

/**
 * POST /api/auth/register — Create a new account.
 *
 * Only allowed for:
 * - Users with a valid invite token (invited by admin)
 * - Initial platform setup (if no users exist yet)
 */
auth.post('/register', async (c) => {
  const body = registerSchema.parse(await c.req.json());
  const db = getDb();

  let role: string = AUTH_ROLES.CLIENT_USER;
  let tenantId: string | null = null;

  if (body.inviteToken) {
    // Validate invitation
    const inviteRecords = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.token, body.inviteToken),
          eq(invitations.status, 'pending'),
        ),
      )
      .limit(1);

    if (inviteRecords.length === 0) {
      throw new AppError(
        'INVITE_INVALID',
        'Invalid or expired invitation token.',
        400,
      );
    }

    const invite = inviteRecords[0]!;

    // Check if invitation email matches
    if (invite.email.toLowerCase() !== body.email.toLowerCase()) {
      throw new AppError(
        'INVITE_EMAIL_MISMATCH',
        'Email does not match the invitation.',
        400,
      );
    }

    role = invite.role;
    tenantId = invite.tenantId;

    // Mark invitation as accepted
    await db
      .update(invitations)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(invitations.id, invite.id));
  } else {
    // Check if this is the initial setup (no users exist)
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .limit(1);

    if (existingUsers.length > 0) {
      throw new AppError(
        'REGISTRATION_DISABLED',
        'Registration is only available via invitation. Contact your administrator.',
        403,
      );
    }

    // First user becomes platform admin (consultant)
    role = AUTH_ROLES.CONSULTANT;
    tenantId = null;
  }

  // Check if email already exists
  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, body.email.toLowerCase()))
    .limit(1);

  if (existingEmail.length > 0) {
    throw new AppError(
      'EMAIL_EXISTS',
      'An account with this email already exists.',
      409,
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

  // Create user
  const newUser = await db
    .insert(users)
    .values({
      email: body.email.toLowerCase(),
      passwordHash,
      name: body.name,
      role,
      tenantId,
      lastLoginAt: new Date(),
    })
    .returning();

  const createdUser = newUser[0]!;

  // Create session token
  const session = await createSessionToken({
    id: createdUser.id,
    email: createdUser.email,
    role: createdUser.role,
    tenantId: createdUser.tenantId,
    name: createdUser.name,
  });

  setSessionCookie(c, session.token, session.expiresAt);
  await storeSession(db, createdUser.id, session.token, session.expiresAt, c);

  return c.json({
    success: true,
    user: buildAuthUserResponse(createdUser),
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
  }, 201);
});

/**
 * POST /api/auth/logout — Invalidate the current session.
 */
auth.post('/logout', authMiddlewareV2, async (c) => {
  const userId = c.get('userId') as string;

  // Delete all sessions for this user
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));

  clearSessionCookie(c);

  return c.json({ message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me — Get current user information.
 */
auth.get('/me', authMiddlewareV2, async (c) => {
  const user = c.get('user') as AuthUser;

  // Re-extract the token to return it
  const authHeader = c.req.header('Authorization');
  let token = '';
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    const cookieHeader = c.req.header('Cookie');
    const match = cookieHeader?.match(/aia_session=([^;]+)/);
    if (match) {
      token = match[1] || '';
    }
  }

  return c.json({ user, token });
});

/**
 * POST /api/auth/refresh — Refresh an expiring session token.
 *
 * Issues a new token if the current one is valid.
 */
auth.post('/refresh', authMiddlewareV2, async (c) => {
  const user = c.get('user') as AuthUser;

  // Create a fresh session token
  const session = await createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    name: user.name,
  });

  setSessionCookie(c, session.token, session.expiresAt);

  // Replace old sessions with the new one
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await storeSession(db, user.id, session.token, session.expiresAt, c);

  return c.json({
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
  });
});

/**
 * POST /api/auth/forgot-password — Request a password reset.
 *
 * Generates a reset token. In production, this would send an email.
 * Currently returns the token in the response for development purposes.
 */
auth.post('/forgot-password', async (c) => {
  const body = forgotPasswordSchema.parse(await c.req.json());
  const db = getDb();

  const userRecords = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, body.email.toLowerCase()))
    .limit(1);

  // Always return success to avoid email enumeration
  if (userRecords.length === 0) {
    return c.json({
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  }

  const user = userRecords[0]!;
  const resetToken = nanoid(48);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  // Delete any existing reset tokens for this user, then insert new one
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token: resetToken,
    expiresAt,
  });

  // In production: send email with reset link
  // For development: include token in response
  const env = getEnv();
  const responseData: Record<string, string> = {
    message: 'If an account with this email exists, a password reset link has been sent.',
  };

  if (env.NODE_ENV === 'development') {
    responseData.resetToken = resetToken;
    responseData.resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
  }

  return c.json(responseData);
});

/**
 * POST /api/auth/reset-password — Reset password with a valid token.
 */
auth.post('/reset-password', async (c) => {
  const body = resetPasswordSchema.parse(await c.req.json());
  const db = getDb();

  // Find valid reset token
  const tokenRecords = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, body.token))
    .limit(1);

  if (tokenRecords.length === 0) {
    throw new AppError(
      'RESET_TOKEN_INVALID',
      'Invalid or expired reset token.',
      400,
    );
  }

  const tokenRecord = tokenRecords[0]!;

  if (tokenRecord.expiresAt < new Date()) {
    // Clean up expired token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, tokenRecord.id));
    throw new AppError(
      'RESET_TOKEN_EXPIRED',
      'Reset token has expired. Please request a new one.',
      400,
    );
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS);

  // Update user password
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, tokenRecord.userId));

  // Delete all reset tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, tokenRecord.userId));

  // Invalidate all existing sessions (force re-login with new password)
  await db.delete(sessions).where(eq(sessions.userId, tokenRecord.userId));

  return c.json({
    message: 'Password reset successfully. Please log in with your new password.',
  });
});

/**
 * POST /api/auth/accept-invite — Accept an invitation and set password.
 *
 * Creates the user account and starts a session.
 */
auth.post('/accept-invite', async (c) => {
  const body = acceptInviteSchema.parse(await c.req.json());
  const db = getDb();

  // Find the invitation
  const inviteRecords = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.token, body.token),
        eq(invitations.status, 'pending'),
      ),
    )
    .limit(1);

  if (inviteRecords.length === 0) {
    throw new AppError(
      'INVITE_INVALID',
      'Invalid or expired invitation. Contact your administrator for a new invite.',
      400,
    );
  }

  const invite = inviteRecords[0]!;

  // Check if email already has an account
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, invite.email.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    // Mark invite as accepted but error — user should log in instead
    await db
      .update(invitations)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(invitations.id, invite.id));

    throw new AppError(
      'EMAIL_EXISTS',
      'An account with this email already exists. Please log in instead.',
      409,
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

  // Create user
  const newUser = await db
    .insert(users)
    .values({
      email: invite.email.toLowerCase(),
      passwordHash,
      name: body.name,
      role: invite.role,
      tenantId: invite.tenantId,
      lastLoginAt: new Date(),
    })
    .returning();

  const createdUser = newUser[0]!;

  // Mark invitation as accepted
  await db
    .update(invitations)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(invitations.id, invite.id));

  // Create session
  const session = await createSessionToken({
    id: createdUser.id,
    email: createdUser.email,
    role: createdUser.role,
    tenantId: createdUser.tenantId,
    name: createdUser.name,
  });

  setSessionCookie(c, session.token, session.expiresAt);
  await storeSession(db, createdUser.id, session.token, session.expiresAt, c);

  return c.json({
    success: true,
    user: buildAuthUserResponse(createdUser),
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
  }, 201);
});

export { auth };
