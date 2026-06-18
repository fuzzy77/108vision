/**
 * Store install flow — fetch, verify signature, write extension, reload.
 */

import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  AGENTS_DIR,
  COMMANDS_DIR,
  SKILLS_DIR,
  MCP_CONFIG_FILE,
  ensureExtensionDirs,
} from '../../paths.js';
import { reloadExtensions } from '../../loader.js';
import { recordInstalledExtension } from '../../lock.js';
import { reviewStorePackageInstall } from '../../security/install-guard.js';
import { verifyStoreSignature } from '../../security/store-signature.js';
import { loadMcpConfig, saveMcpConfig } from '../../mcp/config.js';
import { addMcpServerDefinition } from '../../mcp/manager.js';
import { parseMcpInstall } from '../../mcp/install.js';
import { parsePersonaAgentDefinition } from '../../schemas.js';
import type { McpServerDefinition } from '../../types.js';
import { parse as parseYaml } from 'yaml';

import {
  findStoreItemById,
  type StoreCatalogItem,
} from './catalog.js';

export interface StoreInstallResult {
  ok: boolean;
  message: string;
  warnings: string[];
  itemId?: string;
  installedName?: string;
}

function targetPathForItem(item: StoreCatalogItem): string {
  switch (item.type) {
    case 'command':
      return join(COMMANDS_DIR, `${item.name}.yml`);
    case 'skill':
      return join(SKILLS_DIR, item.name, 'SKILL.yml');
    case 'agent':
      return join(AGENTS_DIR, `${item.name}.yml`);
    default:
      throw new Error(`Tipo non supportato per install file: ${item.type}`);
  }
}

async function fetchInstallContent(item: StoreCatalogItem): Promise<string> {
  if (item.inlineContent) return item.inlineContent;
  if (!item.installUrl) {
    throw new Error('Pacchetto senza installUrl o inlineContent');
  }

  const res = await fetch(item.installUrl, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) {
    throw new Error(`Download fallito: HTTP ${res.status}`);
  }
  return res.text();
}

function writeExtensionFile(path: string, content: string, item: StoreCatalogItem): void {
  const parent = join(path, '..');
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });

  const review = reviewStorePackageInstall(path, item.type, content, {
    author: item.author,
    version: item.version,
    signature: item.signature,
    verified: item.verified,
  });
  if (!review.ok) {
    throw new Error(review.warnings.join('; '));
  }

  writeFileSync(path, content, 'utf-8');
}

function installMcpFromStoreItem(item: StoreCatalogItem): StoreInstallResult {
  const preset = item.mcpPreset ?? item.name;
  const { name, definition } = parseMcpInstall([preset]);
  const doc = loadMcpConfig();
  const servers = [...doc.mcp_servers.filter((s: McpServerDefinition) => s.name !== name), definition];
  saveMcpConfig(servers);
  addMcpServerDefinition(definition);
  recordInstalledExtension('mcp', name, MCP_CONFIG_FILE, item.version);
  return {
    ok: true,
    message: `MCP installato: ${name}`,
    warnings: [],
    itemId: item.id,
    installedName: name,
  };
}

function installBundledItem(item: StoreCatalogItem): StoreInstallResult {
  if (item.type === 'mcp') {
    return installMcpFromStoreItem(item);
  }

  const warnings: string[] = [];
  if (item.type === 'command') {
    const path = join(COMMANDS_DIR, `${item.name}.yml`);
    if (existsSync(path)) {
      return {
        ok: true,
        message: `Già installato (bundled): ${item.name}`,
        warnings: ['File già presente in ~/.108ai/commands'],
        itemId: item.id,
        installedName: item.name,
      };
    }
  }

  warnings.push('Bundled: esegui reload se manca il seed al primo avvio');
  reloadExtensions();
  return {
    ok: true,
    message: `Bundled disponibile: ${item.displayName}`,
    warnings,
    itemId: item.id,
    installedName: item.name,
  };
}

export async function installStoreItem(
  itemId: string,
  options?: { force?: boolean },
): Promise<StoreInstallResult> {
  ensureExtensionDirs();
  const item = findStoreItemById(itemId);
  if (!item) {
    return { ok: false, message: `Item store non trovato: ${itemId}`, warnings: [] };
  }

  if (item.bundled && !item.installUrl && !item.inlineContent) {
    const bundled = installBundledItem(item);
    reloadExtensions();
    return bundled;
  }

  if (item.type === 'mcp' && item.mcpPreset) {
    const mcpResult = installMcpFromStoreItem(item);
    reloadExtensions();
    return mcpResult;
  }

  let content: string;
  try {
    content = await fetchInstallContent(item);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
      warnings: [],
      itemId,
    };
  }

  const author = item.author ?? '108ai';
  const version = item.version ?? '1';
  const sig = verifyStoreSignature({
    author,
    name: item.name,
    version,
    content,
    signature: item.signature,
    verified: item.verified,
    allowUnsignedBundled: item.bundled,
  });

  if (!sig.ok && !options?.force) {
    return {
      ok: false,
      message: sig.reason ?? 'Verifica firma fallita',
      warnings: sig.warnings,
      itemId,
    };
  }

  try {
    if (item.type === 'agent') {
      parsePersonaAgentDefinition(parseYaml(content));
    }
  } catch (err) {
    return {
      ok: false,
      message: `Manifest agent non valido: ${err instanceof Error ? err.message : String(err)}`,
      warnings: sig.warnings,
      itemId,
    };
  }

  const target = targetPathForItem(item);
  try {
    writeExtensionFile(target, content, item);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
      warnings: sig.warnings,
      itemId,
    };
  }

  recordInstalledExtension(item.type, item.name, target, version);
  const reload = reloadExtensions();

  return {
    ok: true,
    message: `Installato: ${item.displayName}`,
    warnings: [...sig.warnings, ...reload.warnings],
    itemId,
    installedName: item.name,
  };
}