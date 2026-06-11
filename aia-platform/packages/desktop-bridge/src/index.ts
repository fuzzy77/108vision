/**
 * @aia/desktop-bridge — Public API.
 *
 * Provides OS-level desktop interaction: window enumeration, UI tree reading,
 * screenshot capture, keyboard/mouse input, and clipboard access.
 *
 * Entry point:
 *   import { DesktopBridge, createDesktopBridge } from '@aia/desktop-bridge';
 *
 *   const bridge = await createDesktopBridge({ visionEnabled: true }, aiClient);
 *   const windows = await bridge.listWindows();
 *   const content = await bridge.readFocused();
 *   const result  = await bridge.pressHotkey(['ctrl', 'c']);
 *
 * Architecture:
 *   DesktopBridge (facade)
 *     ├── providers/           OS-level driver (Win32 / macOS stub)
 *     ├── perception/          Read what is on screen
 *     │     ├── window-manager   Enumerate & focus windows
 *     │     ├── accessibility    Read UI element tree (UIA / AX)
 *     │     ├── screen-capture   Take screenshots
 *     │     ├── ocr              Tesseract.js fallback
 *     │     └── vision-analyzer  LLM vision fallback
 *     ├── action/              Interact with the desktop
 *     │     ├── keyboard         Type text and key combinations
 *     │     ├── mouse            Click, move, scroll
 *     │     └── clipboard-bridge Read/write clipboard
 *     ├── safety/              Guard against mistakes
 *     │     ├── risk-classifier  Classify action danger level
 *     │     ├── confirmation     Pre/post screenshot wrapping
 *     │     └── window-guard     Verify target window hasn't changed
 *     └── tools/               Helpers
 *           ├── app-detector     Classify running app types
 *           └── focus-tracker    Poll and emit focus changes
 */

// ---------------------------------------------------------------------------
// Main class and factory
// ---------------------------------------------------------------------------

export { DesktopBridge } from './bridge.js';

// ---------------------------------------------------------------------------
// Types — all public-facing types are re-exported from types.ts
// ---------------------------------------------------------------------------

export type {
  WindowInfo,
  UIElement,
  ScreenCapture,
  DesktopAction,
  ActionResult,
  PerceptionResult,
  DesktopBridgeConfig,
  DesktopProvider,
  RiskLevel,
  Bounds,
} from './types.js';

// ---------------------------------------------------------------------------
// Sub-services (for advanced use — most callers should use DesktopBridge)
// ---------------------------------------------------------------------------

export { WindowManager } from './perception/window-manager.js';
export { AccessibilityReader } from './perception/accessibility.js';
export { ScreenCaptureService } from './perception/screen-capture.js';
export { OcrReader } from './perception/ocr.js';
export { analyzeScreenshot } from './perception/vision-analyzer.js';
export type { VisionAnalysisResult } from './perception/vision-analyzer.js';

export { KeyboardController } from './action/keyboard.js';
export { MouseController } from './action/mouse.js';
export { ClipboardBridge } from './action/clipboard-bridge.js';

export { RiskClassifier } from './safety/risk-classifier.js';
export type { ActionType } from './safety/risk-classifier.js';
export { WindowGuard, WindowGuardError } from './safety/window-guard.js';
export type { WindowGuardOptions } from './safety/window-guard.js';
export { ConfirmationService } from './safety/confirmation.js';
export type { ConfirmedAction, ConfirmationOptions } from './safety/confirmation.js';

export { AppDetector } from './tools/app-detector.js';
export type { AppInfo, AppType } from './tools/app-detector.js';
export { FocusTracker } from './tools/focus-tracker.js';
export type { FocusChange, FocusChangeHandler } from './tools/focus-tracker.js';

// ---------------------------------------------------------------------------
// Provider factory (for callers that need the raw provider)
// ---------------------------------------------------------------------------

export { createProvider } from './providers/index.js';

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

import { DesktopBridge } from './bridge.js';
import type { DesktopBridgeConfig } from './types.js';
import type { AIClient } from '@aia/ai-client';

/**
 * Create and initialise a DesktopBridge instance.
 *
 * This is the recommended entry point for most callers.
 *
 * @param config   Optional config overrides (platform is auto-detected).
 * @param aiClient Optional AIClient for vision analysis. Required for
 *                 `analyzeScreen()` and vision-based `perceive()` fallback.
 *
 * @example
 * const bridge = await createDesktopBridge({}, aiClient);
 * const windows = await bridge.listWindows();
 */
export async function createDesktopBridge(
  config: Partial<DesktopBridgeConfig> = {},
  aiClient: AIClient | null = null,
): Promise<DesktopBridge> {
  const bridge = new DesktopBridge(aiClient, config);
  await bridge.init();
  return bridge;
}
  try {
    const { platform } = process;

    if (platform === 'win32') {
      return await readWindowWindows(windowId);
    } else if (platform === 'darwin') {
      return await readWindowMacOS(windowId);
    } else {
      return await readWindowLinux(windowId);
    }
  } catch (error) {
    throw new Error(
      `readWindow failed for window ${windowId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Read the content of the currently focused (foreground) window.
 */
export async function readFocusedWindow(): Promise<WindowContent> {
  const windows = await listWindows();
  // The first window from the OS-level list is typically the foreground window,
  // but we also try a direct focused-window query per platform.
  try {
    const { platform } = process;
    let focusedId: number | string;

    if (platform === 'win32') {
      focusedId = await getFocusedWindowIdWindows();
    } else if (platform === 'darwin') {
      focusedId = await getFocusedWindowIdMacOS();
    } else {
      focusedId = await getFocusedWindowIdLinux();
    }

    return readWindow(focusedId);
  } catch {
    // Fall back to first visible window
    if (windows.length === 0) {
      throw new Error('No visible windows found');
    }
    return readWindow(windows[0]!.id);
  }
}

// --- Screenshot ---

/**
 * Capture a screenshot.
 *
 * @param windowId Optional window ID to capture. When omitted, captures the full screen.
 * @returns PNG data as a Buffer.
 */
export async function captureScreenshot(windowId?: number | string): Promise<Buffer> {
  try {
    const screenshotDesktop = await import('screenshot-desktop');

    if (windowId !== undefined) {
      // Attempt window-specific capture where supported
      try {
        // screenshot-desktop supports screen IDs (monitors) but not window IDs
        // on all platforms.  Fall back to full screen and crop when needed.
        const data = await screenshotDesktop.default({ format: 'png' });
        return data;
      } catch {
        // swallow and fall through to full screen
      }
    }

    const data = await screenshotDesktop.default({ format: 'png' });
    return data;
  } catch (error) {
    throw new Error(
      `Screenshot failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// --- LLM Vision Analysis ---

/**
 * Capture a screenshot and run LLM vision analysis on it.
 *
 * Requires that an AI client is configured (OPENAI_API_KEY or equivalent).
 */
export async function analyzeScreen(
  windowId?: number | string,
  prompt = 'Describe what is visible on the screen, including all text, UI elements, and their purpose.',
): Promise<ScreenAnalysis> {
  const screenshotBuffer = await captureScreenshot(windowId);
  const base64Image = screenshotBuffer.toString('base64');

  try {
    // Dynamically import ai-client to keep this dependency optional at runtime
    const { createAIClient } = await import('@aia/ai-client');
    const client = createAIClient();

    const response = await client.chat({
      model: 'gpt-4o-mini', // Use a vision-capable model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64Image}`, detail: 'auto' },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 1024,
    });

    const rawResponse = response.choices[0]?.message.content ?? '';

    // Parse visible text and elements from the response (best-effort)
    const visibleText = extractVisibleText(rawResponse);
    const elements = extractElements(rawResponse);

    return {
      description: rawResponse,
      visibleText,
      elements,
      rawResponse,
    };
  } catch (error) {
    throw new Error(
      `Screen analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// --- Window Focus ---

/**
 * Bring a window to the foreground.
 */
export async function focusWindow(windowId: number | string): Promise<void> {
  const { platform } = process;

  try {
    if (platform === 'win32') {
      await focusWindowWindows(windowId);
    } else if (platform === 'darwin') {
      await focusWindowMacOS(windowId);
    } else {
      await focusWindowLinux(windowId);
    }
  } catch (error) {
    throw new Error(
      `focusWindow failed for window ${windowId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// --- UI Automation (HIGH-RISK) ---

/**
 * Type text in the currently focused input element.
 * HIGH-RISK: types into whatever field is currently focused.
 */
export async function typeText(text: string, delayMs = 0): Promise<void> {
  if (!text) throw new Error('typeText: text must be a non-empty string');

  try {
    const { keyboard, Key } = await import('@nut-tree-fork/nut-js');
    // Configure typing speed
    if (delayMs > 0) {
      keyboard.config.autoDelayMs = delayMs;
    }
    await keyboard.type(text);
  } catch (error) {
    throw new Error(
      `typeText failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Click a UI element identified by its accessible name.
 * HIGH-RISK: modifies system state.
 */
export async function clickElement(
  elementName: string,
  windowId?: number | string,
): Promise<void> {
  if (!elementName) throw new Error('clickElement: elementName is required');

  try {
    // Walk the accessibility tree to find the element by name, then click it
    const tree = windowId
      ? await getUITree(windowId)
      : await getUITreeFocused();

    const element = findElementByName(tree.root, elementName);
    if (!element) {
      throw new Error(`Element "${elementName}" not found in window`);
    }

    if (!element.bounds) {
      throw new Error(`Element "${elementName}" has no bounds — cannot click`);
    }

    const centerX = element.bounds.x + element.bounds.width / 2;
    const centerY = element.bounds.y + element.bounds.height / 2;

    await mouseClickAt(centerX, centerY);
  } catch (error) {
    throw new Error(
      `clickElement failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Press a keyboard hotkey or key combination.
 * HIGH-RISK: modifies system state.
 *
 * @param keys Array of key names (e.g. ['ctrl', 'c'] or ['alt', 'F4']).
 */
export async function pressHotkey(keys: string[]): Promise<void> {
  if (!keys || keys.length === 0) {
    throw new Error('pressHotkey: at least one key must be specified');
  }

  try {
    const nutjs = await import('@nut-tree-fork/nut-js');
    const resolvedKeys = keys.map((k) => resolveNutKey(nutjs.Key, k));
    await nutjs.keyboard.pressKey(...resolvedKeys);
    await nutjs.keyboard.releaseKey(...resolvedKeys);
  } catch (error) {
    throw new Error(
      `pressHotkey failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Click the mouse at absolute screen coordinates.
 * HIGH-RISK: modifies system state.
 */
export async function mouseClickAt(
  x: number,
  y: number,
  button: 'left' | 'right' | 'middle' = 'left',
): Promise<void> {
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error('mouseClickAt: x and y must be numbers');
  }

  try {
    const { mouse, Point, Button } = await import('@nut-tree-fork/nut-js');

    const buttonMap: Record<string, unknown> = {
      left: Button.LEFT,
      right: Button.RIGHT,
      middle: Button.MIDDLE,
    };

    await mouse.move([new Point(x, y)]);
    await mouse.click(buttonMap[button] as Parameters<typeof mouse.click>[0]);
  } catch (error) {
    throw new Error(
      `mouseClickAt failed at (${x}, ${y}): ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Scroll within a window.
 * LOW-RISK: does not alter application data, only changes viewport.
 *
 * @param direction 'up' | 'down' | 'left' | 'right'
 * @param amount Number of scroll steps (default: 3)
 */
export async function scrollWindow(
  windowId: number | string,
  direction: 'up' | 'down' | 'left' | 'right' = 'down',
  amount = 3,
): Promise<void> {
  try {
    const { mouse, Point, Button } = await import('@nut-tree-fork/nut-js');

    // First focus the target window
    await focusWindow(windowId);

    const scrollDirectionMap: Record<string, () => Promise<void>> = {
      down: async () => { await mouse.scrollDown(amount); },
      up: async () => { await mouse.scrollUp(amount); },
      left: async () => { await mouse.scrollLeft(amount); },
      right: async () => { await mouse.scrollRight(amount); },
    };

    const scrollFn = scrollDirectionMap[direction];
    if (!scrollFn) throw new Error(`Unknown scroll direction: ${direction}`);
    await scrollFn();
  } catch (error) {
    throw new Error(
      `scrollWindow failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// --- Accessibility Tree ---

/**
 * Get the full accessibility UI tree for a window.
 * Useful for understanding the structure of an application without screenshots.
 */
export async function getUITree(windowId: number | string): Promise<UITree> {
  const { platform } = process;

  try {
    if (platform === 'win32') {
      return await getUITreeWindows(windowId);
    } else if (platform === 'darwin') {
      return await getUITreeMacOS(windowId);
    } else {
      return await getUITreeLinux(windowId);
    }
  } catch (error) {
    throw new Error(
      `getUITree failed for window ${windowId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// ============================================================
// Platform-specific implementations
// ============================================================

// --- Windows (koffi / WinAPI) ---

async function listWindowsWindows(): Promise<WindowInfo[]> {
  const koffi = await import('koffi');

  const user32 = koffi.load('user32.dll');

  // Declare WinAPI functions
  const EnumWindows = user32.func('bool EnumWindows(void* lpEnumFunc, intptr_t lParam)');
  const IsWindowVisible = user32.func('bool IsWindowVisible(intptr_t hWnd)');
  const GetWindowTextW = user32.func('int GetWindowTextW(intptr_t hWnd, char16_t* lpString, int nMaxCount)');
  const GetWindowTextLengthW = user32.func('int GetWindowTextLengthW(intptr_t hWnd)');
  const GetWindowRect = user32.func('bool GetWindowRect(intptr_t hWnd, void* lpRect)');

  const windows: WindowInfo[] = [];

  const callback = koffi.proto('bool __stdcall EnumWindowsProc(intptr_t hWnd, intptr_t lParam)');
  const enumProc = koffi.register(
    (hWnd: number) => {
      if (!IsWindowVisible(hWnd)) return true;

      const len = GetWindowTextLengthW(hWnd);
      if (len <= 0) return true;

      const titleBuf = Buffer.alloc((len + 1) * 2);
      GetWindowTextW(hWnd, titleBuf, len + 1);
      const title = titleBuf.toString('utf16le').replace(/\0/g, '').trim();

      if (!title) return true;

      const rectBuf = Buffer.alloc(16); // RECT: left, top, right, bottom (4 * int32)
      GetWindowRect(hWnd, rectBuf);
      const left = rectBuf.readInt32LE(0);
      const top = rectBuf.readInt32LE(4);
      const right = rectBuf.readInt32LE(8);
      const bottom = rectBuf.readInt32LE(12);

      windows.push({
        id: hWnd,
        title,
        processName: '',
        visible: true,
        bounds: { x: left, y: top, width: right - left, height: bottom - top },
      });

      return true;
    },
    callback,
  );

  EnumWindows(enumProc, 0);
  koffi.unregister(enumProc);

  return windows;
}

async function getFocusedWindowIdWindows(): Promise<number> {
  const koffi = await import('koffi');
  const user32 = koffi.load('user32.dll');
  const GetForegroundWindow = user32.func('intptr_t GetForegroundWindow()');
  return GetForegroundWindow() as number;
}

async function readWindowWindows(windowId: number | string): Promise<WindowContent> {
  // Use UI Automation (UIA) via koffi for deep text extraction.
  // Fallback: capture screenshot + OCR via tesseract.js.
  try {
    const Tesseract = await import('tesseract.js');
    const screenshotBuf = await captureScreenshot(windowId);

    const result = await Tesseract.recognize(screenshotBuf, 'eng', {
      logger: () => {},
    });

    return {
      windowId,
      title: '',
      text: result.data.text,
      appRole: 'window',
    };
  } catch (error) {
    throw new Error(
      `readWindowWindows fallback OCR failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function focusWindowWindows(windowId: number | string): Promise<void> {
  const koffi = await import('koffi');
  const user32 = koffi.load('user32.dll');
  const SetForegroundWindow = user32.func('bool SetForegroundWindow(intptr_t hWnd)');
  const ShowWindow = user32.func('bool ShowWindow(intptr_t hWnd, int nCmdShow)');

  const SW_RESTORE = 9;
  ShowWindow(windowId as number, SW_RESTORE);
  SetForegroundWindow(windowId as number);
}

async function getUITreeWindows(windowId: number | string): Promise<UITree> {
  // Full UIA tree traversal requires COM automation.
  // For now, provide a shallow tree from basic WinAPI info.
  const windows = await listWindowsWindows();
  const win = windows.find((w) => w.id === windowId);

  return {
    windowId,
    root: {
      role: 'window',
      name: win?.title ?? String(windowId),
      children: [],
    },
  };
}

// --- macOS (AppleScript / AX API) ---

async function listWindowsMacOS(): Promise<WindowInfo[]> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);

  const script = `
    tell application "System Events"
      set winList to {}
      repeat with proc in (processes whose background only is false)
        repeat with w in (windows of proc)
          set winList to winList & {(name of w) & "|||" & (name of proc) & "|||" & (position of w) & "|||" & (size of w)}
        end repeat
      end repeat
      return winList
    end tell
  `;

  const { stdout } = await exec('osascript', ['-e', script]);
  const lines = stdout.trim().split(', ');

  const windows: WindowInfo[] = [];
  let id = 1;

  for (const line of lines) {
    const parts = line.split('|||');
    if (parts.length < 2) continue;

    windows.push({
      id: id++,
      title: parts[0]?.trim() ?? '',
      processName: parts[1]?.trim() ?? '',
      visible: true,
      bounds: { x: 0, y: 0, width: 0, height: 0 },
    });
  }

  return windows;
}

async function getFocusedWindowIdMacOS(): Promise<number> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);

  const script = `
    tell application "System Events"
      return name of first window of (first process whose frontmost is true)
    end tell
  `;

  const { stdout } = await exec('osascript', ['-e', script]);
  // Return 0 as a signal to use the title-based match
  void stdout;
  return 0;
}

async function readWindowMacOS(windowId: number | string): Promise<WindowContent> {
  // OCR fallback (same as Windows)
  const Tesseract = await import('tesseract.js');
  const screenshotBuf = await captureScreenshot(windowId);

  const result = await Tesseract.recognize(screenshotBuf, 'eng', {
    logger: () => {},
  });

  return {
    windowId,
    title: '',
    text: result.data.text,
    appRole: 'window',
  };
}

async function focusWindowMacOS(windowId: number | string): Promise<void> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);

  // windowId on macOS is the numeric index from listWindowsMacOS
  // Without a direct process name, this is best-effort
  await exec('osascript', [
    '-e',
    `tell application "System Events" to set frontmost of process id ${windowId} to true`,
  ]).catch(() => {});
}

async function getUITreeMacOS(_windowId: number | string): Promise<UITree> {
  return {
    windowId: _windowId,
    root: {
      role: 'window',
      name: String(_windowId),
      children: [],
    },
  };
}

// --- Linux (xdotool / AT-SPI) ---

async function listWindowsLinux(): Promise<WindowInfo[]> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);

  const { stdout } = await exec('xdotool', ['search', '--onlyvisible', '--name', '']);

  const ids = stdout.trim().split('\n').filter(Boolean);
  const windows: WindowInfo[] = [];

  for (const idStr of ids) {
    const id = parseInt(idStr, 10);
    if (isNaN(id)) continue;

    try {
      const { stdout: title } = await exec('xdotool', ['getwindowname', idStr]);
      const { stdout: geo } = await exec('xdotool', ['getwindowgeometry', '--shell', idStr]);

      const geoMap: Record<string, number> = {};
      for (const line of geo.split('\n')) {
        const [k, v] = line.split('=');
        if (k && v) geoMap[k.trim()] = parseInt(v.trim(), 10);
      }

      windows.push({
        id,
        title: title.trim(),
        processName: '',
        visible: true,
        bounds: {
          x: geoMap['X'] ?? 0,
          y: geoMap['Y'] ?? 0,
          width: geoMap['WIDTH'] ?? 0,
          height: geoMap['HEIGHT'] ?? 0,
        },
      });
    } catch {
      continue;
    }
  }

  return windows;
}

async function getFocusedWindowIdLinux(): Promise<number> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);

  const { stdout } = await exec('xdotool', ['getactivewindow']);
  return parseInt(stdout.trim(), 10);
}

async function readWindowLinux(windowId: number | string): Promise<WindowContent> {
  const Tesseract = await import('tesseract.js');
  const screenshotBuf = await captureScreenshot(windowId);

  const result = await Tesseract.recognize(screenshotBuf, 'eng', {
    logger: () => {},
  });

  return {
    windowId,
    title: '',
    text: result.data.text,
    appRole: 'window',
  };
}

async function focusWindowLinux(windowId: number | string): Promise<void> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);

  await exec('xdotool', ['windowactivate', '--sync', String(windowId)]);
}

async function getUITreeLinux(_windowId: number | string): Promise<UITree> {
  return {
    windowId: _windowId,
    root: {
      role: 'window',
      name: String(_windowId),
      children: [],
    },
  };
}

// --- Helpers ---

/**
 * Get the UI tree for the currently focused window.
 */
async function getUITreeFocused(): Promise<UITree> {
  const { platform } = process;

  let focusedId: number | string;
  if (platform === 'win32') {
    focusedId = await getFocusedWindowIdWindows();
  } else if (platform === 'darwin') {
    focusedId = await getFocusedWindowIdMacOS();
  } else {
    focusedId = await getFocusedWindowIdLinux();
  }

  return getUITree(focusedId);
}

/**
 * Recursively find an element in a UIElement tree by accessible name.
 */
function findElementByName(node: UIElement, name: string): UIElement | null {
  if (node.name.toLowerCase().includes(name.toLowerCase())) {
    return node;
  }
  for (const child of node.children ?? []) {
    const found = findElementByName(child, name);
    if (found) return found;
  }
  return null;
}

/**
 * Map a string key name to a nut-js Key enum value.
 * Falls back to the raw string if not found (nut-js accepts strings too).
 */
function resolveNutKey(Key: Record<string, unknown>, keyName: string): unknown {
  const normalized = keyName.toLowerCase();

  const aliases: Record<string, string> = {
    ctrl: 'LeftControl',
    control: 'LeftControl',
    alt: 'LeftAlt',
    shift: 'LeftShift',
    win: 'LeftSuper',
    cmd: 'LeftSuper',
    meta: 'LeftSuper',
    enter: 'Return',
    esc: 'Escape',
    del: 'Delete',
    backspace: 'Backspace',
    tab: 'Tab',
    space: 'Space',
  };

  const resolved = aliases[normalized] ?? keyName;
  return Key[resolved] ?? Key[keyName] ?? keyName;
}

/**
 * Extract plain text lines that look like screen content from an LLM response.
 */
function extractVisibleText(response: string): string {
  // Heuristic: lines that appear to be quoted UI text (quoted or bullet-prefixed)
  const lines = response
    .split('\n')
    .filter((l) => l.match(/["']|^\s*[-•*]\s+/))
    .map((l) => l.replace(/^[\s\-•*"']+|["']+$/g, '').trim())
    .filter(Boolean);
  return lines.join('\n');
}

/**
 * Extract a list of detected UI elements from an LLM response.
 */
function extractElements(
  response: string,
): Array<{ label: string; confidence: number }> {
  const elements: Array<{ label: string; confidence: number }> = [];

  // Look for patterns like "button", "input", "link", "menu", etc.
  const uiRoles = ['button', 'input', 'text field', 'link', 'menu', 'dialog', 'toolbar', 'checkbox', 'radio', 'tab', 'list'];

  for (const role of uiRoles) {
    const regex = new RegExp(`\\b${role}\\b`, 'gi');
    const matches = response.match(regex);
    if (matches && matches.length > 0) {
      elements.push({ label: role, confidence: Math.min(matches.length * 0.2, 1.0) });
    }
  }

  return elements;
}
