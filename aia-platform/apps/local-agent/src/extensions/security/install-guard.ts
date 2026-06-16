import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { isPathUnderExtensionsBase } from './sandbox.js';

export function checksumFile(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export interface InstallReviewResult {
  ok: boolean;
  warnings: string[];
  checksum?: string;
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
