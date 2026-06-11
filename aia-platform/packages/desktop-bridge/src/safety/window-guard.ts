/**
 * WindowGuard — verify that the target window is still the correct one
 * before executing a high-risk action.
 *
 * Guards against the "wrong window" class of bugs where:
 *   1. User changes focus between the planning step and the execution step.
 *   2. The target application closes and another window takes the same handle.
 *   3. The target window title changes (e.g. "Save As" dialog appeared).
 *
 * Usage:
 *   const guard = new WindowGuard(provider, targetWindow);
 *   await guard.verify();   // throws WindowGuardError if window changed
 */

import type { DesktopProvider, WindowInfo } from '../types.js';

export class WindowGuardError extends Error {
  constructor(
    public readonly reason: 'not_found' | 'title_changed' | 'process_changed' | 'not_focused',
    message: string,
  ) {
    super(message);
    this.name = 'WindowGuardError';
  }
}

export interface WindowGuardOptions {
  /**
   * Whether to require the target window to be in the foreground.
   * Default: false — useful when clicking on background windows.
   */
  requireFocus?: boolean;
  /**
   * Allow the title to differ by this many characters (Levenshtein distance).
   * Default: 0 — exact match required.
   * Set to a small positive value if the title includes a counter or timestamp.
   */
  titleTolerance?: number;
}

export class WindowGuard {
  private readonly expectedHandle: number;
  private readonly expectedTitle: string;
  private readonly expectedProcess: string;
  private readonly options: Required<WindowGuardOptions>;

  constructor(
    private readonly provider: DesktopProvider,
    expectedWindow: WindowInfo,
    options: WindowGuardOptions = {},
  ) {
    this.expectedHandle = expectedWindow.handle;
    this.expectedTitle = expectedWindow.title;
    this.expectedProcess = expectedWindow.processName;
    this.options = {
      requireFocus: options.requireFocus ?? false,
      titleTolerance: options.titleTolerance ?? 0,
    };
  }

  /**
   * Verify that the target window is still valid and unchanged.
   *
   * @throws {WindowGuardError} If any guard condition is violated.
   */
  async verify(): Promise<void> {
    const allWindows = await this.provider.getWindows();
    const current = allWindows.find((w) => w.handle === this.expectedHandle);

    if (!current) {
      throw new WindowGuardError(
        'not_found',
        `Target window (handle=${this.expectedHandle}, title="${this.expectedTitle}") no longer exists.`,
      );
    }

    if (current.processName !== this.expectedProcess) {
      throw new WindowGuardError(
        'process_changed',
        `Window handle ${this.expectedHandle} is now owned by process "${current.processName}" ` +
        `(expected "${this.expectedProcess}"). The window was likely closed and reused.`,
      );
    }

    const titleDist = levenshtein(current.title, this.expectedTitle);
    if (titleDist > this.options.titleTolerance) {
      throw new WindowGuardError(
        'title_changed',
        `Target window title changed from "${this.expectedTitle}" to "${current.title}". ` +
        `The application state may have changed (e.g. a dialog appeared).`,
      );
    }

    if (this.options.requireFocus && !current.isFocused) {
      throw new WindowGuardError(
        'not_focused',
        `Target window "${current.title}" is not in the foreground. ` +
        'Call focusWindow() before executing input actions.',
      );
    }
  }

  /**
   * Verify silently — returns false instead of throwing.
   * Use this when you want to handle the failure gracefully rather than
   * propagating the exception.
   */
  async check(): Promise<{ valid: boolean; reason?: string }> {
    try {
      await this.verify();
      return { valid: true };
    } catch (error) {
      if (error instanceof WindowGuardError) {
        return { valid: false, reason: error.message };
      }
      throw error;
    }
  }
}

// ---------------------------------------------------------------------------
// Levenshtein distance — used for fuzzy title matching
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }

  return matrix[b.length]![a.length]!;
}
