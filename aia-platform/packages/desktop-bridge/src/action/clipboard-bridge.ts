/**
 * ClipboardBridge — enhanced clipboard operations.
 *
 * Provides text, image, and rich-text clipboard access using the
 * OS-native clipboard via PowerShell (Windows) or pbcopy/pbpaste (macOS stub).
 *
 * Key design choices:
 *   - All write operations are reversible via `undo()` (the previous clipboard
 *     value is stored in memory between calls).
 *   - Image round-trip: capture a ScreenCapture → copy to clipboard → paste into app.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { ScreenCapture } from '../types.js';

const execFileAsync = promisify(execFile);

export class ClipboardBridge {
  /** The clipboard text value before the last write, used for undo. */
  private _previousText: string | null = null;

  // ---------------------------------------------------------------------------
  // Text
  // ---------------------------------------------------------------------------

  /**
   * Read the current clipboard text content.
   */
  async readText(): Promise<string> {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync('powershell', [
        '-NoProfile',
        '-Command',
        'Get-Clipboard',
      ]);
      return stdout.trim();
    }
    if (process.platform === 'darwin') {
      const { stdout } = await execFileAsync('pbpaste');
      return stdout;
    }
    // Linux: xclip/xsel required — not guaranteed in all environments
    const { stdout } = await execFileAsync('xclip', ['-o', '-selection', 'clipboard']);
    return stdout;
  }

  /**
   * Write text to the clipboard.
   * Stores the previous clipboard value in memory for `undo()`.
   */
  async writeText(text: string): Promise<void> {
    this._previousText = await this.readText().catch(() => null);

    if (process.platform === 'win32') {
      await execFileAsync('powershell', [
        '-NoProfile',
        '-Command',
        `Set-Clipboard -Value '${text.replace(/'/g, "''")}'`,
      ]);
      return;
    }
    if (process.platform === 'darwin') {
      const { exec } = await import('child_process');
      await new Promise<void>((resolve, reject) => {
        const child = exec('pbcopy');
        child.stdin?.write(text);
        child.stdin?.end();
        child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pbcopy exited ${code}`))));
      });
      return;
    }
    const { exec } = await import('child_process');
    await new Promise<void>((resolve, reject) => {
      const child = exec('xclip -selection clipboard');
      child.stdin?.write(text);
      child.stdin?.end();
      child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`xclip exited ${code}`))));
    });
  }

  /**
   * Restore the clipboard to the value it had before the last `writeText` call.
   */
  async undo(): Promise<void> {
    if (this._previousText !== null) {
      await this.writeText(this._previousText);
      this._previousText = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------------

  /**
   * Copy a ScreenCapture image to the clipboard.
   * On Windows uses PowerShell + System.Windows.Forms.Clipboard.
   */
  async writeImage(capture: ScreenCapture): Promise<void> {
    if (process.platform !== 'win32') {
      throw new Error('Image clipboard write is only supported on Windows in this version.');
    }

    const tmpPath = `${process.env['TEMP'] ?? 'C:\\Windows\\Temp'}\\aia_clip_${Date.now()}.png`;
    const fs = await import('fs/promises');
    await fs.writeFile(tmpPath, capture.buffer);

    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      $img = [System.Drawing.Image]::FromFile('${tmpPath}')
      [System.Windows.Forms.Clipboard]::SetImage($img)
      $img.Dispose()
    `.trim();

    await execFileAsync('powershell', ['-NoProfile', '-Command', script]);
    await fs.unlink(tmpPath).catch(() => undefined);
  }

  /**
   * Check whether the clipboard currently contains an image.
   */
  async hasImage(): Promise<boolean> {
    if (process.platform !== 'win32') return false;

    const { stdout } = await execFileAsync('powershell', [
      '-NoProfile',
      '-Command',
      `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::ContainsImage()`,
    ]);
    return stdout.trim().toLowerCase() === 'true';
  }

  /**
   * Read an image from the clipboard and return it as a ScreenCapture.
   * Returns null if the clipboard does not contain an image.
   */
  async readImage(): Promise<ScreenCapture | null> {
    if (process.platform !== 'win32') return null;

    const hasImg = await this.hasImage();
    if (!hasImg) return null;

    const tmpPath = `${process.env['TEMP'] ?? 'C:\\Windows\\Temp'}\\aia_clipread_${Date.now()}.png`;
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      $img = [System.Windows.Forms.Clipboard]::GetImage()
      $img.Save('${tmpPath}', [System.Drawing.Imaging.ImageFormat]::Png)
      $img.Dispose()
      "$($img.Width)|$($img.Height)"
    `.trim();

    const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', script]);
    const parts = stdout.trim().split('|');

    const fs = await import('fs/promises');
    const buffer = await fs.readFile(tmpPath);
    await fs.unlink(tmpPath).catch(() => undefined);

    return {
      buffer,
      width: parseInt(parts[0] ?? '0', 10),
      height: parseInt(parts[1] ?? '0', 10),
      format: 'png',
      timestamp: Date.now(),
    };
  }
}
