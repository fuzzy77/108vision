/**
 * Desktop Capability — Desktop automation and accessibility actions.
 *
 * Exposes @aia/desktop-bridge to the gateway via the handler registry.
 *
 * The bridge is initialised lazily on first use via `getOrInitBridge()`.
 * A single DesktopBridge instance is reused across calls within the
 * agent's lifetime (one process = one bridge = one provider connection).
 *
 * Risk tiers (enforced by security.ts):
 * - read-only : listWindows, readWindow, readFocused, screenshot, analyzeScreen, getUITree
 * - low-risk  : focusWindow, scrollWindow
 * - high-risk : typeText, clickElement, pressHotkey, mouseClick
 *
 * HIGH-RISK actions require `requireApprovalHighRisk: false` in config.riskPreferences
 * (set via the Desktop Access toggle in the tray) or an explicit approval flag
 * `_approved: true` injected by the gateway into the params before dispatch.
 */

import type { AgentConfig } from '../config.js';
import type { DesktopBridge } from '@aia/desktop-bridge';

// ---------------------------------------------------------------------------
// Bridge singleton — lazily initialised
// ---------------------------------------------------------------------------

let _bridge: DesktopBridge | null = null;
let _bridgeInitialising: Promise<DesktopBridge> | null = null;

/**
 * Return the shared DesktopBridge instance, initialising it on first call.
 * Subsequent calls return the cached instance immediately.
 *
 * Throws if `@aia/desktop-bridge` is not installed or the platform is
 * unsupported (Linux is not yet supported by the bridge).
 */
async function getOrInitBridge(): Promise<DesktopBridge> {
  if (_bridge) return _bridge;

  // Avoid double-init under concurrent calls
  if (_bridgeInitialising) return _bridgeInitialising;

  _bridgeInitialising = (async () => {
    let mod: typeof import('@aia/desktop-bridge');
    try {
      mod = await import('@aia/desktop-bridge');
    } catch (error) {
      throw new Error(
        `@aia/desktop-bridge is not available: ${error instanceof Error ? error.message : String(error)}. ` +
        'Ensure desktop capabilities are enabled and the package is installed.',
      );
    }

    const bridge = await mod.createDesktopBridge({
      // Platform is auto-detected; visionEnabled/ocrEnabled default to true
      screenshotBeforeAction: true,
      screenshotAfterAction: false, // only pre-action for the agent
    });

    _bridge = bridge;
    _bridgeInitialising = null;
    return bridge;
  })();

  return _bridgeInitialising;
}

// ---------------------------------------------------------------------------
// Type helpers (local — avoids a circular import with index.ts)
// ---------------------------------------------------------------------------

type ActionHandler = (
  params: Record<string, unknown>,
  config: AgentConfig,
) => Promise<unknown> | unknown;

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

function requireWindowHandle(params: Record<string, unknown>): number {
  const v = params['windowId'];
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    if (!isNaN(n)) return n;
  }
  throw new Error('Required parameter "windowId" must be a number or numeric string');
}

function optionalWindowHandle(params: Record<string, unknown>): number | undefined {
  const v = params['windowId'];
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.length > 0) {
    const n = parseInt(v, 10);
    if (!isNaN(n)) return n;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function assertDesktopEnabled(config: AgentConfig): void {
  if (!config.desktopEnabled) {
    throw new Error(
      'Desktop capabilities are disabled. Enable via the Desktop Access toggle in the tray ' +
      'or set desktopEnabled: true in config.',
    );
  }
}

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
// Handler map
// ============================================================

export const desktopHandlers = new Map<string, ActionHandler>();

// --- READ-ONLY ---

/**
 * List all visible windows.
 * Returns: { windows: WindowInfo[] }
 */
desktopHandlers.set('desktop.listWindows', async (_params, config) => {
  assertDesktopEnabled(config);
  const db = await getOrInitBridge();
  const windows = await db.listWindows();
  return { windows };
});

/**
 * Read the text content of a specific window via accessibility / OCR / vision.
 * Params: windowId (number | string)
 * Returns: { content: string; method: string }
 */
desktopHandlers.set('desktop.readWindow', async (params, config) => {
  assertDesktopEnabled(config);
  const handle = requireWindowHandle(params);
  const db = await getOrInitBridge();
  const result = await db.perceive(handle);
  return { content: result.content, method: result.method, confidence: result.confidence };
});

/**
 * Read the content of the currently focused window.
 * Returns: { content: string; method: string }
 */
desktopHandlers.set('desktop.readFocused', async (_params, config) => {
  assertDesktopEnabled(config);
  const db = await getOrInitBridge();
  const result = await db.perceive();
  return { content: result.content, method: result.method, confidence: result.confidence };
});

/**
 * Capture a screenshot of a window or the full screen.
 * Params: windowId? (number | string)
 * Returns: { data: string (base64 PNG), mimeType: 'image/png', width: number, height: number }
 */
desktopHandlers.set('desktop.screenshot', async (params, config) => {
  assertDesktopEnabled(config);
  const handle = optionalWindowHandle(params);
  const db = await getOrInitBridge();
  const capture = await db.screenshot(handle);
  return {
    data: capture.buffer.toString('base64'),
    mimeType: 'image/png',
    width: capture.width,
    height: capture.height,
  };
});

/**
 * Capture a screenshot and run LLM vision analysis.
 * Params:
 *   windowId? (number | string)
 *   prompt?   (string) — custom analysis prompt
 * Returns: { description: string; elements: UIElement[]; answer?: string }
 */
desktopHandlers.set('desktop.analyzeScreen', async (params, config) => {
  assertDesktopEnabled(config);
  if (!config.desktopVisionEnabled) {
    throw new Error('Desktop vision analysis is disabled (desktopVisionEnabled: false).');
  }
  const handle = optionalWindowHandle(params);
  const question = optionalString(params, 'prompt');
  const db = await getOrInitBridge();
  return db.analyzeScreen(handle, question);
});

/**
 * Get the full accessibility UI element tree for a window.
 * Params: windowId (number | string), depth? (number, default 5)
 * Returns: { elements: UIElement[] }
 */
desktopHandlers.set('desktop.getUITree', async (params, config) => {
  assertDesktopEnabled(config);
  const handle = requireWindowHandle(params);
  const depth = optionalNumber(params, 'depth') ?? 5;
  const db = await getOrInitBridge();
  const elements = await db.getUITree(handle, depth);
  return { elements };
});

// --- LOW-RISK ---

/**
 * Bring a window to the foreground.
 * Params: windowId (number | string)
 * Returns: { focused: true }
 */
desktopHandlers.set('desktop.focusWindow', async (params, config) => {
  assertDesktopEnabled(config);
  const handle = requireWindowHandle(params);
  const db = await getOrInitBridge();
  const result = await db.focusWindow(handle);
  return { focused: result.success, durationMs: result.durationMs };
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
  const handle = requireWindowHandle(params);
  const direction = (optionalString(params, 'direction') ?? 'down') as 'up' | 'down' | 'left' | 'right';
  const amount = optionalNumber(params, 'amount') ?? 3;

  if (!['up', 'down', 'left', 'right'].includes(direction)) {
    throw new Error(`Invalid scroll direction "${direction}". Must be: up, down, left, right`);
  }

  const db = await getOrInitBridge();

  // DesktopBridge doesn't expose a public scrollWindow method on the facade.
  // Strategy: focus the target window, then send scroll key(s) via pressHotkey.
  // This is equivalent to the previous implementation and matches expected UX.
  await db.focusWindow(handle);

  const scrollKeys: Record<string, string> = {
    down: 'PageDown',
    up: 'PageUp',
    left: 'Left',
    right: 'Right',
  };

  const key = scrollKeys[direction] ?? 'PageDown';

  // Fire `amount` key presses sequentially
  for (let i = 0; i < Math.max(1, amount); i++) {
    await db.pressHotkey([key]);
  }

  return { scrolled: true, direction, amount };
});

// --- HIGH-RISK ---

/**
 * Type text into the currently focused input field.
 * Params:
 *   text     (string) — text to type
 *   delayMs? (number) — inter-character delay (not directly supported by bridge; ignored)
 *   _approved (boolean) — must be true (set by gateway after user confirmation)
 * Returns: { typed: true, length: number, screenshotBefore?: string }
 */
desktopHandlers.set('desktop.typeText', async (params, config) => {
  assertDesktopEnabled(config);
  assertHighRiskApproved(params, config, 'desktop.typeText');

  const text = requireString(params, 'text');
  const db = await getOrInitBridge();

  // Pre-action screenshot for audit
  let screenshotBefore: string | undefined;
  if (config.screenshotBeforeAction) {
    try {
      const capture = await db.screenshot();
      screenshotBefore = capture.buffer.toString('base64');
    } catch {
      // Non-fatal — proceed even if screenshot fails
    }
  }

  // Get focused window handle for typeInWindow
  const focused = await db.listWindows().then((ws) => ws.find((w) => w.isFocused));
  if (!focused) {
    throw new Error('No focused window found — cannot type text');
  }

  await db.typeInWindow(focused.handle, text);

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
  const handle = optionalWindowHandle(params);
  const db = await getOrInitBridge();

  // Resolve window handle: use provided or fall back to focused window
  let targetHandle = handle;
  if (targetHandle === undefined) {
    const focused = await db.listWindows().then((ws) => ws.find((w) => w.isFocused));
    if (!focused) {
      throw new Error('No focused window found — cannot click element');
    }
    targetHandle = focused.handle;
  }

  let screenshotBefore: string | undefined;
  if (config.screenshotBeforeAction) {
    try {
      const capture = await db.screenshot(targetHandle);
      screenshotBefore = capture.buffer.toString('base64');
    } catch {
      // Non-fatal
    }
  }

  const result = await db.clickElement(targetHandle, elementName);

  return {
    clicked: result.success,
    elementName,
    durationMs: result.durationMs,
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

  const db = await getOrInitBridge();
  const result = await db.pressHotkey(keyStrings);

  return { pressed: result.success, keys: keyStrings, durationMs: result.durationMs };
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

  const db = await getOrInitBridge();

  let screenshotBefore: string | undefined;
  if (config.screenshotBeforeAction) {
    try {
      const capture = await db.screenshot();
      screenshotBefore = capture.buffer.toString('base64');
    } catch {
      // Non-fatal
    }
  }

  // 'middle' maps to 'left' as the provider interface only supports left/right.
  const providerButton: 'left' | 'right' = button === 'right' ? 'right' : 'left';
  const result = await db.mouseClickAt(x, y, providerButton);

  return {
    clicked: result.success,
    x,
    y,
    button,
    durationMs: result.durationMs,
    ...(screenshotBefore ? { screenshotBefore } : {}),
  };
});
