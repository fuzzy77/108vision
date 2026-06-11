/**
 * ScreenCapture layer — unified capture helpers over the provider.
 *
 * Adds a crop/resize pipeline (via sharp) and a simple capture-and-save
 * utility for debugging.
 */

import type { DesktopProvider, ScreenCapture, Bounds } from '../types.js';

export class ScreenCaptureService {
  constructor(private readonly provider: DesktopProvider) {}

  /** Capture a single window's client area. */
  async captureWindow(handle: number): Promise<ScreenCapture> {
    return this.provider.captureWindow(handle);
  }

  /** Capture the full primary monitor. */
  async captureScreen(): Promise<ScreenCapture> {
    return this.provider.captureScreen();
  }

  /** Capture an arbitrary rectangular region of the screen. */
  async captureRegion(bounds: Bounds): Promise<ScreenCapture> {
    return this.provider.captureRegion(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  /**
   * Resize a captured image to the given max dimension while maintaining
   * aspect ratio. Returns a new ScreenCapture with the resized buffer.
   *
   * Useful for reducing payload size before sending to a vision LLM.
   */
  async resizeCapture(
    capture: ScreenCapture,
    maxDimension: number,
  ): Promise<ScreenCapture> {
    if (capture.width <= maxDimension && capture.height <= maxDimension) {
      return capture;
    }

    const sharp = (await import('sharp')).default;
    const resized = await sharp(capture.buffer)
      .resize({
        width: capture.width > capture.height ? maxDimension : undefined,
        height: capture.height >= capture.width ? maxDimension : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    const meta = await sharp(resized).metadata();
    return {
      buffer: resized,
      width: meta.width ?? capture.width,
      height: meta.height ?? capture.height,
      format: 'png',
      windowHandle: capture.windowHandle,
      timestamp: capture.timestamp,
    };
  }

  /**
   * Convert a ScreenCapture buffer to a base64-encoded data URI.
   * Convenient for passing to vision LLMs or embedding in HTML.
   */
  toDataUri(capture: ScreenCapture): string {
    const mime = capture.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${capture.buffer.toString('base64')}`;
  }

  /**
   * Save a capture to disk (debugging / audit trail).
   */
  async saveToDisk(capture: ScreenCapture, filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, capture.buffer);
  }
}
