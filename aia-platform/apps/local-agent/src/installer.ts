/**
 * Installer — Self-install helper for the 108 AI desktop agent.
 *
 * Provides platform-specific methods to:
 * - Add the agent to system startup (auto-start on boot)
 * - Create a desktop shortcut
 * - Generate initial configuration
 *
 * Platforms:
 * - Windows: Registry Run key
 * - macOS: LaunchAgent plist
 * - Linux: systemd user service
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';
import { execSync } from 'node:child_process';

const APP_NAME = '108AI-Desktop';
const DISPLAY_NAME = '108 AI - Desktop Agent';

/**
 * Add the agent to system startup.
 */
export function addToStartup(executablePath: string): { success: boolean; location: string } {
  const os = platform();

  switch (os) {
    case 'win32':
      return addToStartupWindows(executablePath);
    case 'darwin':
      return addToStartupMacOS(executablePath);
    case 'linux':
      return addToStartupLinux(executablePath);
    default:
      throw new Error(`Unsupported platform for auto-start: ${os}`);
  }
}

/**
 * Remove the agent from system startup.
 */
export function removeFromStartup(): { success: boolean } {
  const os = platform();

  switch (os) {
    case 'win32':
      return removeFromStartupWindows();
    case 'darwin':
      return removeFromStartupMacOS();
    case 'linux':
      return removeFromStartupLinux();
    default:
      throw new Error(`Unsupported platform: ${os}`);
  }
}

// --- Windows ---

function addToStartupWindows(executablePath: string): { success: boolean; location: string } {
  const regKey = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
  const command = `reg add "${regKey}" /v "${APP_NAME}" /t REG_SZ /d "${executablePath}" /f`;

  try {
    execSync(command, { stdio: 'pipe' });
    return { success: true, location: regKey };
  } catch (error) {
    throw new Error(
      `Failed to add to Windows startup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

function removeFromStartupWindows(): { success: boolean } {
  const regKey = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
  const command = `reg delete "${regKey}" /v "${APP_NAME}" /f`;

  try {
    execSync(command, { stdio: 'pipe' });
    return { success: true };
  } catch {
    return { success: true };
  }
}

// --- macOS ---

function addToStartupMacOS(executablePath: string): { success: boolean; location: string } {
  const plistDir = join(homedir(), 'Library', 'LaunchAgents');
  const plistPath = join(plistDir, `dev.108ai.desktop.plist`);

  if (!existsSync(plistDir)) {
    mkdirSync(plistDir, { recursive: true });
  }

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>dev.108ai.desktop</string>
    <key>ProgramArguments</key>
    <array>
        <string>${executablePath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${join(homedir(), '.108ai', 'agent.log')}</string>
    <key>StandardErrorPath</key>
    <string>${join(homedir(), '.108ai', 'agent-error.log')}</string>
</dict>
</plist>`;

  writeFileSync(plistPath, plistContent, 'utf-8');

  try {
    execSync(`launchctl load "${plistPath}"`, { stdio: 'pipe' });
  } catch {
    // May fail if already loaded
  }

  return { success: true, location: plistPath };
}

function removeFromStartupMacOS(): { success: boolean } {
  const plistPath = join(homedir(), 'Library', 'LaunchAgents', 'dev.108ai.desktop.plist');

  try {
    execSync(`launchctl unload "${plistPath}"`, { stdio: 'pipe' });
  } catch {
    // May not be loaded
  }

  return { success: true };
}

// --- Linux ---

function addToStartupLinux(executablePath: string): { success: boolean; location: string } {
  const serviceDir = join(homedir(), '.config', 'systemd', 'user');
  const servicePath = join(serviceDir, '108ai-desktop.service');

  if (!existsSync(serviceDir)) {
    mkdirSync(serviceDir, { recursive: true });
  }

  const serviceContent = `[Unit]
Description=${DISPLAY_NAME}
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${executablePath}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
`;

  writeFileSync(servicePath, serviceContent, 'utf-8');

  try {
    execSync('systemctl --user daemon-reload', { stdio: 'pipe' });
    execSync('systemctl --user enable 108ai-desktop.service', { stdio: 'pipe' });
  } catch (error) {
    throw new Error(
      `Failed to enable systemd service: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  return { success: true, location: servicePath };
}

function removeFromStartupLinux(): { success: boolean } {
  try {
    execSync('systemctl --user disable 108ai-desktop.service', { stdio: 'pipe' });
    execSync('systemctl --user stop 108ai-desktop.service', { stdio: 'pipe' });
  } catch {
    // May not exist
  }

  return { success: true };
}

/**
 * Create a desktop shortcut (Windows only for now).
 */
export function createDesktopShortcut(executablePath: string): { success: boolean; path: string } {
  const os = platform();

  if (os !== 'win32') {
    throw new Error('Desktop shortcuts are only supported on Windows');
  }

  const desktopPath = join(homedir(), 'Desktop', `${DISPLAY_NAME}.lnk`);

  const psCommand = `
$ws = New-Object -COMObject WScript.Shell
$shortcut = $ws.CreateShortcut("${desktopPath.replace(/\\/g, '\\\\')}")
$shortcut.TargetPath = "${executablePath.replace(/\\/g, '\\\\')}"
$shortcut.Description = "${DISPLAY_NAME}"
$shortcut.Save()
`.trim();

  try {
    execSync(`powershell -Command "${psCommand.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    return { success: true, path: desktopPath };
  } catch (error) {
    throw new Error(
      `Failed to create desktop shortcut: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
