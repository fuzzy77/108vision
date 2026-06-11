/**
 * RiskClassifier — assign a risk level to desktop actions before execution.
 *
 * Risk taxonomy:
 *   read-only  — no side effects; safe to call without confirmation
 *   low-risk   — changes local state (focus, clipboard read) but is easily reversible
 *   high-risk  — writes to the OS, modifies application state, or sends input
 *
 * Risk is used by the DesktopBridge facade to decide:
 *   - Whether to capture pre/post screenshots
 *   - Whether to check the window guard before proceeding
 *   - What to log in the ActionResult audit trail
 */

import type { RiskLevel } from '../types.js';

// ---------------------------------------------------------------------------
// Action type definitions
// ---------------------------------------------------------------------------

export type ActionType =
  | 'listWindows'
  | 'readWindow'
  | 'readFocused'
  | 'screenshot'
  | 'perceive'
  | 'analyzeScreen'
  | 'getUITree'
  | 'focusWindow'
  | 'clipboardRead'
  | 'scrollWindow'
  | 'mouseMove'
  | 'typeText'
  | 'pressKey'
  | 'mouseClick'
  | 'clipboardWrite'
  | 'clipboardWriteImage'
  | 'doubleClick'
  | 'rightClick'
  | 'hotkey';

const RISK_MAP: Record<ActionType, RiskLevel> = {
  // Read-only — no side effects
  listWindows: 'read-only',
  readWindow: 'read-only',
  readFocused: 'read-only',
  screenshot: 'read-only',
  perceive: 'read-only',
  analyzeScreen: 'read-only',
  getUITree: 'read-only',

  // Low-risk — easily reversible
  focusWindow: 'low-risk',
  clipboardRead: 'low-risk',
  scrollWindow: 'low-risk',
  mouseMove: 'low-risk',

  // High-risk — sends input or modifies state
  typeText: 'high-risk',
  pressKey: 'high-risk',
  mouseClick: 'high-risk',
  doubleClick: 'high-risk',
  rightClick: 'high-risk',
  hotkey: 'high-risk',
  clipboardWrite: 'high-risk',
  clipboardWriteImage: 'high-risk',
};

export class RiskClassifier {
  /**
   * Return the risk level for the given action type.
   */
  classify(actionType: ActionType): RiskLevel {
    return RISK_MAP[actionType] ?? 'high-risk';
  }

  /**
   * Return true if the action is safe to run without pre/post screenshots
   * or window guard checks.
   */
  isReadOnly(actionType: ActionType): boolean {
    return this.classify(actionType) === 'read-only';
  }

  /**
   * Return true if the action requires pre-execution safety checks
   * (window guard verification, rate limit enforcement).
   */
  requiresSafetyCheck(actionType: ActionType): boolean {
    return this.classify(actionType) === 'high-risk';
  }

  /**
   * Return a human-readable description of why an action has its risk level.
   */
  explain(actionType: ActionType): string {
    const level = this.classify(actionType);
    switch (level) {
      case 'read-only':
        return `"${actionType}" only reads desktop state — no side effects.`;
      case 'low-risk':
        return `"${actionType}" changes local/transient state but is easily reversible.`;
      case 'high-risk':
        return `"${actionType}" sends input or modifies application state — requires safety checks.`;
    }
  }
}
