import { createServer, type Server } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildUiApiSnapshot } from './api.js';
import { setActivePersona } from '../agents/switcher.js';
import { startMcpServer } from '../mcp/manager.js';
import { installStoreItem } from './store/installer.js';

const DEFAULT_PORT = 7891;
let server: Server | null = null;
let currentPort = DEFAULT_PORT;

function webDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), 'web');
}

function readWebFile(name: string): string {
  const path = join(webDir(), name);
  if (!existsSync(path)) return `/* missing ${name} */`;
  return readFileSync(path, 'utf-8');
}

function json(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

async function handleApi(
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
  pathname: string,
  searchParams: URLSearchParams,
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (pathname === '/api/snapshot' && req.method === 'GET') {
    const q = searchParams.get('q') ?? '';
    const type = searchParams.get('type') ?? 'all';
    json(res, 200, buildUiApiSnapshot(q, type));
    return;
  }

  if (pathname === '/api/agent/use' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const { name } = JSON.parse(body) as { name?: string };
      if (!name) {
        json(res, 400, { error: 'name required' });
        return;
      }
      const result = setActivePersona(name);
      json(res, result.ok ? 200 : 400, result);
    } catch {
      json(res, 400, { error: 'invalid json' });
    }
    return;
  }

  if (pathname === '/api/mcp/start' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const { name } = JSON.parse(body) as { name?: string };
      if (!name) {
        json(res, 400, { error: 'name required' });
        return;
      }
      await startMcpServer(name);
      json(res, 200, { ok: true, name });
    } catch (err) {
      json(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  if (pathname === '/api/store/install' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const { itemId, force } = JSON.parse(body) as { itemId?: string; force?: boolean };
      if (!itemId) {
        json(res, 400, { error: 'itemId required' });
        return;
      }
      const result = await installStoreItem(itemId, { force: force === true });
      json(res, result.ok ? 200 : 400, result);
    } catch (err) {
      json(res, 500, { error: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  json(res, 404, { error: 'not found' });
}

export function getUiServerUrl(): string {
  return `http://127.0.0.1:${currentPort}`;
}

export function isUiServerRunning(): boolean {
  return server !== null;
}

export async function startUiServer(port = DEFAULT_PORT): Promise<string> {
  if (server) return getUiServerUrl();

  currentPort = port;

  server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', getUiServerUrl());
    const pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname, url.searchParams);
      return;
    }

    const fileMap: Record<string, string> = {
      '/': 'index.html',
      '/index.html': 'index.html',
      '/app.js': 'app.js',
      '/styles.css': 'styles.css',
    };

    const file = fileMap[pathname];
    if (!file) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const content = readWebFile(file);
    const type =
      file.endsWith('.html') ? 'text/html' :
      file.endsWith('.js') ? 'application/javascript' :
      'text/css';

    res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
    res.end(content);
  });

  await new Promise<void>((resolve, reject) => {
    server!.listen(port, '127.0.0.1', () => resolve());
    server!.on('error', reject);
  });

  return getUiServerUrl();
}

export async function stopUiServer(): Promise<void> {
  if (!server) return;
  await new Promise<void>((resolve) => {
    server!.close(() => resolve());
  });
  server = null;
}
