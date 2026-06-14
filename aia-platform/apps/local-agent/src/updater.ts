/**
 * Auto-Updater — Checks for new versions and self-updates the binary.
 *
 * Strategy:
 * - On startup: check gateway for latest version
 * - If newer version available: download new binary, replace self, restart
 * - Check again every 6 hours while running
 */

import { createWriteStream, renameSync, unlinkSync, chmodSync, existsSync } from 'node:fs';
import { platform, arch } from 'node:os';
import { spawn } from 'node:child_process';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const CURRENT_VERSION = '0.2.0';

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  sha256: string;
  releaseNotes: string;
}

/**
 * Check the gateway for available updates.
 */
export async function checkForUpdate(gatewayBaseUrl: string): Promise<UpdateInfo | null> {
  const target = getTargetPlatform();
  const url = `${gatewayBaseUrl}/api/desktop-agent/updates?platform=${target.platform}&arch=${target.arch}&current=${CURRENT_VERSION}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': `108ai-desktop/${CURRENT_VERSION}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 204 || response.status === 304) {
      return null; // No update available
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as UpdateInfo;

    if (data.version === CURRENT_VERSION) {
      return null;
    }

    return data;
  } catch {
    // Update check is non-critical
    return null;
  }
}

/**
 * Download and apply an update.
 *
 * Strategy:
 * 1. Download new binary to temp file
 * 2. Verify SHA256 hash
 * 3. Replace current binary (rename old → .bak, move new → current)
 * 4. Schedule restart
 */
export async function applyUpdate(
  update: UpdateInfo,
  onProgress?: (percent: number) => void,
): Promise<boolean> {
  const currentPath = process.execPath;
  const tempPath = currentPath + '.update';
  const backupPath = currentPath + '.bak';

  console.log(JSON.stringify({
    level: 'info',
    message: 'Downloading update',
    version: update.version,
    url: update.downloadUrl,
  }));

  try {
    // Download
    const response = await fetch(update.downloadUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const totalSize = parseInt(response.headers.get('content-length') ?? '0', 10);
    let downloadedSize = 0;

    const writer = createWriteStream(tempPath);
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      writer.write(Buffer.from(value));
      downloadedSize += value.length;

      if (totalSize > 0 && onProgress) {
        onProgress(Math.round((downloadedSize / totalSize) * 100));
      }
    }

    writer.close();

    // TODO: Verify SHA256 hash (crypto.createHash('sha256'))

    // Replace binary
    if (existsSync(backupPath)) {
      unlinkSync(backupPath);
    }

    renameSync(currentPath, backupPath);
    renameSync(tempPath, currentPath);

    // Make executable on Unix
    if (platform() !== 'win32') {
      chmodSync(currentPath, 0o755);
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Update applied successfully',
      version: update.version,
    }));

    return true;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Update failed',
      error: error instanceof Error ? error.message : String(error),
    }));

    // Cleanup temp file
    try { unlinkSync(tempPath); } catch {}

    return false;
  }
}

/**
 * Restart the agent process after an update.
 */
export function scheduleRestart(): void {
  console.log(JSON.stringify({
    level: 'info',
    message: 'Restarting agent after update...',
  }));

  const execPath = process.execPath;
  const args = process.argv.slice(1);

  // Spawn detached process and exit current
  const child = spawn(execPath, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  process.exit(0);
}

/**
 * Start periodic update checks in the background.
 */
export function startUpdateLoop(gatewayBaseUrl: string): void {
  const check = async () => {
    const update = await checkForUpdate(gatewayBaseUrl);
    if (update) {
      console.log(JSON.stringify({
        level: 'info',
        message: 'Update available',
        currentVersion: CURRENT_VERSION,
        newVersion: update.version,
        releaseNotes: update.releaseNotes,
      }));

      // Auto-apply in background
      const success = await applyUpdate(update);
      if (success) {
        scheduleRestart();
      }
    }
  };

  // Check on startup (after 5s delay to not block main flow)
  setTimeout(check, 5000);

  // Check periodically
  setInterval(check, CHECK_INTERVAL_MS);
}

function getTargetPlatform(): { platform: string; arch: string } {
  const p = platform();
  const a = arch();

  return {
    platform: p === 'win32' ? 'windows' : p === 'darwin' ? 'macos' : 'linux',
    arch: a === 'arm64' ? 'arm64' : 'x64',
  };
}

export function getCurrentVersion(): string {
  return CURRENT_VERSION;
}
