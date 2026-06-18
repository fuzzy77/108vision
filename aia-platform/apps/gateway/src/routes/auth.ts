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
import { eq, and, gt } from 'drizzle-orm';
import { createHash } from 'crypto';
import { authMiddlewareV2 } from '../middleware/auth-v2.js';
import { emailService } from '../services/email.service.js';

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
  emailVerified?: boolean | null;
  lastLoginAt?: Date | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AuthUser['role'],
    tenantId: user.tenantId,
    emailVerified: user.emailVerified ?? false,
    lastLoginAt: user.lastLoginAt ?? new Date(),
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
  // Cooldown: don't generate a new token if one was created in the last 5 minutes
  const recentToken = await db.select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.userId, user.id),
      gt(passwordResetTokens.createdAt, new Date(Date.now() - 5 * 60 * 1000))
    ))
    .limit(1);

  if (recentToken.length > 0) {
    // Return success without generating new token (prevents token rotation attack)
    return c.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
  }

  const resetToken = nanoid(48);
  const tokenHash = createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  // Delete any existing reset tokens for this user, then insert new one
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token: tokenHash,
    expiresAt,
  });

  const env = getEnv();

  await emailService.sendPasswordReset(user.email, resetToken);

  const responseData: Record<string, string> = {
    message: 'If an account with this email exists, a password reset link has been sent.',
  };

  if (env.NODE_ENV === 'development') {
    responseData.resetToken = resetToken;
    responseData.resetUrl = `${env.APP_URL}/auth/reset-password?token=${resetToken}`;
  }

  return c.json(responseData);
});

/**
 * POST /api/auth/reset-password — Reset password with a valid token.
 */
auth.post('/reset-password', async (c) => {
  const body = resetPasswordSchema.parse(await c.req.json());
  const db = getDb();

  // Hash the incoming token before lookup (tokens are stored as SHA-256 hashes)
  const lookupHash = createHash('sha256').update(body.token).digest('hex');

  // Find valid reset token
  const tokenRecords = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, lookupHash))
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

/**
 * GET /api/auth/desktop-agent — Desktop Agent OAuth login page.
 *
 * The Desktop Agent opens this URL in the user's browser with a redirect_uri
 * pointing to its local callback server (e.g., http://127.0.0.1:PORT/callback).
 * After the user logs in, we redirect back with the token as query params.
 *
 * Flow: Agent opens browser → this page → user enters credentials → redirect to agent callback.
 */
auth.get('/desktop-agent', async (c) => {
  const redirectUri = c.req.query('redirect_uri');

  if (!redirectUri) {
    return c.html(`<!DOCTYPE html>
<html><head><title>108 AI — Errore</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}.card{text-align:center;padding:3rem;background:white;border-radius:1rem;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:400px}h1{color:#dc2626;font-size:1.25rem}p{color:#64748b}</style>
</head><body><div class="card"><h1>Parametro mancante</h1><p>redirect_uri non fornito. Riavvia il Desktop Agent.</p></div></body></html>`, 400);
  }

  // Validate redirect_uri is localhost (security: only allow local callbacks)
  try {
    const url = new URL(redirectUri);
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      return c.html(`<!DOCTYPE html>
<html><head><title>108 AI — Errore</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}.card{text-align:center;padding:3rem;background:white;border-radius:1rem;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:400px}h1{color:#dc2626;font-size:1.25rem}p{color:#64748b}</style>
</head><body><div class="card"><h1>Redirect non consentito</h1><p>Il redirect_uri deve puntare a localhost.</p></div></body></html>`, 400);
    }
  } catch {
    return c.html(`<!DOCTYPE html>
<html><head><title>108 AI — Errore</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}.card{text-align:center;padding:3rem;background:white;border-radius:1rem;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:400px}h1{color:#dc2626;font-size:1.25rem}p{color:#64748b}</style>
</head><body><div class="card"><h1>URL non valido</h1><p>redirect_uri non valido.</p></div></body></html>`, 400);
  }

  // Render login page with embedded form
  return c.html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>108 AI — Login Desktop Agent</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,.08); padding: 2.5rem; width: 100%; max-width: 380px; }
    .logo { text-align: center; margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .logo span { color: #059669; }
    .subtitle { text-align: center; color: #64748b; font-size: 0.875rem; margin-bottom: 2rem; }
    label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; }
    input { width: 100%; padding: 0.625rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.875rem; margin-bottom: 1rem; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
    button { width: 100%; padding: 0.75rem; background: #059669; color: white; border: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #047857; }
    button:disabled { background: #9ca3af; cursor: not-allowed; }
    .error { background: #fef2f2; color: #dc2626; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.8rem; margin-bottom: 1rem; display: none; }
    .info { text-align: center; color: #94a3b8; font-size: 0.75rem; margin-top: 1.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">108 <span>AI</span></div>
    <div class="subtitle">Accedi per connettere il Desktop Agent</div>
    <div class="error" id="error"></div>
    <form id="loginForm">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required autocomplete="email" autofocus>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required autocomplete="current-password">
      <button type="submit" id="submitBtn">Accedi</button>
    </form>
    <div class="info">Il token viene inviato in modo sicuro al Desktop Agent locale.</div>
  </div>
  <script>
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('error');
    const submitBtn = document.getElementById('submitBtn');
    const redirectUri = ${JSON.stringify(redirectUri)};

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Accesso in corso...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.detail || data.error?.message || 'Credenziali non valide');
        }

        // Redirect back to Desktop Agent with token
        const params = new URLSearchParams({
          token: data.token,
          tenant_id: data.user.tenantId || '',
          expires_at: String(new Date(data.expiresAt).getTime()),
        });

        window.location.href = redirectUri + '?' + params.toString();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Accedi';
      }
    });
  </script>
</body>
</html>`);
});

export { auth };
