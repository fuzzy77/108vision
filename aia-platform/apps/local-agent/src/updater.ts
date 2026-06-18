/**
 * Auto-Updater — Checks gateway for updates, stages binary, applies on restart.
 *
 * Gateway contract: GET /api/desktop-agent/updates?version={current}
 */

import {
  createWriteStream,
  renameSync,
  unlinkSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { platform, arch } from 'node:os';
import { spawn } from 'node:child_process';

import { getAppVersion, isNewerVersion } from './version.js';
import { getDataDir, getInstalledBinaryPath } from './paths.js';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const PENDING_UPDATE_FILE = 'pending-update.json';

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes?: string;
}

interface PendingUpdate {
  version: string;
  downloadPath: string;
  targetPath: string;
  createdAt: string;
}

interface GatewayUpdateResponse {
  updateAvailable: boolean;
  version: string;
  releaseNotes?: string;
  downloads?: Array<{
    filename: string;
    os: string;
    arch: string;
    url: string;
  }>;
}

function getPendingUpdatePath(): string {
  return join(getDataDir(), PENDING_UPDATE_FILE);
}

function getUpdateStagingPath(): string {
  const tmpDir = join(getDataDir(), 'tmp');
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }
  const ext = platform() === 'win32' ? '.exe' : '';
  return join(tmpDir, `108ai-new${ext}`);
}

function getTargetPlatform(): { os: string; arch: string } {
  const p = platform();
  const a = arch();
  return {
    os: p === 'win32' ? 'windows' : p === 'darwin' ? 'macos' : 'linux',
    arch: a === 'arm64' ? 'arm64' : 'x64',
  };
}

/**
 * Check the gateway for available updates.
 */
export async function checkForUpdate(gatewayBaseUrl: string): Promise<UpdateInfo | null> {
  const current = getAppVersion();
  const base = gatewayBaseUrl.replace(/\/$/, '');
  const url = `${base}/api/desktop-agent/updates?version=${encodeURIComponent(current)}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': `108ai-desktop/${current}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as GatewayUpdateResponse;

    if (!data.updateAvailable || !isNewerVersion(data.version, current)) {
      return null;
    }

    const target = getTargetPlatform();
    const download =
      data.downloads?.find((d) => d.os === target.os && d.arch === target.arch) ??
      data.downloads?.[0];

    if (!download?.url) {
      return null;
    }

    return {
      version: data.version,
      downloadUrl: download.url,
      releaseNotes: data.releaseNotes,
    };
  } catch {
    return null;
  }
}

/**
 * Download update to staging area and write pending manifest (apply on next restart).
 */
export async function stageUpdate(
  update: UpdateInfo,
  onProgress?: (percent: number) => void,
): Promise<boolean> {
  const stagingPath = getUpdateStagingPath();
  const targetPath = isRunningInstalledBinary() ? getInstalledBinaryPath() : process.execPath;

  console.log(JSON.stringify({
    level: 'info',
    message: 'Downloading update (staged)',
    version: update.version,
    url: update.downloadUrl,
  }));

  try {
    const response = await fetch(update.downloadUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const totalSize = parseInt(response.headers.get('content-length') ?? '0', 10);
    let downloadedSize = 0;

    const writer = createWriteStream(stagingPath);
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

    await new Promise<void>((resolve, reject) => {
      writer.end(() => resolve());
      writer.on('error', reject);
    });

    if (platform() !== 'win32') {
      chmodSync(stagingPath, 0o755);
    }

    const pending: PendingUpdate = {
      version: update.version,
      downloadPath: stagingPath,
      targetPath,
      createdAt: new Date().toISOString(),
    };
    writeFileSync(getPendingUpdatePath(), JSON.stringify(pending, null, 2), 'utf-8');

    console.log(JSON.stringify({
      level: 'info',
      message: 'Update staged — will apply on next restart',
      version: update.version,
    }));

    return true;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Update staging failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    try { unlinkSync(stagingPath); } catch { /* ignore */ }
    return false;
  }
}

function isRunningInstalledBinary(): boolean {
  try {
    return process.execPath.toLowerCase() === getInstalledBinaryPath().toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Apply a pending staged update (call before agent main on startup).
 */
export function applyPendingUpdate(): boolean {
  const pendingPath = getPendingUpdatePath();
  if (!existsSync(pendingPath)) return false;

  let pending: PendingUpdate;
  try {
    pending = JSON.parse(readFileSync(pendingPath, 'utf-8')) as PendingUpdate;
  } catch {
    return false;
  }

  if (!existsSync(pending.downloadPath)) {
    try { unlinkSync(pendingPath); } catch { /* ignore */ }
    return false;
  }

  const target = pending.targetPath;
  const backupPath = target + '.bak';

  try {
    if (existsSync(backupPath)) {
      unlinkSync(backupPath);
    }
    if (existsSync(target)) {
      renameSync(target, backupPath);
    }
    renameSync(pending.downloadPath, target);
    if (platform() !== 'win32') {
      chmodSync(target, 0o755);
    }
    unlinkSync(pendingPath);

    console.log(JSON.stringify({
      level: 'info',
      message: 'Pending update applied',
      version: pending.version,
      target,
    }));

    return true;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Failed to apply pending update',
      error: error instanceof Error ? error.message : String(error),
    }));
    return false;
  }
}

export function loadPendingUpdateVersion(): string | null {
  const pendingPath = getPendingUpdatePath();
  if (!existsSync(pendingPath)) return null;
  try {
    const pending = JSON.parse(readFileSync(pendingPath, 'utf-8')) as PendingUpdate;
    return pending.version;
  } catch {
    return null;
  }
}

/**
 * Restart the agent process after an update.
 */
export function scheduleRestart(): void {
  const execPath = process.execPath;
  const args = process.argv.slice(1);

  const child = spawn(execPath, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  process.exit(0);
}

export type UpdateNotificationHandler = (info: {
  type: 'available' | 'staged';
  version: string;
  releaseNotes?: string;
}) => void;

let notifyHandler: UpdateNotificationHandler | null = null;

export function setUpdateNotificationHandler(handler: UpdateNotificationHandler | null): void {
  notifyHandler = handler;
}

/**
 * Start periodic update checks in the background.
 * Downloads updates to staging; does not auto-restart (user or next boot applies).
 */
export function startUpdateLoop(gatewayBaseUrl: string): void {
  const check = async () => {
    const update = await checkForUpdate(gatewayBaseUrl);
    if (!update) return;

    notifyHandler?.({
      type: 'available',
      version: update.version,
      releaseNotes: update.releaseNotes,
    });

    const success = await stageUpdate(update);
    if (success) {
      notifyHandler?.({
        type: 'staged',
        version: update.version,
        releaseNotes: update.releaseNotes,
      });
    }
  };

  setTimeout(check, 5_000);
  setInterval(check, CHECK_INTERVAL_MS);
}

export { getAppVersion as getCurrentVersion } from './version.js';
