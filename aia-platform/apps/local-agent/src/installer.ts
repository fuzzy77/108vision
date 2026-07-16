/**
 * Unified installer — idempotent install, repair, update, uninstall.
 *
 * Install layout:
 *   ~/.108ai/bin/108ai[.exe]   — installed binary
 *   ~/.108ai/install.json      — install manifest
 */

import {
  existsSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  chmodSync,
} from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';

import { getAppVersion } from './version.js';
import { enableAutostart, disableAutostart } from './autostart.js';
import { applyFirstRunDefaults } from './first-run.js';
import {
  INSTALL_DIR_NAME,
  getDataDir,
  getInstallDir,
  getInstalledBinaryPath,
} from './paths.js';

const MANIFEST_FILE = 'install.json';

export interface InstallManifest {
  version: string;
  installedAt: string;
  binaryPath: string;
  autostartEnabled: boolean;
}

export interface InstallOptions {
  /** Copy binary even if already installed (repair/update). */
  forceCopy?: boolean;
  /** Register OS autostart after install. */
  enableAutostart?: boolean;
  /** Skip interactive menu when reinstalling. */
  silent?: boolean;
}

export interface InstallResult {
  action: 'fresh' | 'updated' | 'repaired' | 'skipped' | 'cancelled';
  binaryPath: string;
  pathAdded: boolean;
  autostartEnabled: boolean;
}

export function getManifestPath(): string {
  return join(getDataDir(), MANIFEST_FILE);
}

export function loadInstallManifest(): InstallManifest | null {
  const path = getManifestPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as InstallManifest;
  } catch {
    return null;
  }
}

function saveInstallManifest(manifest: InstallManifest): void {
  const dataDir = getDataDir();
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  writeFileSync(getManifestPath(), JSON.stringify(manifest, null, 2), 'utf-8');
}

export function isInstalledBinary(path: string): boolean {
  const normalized = path.toLowerCase();
  const installDir = getInstallDir().toLowerCase();
  return normalized.startsWith(installDir);
}

export function isRunningFromInstallLocation(): boolean {
  return isInstalledBinary(process.execPath);
}

export function isDirectoryInPath(dir: string): boolean {
  const pathVar = process.env['PATH'] ?? '';
  const separator = platform() === 'win32' ? ';' : ':';
  return pathVar.split(separator).some((p) => p.toLowerCase() === dir.toLowerCase());
}

function getShellProfile(): string | null {
  const home = homedir();
  const shell = process.env['SHELL'] ?? '';

  if (shell.includes('zsh')) return join(home, '.zshrc');
  if (shell.includes('bash')) {
    const bashProfile = join(home, '.bash_profile');
    if (existsSync(bashProfile)) return bashProfile;
    return join(home, '.bashrc');
  }
  if (shell.includes('fish')) return join(home, '.config', 'fish', 'config.fish');

  if (existsSync(join(home, '.zshrc'))) return join(home, '.zshrc');
  if (existsSync(join(home, '.bashrc'))) return join(home, '.bashrc');
  return null;
}

export function addInstallDirToPath(): boolean {
  const installDir = getInstallDir();
  if (isDirectoryInPath(installDir)) return false;

  if (platform() === 'win32') {
    try {
      const userPath = execSync(`reg query "HKCU\\Environment" /v Path`, { encoding: 'utf-8' });
      const match = userPath.match(/Path\s+REG_(?:EXPAND_)?SZ\s+(.+)/i);
      const existingUserPath = match ? match[1]!.trim() : '';
      const newPath = existingUserPath ? `${existingUserPath};${installDir}` : installDir;
      execSync(`setx PATH "${newPath}"`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  const shellProfile = getShellProfile();
  if (!shellProfile) return false;

  try {
    const exportLine = `\nexport PATH="$HOME/${INSTALL_DIR_NAME}/bin:$PATH"\n`;
    const content = existsSync(shellProfile) ? readFileSync(shellProfile, 'utf-8') : '';
    if (!content.includes(INSTALL_DIR_NAME)) {
      writeFileSync(shellProfile, content + exportLine, 'utf-8');
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function copyBinaryToInstallDir(force: boolean): 'skipped' | 'copied' {
  const installDir = getInstallDir();
  const targetPath = getInstalledBinaryPath();
  const sourcePath = process.execPath;

  if (!existsSync(installDir)) {
    mkdirSync(installDir, { recursive: true });
  }

  if (sourcePath === targetPath && !force) {
    return 'skipped';
  }

  if (!force && existsSync(targetPath)) {
    // Already have a binary; only overwrite if source is different file (update from download)
    if (sourcePath !== targetPath) {
      copyFileSync(sourcePath, targetPath);
      if (platform() !== 'win32') {
        chmodSync(targetPath, 0o755);
      }
      return 'copied';
    }
    return 'skipped';
  }

  if (sourcePath !== targetPath) {
    copyFileSync(sourcePath, targetPath);
  }

  if (platform() !== 'win32') {
    chmodSync(targetPath, 0o755);
  }

  return 'copied';
}

async function promptInstallAction(): Promise<'update' | 'repair' | 'uninstall' | 'cancel'> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    process.stdout.write('\n  108 AI gia\' installato. Scegli:\n');
    process.stdout.write('    [1] Aggiorna / sovrascrivi binary\n');
    process.stdout.write('    [2] Ripara (PATH + autostart)\n');
    process.stdout.write('    [3] Disinstalla\n');
    process.stdout.write('    [4] Annulla\n\n');
    process.stdout.write('  Scelta [1]: ');

    rl.question('', (answer) => {
      rl.close();
      const choice = answer.trim() || '1';
      if (choice === '3') resolve('uninstall');
      else if (choice === '4') resolve('cancel');
      else if (choice === '2') resolve('repair');
      else resolve('update');
    });
  });
}

/**
 * Idempotent install — safe to call on every first agent start.
 */
export async function installAgent(options: InstallOptions = {}): Promise<InstallResult> {
  const manifest = loadInstallManifest();
  const alreadyInstalled = manifest !== null || existsSync(getInstalledBinaryPath());

  if (alreadyInstalled && !options.silent && !options.forceCopy && process.stdin.isTTY) {
    const action = await promptInstallAction();
    if (action === 'cancel') {
      return {
        action: 'cancelled',
        binaryPath: getInstalledBinaryPath(),
        pathAdded: false,
        autostartEnabled: isAutostartEnabledFromManifest(),
      };
    }
    if (action === 'uninstall') {
      uninstallAgent();
      return {
        action: 'cancelled',
        binaryPath: getInstalledBinaryPath(),
        pathAdded: false,
        autostartEnabled: false,
      };
    }
    if (action === 'repair') {
      options = { ...options, forceCopy: false, enableAutostart: true };
    } else {
      options = { ...options, forceCopy: true };
    }
  }

  const copyResult = copyBinaryToInstallDir(options.forceCopy ?? !alreadyInstalled);
  const pathAdded = addInstallDirToPath();

  let autostartEnabled = false;
  if (options.enableAutostart ?? true) {
    autostartEnabled = enableAutostart();
  }

  const binaryPath = getInstalledBinaryPath();
  saveInstallManifest({
    version: getAppVersion(),
    installedAt: new Date().toISOString(),
    binaryPath,
    autostartEnabled,
  });

  const action: InstallResult['action'] =
    copyResult === 'copied'
      ? alreadyInstalled
        ? 'updated'
        : 'fresh'
      : alreadyInstalled
        ? 'repaired'
        : 'skipped';

  if (action === 'fresh') {
    applyFirstRunDefaults();
  }

  return { action, binaryPath, pathAdded, autostartEnabled };
}

function isAutostartEnabledFromManifest(): boolean {
  return loadInstallManifest()?.autostartEnabled ?? false;
}

/**
 * Silent install/update on agent bootstrap.
 * - If running from a non-install location (e.g. Downloads): install + copy to ~/.108ai/bin
 * - If running from install location but version changed: update in place
 * - If already installed and same version: skip
 */
export async function ensureInstalled(): Promise<InstallResult | null> {
  if (isRunningFromInstallLocation()) {
    // Already running from install dir — check if manifest version differs (self-update scenario)
    const manifest = loadInstallManifest();
    const currentVersion = getAppVersion();
    if (manifest && manifest.version === currentVersion) {
      return null;
    }
    // Version changed — update manifest
    saveInstallManifest({
      version: currentVersion,
      installedAt: manifest?.installedAt ?? new Date().toISOString(),
      binaryPath: getInstalledBinaryPath(),
      autostartEnabled: manifest?.autostartEnabled ?? true,
    });
    return { action: 'updated', binaryPath: getInstalledBinaryPath(), pathAdded: false, autostartEnabled: manifest?.autostartEnabled ?? true };
  }

  // Running from outside install dir (e.g. fresh download) — install
  return installAgent({
    silent: true,
    forceCopy: true,
    enableAutostart: true,
  });
}

export function uninstallAgent(): void {
  disableAutostart();

  const binaryPath = getInstalledBinaryPath();
  if (existsSync(binaryPath) && !isRunningFromInstallLocation()) {
    try {
      unlinkSync(binaryPath);
    } catch {
      // binary may be in use
    }
  }

  const manifestPath = getManifestPath();
  if (existsSync(manifestPath)) {
    unlinkSync(manifestPath);
  }
}

export function printInstallSuccess(result: InstallResult): void {
  process.stdout.write('\n  [OK] Installazione completata!\n\n');
  process.stdout.write(`  Binary: ${result.binaryPath}\n`);
  process.stdout.write(`  Versione: ${getAppVersion()}\n`);
  if (result.pathAdded) {
    process.stdout.write('  PATH aggiornato — riavvia il terminale.\n');
  }
  if (result.autostartEnabled) {
    process.stdout.write('  Avvio automatico: attivo\n');
  }
  process.stdout.write('\n  Comandi:\n');
  process.stdout.write('    108ai                  Shell interattiva\n');
  process.stdout.write('    108ai agent            Agente in background (tray)\n');
  process.stdout.write('    108ai --install        Ripara / aggiorna installazione\n\n');
}

export function printUninstallInstructions(): void {
  const dataDir = getDataDir();
  process.stdout.write('\n  108 AI — Disinstallazione\n\n');
  process.stdout.write('  Autostart rimosso.\n');
  process.stdout.write(`  Per rimuovere tutti i dati, elimina: ${dataDir}\n`);
  process.stdout.write(`  Rimuovi "${getInstallDir()}" dal PATH se presente.\n\n`);
}
