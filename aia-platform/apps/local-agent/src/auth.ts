/**
 * OAuth Authentication — Browser-based login for the Desktop Agent.
 *
 * Flow:
 * 1. Start ephemeral HTTP server on random port
 * 2. Open browser to gateway /auth/desktop-agent?redirect_uri=...
 * 3. User authenticates in browser
 * 4. Gateway redirects back with token
 * 5. Agent stores token in config
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import open from 'open';

export interface AuthResult {
  token: string;
  tenantId: string;
  expiresAt: number;
}

/**
 * Perform browser-based OAuth login.
 * Opens the user's default browser and waits for the callback.
 *
 * @param gatewayBaseUrl - Base HTTP(S) URL of the gateway (e.g., https://api.108ai.dev)
 * @param timeoutMs - Max time to wait for callback (default: 120s)
 */
export async function performBrowserLogin(
  gatewayBaseUrl: string,
  timeoutMs = 120_000,
): Promise<AuthResult> {
  return new Promise((resolve, reject) => {
    // Keepalive interval — ensures the event loop stays active in Bun compiled binaries
    const keepAlive = setInterval(() => {}, 500);

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? '/', `http://localhost`);

      process.stdout.write(`  \x1b[90m<- Callback ricevuto: ${url.pathname}\x1b[0m\n`);

      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const token = url.searchParams.get('token');
      const tenantId = url.searchParams.get('tenant_id');
      const expiresAt = url.searchParams.get('expires_at');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage(error));
        cleanup();
        reject(new Error(`Authentication failed: ${error}`));
        return;
      }

      if (!token || !tenantId) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(errorPage('Missing token or tenant_id in callback'));
        cleanup();
        reject(new Error('Invalid callback: missing token or tenant_id'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(successPage());

      cleanup();
      resolve({
        token,
        tenantId,
        expiresAt: expiresAt ? parseInt(expiresAt, 10) : Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
    });

    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timeout);
      clearInterval(keepAlive);
      server.close();
    };

    // Listen on 0.0.0.0 (all interfaces) to avoid Windows loopback issues
    server.listen(0, '0.0.0.0', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        cleanup();
        reject(new Error('Failed to start local auth server'));
        return;
      }

      const port = address.port;
      const redirectUri = `http://127.0.0.1:${port}/callback`;
      const loginUrl = `${gatewayBaseUrl}/api/auth/desktop-agent?redirect_uri=${encodeURIComponent(redirectUri)}`;

      process.stdout.write(`  \x1b[90m   Callback server in ascolto su porta ${port}\x1b[0m\n`);

      open(loginUrl).catch(() => {
        process.stdout.write('\n');
        process.stdout.write(`  \x1b[33m[!] Non riesco ad aprire il browser. Apri questo URL manualmente:\x1b[0m\n`);
        process.stdout.write(`  \x1b[36m    ${loginUrl}\x1b[0m\n`);
        process.stdout.write('\n');
      });

      timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout: nessuna risposta dal browser dopo ${timeoutMs / 1000}s`));
      }, timeoutMs);
    });

    server.on('error', (err) => {
      cleanup();
      reject(new Error(`Auth server error: ${err.message}`));
    });
  });
}

/**
 * Convert a WebSocket gateway URL to an HTTP base URL.
 * wss://api.108ai.dev/ws/local-agent → https://api.108ai.dev
 * ws://localhost:3000/ws/local-agent → http://localhost:3000
 */
export function gatewayWsToHttp(wsUrl: string): string {
  return wsUrl
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/ws\/local-agent\/?$/, '');
}

function successPage(): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>108 AI - Autenticazione completata</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
  .card { text-align: center; padding: 3rem; background: white; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 400px; }
  .icon { font-size: 3rem; margin-bottom: 1rem; color: #059669; }
  h1 { color: #059669; font-size: 1.25rem; margin: 0 0 0.5rem; }
  p { color: #64748b; font-size: 0.875rem; margin: 0; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">&#10004;</div>
  <h1>Autenticazione completata</h1>
  <p>Puoi chiudere questa finestra. Il Desktop Agent &#232; ora connesso.</p>
</div>
</body>
</html>`;
}

function errorPage(error: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>108 AI - Errore autenticazione</title>
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
  <h1>Errore di autenticazione</h1>
  <p>${error}</p>
</div>
</body>
</html>`;
}
