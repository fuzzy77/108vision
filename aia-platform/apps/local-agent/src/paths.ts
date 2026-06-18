/**
 * Shared install paths for desktop agent.
 */

import { join } from 'node:path';
import { homedir, platform } from 'node:os';

export const INSTALL_DIR_NAME = '.108ai';

export function getDataDir(): string {
  return join(homedir(), INSTALL_DIR_NAME);
}

export function getInstallDir(): string {
  return join(getDataDir(), 'bin');
}

export function getExeName(): string {
  return platform() === 'win32' ? '108ai.exe' : '108ai';
}

export function getInstalledBinaryPath(): string {
  return join(getInstallDir(), getExeName());
}
