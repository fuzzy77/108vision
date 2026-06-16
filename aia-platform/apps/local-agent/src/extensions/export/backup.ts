import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';

import {
  AGENTS_DIR,
  COMMANDS_DIR,
  EXTENSIONS_BASE_DIR,
  EXTENSIONS_LOCK_FILE,
  MCP_CONFIG_FILE,
  PERMISSIONS_FILE,
  SKILLS_DIR,
} from '../paths.js';
import { loadExtensionsLock } from '../lock.js';

export interface BackupExportResult {
  ok: boolean;
  path: string;
  message: string;
}

export function exportExtensionsBackup(targetDir?: string): BackupExportResult {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = targetDir ?? join(EXTENSIONS_BASE_DIR, 'backups', stamp);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const copyIfExists = (src: string, destName: string) => {
    if (!existsSync(src)) return;
    cpSync(src, join(outDir, destName), { recursive: true });
  };

  copyIfExists(COMMANDS_DIR, 'commands');
  copyIfExists(SKILLS_DIR, 'skills');
  copyIfExists(AGENTS_DIR, 'agents');
  copyIfExists(MCP_CONFIG_FILE, 'mcp.yml');
  copyIfExists(PERMISSIONS_FILE, 'permissions.yml');

  const lock = loadExtensionsLock();
  writeFileSync(join(outDir, 'extensions-lock.json'), JSON.stringify(lock, null, 2), 'utf-8');

  const manifest = {
    exportedAt: new Date().toISOString(),
    source: EXTENSIONS_BASE_DIR,
    lockEntries: lock.entries.length,
  };
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  return {
    ok: true,
    path: outDir,
    message: `Backup esportato in ${outDir}`,
  };
}

export function readBackupManifest(backupDir: string): Record<string, unknown> | null {
  const path = join(backupDir, 'manifest.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface BackupRestoreResult {
  ok: boolean;
  path: string;
  message: string;
  restored: string[];
}

export function restoreExtensionsBackup(backupDir: string): BackupRestoreResult {
  const restored: string[] = [];
  const manifest = readBackupManifest(backupDir);
  if (!manifest) {
    return {
      ok: false,
      path: backupDir,
      message: 'Backup non valido: manifest.json mancante',
      restored,
    };
  }

  const restoreCopy = (srcName: string, destPath: string) => {
    const src = join(backupDir, srcName);
    if (!existsSync(src)) return;
    cpSync(src, destPath, { recursive: true, force: true });
    restored.push(destPath);
  };

  restoreCopy('commands', COMMANDS_DIR);
  restoreCopy('skills', SKILLS_DIR);
  restoreCopy('agents', AGENTS_DIR);
  restoreCopy('mcp.yml', MCP_CONFIG_FILE);
  restoreCopy('permissions.yml', PERMISSIONS_FILE);

  const lockSrc = join(backupDir, 'extensions-lock.json');
  if (existsSync(lockSrc)) {
    cpSync(lockSrc, join(EXTENSIONS_BASE_DIR, 'extensions-lock.json'), { force: true });
    restored.push(EXTENSIONS_LOCK_FILE);
  }

  return {
    ok: true,
    path: backupDir,
    message: `Restore completato da ${backupDir} (${restored.length} elementi)`,
    restored,
  };
}
