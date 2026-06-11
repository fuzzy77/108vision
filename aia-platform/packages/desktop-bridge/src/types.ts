/**
 * @aia/desktop-bridge — Core type definitions.
 *
 * All interfaces and types shared across the package.
 * Providers, perception layers, action layers, and safety
 * layers all import from this single source of truth.
 */

// ---------------------------------------------------------------------------
// Window & Process
// ---------------------------------------------------------------------------

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInfo {
  /** Native window handle (HWND on Windows, CGWindowID on macOS). */
  handle: number;
  /** Visible title bar text. */
  title: string;
  /** Process executable name without extension (e.g. "chrome", "notepad"). */
  processName: string;
  /** OS process identifier. */
  processId: number;
  /** Screen coordinates and dimensions. */
  bounds: Bounds;
  /** Whether the window is visible (not minimised, not hidden). */
  isVisible: boolean;
  /** Whether this window currently holds the foreground focus. */
  isFocused: boolean;
  /** Native window class name (Win32 WNDCLASS name or macOS bundle ID). */
  className: string;
}

// ---------------------------------------------------------------------------
// Accessibility UI Tree
// ---------------------------------------------------------------------------

export interface UIElement {
  /** ARIA-style role: button, textfield, label, list, menuitem, etc. */
  role: string;
  /** Accessible name (label, aria-label, title). */
  name: string;
  /** Current value (text content, selected option, checkbox state). */
  value: string;
  /** Screen bounding box. */
  bounds: Bounds;
  /** Direct children in the UI tree. */
  children: UIElement[];
  /** Whether the control accepts user interaction. */
  isEnabled: boolean;
  /** Whether the control accepts text input. */
  isEditable: boolean;
  /** UIA AutomationId or macOS AXIdentifier — stable across sessions. */
  automationId?: string;
}

// ---------------------------------------------------------------------------
// Screen Capture
// ---------------------------------------------------------------------------

export interface ScreenCapture {
  /** Raw image data. */
  buffer: Buffer;
  width: number;
  height: number;
  format: 'png' | 'jpeg';
  /** The window handle this capture was taken from, if window-scoped. */
  windowHandle?: number;
  /** Unix ms timestamp of the capture. */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Actions & Results
// ---------------------------------------------------------------------------

export type RiskLevel = 'read-only' | 'low-risk' | 'high-risk';

export interface DesktopAction {
  type: 'keyboard' | 'mouse' | 'clipboard' | 'focus';
  /** Human-readable description (e.g. "press Ctrl+C", "click (120,450)"). */
  detail: string;
  riskLevel: RiskLevel;
  /** The window this action targets. */
  targetWindow?: WindowInfo;
  /** Captured before the action executed. */
  preScreenshot?: ScreenCapture;
  /** Captured after the action executed. */
  postScreenshot?: ScreenCapture;
}

export interface ActionResult {
  success: boolean;
  action: DesktopAction;
  error?: string;
  durationMs: number;
  /** True when the action can be reversed (clipboard write, focus). */
  undoable: boolean;
}

// ---------------------------------------------------------------------------
// Perception
// ---------------------------------------------------------------------------

export interface PerceptionResult {
  /** Which technique was used to extract content. */
  method: 'accessibility' | 'vision' | 'ocr';
  /** Extracted text content of the window. */
  content: string;
  /** Structured UI element tree, when method is "accessibility". */
  elements?: UIElement[];
  /** 0-1 confidence score (1 = definitive, 0 = guessed). */
  confidence: number;
  /** The screenshot used during perception, if any. */
  screenshot?: ScreenCapture;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface DesktopBridgeConfig {
  platform: 'win32' | 'darwin' | 'linux';
  /** Allow LLM-based vision analysis as perception fallback. */
  visionEnabled: boolean;
  /** Allow Tesseract OCR as perception fallback. */
  ocrEnabled: boolean;
  /** Hard cap on automated actions per 60-second rolling window. */
  maxActionsPerMinute: number;
  /** Capture a screenshot before each mutating action. */
  screenshotBeforeAction: boolean;
  /** Capture a screenshot after each mutating action. */
  screenshotAfterAction: boolean;
  /**
   * When set, only windows whose processName is in this list are targetable.
   * Takes precedence over blockedProcesses.
   */
  allowedProcesses?: string[];
  /** Windows whose processName is in this list are never touched. */
  blockedProcesses?: string[];
}

// ---------------------------------------------------------------------------
// Provider contract
// ---------------------------------------------------------------------------

/**
 * Low-level OS provider interface.
 * Each platform (Windows, macOS) implements this.
 */
export interface DesktopProvider {
  /** Return all currently visible top-level windows. */
  getWindows(): Promise<WindowInfo[]>;
  /** Return the window that currently holds keyboard focus, or null. */
  getFocusedWindow(): Promise<WindowInfo | null>;
  /** Bring the specified window to the foreground. */
  focusWindow(handle: number): Promise<void>;
  /**
   * Return the accessibility/automation UI tree rooted at the window.
   * @param depth Maximum tree depth to return (default: 5).
   */
  getUITree(handle: number, depth?: number): Promise<UIElement[]>;
  /** Capture a single window's client area as PNG. */
  captureWindow(handle: number): Promise<ScreenCapture>;
  /** Capture the full primary screen. */
  captureScreen(): Promise<ScreenCapture>;
  /** Capture an arbitrary screen region. */
  captureRegion(x: number, y: number, w: number, h: number): Promise<ScreenCapture>;
  /** Type a Unicode string at the current cursor position. */
  typeText(text: string): Promise<void>;
  /**
   * Simulate a key press.
   * @param key Key name: 'a'-'z', 'F1'-'F12', 'Enter', 'Tab', 'Escape', etc.
   * @param modifiers Modifier keys: 'ctrl', 'alt', 'shift', 'meta'.
   */
  pressKey(key: string, modifiers?: string[]): Promise<void>;
  /** Simulate a mouse button click at the given screen coordinates. */
  mouseClick(x: number, y: number, button?: 'left' | 'right'): Promise<void>;
  /** Move the mouse cursor to the given screen coordinates. */
  mouseMove(x: number, y: number): Promise<void>;
  /**
   * Scroll at the given position.
   * @param delta Positive = scroll down, negative = scroll up.
   */
  mouseScroll(x: number, y: number, delta: number): Promise<void>;
}
