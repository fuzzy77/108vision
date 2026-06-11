/**
 * Confirmation layer — pre/post screenshot capture and undo buffer.
 *
 * Wraps an action with:
 *   1. Pre-action screenshot (evidence of what the screen looked like before)
 *   2. Action execution
 *   3. Post-action screenshot (evidence of the result)
 *   4. Optional undo screenshot storage for later comparison
 *
 * This module does NOT decide whether to take screenshots — that decision
 * belongs to DesktopBridge based on the DesktopBridgeConfig. This module
 * only does the capturing and wraps the result.
 */

import type { ScreenCapture } from '../types.js';
import type { ScreenCaptureService } from '../perception/screen-capture.js';

export interface ConfirmedAction<T> {
  result: T;
  preScreenshot?: ScreenCapture;
  postScreenshot?: ScreenCapture;
  durationMs: number;
}

export interface ConfirmationOptions {
  capturePreScreenshot: boolean;
  capturePostScreenshot: boolean;
  /** If provided, take a window-scoped screenshot instead of full screen. */
  windowHandle?: number;
}

export class ConfirmationService {
  constructor(private readonly capture: ScreenCaptureService) {}

  /**
   * Execute an action function wrapped with optional pre/post screenshots.
   *
   * @param action The async function to execute.
   * @param opts   Controls whether to capture screenshots.
   * @returns The action's return value along with captured screenshots and duration.
   */
  async withConfirmation<T>(
    action: () => Promise<T>,
    opts: ConfirmationOptions,
  ): Promise<ConfirmedAction<T>> {
    let preScreenshot: ScreenCapture | undefined;
    let postScreenshot: ScreenCapture | undefined;

    if (opts.capturePreScreenshot) {
      preScreenshot = opts.windowHandle !== undefined
        ? await this.capture.captureWindow(opts.windowHandle).catch(() => undefined)
        : await this.capture.captureScreen().catch(() => undefined);
    }

    const start = Date.now();
    const result = await action();
    const durationMs = Date.now() - start;

    if (opts.capturePostScreenshot) {
      // Small delay to allow the application to visually update
      await sleep(100);
      postScreenshot = opts.windowHandle !== undefined
        ? await this.capture.captureWindow(opts.windowHandle).catch(() => undefined)
        : await this.capture.captureScreen().catch(() => undefined);
    }

    return { result, preScreenshot, postScreenshot, durationMs };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
