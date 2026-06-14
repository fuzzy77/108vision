/**
 * Google OAuth2 — Authentication for Gmail and Google Calendar APIs.
 *
 * Flow:
 * 1. Start local HTTP server on port 8108 (or next available)
 * 2. Build authorization URL and open browser
 * 3. Wait for callback with authorization code
 * 4. Exchange code for access + refresh tokens
 * 5. Persist tokens to ~/.108ai/integrations/google.json
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { URL, URLSearchParams } from 'node:url';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix timestamp in milliseconds when the access token expires. */
  expiresAt: number;
  scope: string;
  /** The authenticated user's Gmail address. */
  email: string;
}

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

/** Shape returned by Google's token endpoint. */
interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const INTEGRATIONS_DIR = join(homedir(), '.108ai', 'integrations');
const GOOGLE_TOKEN_PATH = join(INTEGRATIONS_DIR, 'google.json');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Port to try first for the OAuth callback server. */
const PREFERRED_CALLBACK_PORT = 8108;

/** 5-minute buffer before considering a token expired (matches auth.ts pattern). */
const EXPIRY_BUFFER_MS = 5 * 60 * 1_000;

/** Browser auth timeout: 2 minutes. */
const AUTH_TIMEOUT_MS = 120_000;

/**
 * Default scopes covering Gmail read/send/modify and Google Calendar read/write.
 */
export const DEFAULT_GOOGLE_SCOPES: string[] = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

// ─────────────────────────────────────────────
// Token storage
// ─────────────────────────────────────────────

/** Load saved tokens from disk. Returns null if not found or unparseable. */
export function loadGoogleTokens(): GoogleTokens | null {
  if (!existsSync(GOOGLE_TOKEN_PATH)) {
    return null;
  }
  try {
    const raw = readFileSync(GOOGLE_TOKEN_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (!isGoogleTokens(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Persist tokens to ~/.108ai/integrations/google.json. Creates directory if needed. */
export function saveGoogleTokens(tokens: GoogleTokens): void {
  if (!existsSync(INTEGRATIONS_DIR)) {
    mkdirSync(INTEGRATIONS_DIR, { recursive: true });
  }
  writeFileSync(GOOGLE_TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
}

/** Delete persisted tokens. Silently ignores missing file. */
export function removeGoogleTokens(): void {
  if (existsSync(GOOGLE_TOKEN_PATH)) {
    unlinkSync(GOOGLE_TOKEN_PATH);
  }
}

// ─────────────────────────────────────────────
// Token checks
// ─────────────────────────────────────────────

/** Returns true if the access token is expired (or will expire within 5 minutes). */
export function isGoogleTokenExpired(tokens: GoogleTokens): boolean {
  return Date.now() > tokens.expiresAt - EXPIRY_BUFFER_MS;
}

// ─────────────────────────────────────────────
// Token refresh
// ─────────────────────────────────────────────

/**
 * Refresh an expired access token using the stored refresh token.
 * Updates and persists tokens on success.
 * Removes persisted tokens and throws if the refresh grant is revoked.
 */
export async function refreshGoogleToken(
  config: GoogleAuthConfig,
  refreshToken: string,
): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    // Refresh token revoked or invalid — clean up stored tokens
    removeGoogleTokens();
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Google token refresh failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as GoogleTokenResponse;

  // Refresh responses do not include a new refresh_token — keep the existing one.
  // They also do not include id_token, so preserve the existing email.
  const existing = loadGoogleTokens();
  const email = existing?.email ?? '';

  const tokens: GoogleTokens = {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: Date.now() + data.expires_in * 1_000,
    scope: data.scope,
    email,
  };

  saveGoogleTokens(tokens);
  return tokens;
}

// ─────────────────────────────────────────────
// Browser OAuth2 flow
// ─────────────────────────────────────────────

/**
 * Authenticate via the browser-based OAuth2 flow.
 *
 * Opens the user's default browser to the Google consent screen and waits for
 * the authorization code callback on a local HTTP server.
 *
 * @param config   OAuth2 client credentials and requested scopes.
 * @param timeoutMs  Maximum time to wait for the browser callback (default: 120 s).
 */
export async function authenticateGoogle(
  config: GoogleAuthConfig,
  timeoutMs = AUTH_TIMEOUT_MS,
): Promise<GoogleTokens> {
  return new Promise((resolve, reject) => {
    // Keepalive — prevents Bun compiled binary event loop from exiting
    const keepAlive = setInterval(() => {}, 500);

    const state = randomBytes(16).toString('hex');
    let callbackPort: number | null = null;

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? '/', `http://localhost`);

      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const error = url.searchParams.get('error');
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage(`Google authorization denied: ${error}`));
        cleanup();
        reject(new Error(`Google OAuth error: ${error}`));
        return;
      }

      // CSRF — validate state parameter
      if (returnedState !== state) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage('Invalid state parameter — possible CSRF attack.'));
        cleanup();
        reject(new Error('Google OAuth: state mismatch (CSRF check failed)'));
        return;
      }

      if (!code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage('Missing authorization code in callback.'));
        cleanup();
        reject(new Error('Google OAuth callback missing authorization code'));
        return;
      }

      // Exchange authorization code for tokens asynchronously
      const redirectUri = buildRedirectUri(callbackPort!);
      exchangeCodeForTokens(config, code, redirectUri)
        .then((tokens) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(successPage(tokens.email));
          cleanup();
          saveGoogleTokens(tokens);
          resolve(tokens);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(errorPage(message));
          cleanup();
          reject(err instanceof Error ? err : new Error(message));
        });
    });

    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timeout);
      clearInterval(keepAlive);
      server.close();
    };

    // Try preferred port first; fall back to OS-assigned port on conflict
    server.listen(PREFERRED_CALLBACK_PORT, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        cleanup();
        reject(new Error('Failed to determine local callback server address'));
        return;
      }

      callbackPort = address.port;
      const redirectUri = buildRedirectUri(callbackPort);
      const authUrl = buildAuthUrl(config, redirectUri, state);

      process.stdout.write(
        `  \x1b[90m   Google auth callback server listening on port ${callbackPort}\x1b[0m\n`,
      );

      // Dynamic import of `open` — avoids bundling issues on Windows
      import('open')
        .then(({ default: openBrowser }) => openBrowser(authUrl))
        .catch(() => {
          process.stdout.write('\n');
          process.stdout.write(
            `  \x1b[33m[!] Cannot open browser automatically. Visit this URL:\x1b[0m\n`,
          );
          process.stdout.write(`  \x1b[36m    ${authUrl}\x1b[0m\n`);
          process.stdout.write('\n');
        });

      timeout = setTimeout(() => {
        cleanup();
        reject(
          new Error(`Google auth timeout: no callback received after ${timeoutMs / 1_000}s`),
        );
      }, timeoutMs);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      // EADDRINUSE: preferred port taken — retry on any free port
      if (err.code === 'EADDRINUSE') {
        server.listen(0, '127.0.0.1');
        return;
      }
      cleanup();
      reject(new Error(`Google auth server error: ${err.message}`));
    });
  });
}

// ─────────────────────────────────────────────
// High-level helper
// ─────────────────────────────────────────────

/**
 * Return a valid access token.
 *
 * - If no tokens are stored, returns null (caller should invoke `authenticateGoogle`).
 * - If tokens are not expired, returns the stored access token immediately.
 * - If tokens are expired, attempts a refresh; returns null if refresh fails.
 */
export async function getValidAccessToken(config: GoogleAuthConfig): Promise<string | null> {
  const tokens = loadGoogleTokens();
  if (!tokens) {
    return null;
  }

  if (!isGoogleTokenExpired(tokens)) {
    return tokens.accessToken;
  }

  try {
    const refreshed = await refreshGoogleToken(config, tokens.refreshToken);
    return refreshed.accessToken;
  } catch {
    // Refresh failed (token revoked) — tokens already removed by refreshGoogleToken
    return null;
  }
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

function buildRedirectUri(port: number): string {
  return `http://127.0.0.1:${port}/callback`;
}

function buildAuthUrl(config: GoogleAuthConfig, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(
  config: GoogleAuthConfig,
  code: string,
  redirectUri: string,
): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Google token exchange failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as GoogleTokenResponse;

  if (!data.refresh_token) {
    throw new Error(
      'Google did not return a refresh_token. ' +
        'Ensure access_type=offline and prompt=consent are set.',
    );
  }

  const email = extractEmailFromIdToken(data.id_token);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1_000,
    scope: data.scope,
    email,
  };
}

/**
 * Decode a JWT id_token payload and extract the `email` claim.
 *
 * This is a structural decode only — no signature verification.
 * We trust Google's HTTPS endpoint for authenticity.
 */
function extractEmailFromIdToken(idToken: string | undefined): string {
  if (!idToken) {
    return '';
  }

  try {
    const parts = idToken.split('.');
    // JWT must have exactly three parts: header.payload.signature
    if (parts.length !== 3) {
      return '';
    }

    const payloadPart = parts[1];
    if (!payloadPart) {
      return '';
    }

    // Base64url → base64 → JSON
    const padded = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    const payload = JSON.parse(json) as Record<string, unknown>;

    return typeof payload['email'] === 'string' ? payload['email'] : '';
  } catch {
    return '';
  }
}

/** Type guard for a stored token object. */
function isGoogleTokens(value: unknown): value is GoogleTokens {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['accessToken'] === 'string' &&
    typeof v['refreshToken'] === 'string' &&
    typeof v['expiresAt'] === 'number' &&
    typeof v['scope'] === 'string' &&
    typeof v['email'] === 'string'
  );
}

// ─────────────────────────────────────────────
// HTML pages shown in the browser
// ─────────────────────────────────────────────

function successPage(email: string): string {
  const displayEmail = email
    ? `<p class="email">${escapeHtml(email)}</p>`
    : '';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>108 AI — Google Connected</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
  .card { text-align: center; padding: 3rem; background: white; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px; }
  .icon { font-size: 3rem; margin-bottom: 1rem; color: #059669; }
  h1 { color: #059669; font-size: 1.25rem; margin: 0 0 0.5rem; }
  p { color: #64748b; font-size: 0.875rem; margin: 0.25rem 0 0; }
  .email { font-weight: 600; color: #334155; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">&#10004;</div>
  <h1>Google account connected</h1>
  ${displayEmail}
  <p>You can close this window. The Desktop Agent is now authorized.</p>
</div>
</body>
</html>`;
}

function errorPage(error: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>108 AI — Google Auth Error</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
  .card { text-align: center; padding: 3rem; background: white; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px; }
  .icon { font-size: 3rem; margin-bottom: 1rem; color: #dc2626; }
  h1 { color: #dc2626; font-size: 1.25rem; margin: 0 0 0.5rem; }
  p { color: #64748b; font-size: 0.875rem; margin: 0; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">&#10008;</div>
  <h1>Google authentication failed</h1>
  <p>${escapeHtml(error)}</p>
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
