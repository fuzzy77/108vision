/**
 * WindowManager — enumerate and focus application windows.
 *
 * Thin wrapper around the provider's window enumeration with added
 * filtering utilities used by the bridge facade.
 */

import type { DesktopProvider, WindowInfo } from '../types.js';

export class WindowManager {
  constructor(private readonly provider: DesktopProvider) {}

  /** Return all visible top-level windows. */
  async listWindows(): Promise<WindowInfo[]> {
    return this.provider.getWindows();
  }

  /**
   * Return all windows whose processName or title contains the given string
   * (case-insensitive).
   */
  async findWindows(query: string): Promise<WindowInfo[]> {
    const all = await this.provider.getWindows();
    const q = query.toLowerCase();
    return all.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.processName.toLowerCase().includes(q),
    );
  }

  /** Return the window that currently holds keyboard focus. */
  async getFocused(): Promise<WindowInfo | null> {
    return this.provider.getFocusedWindow();
  }

  /**
   * Bring the window identified by `handle` to the foreground.
   * Waits up to `timeoutMs` for the window to actually receive focus.
   */
  async focus(handle: number, timeoutMs = 2000): Promise<void> {
    await this.provider.focusWindow(handle);

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const focused = await this.provider.getFocusedWindow();
      if (focused?.handle === handle) return;
      await sleep(50);
    }
    // Non-fatal — some applications (UAC dialogs, system windows) cannot
    // be forcefully focused from an unprivileged process.
  }

  /**
   * Return the window for the given handle, or null if not found.
   */
  async getWindow(handle: number): Promise<WindowInfo | null> {
    const all = await this.provider.getWindows();
    return all.find((w) => w.handle === handle) ?? null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
