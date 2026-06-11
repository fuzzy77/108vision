/**
 * Keyboard action layer — delegates to the platform provider.
 *
 * Wraps raw provider calls with timing, logging, and validation so
 * higher-level callers get consistent behaviour regardless of OS.
 */

import type { DesktopProvider } from '../types.js';

export class KeyboardController {
  constructor(private readonly provider: DesktopProvider) {}

  /**
   * Type a string of text at the current focus position.
   * Prefer this over pressKey for continuous text input.
   *
   * @param text Unicode string to type (handles special chars via nut-js).
   */
  async type(text: string): Promise<void> {
    if (!text) return;
    await this.provider.typeText(text);
  }

  /**
   * Press a single key, optionally with modifier keys held.
   *
   * @param key Key name: 'a'-'z', 'Enter', 'Tab', 'Escape', 'F1'-'F12', etc.
   * @param modifiers Modifier keys to hold: 'ctrl', 'alt', 'shift', 'meta'.
   *
   * @example
   * await keyboard.press('s', ['ctrl']);      // Ctrl+S
   * await keyboard.press('F5');               // F5
   * await keyboard.press('Enter');
   */
  async press(key: string, modifiers: string[] = []): Promise<void> {
    await this.provider.pressKey(key, modifiers);
  }

  /**
   * Send a hotkey combination (convenience wrapper over `press`).
   *
   * @param keys Array of key names; modifiers should come first by convention.
   * @example
   * await keyboard.hotkey(['ctrl', 'c']);     // Copy
   * await keyboard.hotkey(['ctrl', 'z']);     // Undo
   * await keyboard.hotkey(['alt', 'F4']);     // Close window
   */
  async hotkey(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    if (keys.length === 1) {
      await this.press(keys[0]!);
      return;
    }
    const mainKey = keys[keys.length - 1]!;
    const modifiers = keys.slice(0, -1);
    await this.press(mainKey, modifiers);
  }

  /**
   * Select all text in the focused control (Ctrl+A).
   */
  async selectAll(): Promise<void> {
    await this.press('a', ['ctrl']);
  }

  /**
   * Copy the current selection to the clipboard (Ctrl+C).
   */
  async copy(): Promise<void> {
    await this.press('c', ['ctrl']);
  }

  /**
   * Paste clipboard content (Ctrl+V).
   */
  async paste(): Promise<void> {
    await this.press('v', ['ctrl']);
  }

  /**
   * Undo the last action (Ctrl+Z).
   */
  async undo(): Promise<void> {
    await this.press('z', ['ctrl']);
  }
}
