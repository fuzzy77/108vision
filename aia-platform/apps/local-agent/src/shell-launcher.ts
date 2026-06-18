/**
 * Open an interactive 108ai shell in the user's default terminal.
 */

import { spawn } from 'node:child_process';
import { platform } from 'node:os';

import { getInstalledBinaryPath } from './paths.js';

function quoteForShell(path: string): string {
  if (platform() === 'win32') {
    return `"${path.replace(/"/g, '\\"')}"`;
  }
  return `'${path.replace(/'/g, `'\\''`)}'`;
}

/**
 * Spawn a new terminal window running `108ai shell`.
 * Best-effort — failures are silent (tray action).
 */
export function openShellInTerminal(): void {
  const binary = getInstalledBinaryPath();
  const command = `${quoteForShell(binary)} shell`;

  if (platform() === 'win32') {
    spawn('cmd.exe', ['/c', 'start', 'cmd', '/k', command], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();
    return;
  }

  if (platform() === 'darwin') {
    const script = `tell application "Terminal" to do script "${binary} shell"`;
    spawn('osascript', ['-e', script], { detached: true, stdio: 'ignore' }).unref();
    return;
  }

  const linuxTerminals: Array<{ bin: string; args: string[] }> = [
    { bin: 'x-terminal-emulator', args: ['-e', binary, 'shell'] },
    { bin: 'gnome-terminal', args: ['--', binary, 'shell'] },
    { bin: 'konsole', args: ['-e', binary, 'shell'] },
    { bin: 'xfce4-terminal', args: ['-e', `${binary} shell`] },
    { bin: 'xterm', args: ['-e', binary, 'shell'] },
  ];

  for (const term of linuxTerminals) {
    try {
      spawn(term.bin, term.args, { detached: true, stdio: 'ignore' }).unref();
      return;
    } catch {
      // try next terminal emulator
    }
  }
}
