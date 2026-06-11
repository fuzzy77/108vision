/**
 * System Capability — OS-level utilities.
 *
 * Provides:
 * - Open URL in default browser
 * - Open file with default application
 * - Show OS notification
 * - Get system information (OS, memory, disk)
 */

import { platform, hostname, totalmem, freemem, cpus, release, arch, uptime } from 'node:os';
import { statfsSync } from 'node:fs';
import { homedir } from 'node:os';

/**
 * Open a URL in the user's default browser.
 */
export async function openUrl(url: string): Promise<{ opened: boolean; url: string }> {
  // Validate URL
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'mailto:') {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unsupported')) {
      throw error;
    }
    throw new Error(`Invalid URL: ${url}`);
  }

  try {
    const open = await import('open');
    await open.default(url);
    return { opened: true, url };
  } catch (error) {
    throw new Error(
      `Failed to open URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Open a file with its default application.
 */
export async function openFile(path: string): Promise<{ opened: boolean; path: string }> {
  if (!path) {
    throw new Error('File path is required');
  }

  try {
    const open = await import('open');
    await open.default(path);
    return { opened: true, path };
  } catch (error) {
    throw new Error(
      `Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Show an OS-level notification.
 */
export async function showNotification(
  title: string,
  body: string,
): Promise<{ shown: boolean }> {
  if (!title) {
    throw new Error('Notification title is required');
  }

  try {
    const notifier = await import('node-notifier');
    return new Promise((resolve) => {
      notifier.default.notify(
        {
          title,
          message: body || '',
          icon: undefined, // Use default icon
          sound: false,
          wait: false,
        },
        (err) => {
          if (err) {
            resolve({ shown: false });
          } else {
            resolve({ shown: true });
          }
        },
      );
    });
  } catch {
    // Notifications may not be available in all environments
    console.log(JSON.stringify({
      level: 'warn',
      message: 'Notification system not available',
    }));
    return { shown: false };
  }
}

/**
 * Get system information for AI context.
 */
export function getSystemInfo(): SystemInfo {
  const totalMemory = totalmem();
  const freeMemory = freemem();
  const cpuInfo = cpus();

  let diskInfo: DiskInfo | null = null;
  try {
    const stats = statfsSync(homedir());
    diskInfo = {
      totalGb: Math.round((stats.bsize * stats.blocks) / (1024 * 1024 * 1024) * 10) / 10,
      freeGb: Math.round((stats.bsize * stats.bavail) / (1024 * 1024 * 1024) * 10) / 10,
      usedPercent: Math.round((1 - stats.bavail / stats.blocks) * 100),
    };
  } catch {
    // statfs may not be available on all platforms
  }

  return {
    os: {
      platform: platform(),
      release: release(),
      arch: arch(),
      hostname: hostname(),
      uptime: Math.round(uptime()),
    },
    memory: {
      totalGb: Math.round((totalMemory / (1024 * 1024 * 1024)) * 10) / 10,
      freeGb: Math.round((freeMemory / (1024 * 1024 * 1024)) * 10) / 10,
      usedPercent: Math.round(((totalMemory - freeMemory) / totalMemory) * 100),
    },
    cpu: {
      cores: cpuInfo.length,
      model: cpuInfo[0]?.model ?? 'Unknown',
    },
    disk: diskInfo,
    nodeVersion: process.version,
  };
}

// --- Types ---

export interface SystemInfo {
  os: {
    platform: string;
    release: string;
    arch: string;
    hostname: string;
    uptime: number;
  };
  memory: {
    totalGb: number;
    freeGb: number;
    usedPercent: number;
  };
  cpu: {
    cores: number;
    model: string;
  };
  disk: DiskInfo | null;
  nodeVersion: string;
}

interface DiskInfo {
  totalGb: number;
  freeGb: number;
  usedPercent: number;
}
