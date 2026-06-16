/**
 * Screen handler — screenshot capture and active window info.
 *
 * Strategy:
 *   captureScreen()     — full-screen PNG via PowerShell (Win) / screencapture (macOS)
 *                         Falls back to a 1x1 placeholder PNG when tools are unavailable.
 *   getActiveWindow()   — foreground window title + process via PowerShell (Win) /
 *                         AppleScript (macOS).
 *
 * No external npm dependencies — Node.js built-in modules only.
 * The powershell approach is consistent with what the rest of the bridge already uses.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// captureScreen
// ---------------------------------------------------------------------------

export interface ScreenshotResult {
  /** Base64-encoded PNG image. */
  data: string;
  mimeType: 'image/png';
  /** Width in pixels. 0 when unavailable. */
  width: number;
  /** Height in pixels. 0 when unavailable. */
  height: number;
  /** Whether this is a real screenshot (true) or the fallback placeholder (false). */
  available: boolean;
}

export async function captureScreen(): Promise<ScreenshotResult> {
  if (process.platform === 'win32') {
    return captureScreenWindows();
  }
  if (process.platform === 'darwin') {
    return captureScreenMacOS();
  }
  // Linux — attempt scrot, then imagemagick import, then placeholder
  return captureScreenLinux();
}

async function captureScreenWindows(): Promise<ScreenshotResult> {
  const tmpFile = join(tmpdir(), `aia_screen_${Date.now()}.png`);

  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bmp = New-Object System.Drawing.Bitmap $screen.Bounds.Width, $screen.Bounds.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
$g.Dispose()
$bmp.Save('${tmpFile.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
"$($screen.Bounds.Width)|$($screen.Bounds.Height)"
`.trim();

  try {
    const { stdout } = await execFileAsync(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { encoding: 'utf-8' },
    );
    const parts = stdout.trim().split('|');
    const width = parseInt(parts[0] ?? '0', 10);
    const height = parseInt(parts[1] ?? '0', 10);

    if (!existsSync(tmpFile)) {
      return placeholderScreenshot();
    }

    const buffer = readFileSync(tmpFile);
    try { unlinkSync(tmpFile); } catch { /* non-fatal */ }

    return {
      data: buffer.toString('base64'),
      mimeType: 'image/png',
      width: isNaN(width) ? 0 : width,
      height: isNaN(height) ? 0 : height,
      available: true,
    };
  } catch {
    if (existsSync(tmpFile)) {
      try { unlinkSync(tmpFile); } catch { /* non-fatal */ }
    }
    return placeholderScreenshot();
  }
}

async function captureScreenMacOS(): Promise<ScreenshotResult> {
  const tmpFile = join(tmpdir(), `aia_screen_${Date.now()}.png`);

  try {
    // -x = silent (no sound), -t png = PNG format
    await execFileAsync('screencapture', ['-x', '-t', 'png', tmpFile], {
      encoding: 'utf-8',
    });

    if (!existsSync(tmpFile)) return placeholderScreenshot();

    const buffer = readFileSync(tmpFile);
    try { unlinkSync(tmpFile); } catch { /* non-fatal */ }

    // Parse dimensions from PNG header (bytes 16–23 of IHDR chunk)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    return {
      data: buffer.toString('base64'),
      mimeType: 'image/png',
      width,
      height,
      available: true,
    };
  } catch {
    if (existsSync(tmpFile)) {
      try { unlinkSync(tmpFile); } catch { /* non-fatal */ }
    }
    return placeholderScreenshot();
  }
}

async function captureScreenLinux(): Promise<ScreenshotResult> {
  const tmpFile = join(tmpdir(), `aia_screen_${Date.now()}.png`);

  // Try scrot first, then import (ImageMagick)
  const tools: [string, string[]][] = [
    ['scrot', [tmpFile]],
    ['import', ['-window', 'root', tmpFile]],
  ];

  for (const [bin, args] of tools) {
    try {
      await execFileAsync(bin, args, { encoding: 'utf-8' });

      if (!existsSync(tmpFile)) continue;

      const buffer = readFileSync(tmpFile);
      try { unlinkSync(tmpFile); } catch { /* non-fatal */ }

      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);

      return {
        data: buffer.toString('base64'),
        mimeType: 'image/png',
        width,
        height,
        available: true,
      };
    } catch {
      // Try next tool
    }
  }

  if (existsSync(tmpFile)) {
    try { unlinkSync(tmpFile); } catch { /* non-fatal */ }
  }

  return placeholderScreenshot();
}

/**
 * Minimal 1x1 transparent PNG returned when no screenshot tool is available.
 * Callers should check `available: false` and communicate the limitation.
 */
function placeholderScreenshot(): ScreenshotResult {
  // 1x1 transparent PNG (67 bytes, base64-encoded)
  const PNG_1X1 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  return {
    data: PNG_1X1,
    mimeType: 'image/png',
    width: 1,
    height: 1,
    available: false,
  };
}

// ---------------------------------------------------------------------------
// getActiveWindow
// ---------------------------------------------------------------------------

export interface ActiveWindowInfo {
  title: string;
  process: string;
  /** Platform-specific window handle or PID. 0 when unavailable. */
  handle: number;
}

export async function getActiveWindow(): Promise<ActiveWindowInfo> {
  if (process.platform === 'win32') {
    return getActiveWindowWindows();
  }
  if (process.platform === 'darwin') {
    return getActiveWindowMacOS();
  }
  return getActiveWindowLinux();
}

async function getActiveWindowWindows(): Promise<ActiveWindowInfo> {
  const script = `
Add-Type @"
using System;
using System.Text;
using System.Diagnostics;
using System.Runtime.InteropServices;
public class Fg {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hwnd, StringBuilder sb, int maxCount);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
}
"@
$hwnd = [Fg]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 512
[Fg]::GetWindowText($hwnd, $sb, 512) | Out-Null
$pid = [uint32]0
[Fg]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
try { $pname = (Get-Process -Id $pid -ErrorAction Stop).ProcessName } catch { $pname = '' }
"$([int]$hwnd)|$($sb.ToString())|$pname"
`.trim();

  try {
    const { stdout } = await execFileAsync(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { encoding: 'utf-8' },
    );
    const parts = stdout.trim().split('|');
    return {
      handle: parseInt(parts[0] ?? '0', 10) || 0,
      title: parts[1] ?? '',
      process: parts[2] ?? '',
    };
  } catch {
    return { title: '', process: '', handle: 0 };
  }
}

async function getActiveWindowMacOS(): Promise<ActiveWindowInfo> {
  const script = `
tell application "System Events"
  set frontApp to first process whose frontmost is true
  set appName to name of frontApp
  try
    set winTitle to name of first window of frontApp
  on error
    set winTitle to appName
  end try
  return appName & "|" & winTitle
end tell
`.trim();

  try {
    const { stdout } = await execFileAsync('osascript', ['-e', script], {
      encoding: 'utf-8',
    });
    const parts = stdout.trim().split('|');
    return {
      title: parts[1] ?? parts[0] ?? '',
      process: parts[0] ?? '',
      handle: 0,
    };
  } catch {
    return { title: '', process: '', handle: 0 };
  }
}

async function getActiveWindowLinux(): Promise<ActiveWindowInfo> {
  try {
    const { stdout: idStr } = await execFileAsync('xdotool', ['getactivewindow'], {
      encoding: 'utf-8',
    });
    const handle = parseInt(idStr.trim(), 10);

    const { stdout: title } = await execFileAsync(
      'xdotool',
      ['getwindowname', String(handle)],
      { encoding: 'utf-8' },
    );

    // xdotool getwindowpid for process name
    let processName = '';
    try {
      const { stdout: pidStr } = await execFileAsync(
        'xdotool',
        ['getwindowpid', String(handle)],
        { encoding: 'utf-8' },
      );
      const pid = parseInt(pidStr.trim(), 10);
      const { stdout: cmdline } = await execFileAsync(
        'cat',
        [`/proc/${pid}/comm`],
        { encoding: 'utf-8' },
      );
      processName = cmdline.trim();
    } catch { /* non-fatal */ }

    return {
      title: title.trim(),
      process: processName,
      handle: isNaN(handle) ? 0 : handle,
    };
  } catch {
    return { title: '', process: '', handle: 0 };
  }
}
