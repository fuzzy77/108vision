/**
 * @aia/desktop-bridge — Public API.
 *
 * Provides OS-level desktop interaction: window enumeration, UI tree reading,
 * screenshot capture, keyboard/mouse input, and clipboard access.
 *
 * Recommended entry points:
 *
 *   // High-level facade (desktop automation):
 *   import { createDesktopBridge } from '@aia/desktop-bridge';
 *   const bridge = await createDesktopBridge({}, aiClient);
 *   const windows = await bridge.listWindows();
 *
 *   // Tool dispatcher (agent handler layer):
 *   import { handleToolCall } from '@aia/desktop-bridge';
 *   const result = await handleToolCall('filesystem.readFile', { path: '/tmp/x' }, ctx);
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
 *     ├── tools/               Helpers
 *     │     ├── app-detector     Classify running app types
 *     │     └── focus-tracker    Poll and emit focus changes
 *     └── handlers/            Agent tool dispatcher (filesystem, shell, clipboard, screen)
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
// Tool dispatcher (Desktop Agent handler layer)
// ---------------------------------------------------------------------------

export { handleToolCall } from './handlers/index.js';
export type {
  ToolCallResult,
  ToolCallSuccess,
  ToolCallError,
  ToolCallContext,
} from './handlers/index.js';

// Handler namespaces (for callers that need direct handler access)
export {
  filesystemHandlers,
  shellHandlers,
  clipboardHandlers,
  screenHandlers,
} from './handlers/index.js';

// Individual handler types
export type { FileEntry, FileInfo, ActionRequest } from './handlers/filesystem.js';
export type { ShellResult } from './handlers/shell.js';
export type { ScreenshotResult, ActiveWindowInfo } from './handlers/screen.js';

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

import { DesktopBridge } from './bridge.js';
import type { DesktopBridgeConfig } from './types.js';
import type { AIClient } from '@aia/ai-client';

/**
 * Create and initialise a DesktopBridge instance.
 *
 * This is the recommended entry point for desktop automation.
 *
 * @param config   Optional config overrides (platform is auto-detected).
 * @param aiClient Optional AIClient for vision analysis. Required for
 *                 `analyzeScreen()` and vision-based `perceive()` fallback.
 *
 * @example
 * const bridge = await createDesktopBridge({}, aiClient);
 * const windows = await bridge.listWindows();
 * const content = await bridge.readFocused();
 * await bridge.pressHotkey(['ctrl', 'c']);
 */
export async function createDesktopBridge(
  config: Partial<DesktopBridgeConfig> = {},
  aiClient: AIClient | null = null,
): Promise<DesktopBridge> {
  const bridge = new DesktopBridge(aiClient, config);
  await bridge.init();
  return bridge;
}
