/**
 * Application version — single source read from package.json at runtime.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FALLBACK_VERSION = '0.5.1';

function readPackageVersion(): string {
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'),
    join(process.cwd(), 'package.json'),
  ];

  for (const pkgPath of candidates) {
    if (!existsSync(pkgPath)) continue;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // try next candidate
    }
  }

  return FALLBACK_VERSION;
}

const APP_VERSION = readPackageVersion();

export function getAppVersion(): string {
  return APP_VERSION;
}

/** @deprecated use getAppVersion */
export function getCurrentVersion(): string {
  return APP_VERSION;
}

/**
 * Returns true when `latest` is strictly newer than `current` (semver triple).
 */
export function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string): [number, number, number] => {
    const parts = v.replace(/^v/i, '').split('-')[0]!.split('.').map((n) => parseInt(n, 10) || 0);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };

  const [lMaj, lMin, lPat] = parse(latest);
  const [cMaj, cMin, cPat] = parse(current);

  if (lMaj !== cMaj) return lMaj > cMaj;
  if (lMin !== cMin) return lMin > cMin;
  return lPat > cPat;
}
