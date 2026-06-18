/**
 * OS autostart registration — run `108ai agent` on login.
 */

import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';
import { execSync } from 'node:child_process';

import { getInstalledBinaryPath } from './paths.js';

const APP_NAME = '108ai';
const LINUX_DESKTOP_NAME = '108ai-agent.desktop';

function getAgentLaunchCommand(): string {
  const binary = getInstalledBinaryPath();
  if (platform() === 'win32') {
    return `"${binary}" agent`;
  }
  return `"${binary}" agent`;
}

/**
 * Register autostart for the current user.
 */
export function enableAutostart(): boolean {
  const launchCmd = getAgentLaunchCommand();

  try {
    if (platform() === 'win32') {
      execSync(
        `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v ${APP_NAME} /t REG_SZ /d "${launchCmd}" /f`,
        { stdio: 'pipe' },
      );
      return true;
    }

    if (platform() === 'darwin') {
      const plistDir = join(homedir(), 'Library', 'LaunchAgents');
      mkdirSync(plistDir, { recursive: true });
      const plistPath = join(plistDir, 'com.108ai.agent.plist');
      const binary = getInstalledBinaryPath();
      const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.108ai.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>${binary}</string>
    <string>agent</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><false/>
</dict>
</plist>`;
      writeFileSync(plistPath, plist, 'utf-8');
      return true;
    }

    // Linux — XDG autostart
    const autostartDir = join(homedir(), '.config', 'autostart');
    mkdirSync(autostartDir, { recursive: true });
    const desktopPath = join(autostartDir, LINUX_DESKTOP_NAME);
    const binary = getInstalledBinaryPath();
    const desktop = `[Desktop Entry]
Type=Application
Name=108 AI Agent
Comment=108 AI Desktop Agent background service
Exec=${binary} agent
Terminal=false
X-GNOME-Autostart-enabled=true
`;
    writeFileSync(desktopPath, desktop, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove autostart registration.
 */
export function disableAutostart(): boolean {
  try {
    if (platform() === 'win32') {
      execSync(
        `reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v ${APP_NAME} /f`,
        { stdio: 'pipe' },
      );
      return true;
    }

    if (platform() === 'darwin') {
      const plistPath = join(homedir(), 'Library', 'LaunchAgents', 'com.108ai.agent.plist');
      if (existsSync(plistPath)) {
        unlinkSync(plistPath);
      }
      return true;
    }

    const desktopPath = join(homedir(), '.config', 'autostart', LINUX_DESKTOP_NAME);
    if (existsSync(desktopPath)) {
      unlinkSync(desktopPath);
    }
    return true;
  } catch {
    return false;
  }
}

export function isAutostartEnabled(): boolean {
  try {
    if (platform() === 'win32') {
      const out = execSync(
        `reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v ${APP_NAME}`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
      return out.includes(APP_NAME);
    }

    if (platform() === 'darwin') {
      return existsSync(join(homedir(), 'Library', 'LaunchAgents', 'com.108ai.agent.plist'));
    }

    return existsSync(join(homedir(), '.config', 'autostart', LINUX_DESKTOP_NAME));
  } catch {
    return false;
  }
}
