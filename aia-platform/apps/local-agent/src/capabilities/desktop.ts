/**
 * Desktop Capability — Desktop automation and accessibility actions.
 *
 * Exposes @108ai/desktop-bridge to the gateway via the handler registry.
 *
 * Risk tiers (enforced by security.ts):
 * - read-only : listWindows, readWindow, readFocused, screenshot, analyzeScreen, getUITree
 * - low-risk  : focusWindow, scrollWindow
 * - high-risk : typeText, clickElement, pressHotkey, mouseClick
 *
 * HIGH-RISK actions require `requireApprovalHighRisk: false` in config.riskPreferences
 * (set via the Desktop Access toggle in the tray) or an explicit approval flag
 * `_approved: true` injected by the gateway into the params before dispatch.
 *
 * All handlers follow the standard pattern used throughout capabilities/:
 *   handlers.set('desktop.XXX', (params, config) => { ... });
 */

import type { AgentConfig } from '../config.js';

// Lazy import: the bridge is optional at build time; absence must not crash
// the agent when desktop is disabled.
async function bridge() {
  try {
    return await import('@108ai/desktop-bridge');
  } catch (error) {
    throw new Error(
      `@108ai/desktop-bridge is not available: ${error instanceof Error ? error.message : String(error)}. ` +
      'Ensure desktop capabilities are enabled in config and the package is installed.',
    );
  }
}

// --- Type helpers ---

function requireString(params: Record<string, unknown>, key: string): string {
  const v = params[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Required parameter "${key}" must be a non-empty string`);
  }
  return v;
}

function optionalString(params: Record<string, unknown>, key: string): string | undefined {
  const v = params[key];
  return typeof v === 'string' ? v : undefined;
}

function optionalNumber(params: Record<string, unknown>, key: string): number | undefined {
  const v = params[key];
  return typeof v === 'number' ? v : undefined;
}

function requireWindowId(params: Record<string, unknown>): number | string {
  const v = params['windowId'];
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.length > 0) return v;
  throw new Error('Required parameter "windowId" must be a non-empty string or number');
}

function optionalWindowId(params: Record<string, unknown>): number | string | undefined {
  const v = params['windowId'];
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.length > 0) return v;
  return undefined;
}

/**
 * Guard: throw when desktop is disabled in config.
 */
function assertDesktopEnabled(config: AgentConfig): void {
  if (!config.desktopEnabled) {
    throw new Error(
      'Desktop capabilities are disabled. Enable via the Desktop Access toggle in the tray or set desktopEnabled: true in config.',
    );
  }
}

/**
 * Guard: throw when a high-risk action is not explicitly approved.
 * The gateway injects `_approved: true` into params after obtaining user consent.
 */
function assertHighRiskApproved(
  params: Record<string, unknown>,
  config: AgentConfig,
  action: string,
): void {
  if (config.riskPreferences.requireApprovalHighRisk && params['_approved'] !== true) {
    throw new Error(
      `High-risk action "${action}" requires explicit gateway approval. ` +
      'The gateway must set _approved: true in params after user confirmation.',
    );
  }
}

// ============================================================
// Handler map — exported so index.ts can merge it
// ============================================================

// Re-declare the handler type locally to avoid a circular import
// (index.ts imports us; we must not import from index.ts).
type ActionHandler = (
  params: Record<string, unknown>,
  config: AgentConfig,
) => Promise<unknown> | unknown;

export const desktopHandlers = new Map<string, ActionHandler>();

// --- READ-ONLY ---

/**
 * List all visible windows.
 * Returns: { windows: WindowInfo[] }
 */
desktopHandlers.set('desktop.listWindows', async (_params, config) => {
  assertDesktopEnabled(config);
  const db = await bridge();
  const windows = await db.listWindows();
  return { windows };
});

/**
 * Read the text content of a specific window via accessibility APIs.
 * Params: windowId (number | string)
 * Returns: WindowContent
 */
desktopHandlers.set('desktop.readWindow', async (params, config) => {
  assertDesktopEnabled(config);
  const windowId = requireWindowId(params);
  const db = await bridge();
  return db.readWindow(windowId);
});

/**
 * Read the content of the currently focused window.
 * Returns: WindowContent
 */
desktopHandlers.set('desktop.readFocused', async (_params, config) => {
  assertDesktopEnabled(config);
  const db = await bridge();
  return db.readFocusedWindow();
});

/**
 * Capture a screenshot of a window or the full screen.
 * Params: windowId? (number | string)
 * Returns: { data: string (base64 PNG), mimeType: 'image/png', width?: number, height?: number }
 */
desktopHandlers.set('desktop.screenshot', async (params, config) => {
  assertDesktopEnabled(config);
  const windowId = optionalWindowId(params);
  const db = await bridge();
  const buf = await db.captureScreenshot(windowId);
  return {
    data: buf.toString('base64'),
    mimeType: 'image/png',
  };
});

/**
 * Capture a screenshot and run LLM vision analysis.
 * Params:
 *   windowId? (number | string)
 *   prompt?   (string) — custom analysis prompt
 * Returns: ScreenAnalysis
 */
desktopHandlers.set('desktop.analyzeScreen', async (params, config) => {
  assertDesktopEnabled(config);
  if (!config.desktopVisionEnabled) {
    throw new Error('Desktop vision analysis is disabled (desktopVisionEnabled: false).');
  }
  const windowId = optionalWindowId(params);
  const prompt = optionalString(params, 'prompt');
  const db = await bridge();
  return db.analyzeScreen(windowId, prompt);
});

/**
 * Get the full accessibility UI element tree for a window.
 * Params: windowId (number | string)
 * Returns: UITree
 */
desktopHandlers.set('desktop.getUITree', async (params, config) => {
  assertDesktopEnabled(config);
  const windowId = requireWindowId(params);
  const db = await bridge();
  return db.getUITree(windowId);
});

// --- LOW-RISK ---

/**
 * Bring a window to the foreground.
 * Params: windowId (number | string)
 * Returns: { focused: true }
 */
desktopHandlers.set('desktop.focusWindow', async (params, config) => {
  assertDesktopEnabled(config);
  const windowId = requireWindowId(params);
  const db = await bridge();
  await db.focusWindow(windowId);
  return { focused: true };
});

/**
 * Scroll within a window.
 * Params:
 *   windowId  (number | string)
 *   direction ('up' | 'down' | 'left' | 'right') — default 'down'
 *   amount    (number) — scroll steps, default 3
 * Returns: { scrolled: true }
 */
desktopHandlers.set('desktop.scrollWindow', async (params, config) => {
  assertDesktopEnabled(config);
  const windowId = requireWindowId(params);
  const direction = (optionalString(params, 'direction') ?? 'down') as 'up' | 'down' | 'left' | 'right';
  const amount = optionalNumber(params, 'amount') ?? 3;

  if (!['up', 'down', 'left', 'right'].includes(direction)) {
    throw new Error(`Invalid scroll direction "${direction}". Must be: up, down, left, right`);
  }

  const db = await bridge();
  await db.scrollWindow(windowId, direction, amount);
  return { scrolled: true };
});

// --- HIGH-RISK ---

/**
 * Type text into the currently focused input field.
 * Params:
 *   text     (string) — text to type
 *   delayMs? (number) — inter-character delay in ms (default 0)
 *   _approved (boolean) — must be true (set by gateway after user confirmation)
 * Returns: { typed: true, length: number }
 */
desktopHandlers.set('desktop.typeText', async (params, config) => {
  assertDesktopEnabled(config);
  assertHighRiskApproved(params, config, 'desktop.typeText');

  const text = requireString(params, 'text');
  const delayMs = optionalNumber(params, 'delayMs') ?? 0;

  const db = await bridge();

  // Optionally capture a pre-action screenshot for audit
  let screenshotBefore: string | undefined;
  if (config.screenshotBeforeAction) {
    try {
      const buf = await db.captureScreenshot();
      screenshotBefore = buf.toString('base64');
    } catch {
      // Non-fatal; proceed even if screenshot fails
    }
  }

  await db.typeText(text, delayMs);

  return {
    typed: true,
    length: text.length,
    ...(screenshotBefore ? { screenshotBefore } : {}),
  };
});

/**
 * Click a UI element identified by its accessible name.
 * Params:
 *   elementName (string)
 *   windowId?   (number | string)
 *   _approved   (boolean)
 * Returns: { clicked: true, elementName: string }
 */
desktopHandlers.set('desktop.clickElement', async (params, config) => {
  assertDesktopEnabled(config);
  assertHighRiskApproved(params, config, 'desktop.clickElement');

  const elementName = requireString(params, 'elementName');
  const windowId = optionalWindowId(params);
  const db = await bridge();

  let screenshotBefore: string | undefined;
  if (config.screenshotBeforeAction) {
    try {
      const buf = await db.captureScreenshot(windowId);
      screenshotBefore = buf.toString('base64');
    } catch {
      // Non-fatal
    }
  }

  await db.clickElement(elementName, windowId);

  return {
    clicked: true,
    elementName,
    ...(screenshotBefore ? { screenshotBefore } : {}),
  };
});

/**
 * Press a keyboard hotkey or key combination.
 * Params:
 *   keys      (string[]) — e.g. ['ctrl', 'c']
 *   _approved (boolean)
 * Returns: { pressed: true, keys: string[] }
 */
desktopHandlers.set('desktop.pressHotkey', async (params, config) => {
  assertDesktopEnabled(config);
  assertHighRiskApproved(params, config, 'desktop.pressHotkey');

  const keys = params['keys'];
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error('Required parameter "keys" must be a non-empty array of key names');
  }
  const keyStrings = keys.map((k) => {
    if (typeof k !== 'string') throw new Error('Each key must be a string');
    return k;
  });

  const db = await bridge();
  await db.pressHotkey(keyStrings);
  return { pressed: true, keys: keyStrings };
});

/**
 * Click the mouse at absolute screen coordinates.
 * Params:
 *   x         (number)
 *   y         (number)
 *   button?   ('left' | 'right' | 'middle') — default 'left'
 *   _approved (boolean)
 * Returns: { clicked: true, x: number, y: number, button: string }
 */
desktopHandlers.set('desktop.mouseClick', async (params, config) => {
  assertDesktopEnabled(config);
  assertHighRiskApproved(params, config, 'desktop.mouseClick');

  const x = params['x'];
  const y = params['y'];
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('Required parameters "x" and "y" must be numbers');
  }

  const button = (optionalString(params, 'button') ?? 'left') as 'left' | 'right' | 'middle';
  if (!['left', 'right', 'middle'].includes(button)) {
    throw new Error(`Invalid button "${button}". Must be: left, right, middle`);
  }

  const db = await bridge();

  let screenshotBefore: string | undefined;
  if (config.screenshotBeforeAction) {
    try {
      const buf = await db.captureScreenshot();
      screenshotBefore = buf.toString('base64');
    } catch {
      // Non-fatal
    }
  }

  await db.mouseClickAt(x, y, button);

  return {
    clicked: true,
    x,
    y,
    button,
    ...(screenshotBefore ? { screenshotBefore } : {}),
  };
});
