/**
 * macOS desktop provider — stub implementation.
 *
 * Full macOS support (Accessibility API via AXUIElement, CGWindowListCopyWindowInfo)
 * is planned for Phase 8. Until then every method throws a clear error so callers
 * fail fast rather than silently.
 *
 * To implement Phase 8, this file should be replaced with a provider that uses:
 *   - `koffi` + ApplicationServices framework for AXUIElement tree traversal
 *   - `screencapture` CLI or CoreGraphics for screenshots
 *   - `robotjs` or `nut-js` for input simulation
 */

import type {
  DesktopProvider,
  WindowInfo,
  UIElement,
  ScreenCapture,
} from '../types.js';

const NOT_IMPLEMENTED =
  'macOS desktop support is not yet implemented. ' +
  'Install @aia/desktop-bridge-macos when it becomes available (Phase 8).';

function stub(): never {
  throw new Error(NOT_IMPLEMENTED);
}

export class MacOSProvider implements DesktopProvider {
  getWindows(): Promise<WindowInfo[]> {
    stub();
  }

  getFocusedWindow(): Promise<WindowInfo | null> {
    stub();
  }

  focusWindow(_handle: number): Promise<void> {
    stub();
  }

  getUITree(_handle: number, _depth?: number): Promise<UIElement[]> {
    stub();
  }

  captureWindow(_handle: number): Promise<ScreenCapture> {
    stub();
  }

  captureScreen(): Promise<ScreenCapture> {
    stub();
  }

  captureRegion(
    _x: number,
    _y: number,
    _w: number,
    _h: number,
  ): Promise<ScreenCapture> {
    stub();
  }

  typeText(_text: string): Promise<void> {
    stub();
  }

  pressKey(_key: string, _modifiers?: string[]): Promise<void> {
    stub();
  }

  mouseClick(_x: number, _y: number, _button?: 'left' | 'right'): Promise<void> {
    stub();
  }

  mouseMove(_x: number, _y: number): Promise<void> {
    stub();
  }

  mouseScroll(_x: number, _y: number, _delta: number): Promise<void> {
    stub();
  }
}
