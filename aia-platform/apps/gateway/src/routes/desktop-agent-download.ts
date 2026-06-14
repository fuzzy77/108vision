/**
 * Desktop Agent Download routes.
 *
 * Public (no auth required) — the user downloads the binary BEFORE logging in.
 * Serves pre-built executables from the file system or redirects to external storage.
 *
 * Mounted at: /api/desktop-agent
 */

import { Hono } from 'hono';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';

const desktopAgentDownload = new Hono();

const AGENT_VERSION = '0.3.0';

const AVAILABLE_BINARIES: Record<string, { filename: string; os: string; arch: string; contentType: string }> = {
  '108ai-agent.exe': { filename: '108ai-agent.exe', os: 'windows', arch: 'x64', contentType: 'application/octet-stream' },
  '108ai-agent-macos-x64': { filename: '108ai-agent-macos-x64', os: 'macos', arch: 'x64', contentType: 'application/octet-stream' },
  '108ai-agent-macos-arm64': { filename: '108ai-agent-macos-arm64', os: 'macos', arch: 'arm64', contentType: 'application/octet-stream' },
  '108ai-agent-linux': { filename: '108ai-agent-linux', os: 'linux', arch: 'x64', contentType: 'application/octet-stream' },
};

const DIST_DIR = join(process.cwd(), '..', 'local-agent', 'dist', 'bin');

/**
 * GET /api/desktop-agent/releases — List available releases and download links.
 */
desktopAgentDownload.get('/releases', (c) => {
  const host = c.req.header('host') ?? 'localhost:3000';
  const protocol = c.req.header('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const releases = Object.entries(AVAILABLE_BINARIES).map(([key, info]) => {
    const filePath = join(DIST_DIR, info.filename);
    const available = existsSync(filePath);
    const size = available ? statSync(filePath).size : null;

    return {
      filename: key,
      os: info.os,
      arch: info.arch,
      version: AGENT_VERSION,
      available,
      size,
      downloadUrl: `${baseUrl}/api/desktop-agent/download/${key}`,
    };
  });

  return c.json({
    version: AGENT_VERSION,
    releases,
  });
});

/**
 * GET /api/desktop-agent/updates — Check for updates (called by running agents).
 */
desktopAgentDownload.get('/updates', (c) => {
  const currentVersion = c.req.query('version');

  if (currentVersion === AGENT_VERSION) {
    return c.json({ updateAvailable: false, version: AGENT_VERSION });
  }

  const host = c.req.header('host') ?? 'localhost:3000';
  const protocol = c.req.header('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  return c.json({
    updateAvailable: true,
    version: AGENT_VERSION,
    downloads: Object.entries(AVAILABLE_BINARIES).map(([key, info]) => ({
      filename: key,
      os: info.os,
      arch: info.arch,
      url: `${baseUrl}/api/desktop-agent/download/${key}`,
    })),
  });
});

/**
 * GET /api/desktop-agent/download/:filename — Download a specific binary.
 */
desktopAgentDownload.get('/download/:filename', (c) => {
  const filename = c.req.param('filename');

  if (!filename || !AVAILABLE_BINARIES[filename]) {
    return c.json({
      error: {
        code: 'INVALID_BINARY',
        message: `Binary "${filename}" not found. Available: ${Object.keys(AVAILABLE_BINARIES).join(', ')}`,
      },
    }, 404);
  }

  const info = AVAILABLE_BINARIES[filename]!;
  const filePath = join(DIST_DIR, info.filename);

  if (!existsSync(filePath)) {
    return c.json({
      error: {
        code: 'BINARY_NOT_BUILT',
        message: `Binary "${filename}" is not yet available. Run "npm run build:bin" in the local-agent package to build it.`,
      },
    }, 404);
  }

  const stat = statSync(filePath);
  const stream = createReadStream(filePath);
  const readableStream = Readable.toWeb(stream) as ReadableStream;

  return new Response(readableStream, {
    status: 200,
    headers: {
      'Content-Type': info.contentType,
      'Content-Length': stat.size.toString(),
      'Content-Disposition': `attachment; filename="${info.filename}"`,
      'Cache-Control': 'public, max-age=3600',
      'X-Agent-Version': AGENT_VERSION,
    },
  });
});

export { desktopAgentDownload };
