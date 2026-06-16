import { resolve, normalize } from 'node:path';

import { EXTENSIONS_BASE_DIR } from '../paths.js';

/**
 * Extension files must live under ~/.108ai (commands, skills, agents, mcp).
 */
export function isPathUnderExtensionsBase(rawPath: string): boolean {
  const resolved = resolve(normalize(rawPath));
  const base = resolve(normalize(EXTENSIONS_BASE_DIR));
  const lower = resolved.toLowerCase();
  const baseLower = base.toLowerCase();
  return lower === baseLower || lower.startsWith(`${baseLower}\\`) || lower.startsWith(`${baseLower}/`);
}

export function assertExtensionPath(rawPath: string, label = 'path'): string {
  const resolved = resolve(normalize(rawPath));
  if (resolved.includes('\0')) {
    throw new Error(`Percorso non valido per ${label}`);
  }
  if (!isPathUnderExtensionsBase(resolved)) {
    throw new Error(
      `${label} fuori sandbox: consentito solo sotto ${EXTENSIONS_BASE_DIR}`,
    );
  }
  return resolved;
}
