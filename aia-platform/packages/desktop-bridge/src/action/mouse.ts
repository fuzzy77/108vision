/**
 * Mouse action layer — delegates to the platform provider.
 *
 * Provides higher-level operations (click center of element bounds,
 * smooth move, double-click) on top of the raw provider primitives.
 */

import type { DesktopProvider, Bounds } from '../types.js';

export class MouseController {
  constructor(private readonly provider: DesktopProvider) {}

  /**
   * Click at absolute screen coordinates.
   */
  async click(x: number, y: number, button: 'left' | 'right' = 'left'): Promise<void> {
    await this.provider.mouseClick(x, y, button);
  }

  /**
   * Double-click at absolute screen coordinates.
   */
  async doubleClick(x: number, y: number): Promise<void> {
    await this.provider.mouseClick(x, y, 'left');
    // Small delay between clicks — too short = treated as single click by some apps
    await sleep(80);
    await this.provider.mouseClick(x, y, 'left');
  }

  /**
   * Right-click at absolute screen coordinates (context menu).
   */
  async rightClick(x: number, y: number): Promise<void> {
    await this.provider.mouseClick(x, y, 'right');
  }

  /**
   * Click the centre of a bounding box (e.g. a UIElement's bounds).
   */
  async clickCenter(bounds: Bounds, button: 'left' | 'right' = 'left'): Promise<void> {
    const cx = Math.round(bounds.x + bounds.width / 2);
    const cy = Math.round(bounds.y + bounds.height / 2);
    await this.provider.mouseClick(cx, cy, button);
  }

  /**
   * Move the cursor to absolute screen coordinates.
   */
  async move(x: number, y: number): Promise<void> {
    await this.provider.mouseMove(x, y);
  }

  /**
   * Hover over a bounding box centre (move without clicking).
   */
  async hover(bounds: Bounds): Promise<void> {
    const cx = Math.round(bounds.x + bounds.width / 2);
    const cy = Math.round(bounds.y + bounds.height / 2);
    await this.provider.mouseMove(cx, cy);
  }

  /**
   * Scroll at the given coordinates.
   * @param delta Positive = scroll down, negative = scroll up.
   *              One "notch" on a typical wheel ≈ 3.
   */
  async scroll(x: number, y: number, delta: number): Promise<void> {
    await this.provider.mouseScroll(x, y, delta);
  }

  /**
   * Scroll within a bounding box.
   */
  async scrollInBounds(bounds: Bounds, delta: number): Promise<void> {
    const cx = Math.round(bounds.x + bounds.width / 2);
    const cy = Math.round(bounds.y + bounds.height / 2);
    await this.provider.mouseScroll(cx, cy, delta);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
