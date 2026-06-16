import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { EXTENSIONS_LOCK_FILE } from './paths.js';
import type { ExtensionsLockEntry, ExtensionsLockFile } from './types.js';
import { checksumFile } from './security/install-guard.js';

function emptyLock(): ExtensionsLockFile {
  return { version: 1, entries: [] };
}

export function loadExtensionsLock(): ExtensionsLockFile {
  if (!existsSync(EXTENSIONS_LOCK_FILE)) return emptyLock();
  try {
    const raw = JSON.parse(readFileSync(EXTENSIONS_LOCK_FILE, 'utf-8')) as ExtensionsLockFile;
    if (raw.version !== 1 || !Array.isArray(raw.entries)) return emptyLock();
    return raw;
  } catch {
    return emptyLock();
  }
}

export function saveExtensionsLock(lock: ExtensionsLockFile): void {
  writeFileSync(EXTENSIONS_LOCK_FILE, JSON.stringify(lock, null, 2), 'utf-8');
}

export function upsertLockEntry(
  entry: Omit<ExtensionsLockEntry, 'installedAt'> & { installedAt?: string },
): void {
  const lock = loadExtensionsLock();
  const installedAt = entry.installedAt ?? new Date().toISOString();
  const next: ExtensionsLockEntry = { ...entry, installedAt };
  const idx = lock.entries.findIndex((e) => e.type === entry.type && e.name === entry.name);
  if (idx >= 0) {
    lock.entries[idx] = next;
  } else {
    lock.entries.push(next);
  }
  saveExtensionsLock(lock);
}

export function recordInstalledExtension(
  type: ExtensionsLockEntry['type'],
  name: string,
  filePath: string,
  version?: string,
): void {
  upsertLockEntry({
    type,
    name,
    version,
    checksum: checksumFile(filePath),
  });
}
