/**
 * AppDetector — classify running applications by type.
 *
 * Knowing the application type helps the bridge choose the right
 * perception strategy:
 *
 *   native-win32   → Accessibility API works well
 *   electron       → Accessibility partial; DevTools protocol possible
 *   browser        → Accessibility tree is the DOM; may need CDP
 *   terminal       → Text-based; screen scraping or ConPTY
 *   java-swing     → Java Accessibility Bridge required
 *   wpf            → UIA works well
 *   uwp            → UIA works, but with limitations
 *   game           → No accessibility; screenshot + OCR only
 *   unknown        → Default to screenshot + OCR
 */

import type { WindowInfo } from '../types.js';

export type AppType =
  | 'native-win32'
  | 'electron'
  | 'browser'
  | 'terminal'
  | 'java-swing'
  | 'wpf'
  | 'uwp'
  | 'game'
  | 'unknown';

export interface AppInfo {
  window: WindowInfo;
  appType: AppType;
  /** Recommended perception strategy for this app type. */
  recommendedPerception: 'accessibility' | 'ocr' | 'vision';
  notes: string;
}

// ---------------------------------------------------------------------------
// Heuristic classification — process name + class name fingerprints
// ---------------------------------------------------------------------------

const PROCESS_TYPE_MAP: Array<{ pattern: RegExp; type: AppType }> = [
  // Browsers
  { pattern: /^(chrome|msedge|brave|vivaldi|opera|firefox|iexplore)$/i, type: 'browser' },
  // Electron apps
  { pattern: /^(code|slack|teams|discord|notion|obsidian|figma|postman|insomnia)$/i, type: 'electron' },
  // Terminals
  { pattern: /^(cmd|powershell|pwsh|WindowsTerminal|conhost|alacritty|wezterm|mintty)$/i, type: 'terminal' },
  // Java Swing
  { pattern: /^(java|javaw|javaws)$/i, type: 'java-swing' },
  // Games (common launchers)
  { pattern: /^(steam|epicgameslauncher|gog|battlenet)$/i, type: 'game' },
];

const CLASS_TYPE_MAP: Array<{ pattern: RegExp; type: AppType }> = [
  { pattern: /Chrome_WidgetWin/i, type: 'browser' },
  { pattern: /MozillaWindowClass/i, type: 'browser' },
  { pattern: /ApplicationFrameWindow/i, type: 'uwp' },
  { pattern: /ConsoleWindowClass/i, type: 'terminal' },
];

function classifyByProcess(processName: string, className: string): AppType {
  for (const { pattern, type } of PROCESS_TYPE_MAP) {
    if (pattern.test(processName)) return type;
  }
  for (const { pattern, type } of CLASS_TYPE_MAP) {
    if (pattern.test(className)) return type;
  }
  return 'unknown';
}

function recommendedPerception(type: AppType): 'accessibility' | 'ocr' | 'vision' {
  switch (type) {
    case 'native-win32':
    case 'wpf':
    case 'uwp':
      return 'accessibility';
    case 'electron':
    case 'browser':
    case 'java-swing':
      return 'accessibility'; // Try first, fallback to ocr/vision handled by bridge
    case 'terminal':
      return 'ocr';
    case 'game':
    case 'unknown':
      return 'vision';
  }
}

function notes(type: AppType): string {
  switch (type) {
    case 'native-win32': return 'Full UIA support expected.';
    case 'wpf': return 'Good UIA support via AutomationPeer.';
    case 'uwp': return 'UIA works but UI tree depth may be limited.';
    case 'electron': return 'UIA tree available but may be shallow; Ctrl+Shift+I for DevTools.';
    case 'browser': return 'DOM exposed via UIA; consider CDP for richer access.';
    case 'terminal': return 'Text-based; OCR works on rendered output.';
    case 'java-swing': return 'Requires Java Accessibility Bridge (JAB) to be enabled.';
    case 'game': return 'No accessibility tree; screenshot + vision only.';
    case 'unknown': return 'Unknown app type — try accessibility first, fall back to vision.';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class AppDetector {
  /**
   * Classify a single window's application type.
   */
  detect(window: WindowInfo): AppInfo {
    const type = classifyByProcess(window.processName, window.className);
    return {
      window,
      appType: type,
      recommendedPerception: recommendedPerception(type),
      notes: notes(type),
    };
  }

  /**
   * Classify all provided windows.
   */
  detectAll(windows: WindowInfo[]): AppInfo[] {
    return windows.map((w) => this.detect(w));
  }

  /**
   * Return windows of a specific app type from a list.
   */
  filterByType(windows: WindowInfo[], type: AppType): WindowInfo[] {
    return windows.filter((w) => classifyByProcess(w.processName, w.className) === type);
  }
}
