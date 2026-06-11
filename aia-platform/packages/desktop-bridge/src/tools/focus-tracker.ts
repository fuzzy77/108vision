/**
 * FocusTracker — observe which window has foreground focus over time.
 *
 * Provides:
 *   - One-shot `getCurrent()` — who has focus right now?
 *   - Polling `watch()` — emit events when focus changes
 *   - History — last N focus transitions
 *
 * The polling approach is used because neither Win32 nor macOS exposes a
 * simple cross-platform "focus changed" event without native hooks or
 * platform-specific APIs. A 250ms poll is imperceptible to users and adds
 * negligible CPU overhead.
 */

import type { DesktopProvider, WindowInfo } from '../types.js';

export interface FocusChange {
  previousWindow: WindowInfo | null;
  currentWindow: WindowInfo | null;
  timestamp: number;
}

export type FocusChangeHandler = (change: FocusChange) => void;

export class FocusTracker {
  private _pollingHandle: ReturnType<typeof setInterval> | null = null;
  private _currentWindow: WindowInfo | null = null;
  private _history: FocusChange[] = [];
  private _handlers: Set<FocusChangeHandler> = new Set();
  private readonly _maxHistory: number;

  constructor(
    private readonly provider: DesktopProvider,
    options: { maxHistory?: number } = {},
  ) {
    this._maxHistory = options.maxHistory ?? 20;
  }

  // ---------------------------------------------------------------------------
  // One-shot
  // ---------------------------------------------------------------------------

  /** Return the window that currently holds keyboard focus. */
  async getCurrent(): Promise<WindowInfo | null> {
    return this.provider.getFocusedWindow();
  }

  // ---------------------------------------------------------------------------
  // Polling watch
  // ---------------------------------------------------------------------------

  /**
   * Start polling for focus changes.
   * @param intervalMs Polling interval in milliseconds (default: 250).
   */
  start(intervalMs = 250): void {
    if (this._pollingHandle) return; // already running

    this._pollingHandle = setInterval(async () => {
      try {
        await this._poll();
      } catch {
        // Swallow errors — the OS may briefly not respond during lock/sleep
      }
    }, intervalMs);
  }

  /** Stop polling. */
  stop(): void {
    if (this._pollingHandle) {
      clearInterval(this._pollingHandle);
      this._pollingHandle = null;
    }
  }

  /** True if the tracker is currently polling. */
  get isRunning(): boolean {
    return this._pollingHandle !== null;
  }

  // ---------------------------------------------------------------------------
  // Event subscription
  // ---------------------------------------------------------------------------

  /**
   * Register a handler that is called whenever focus changes.
   * Returns an unsubscribe function.
   */
  onChange(handler: FocusChangeHandler): () => void {
    this._handlers.add(handler);
    return () => this._handlers.delete(handler);
  }

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------

  /** Return the last N focus changes (most recent first). */
  getHistory(n?: number): FocusChange[] {
    const history = [...this._history].reverse();
    return n !== undefined ? history.slice(0, n) : history;
  }

  /** Return the most recent focus change, or null if none recorded. */
  getLastChange(): FocusChange | null {
    return this._history.length > 0
      ? this._history[this._history.length - 1]!
      : null;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async _poll(): Promise<void> {
    const focused = await this.provider.getFocusedWindow();

    const changed =
      focused?.handle !== this._currentWindow?.handle ||
      focused?.title !== this._currentWindow?.title;

    if (!changed) return;

    const change: FocusChange = {
      previousWindow: this._currentWindow,
      currentWindow: focused,
      timestamp: Date.now(),
    };

    this._currentWindow = focused;

    // Append to history, trimming if over limit
    this._history.push(change);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    // Notify subscribers
    for (const handler of this._handlers) {
      try {
        handler(change);
      } catch {
        // Individual handler errors must not crash the tracker
      }
    }
  }
}
