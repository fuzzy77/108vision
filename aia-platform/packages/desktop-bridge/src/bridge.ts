/**
 * DesktopBridge — main facade.
 *
 * Combines all layers (provider, perception, action, safety) into a single
 * coherent API. Callers interact only with this class.
 *
 * Layer execution order for mutating actions:
 *   1. Process whitelist/blacklist check (config guard)
 *   2. Risk classification
 *   3. Rate limit enforcement
 *   4. Pre-action screenshot (if configured)
 *   5. Window guard verification (high-risk only)
 *   6. Action execution via provider
 *   7. Post-action screenshot (if configured)
 *   8. Return ActionResult
 */

import type { AIClient } from '@aia/ai-client';
import type {
  DesktopBridgeConfig,
  DesktopProvider,
  WindowInfo,
  UIElement,
  ScreenCapture,
  DesktopAction,
  ActionResult,
  PerceptionResult,
  RiskLevel,
} from './types.js';

import { createProvider } from './providers/index.js';
import { WindowManager } from './perception/window-manager.js';
import { AccessibilityReader } from './perception/accessibility.js';
import { ScreenCaptureService } from './perception/screen-capture.js';
import { OcrReader } from './perception/ocr.js';
import { analyzeScreenshot } from './perception/vision-analyzer.js';
import { KeyboardController } from './action/keyboard.js';
import { MouseController } from './action/mouse.js';
import { ClipboardBridge } from './action/clipboard-bridge.js';
import { RiskClassifier, type ActionType } from './safety/risk-classifier.js';
import { ConfirmationService } from './safety/confirmation.js';
import { WindowGuard, WindowGuardError } from './safety/window-guard.js';
import { AppDetector } from './tools/app-detector.js';
import { FocusTracker } from './tools/focus-tracker.js';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: DesktopBridgeConfig = {
  platform: process.platform as DesktopBridgeConfig['platform'],
  visionEnabled: true,
  ocrEnabled: true,
  maxActionsPerMinute: 60,
  screenshotBeforeAction: true,
  screenshotAfterAction: true,
};

// ---------------------------------------------------------------------------
// Rate limiter — simple token-bucket per 60s window
// ---------------------------------------------------------------------------

class ActionRateLimiter {
  private readonly timestamps: number[] = [];

  constructor(private readonly maxPerMinute: number) {}

  check(): void {
    const now = Date.now();
    const windowStart = now - 60_000;

    // Purge old entries
    while (this.timestamps.length > 0 && this.timestamps[0]! < windowStart) {
      this.timestamps.shift();
    }

    if (this.timestamps.length >= this.maxPerMinute) {
      throw new Error(
        `Rate limit exceeded: maximum ${this.maxPerMinute} actions per minute. ` +
        `${this.timestamps.length} actions in the last 60 seconds.`,
      );
    }

    this.timestamps.push(now);
  }
}

// ---------------------------------------------------------------------------
// Bridge
// ---------------------------------------------------------------------------

export class DesktopBridge {
  private readonly config: DesktopBridgeConfig;
  private _provider: DesktopProvider | null = null;

  // Sub-services — initialised lazily after provider is ready
  private _windowManager: WindowManager | null = null;
  private _accessibility: AccessibilityReader | null = null;
  private _screenCapture: ScreenCaptureService | null = null;
  private _ocr: OcrReader | null = null;
  private _keyboard: KeyboardController | null = null;
  private _mouse: MouseController | null = null;
  private _clipboard: ClipboardBridge | null = null;
  private _riskClassifier: RiskClassifier;
  private _confirmation: ConfirmationService | null = null;
  private _appDetector: AppDetector;
  private _focusTracker: FocusTracker | null = null;
  private _rateLimiter: ActionRateLimiter;

  constructor(
    private readonly aiClient: AIClient | null = null,
    config: Partial<DesktopBridgeConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._riskClassifier = new RiskClassifier();
    this._appDetector = new AppDetector();
    this._rateLimiter = new ActionRateLimiter(this.config.maxActionsPerMinute);
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------

  /**
   * Initialise the OS provider and all sub-services.
   * Must be called once before any other method.
   */
  async init(): Promise<void> {
    this._provider = await createProvider();

    this._windowManager = new WindowManager(this._provider);
    this._accessibility = new AccessibilityReader(this._provider);
    this._screenCapture = new ScreenCaptureService(this._provider);
    this._ocr = new OcrReader();
    this._keyboard = new KeyboardController(this._provider);
    this._mouse = new MouseController(this._provider);
    this._clipboard = new ClipboardBridge();
    this._confirmation = new ConfirmationService(this._screenCapture);
    this._focusTracker = new FocusTracker(this._provider);
  }

  // ---------------------------------------------------------------------------
  // Perception
  // ---------------------------------------------------------------------------

  /**
   * List all visible top-level windows.
   */
  async listWindows(): Promise<WindowInfo[]> {
    return this._wm().listWindows();
  }

  /**
   * Read the text content of a window using the best available method:
   * accessibility tree first, OCR fallback, vision as last resort.
   */
  async perceive(windowHandle?: number): Promise<PerceptionResult> {
    const handle = windowHandle ?? (await this._wm().getFocused())?.handle;
    if (handle === undefined) {
      return { method: 'accessibility', content: '', confidence: 0 };
    }

    // 1. Accessibility
    const text = await this._acc().extractText(handle);
    if (text.trim().length > 50) {
      return { method: 'accessibility', content: text, confidence: 0.9 };
    }

    // 2. OCR fallback
    if (this.config.ocrEnabled) {
      const capture = await this._sc().captureWindow(handle);
      const ocrResult = await this._ocr!.recognize(capture);
      if (ocrResult.confidence > 0.5 && ocrResult.text.length > 20) {
        return {
          method: 'ocr',
          content: ocrResult.text,
          confidence: ocrResult.confidence,
          screenshot: capture,
        };
      }
    }

    // 3. Vision fallback (LLM)
    if (this.config.visionEnabled && this.aiClient) {
      const capture = await this._sc().captureWindow(handle);
      const analysis = await analyzeScreenshot(capture, this.aiClient);
      return {
        method: 'vision',
        content: analysis.description,
        elements: analysis.elements,
        confidence: 0.7,
        screenshot: capture,
      };
    }

    return { method: 'accessibility', content: text, confidence: 0.3 };
  }

  /**
   * Read the text content of a specific window by handle.
   */
  async readWindow(handle: number): Promise<string> {
    const result = await this.perceive(handle);
    return result.content;
  }

  /**
   * Read the currently focused window's content.
   */
  async readFocused(): Promise<string> {
    return this.readWindow((await this._wm().getFocused())?.handle ?? 0);
  }

  /**
   * Get the accessibility UI tree for a window.
   */
  async getUITree(handle: number, depth = 5): Promise<UIElement[]> {
    return this._acc().getTree(handle, depth);
  }

  // ---------------------------------------------------------------------------
  // Screenshots
  // ---------------------------------------------------------------------------

  /**
   * Capture a screenshot of a specific window or the full screen.
   */
  async screenshot(handle?: number): Promise<ScreenCapture> {
    if (handle !== undefined) {
      return this._sc().captureWindow(handle);
    }
    return this._sc().captureScreen();
  }

  /**
   * Take a screenshot and analyze it with the LLM vision API.
   *
   * @param handle   Window to capture (undefined = full screen).
   * @param question Optional question to answer about the screen content.
   */
  async analyzeScreen(
    handle?: number,
    question?: string,
  ): Promise<{ description: string; elements: UIElement[]; answer?: string }> {
    if (!this.aiClient) {
      throw new Error('analyzeScreen requires an AIClient — pass one to DesktopBridge constructor.');
    }
    const capture = await this.screenshot(handle);
    return analyzeScreenshot(capture, this.aiClient, question);
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Focus a window and type text into it.
   */
  async typeInWindow(handle: number, text: string): Promise<ActionResult> {
    return this._executeAction(
      'typeText',
      async () => {
        await this._wm().focus(handle);
        await this._keyboard!.type(text);
      },
      handle,
      `type "${text.slice(0, 40)}${text.length > 40 ? '...' : ''}"`,
    );
  }

  /**
   * Find a UI element by name in the window's accessibility tree, then click
   * its centre.
   *
   * @throws {Error} If the element is not found or not enabled.
   */
  async clickElement(handle: number, elementName: string): Promise<ActionResult> {
    const elements = await this._acc().findByName(handle, elementName);
    const enabled = elements.find((e) => e.isEnabled);

    if (!enabled) {
      throw new Error(
        `Element "${elementName}" not found or not enabled in window handle=${handle}.`,
      );
    }

    return this._executeAction(
      'mouseClick',
      async () => {
        await this._wm().focus(handle);
        await this._mouse!.clickCenter(enabled.bounds);
      },
      handle,
      `click element "${elementName}"`,
    );
  }

  /**
   * Press a keyboard hotkey combination.
   *
   * @param keys Array of key names, modifiers first.
   * @example await bridge.pressHotkey(['ctrl', 'c'])
   */
  async pressHotkey(keys: string[]): Promise<ActionResult> {
    return this._executeAction(
      'hotkey',
      async () => this._keyboard!.hotkey(keys),
      undefined,
      `hotkey ${keys.join('+')}`,
    );
  }

  /**
   * Move focus to the specified window.
   */
  async focusWindow(handle: number): Promise<ActionResult> {
    return this._executeAction(
      'focusWindow',
      async () => this._wm().focus(handle),
      handle,
      `focus window handle=${handle}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Clipboard
  // ---------------------------------------------------------------------------

  /**
   * Read text from the system clipboard.
   */
  async readClipboard(): Promise<string> {
    return this._clipboard!.readText();
  }

  /**
   * Write text to the system clipboard.
   */
  async writeClipboard(text: string): Promise<ActionResult> {
    return this._executeAction(
      'clipboardWrite',
      async () => this._clipboard!.writeText(text),
      undefined,
      `clipboard write (${text.length} chars)`,
    );
  }

  // ---------------------------------------------------------------------------
  // App / Focus utilities
  // ---------------------------------------------------------------------------

  /** Classify the type of application running in a window. */
  detectApp(window: WindowInfo) {
    return this._appDetector.detect(window);
  }

  /** Access the FocusTracker for observing focus changes. */
  get focusTracker(): FocusTracker {
    if (!this._focusTracker) throw new Error('Call init() first.');
    return this._focusTracker;
  }

  // ---------------------------------------------------------------------------
  // Private: action execution wrapper
  // ---------------------------------------------------------------------------

  private async _executeAction(
    actionType: ActionType,
    fn: () => Promise<void>,
    windowHandle: number | undefined,
    detail: string,
  ): Promise<ActionResult> {
    const riskLevel: RiskLevel = this._riskClassifier.classify(actionType);

    // Rate limit enforcement (only for non-read-only)
    if (riskLevel !== 'read-only') {
      this._rateLimiter.check();
    }

    // Optionally verify process whitelist/blacklist against target window
    if (windowHandle !== undefined) {
      await this._checkProcessPolicy(windowHandle);
    }

    // Build partial action record
    const targetWindow: WindowInfo | undefined =
      windowHandle !== undefined
        ? (await this._wm().getWindow(windowHandle)) ?? undefined
        : undefined;

    const action: DesktopAction = {
      type: actionTypeToCategory(actionType),
      detail,
      riskLevel,
      targetWindow,
    };

    // Window guard for high-risk actions
    if (riskLevel === 'high-risk' && targetWindow) {
      const guard = new WindowGuard(this._provider!, targetWindow);
      try {
        await guard.verify();
      } catch (error) {
        if (error instanceof WindowGuardError) {
          return {
            success: false,
            action,
            error: error.message,
            durationMs: 0,
            undoable: false,
          };
        }
        throw error;
      }
    }

    // Wrapped execution with screenshots
    const confirmed = await this._confirmation!.withConfirmation(fn, {
      capturePreScreenshot: this.config.screenshotBeforeAction && riskLevel === 'high-risk',
      capturePostScreenshot: this.config.screenshotAfterAction && riskLevel === 'high-risk',
      windowHandle,
    });

    action.preScreenshot = confirmed.preScreenshot;
    action.postScreenshot = confirmed.postScreenshot;

    return {
      success: true,
      action,
      durationMs: confirmed.durationMs,
      undoable: isUndoable(actionType),
    };
  }

  private async _checkProcessPolicy(handle: number): Promise<void> {
    const window = await this._wm().getWindow(handle);
    if (!window) return;

    if (this.config.allowedProcesses && this.config.allowedProcesses.length > 0) {
      if (!this.config.allowedProcesses.includes(window.processName)) {
        throw new Error(
          `Process "${window.processName}" is not in the allowedProcesses whitelist.`,
        );
      }
    }

    if (this.config.blockedProcesses?.includes(window.processName)) {
      throw new Error(
        `Process "${window.processName}" is in the blockedProcesses blacklist.`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Private: lazy service accessors (guard against uninitialised use)
  // ---------------------------------------------------------------------------

  private _wm(): WindowManager {
    if (!this._windowManager) throw new Error('Call init() before using DesktopBridge.');
    return this._windowManager;
  }

  private _acc(): AccessibilityReader {
    if (!this._accessibility) throw new Error('Call init() before using DesktopBridge.');
    return this._accessibility;
  }

  private _sc(): ScreenCaptureService {
    if (!this._screenCapture) throw new Error('Call init() before using DesktopBridge.');
    return this._screenCapture;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function actionTypeToCategory(
  actionType: ActionType,
): DesktopAction['type'] {
  if (actionType.startsWith('keyboard') || ['typeText', 'pressKey', 'hotkey'].includes(actionType)) {
    return 'keyboard';
  }
  if (actionType.startsWith('mouse') || ['mouseClick', 'doubleClick', 'rightClick', 'scrollWindow'].includes(actionType)) {
    return 'mouse';
  }
  if (actionType.startsWith('clipboard')) {
    return 'clipboard';
  }
  return 'focus';
}

function isUndoable(actionType: ActionType): boolean {
  return actionType === 'clipboardWrite' || actionType === 'clipboardWriteImage';
}
