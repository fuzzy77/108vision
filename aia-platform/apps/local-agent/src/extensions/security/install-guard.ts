import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { isPathUnderExtensionsBase } from './sandbox.js';
import { verifyStoreSignature } from './store-signature.js';

export function checksumFile(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export interface InstallReviewResult {
  ok: boolean;
  warnings: string[];
  checksum?: string;
}

export interface StoreInstallReviewOptions {
  author?: string;
  version?: string;
  signature?: string;
  verified?: boolean;
}

/**
 * Basic install-time review: path sandbox + checksum for lock file.
 */
export function reviewExtensionInstall(
  filePath: string,
  type: 'command' | 'skill' | 'agent' | 'mcp',
): InstallReviewResult {
  const warnings: string[] = [];

  if (!isPathUnderExtensionsBase(filePath)) {
    return {
      ok: false,
      warnings: [`Import bloccato: ${filePath} non è sotto ~/.108ai`],
    };
  }

  let checksum: string | undefined;
  try {
    checksum = checksumFile(filePath);
  } catch {
    return { ok: false, warnings: ['Impossibile leggere il file da importare'] };
  }

  if (type === 'mcp' && filePath.includes('..')) {
    warnings.push('Percorso sospetto nel manifest MCP');
  }

  return { ok: true, warnings, checksum };
}

/**
 * Review store download before writing to disk (path + optional author signature).
 */
export function reviewStorePackageInstall(
  filePath: string,
  type: 'command' | 'skill' | 'agent' | 'mcp',
  content: string,
  meta: StoreInstallReviewOptions,
): InstallReviewResult {
  const warnings: string[] = [];

  if (!isPathUnderExtensionsBase(filePath)) {
    return {
      ok: false,
      warnings: [`Install bloccato: ${filePath} non è sotto ~/.108ai`],
    };
  }

  if (type === 'mcp' && filePath.includes('..')) {
    warnings.push('Percorso sospetto nel manifest MCP');
  }

  const sig = verifyStoreSignature({
    author: meta.author ?? '108ai',
    name: filePath.split(/[/\\]/).pop()?.replace(/\.(yml|yaml)$/, '') ?? 'unknown',
    version: meta.version ?? '1',
    content,
    signature: meta.signature,
    verified: meta.verified,
    allowUnsignedBundled: meta.verified,
  });

  if (!sig.ok) {
    return { ok: false, warnings: [sig.reason ?? 'Firma non valida', ...warnings] };
  }

  const checksum = createHash('sha256').update(content, 'utf-8').digest('hex').slice(0, 16);
  return { ok: true, warnings: [...warnings, ...sig.warnings], checksum };
}
