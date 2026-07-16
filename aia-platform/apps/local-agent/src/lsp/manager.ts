/**
 * LSP Manager — Singleton that manages language server lifecycle.
 *
 * Auto-detects which LSP server to use based on file extension,
 * lazy-starts servers on first use, and provides a simple API for
 * diagnostics, definition, and references.
 */

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LspClient, type LspDiagnostic, type LspLocation } from './client.js';
import { findServerForLanguage, getLanguageId, type LspServerConfig } from './servers.js';

interface ManagedServer {
  client: LspClient;
  config: LspServerConfig;
  rootUri: string;
}

const activeServers = new Map<string, ManagedServer>();

export async function getDiagnostics(
  filePath: string,
  content: string,
  timeoutMs = 5000,
): Promise<LspDiagnostic[]> {
  const client = await getOrStartClient(filePath);
  if (!client) return [];

  const uri = pathToFileURL(resolve(filePath)).href;
  const languageId = getLanguageId(filePath);
  if (!languageId) return [];

  const diagPromise = client.waitForDiagnostics(uri, timeoutMs);
  await client.openDocument(uri, languageId, content);
  const diags = await diagPromise;
  await client.closeDocument(uri);

  return diags;
}

export async function getDefinition(
  filePath: string,
  line: number,
  character: number,
): Promise<LspLocation[]> {
  const client = await getOrStartClient(filePath);
  if (!client) return [];

  const uri = pathToFileURL(resolve(filePath)).href;
  return client.definition(uri, line, character);
}

export async function getReferences(
  filePath: string,
  line: number,
  character: number,
): Promise<LspLocation[]> {
  const client = await getOrStartClient(filePath);
  if (!client) return [];

  const uri = pathToFileURL(resolve(filePath)).href;
  return client.references(uri, line, character);
}

export async function getHover(
  filePath: string,
  line: number,
  character: number,
): Promise<string | null> {
  const client = await getOrStartClient(filePath);
  if (!client) return null;

  const uri = pathToFileURL(resolve(filePath)).href;
  return client.hover(uri, line, character);
}

export async function stopAll(): Promise<void> {
  for (const [key, server] of activeServers) {
    await server.client.stop().catch(() => {});
    activeServers.delete(key);
  }
}

// --- Private ---

async function getOrStartClient(filePath: string): Promise<LspClient | null> {
  const languageId = getLanguageId(filePath);
  if (!languageId) return null;

  const serverConfig = findServerForLanguage(languageId);
  if (!serverConfig) return null;

  const rootUri = detectProjectRoot(filePath, serverConfig.rootMarkers);
  const key = `${serverConfig.id}:${rootUri}`;

  const existing = activeServers.get(key);
  if (existing?.client.isRunning()) {
    return existing.client;
  }

  const client = new LspClient(serverConfig, rootUri);

  try {
    await client.start();
    activeServers.set(key, { client, config: serverConfig, rootUri });
    return client;
  } catch {
    return null;
  }
}

function detectProjectRoot(filePath: string, markers: string[]): string {
  let dir = dirname(resolve(filePath));
  const root = dirname(dir) === dir ? dir : '/';

  while (dir !== root) {
    for (const marker of markers) {
      if (marker.includes('*')) {
        // Glob markers like *.sln — skip for now (would need readdirSync)
        continue;
      }
      if (existsSync(resolve(dir, marker))) {
        return pathToFileURL(dir).href;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return pathToFileURL(dirname(resolve(filePath))).href;
}
