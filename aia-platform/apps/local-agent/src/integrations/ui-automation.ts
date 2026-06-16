/**
 * Windows UI Automation — 108 AI Desktop Agent
 *
 * All operations go through PowerShell subprocesses that drive the .NET
 * System.Windows.Automation API.  This allows the agent to read and interact
 * with any Windows application through the accessibility tree — no special
 * application support required.
 *
 * Prerequisites:
 *   Windows 10/11 (UIAutomationClient ships in-box on these platforms).
 *   PowerShell 5.1+ (ships with Windows 10/11).
 *
 * Design constraints:
 *   - Window search is always case-insensitive partial title match.
 *   - Default element-tree depth is 3 (deeper trees can be huge).
 *   - All public functions return null / false / [] on failure — never throw.
 *   - Timeout: 15 s per PowerShell subprocess.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PS_FLAGS = ['-NoProfile', '-NonInteractive', '-Command'];
const TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UIElement {
  name: string;
  automationId: string;
  controlType: string; // e.g. 'Button' | 'Edit' | 'Text' | 'Window' | 'List'
  className: string;
  value?: string;
  isEnabled: boolean;
  boundingRect: { x: number; y: number; width: number; height: number };
  children?: UIElement[];
}

export interface WindowInfo {
  title: string;
  processId: number;
  processName: string;
  className: string;
  handle: string; // hex window handle
  isMinimized: boolean;
  isMaximized: boolean;
  bounds: { x: number; y: number; width: number; height: number };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function runPs(script: string): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(
      'powershell.exe',
      [...PS_FLAGS, script],
      { timeout: TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 },
    );
    if (stderr.trim()) {
      const msg = stderr.trim();
      // PowerShell writes non-fatal warnings to stderr — only abort on hard errors.
      if (/Exception|Error|Cannot/.test(msg)) {
        throw new Error(`PowerShell error: ${msg}`);
      }
    }
    return stdout;
  } catch (err) {
    // Wrap subprocess errors with a clear message; callers decide how to surface.
    throw new Error(
      `UI Automation PowerShell subprocess failed: ${(err as Error).message}`,
    );
  }
}

/** Escape a string for embedding inside a PowerShell double-quoted string. */
function psEscape(value: string): string {
  return value.replace(/`/g, '``').replace(/"/g, '`"').replace(/\$/g, '`$');
}

/**
 * Common assembly-load preamble required by every script that uses
 * UIAutomationClient.  Included inline so each subprocess is self-contained.
 */
const UIA_PREAMBLE = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
`.trimStart();

/**
 * PowerShell helper function that recursively builds a UIElement object tree.
 * Inlined into scripts that need `Get-ElementTree`.
 */
function elementTreeFunction(maxDepth: number): string {
  return `
function Get-ElementTree {
  param($el, [int]$depth = 0, [int]$maxDepth = ${maxDepth})
  $ct = $el.Current.ControlType
  $ctName = if ($ct -ne $null) { $ct.ProgrammaticName.Split('.')[-1] } else { '' }
  $rect = $el.Current.BoundingRectangle
  $valueStr = ''
  try {
    $vp = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    $valueStr = $vp.Current.Value
  } catch {}
  $node = @{
    name         = [string]$el.Current.Name
    automationId = [string]$el.Current.AutomationId
    controlType  = $ctName
    className    = [string]$el.Current.ClassName
    value        = $valueStr
    isEnabled    = [bool]$el.Current.IsEnabled
    boundingRect = @{
      x      = [int]$rect.X
      y      = [int]$rect.Y
      width  = [int]$rect.Width
      height = [int]$rect.Height
    }
    children     = @()
  }
  if ($depth -lt $maxDepth) {
    $kids = $el.FindAll(
      [System.Windows.Automation.TreeScope]::Children,
      [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($kid in $kids) {
      $node.children += ,(Get-ElementTree $kid ($depth + 1) $maxDepth)
    }
  }
  return $node
}
`.trimStart();
}

/**
 * PowerShell snippet that resolves a top-level window by a partial
 * case-insensitive title match.  Writes the result into `$targetWindow`.
 */
function findWindowBlock(title: string): string {
  const escaped = psEscape(title);
  return `
$root = [System.Windows.Automation.AutomationElement]::RootElement
$allWindows = $root.FindAll(
  [System.Windows.Automation.TreeScope]::Children,
  [System.Windows.Automation.Condition]::TrueCondition)
$targetWindow = $null
foreach ($w in $allWindows) {
  if ($w.Current.Name -like "*${escaped}*") {
    $targetWindow = $w
    break
  }
}
if ($targetWindow -eq $null) {
  Write-Output 'null'
  exit 0
}
`.trimStart();
}

/**
 * PowerShell snippet that resolves an element within `$targetWindow` by name
 * and/or automationId.  Writes the result into `$targetElement`.
 */
function findElementBlock(query: {
  name?: string;
  automationId?: string;
}): string {
  const conditions: string[] = [];
  if (query.automationId) {
    const escaped = psEscape(query.automationId);
    conditions.push(
      `New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, "${escaped}")`,
    );
  }
  if (query.name) {
    const escaped = psEscape(query.name);
    conditions.push(
      `New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "${escaped}")`,
    );
  }

  let conditionExpr: string;
  if (conditions.length === 2) {
    conditionExpr = `New-Object System.Windows.Automation.AndCondition(@(${conditions.join(', ')}))`;
  } else if (conditions.length === 1) {
    conditionExpr = conditions[0]!;
  } else {
    conditionExpr =
      '[System.Windows.Automation.Condition]::TrueCondition';
  }

  return `
$searchCondition = ${conditionExpr}
$targetElement = $targetWindow.FindFirst(
  [System.Windows.Automation.TreeScope]::Subtree,
  $searchCondition)
`.trimStart();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List all top-level windows currently open on the desktop.
 */
export async function listWindows(): Promise<WindowInfo[]> {
  const script = `
${UIA_PREAMBLE}
Add-Type -AssemblyName System.Diagnostics.Process
$root = [System.Windows.Automation.AutomationElement]::RootElement
$windows = $root.FindAll(
  [System.Windows.Automation.TreeScope]::Children,
  [System.Windows.Automation.Condition]::TrueCondition)
$results = @()
foreach ($w in $windows) {
  $title = [string]$w.Current.Name
  if ($title -eq '') { continue }
  $pid = [int]$w.Current.ProcessId
  $procName = ''
  try {
    $p = [System.Diagnostics.Process]::GetProcessById($pid)
    $procName = $p.ProcessName
  } catch {}
  $hwnd = [string]$w.Current.NativeWindowHandle
  $hwndHex = '0x' + ([int64]$hwnd).ToString('X')
  $rect  = $w.Current.BoundingRectangle
  $wp    = $null
  $isMin = $false
  $isMax = $false
  try {
    $wp    = $w.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern)
    $vs    = $wp.Current.WindowVisualState
    $isMin = ($vs -eq [System.Windows.Automation.WindowVisualState]::Minimized)
    $isMax = ($vs -eq [System.Windows.Automation.WindowVisualState]::Maximized)
  } catch {}
  $results += @{
    title       = $title
    processId   = $pid
    processName = $procName
    className   = [string]$w.Current.ClassName
    handle      = $hwndHex
    isMinimized = $isMin
    isMaximized = $isMax
    bounds      = @{
      x      = [int]$rect.X
      y      = [int]$rect.Y
      width  = [int]$rect.Width
      height = [int]$rect.Height
    }
  }
}
$results | ConvertTo-Json -Depth 4 -Compress
`;

  try {
    const stdout = await runPs(script);
    const raw = stdout.trim();
    if (!raw || raw === 'null') return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return (parsed as unknown[]).map((item) => {
      const w = item as Record<string, unknown>;
      const bounds = (w['bounds'] ?? {}) as Record<string, unknown>;
      return {
        title: String(w['title'] ?? ''),
        processId: Number(w['processId'] ?? 0),
        processName: String(w['processName'] ?? ''),
        className: String(w['className'] ?? ''),
        handle: String(w['handle'] ?? ''),
        isMinimized: Boolean(w['isMinimized'] ?? false),
        isMaximized: Boolean(w['isMaximized'] ?? false),
        bounds: {
          x: Number(bounds['x'] ?? 0),
          y: Number(bounds['y'] ?? 0),
          width: Number(bounds['width'] ?? 0),
          height: Number(bounds['height'] ?? 0),
        },
      };
    });
  } catch {
    return [];
  }
}

/**
 * Return the accessibility element tree for a window (partial title match).
 *
 * @param windowTitle  Case-insensitive partial window title.
 * @param depth        How many levels deep to recurse (default: 3).
 */
export async function getElementTree(
  windowTitle: string,
  depth = 3,
): Promise<UIElement[]> {
  const safeDepth = Math.max(1, Math.min(depth, 10));
  const script = `
${UIA_PREAMBLE}
${elementTreeFunction(safeDepth)}
${findWindowBlock(windowTitle)}
$kids = $targetWindow.FindAll(
  [System.Windows.Automation.TreeScope]::Children,
  [System.Windows.Automation.Condition]::TrueCondition)
$results = @()
foreach ($kid in $kids) {
  $results += ,(Get-ElementTree $kid 0 ${safeDepth})
}
$results | ConvertTo-Json -Depth 20 -Compress
`;

  try {
    const stdout = await runPs(script);
    const raw = stdout.trim();
    if (!raw || raw === 'null') return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as UIElement[];
  } catch {
    return [];
  }
}

/**
 * Find a single element within a window by automationId, name, or controlType.
 * Returns null if no match is found.
 */
export async function findElement(
  windowTitle: string,
  query: { name?: string; automationId?: string; controlType?: string },
): Promise<UIElement | null> {
  // Build conditions from all supplied criteria.
  const conditions: string[] = [];
  if (query.automationId) {
    const escaped = psEscape(query.automationId);
    conditions.push(
      `New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, "${escaped}")`,
    );
  }
  if (query.name) {
    const escaped = psEscape(query.name);
    conditions.push(
      `New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "${escaped}")`,
    );
  }
  if (query.controlType) {
    // ControlType is matched by ProgrammaticName suffix (e.g. 'Button' → '*.Button').
    const escaped = psEscape(query.controlType);
    // Use a name condition on the ControlType.ProgrammaticName via string matching.
    // We match on the ControlType field name after collecting all elements.
    // PowerShell approach: find all and filter by controlType name post-collection.
    // For simplicity, omit from AND-condition and post-filter in PS.
    void escaped; // handled separately below
  }

  let conditionExpr: string;
  if (conditions.length === 2) {
    conditionExpr = `New-Object System.Windows.Automation.AndCondition(@(${conditions.join(', ')}))`;
  } else if (conditions.length === 1) {
    conditionExpr = conditions[0]!;
  } else {
    conditionExpr =
      '[System.Windows.Automation.Condition]::TrueCondition';
  }

  const ctFilter = query.controlType
    ? `if ($ctName -notlike "*${psEscape(query.controlType)}*") { continue }`
    : '';

  const script = `
${UIA_PREAMBLE}
${findWindowBlock(windowTitle)}
$searchCondition = ${conditionExpr}
$all = $targetWindow.FindAll(
  [System.Windows.Automation.TreeScope]::Subtree,
  $searchCondition)
$found = $null
foreach ($el in $all) {
  $ct = $el.Current.ControlType
  $ctName = if ($ct -ne $null) { $ct.ProgrammaticName.Split('.')[-1] } else { '' }
  ${ctFilter}
  $found = $el
  break
}
if ($found -eq $null) {
  Write-Output 'null'
  exit 0
}
$rect = $found.Current.BoundingRectangle
$valueStr = ''
try {
  $vp = $found.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
  $valueStr = $vp.Current.Value
} catch {}
$ct2 = $found.Current.ControlType
$ctName2 = if ($ct2 -ne $null) { $ct2.ProgrammaticName.Split('.')[-1] } else { '' }
$result = @{
  name         = [string]$found.Current.Name
  automationId = [string]$found.Current.AutomationId
  controlType  = $ctName2
  className    = [string]$found.Current.ClassName
  value        = $valueStr
  isEnabled    = [bool]$found.Current.IsEnabled
  boundingRect = @{
    x      = [int]$rect.X
    y      = [int]$rect.Y
    width  = [int]$rect.Width
    height = [int]$rect.Height
  }
}
$result | ConvertTo-Json -Depth 3 -Compress
`;

  try {
    const stdout = await runPs(script);
    const raw = stdout.trim();
    if (!raw || raw === 'null') return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const rect = (parsed['boundingRect'] ?? {}) as Record<string, unknown>;
    return {
      name: String(parsed['name'] ?? ''),
      automationId: String(parsed['automationId'] ?? ''),
      controlType: String(parsed['controlType'] ?? ''),
      className: String(parsed['className'] ?? ''),
      value: String(parsed['value'] ?? ''),
      isEnabled: Boolean(parsed['isEnabled'] ?? false),
      boundingRect: {
        x: Number(rect['x'] ?? 0),
        y: Number(rect['y'] ?? 0),
        width: Number(rect['width'] ?? 0),
        height: Number(rect['height'] ?? 0),
      },
    };
  } catch {
    return null;
  }
}

/**
 * Click an element identified by automationId or name inside a window.
 *
 * Prefers `InvokePattern.Invoke()` (accessibility-level click, no mouse move).
 * Falls back to setting focus and using `mouse_event` at the element's centre.
 */
export async function clickElement(
  windowTitle: string,
  query: { name?: string; automationId?: string },
): Promise<boolean> {
  const script = `
${UIA_PREAMBLE}
Add-Type -AssemblyName System.Windows.Forms
${findWindowBlock(windowTitle)}
${findElementBlock(query)}
if ($targetElement -eq $null) {
  Write-Output 'false'
  exit 0
}
$clicked = $false
try {
  $ip = $targetElement.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
  $ip.Invoke()
  $clicked = $true
} catch {}
if (-not $clicked) {
  try {
    $targetElement.SetFocus()
    $rect = $targetElement.Current.BoundingRectangle
    $cx   = [int]($rect.X + $rect.Width  / 2)
    $cy   = [int]($rect.Y + $rect.Height / 2)
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class MouseHelper {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, uint cButtons, int dwExtraInfo);
  public const uint MOUSEEVENTF_LEFTDOWN = 0x02;
  public const uint MOUSEEVENTF_LEFTUP   = 0x04;
}
"@
    [MouseHelper]::SetCursorPos($cx, $cy)
    Start-Sleep -Milliseconds 50
    [MouseHelper]::mouse_event([MouseHelper]::MOUSEEVENTF_LEFTDOWN, $cx, $cy, 0, 0)
    [MouseHelper]::mouse_event([MouseHelper]::MOUSEEVENTF_LEFTUP,   $cx, $cy, 0, 0)
    $clicked = $true
  } catch {}
}
Write-Output ($clicked.ToString().ToLower())
`;

  try {
    const stdout = await runPs(script);
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Type text into a window.  If a query is provided the target edit control is
 * focused first; otherwise the currently focused control receives the text.
 *
 * Prefers `ValuePattern.SetValue()` (instant, no keystroke simulation).
 * Falls back to `SendKeys` for controls that do not support ValuePattern.
 */
export async function typeText(
  windowTitle: string,
  text: string,
  query?: { name?: string; automationId?: string },
): Promise<boolean> {
  const escapedText = psEscape(text);

  const focusBlock = query
    ? `
${findElementBlock(query)}
if ($targetElement -ne $null) {
  try { $targetElement.SetFocus() } catch {}
}
`
    : '';

  const elementForValue = query
    ? `$elForValue = $targetElement`
    : `
$elForValue = [System.Windows.Automation.AutomationElement]::FocusedElement
`;

  const script = `
${UIA_PREAMBLE}
Add-Type -AssemblyName System.Windows.Forms
${findWindowBlock(windowTitle)}
${focusBlock}
${elementForValue}
$done = $false
if ($elForValue -ne $null) {
  try {
    $vp = $elForValue.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    $vp.SetValue("${escapedText}")
    $done = $true
  } catch {}
}
if (-not $done) {
  try {
    [System.Windows.Forms.SendKeys]::SendWait("${escapedText}")
    $done = $true
  } catch {}
}
Write-Output ($done.ToString().ToLower())
`;

  try {
    const stdout = await runPs(script);
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Read the current value from an element (TextBox, ComboBox, etc.).
 * Returns empty string if the element cannot be found or has no value.
 */
export async function readValue(
  windowTitle: string,
  query: { name?: string; automationId?: string },
): Promise<string> {
  const script = `
${UIA_PREAMBLE}
${findWindowBlock(windowTitle)}
${findElementBlock(query)}
if ($targetElement -eq $null) {
  Write-Output ''
  exit 0
}
$val = ''
try {
  $vp = $targetElement.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
  $val = $vp.Current.Value
} catch {
  $val = [string]$targetElement.Current.Name
}
Write-Output $val
`;

  try {
    const stdout = await runPs(script);
    return stdout.trim();
  } catch {
    return '';
  }
}

/**
 * Bring a window to the foreground and give it focus.
 * Uses WindowPattern.SetWindowVisualState if available, then SetFocus.
 */
export async function focusWindow(windowTitle: string): Promise<boolean> {
  const script = `
${UIA_PREAMBLE}
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinHelper {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  public const int SW_RESTORE = 9;
}
"@
${findWindowBlock(windowTitle)}
$hwnd = [IntPtr]$targetWindow.Current.NativeWindowHandle
[WinHelper]::ShowWindow($hwnd, [WinHelper]::SW_RESTORE) | Out-Null
[WinHelper]::SetForegroundWindow($hwnd) | Out-Null
try { $targetWindow.SetFocus() } catch {}
Write-Output 'true'
`;

  try {
    const stdout = await runPs(script);
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Minimize, maximize, or restore a window.
 */
export async function setWindowState(
  windowTitle: string,
  state: 'minimize' | 'maximize' | 'restore',
): Promise<boolean> {
  const stateMap: Record<string, string> = {
    minimize: 'Minimized',
    maximize: 'Maximized',
    restore: 'Normal',
  };
  const psState = stateMap[state] ?? 'Normal';

  const script = `
${UIA_PREAMBLE}
${findWindowBlock(windowTitle)}
try {
  $wp = $targetWindow.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern)
  $wp.SetWindowVisualState(
    [System.Windows.Automation.WindowVisualState]::${psState})
  Write-Output 'true'
} catch {
  Write-Output 'false'
}
`;

  try {
    const stdout = await runPs(script);
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Poll until an element matching `query` appears in the window, or the timeout
 * elapses.  Polls every 500 ms.  Returns the element or null on timeout.
 *
 * @param windowTitle  Case-insensitive partial window title.
 * @param query        Search criteria (name and/or automationId).
 * @param timeoutMs    Maximum wait in milliseconds (default: 5000).
 */
export async function waitForElement(
  windowTitle: string,
  query: { name?: string; automationId?: string },
  timeoutMs = 5_000,
): Promise<UIElement | null> {
  const deadline = Date.now() + timeoutMs;
  const POLL_MS = 500;

  while (Date.now() < deadline) {
    const el = await findElement(windowTitle, query);
    if (el !== null) return el;
    await new Promise<void>((resolve) => setTimeout(resolve, POLL_MS));
  }
  return null;
}

/**
 * Capture a screenshot of a specific window and return it as a base64-encoded
 * PNG string.  Suitable for passing directly to Vision models.
 *
 * Returns empty string on failure.
 */
export async function captureWindow(windowTitle: string): Promise<string> {
  const script = `
${UIA_PREAMBLE}
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinCapture {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  public const int SW_RESTORE = 9;
}
"@
${findWindowBlock(windowTitle)}
$hwnd = [IntPtr]$targetWindow.Current.NativeWindowHandle
[WinCapture]::ShowWindow($hwnd, [WinCapture]::SW_RESTORE) | Out-Null
[WinCapture]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 200
$rect = $targetWindow.Current.BoundingRectangle
$x = [int]$rect.X
$y = [int]$rect.Y
$w = [int]$rect.Width
$h = [int]$rect.Height
if ($w -le 0 -or $h -le 0) {
  Write-Output ''
  exit 0
}
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($x, $y, 0, 0, $bmp.Size,
  [System.Drawing.CopyPixelOperation]::SourceCopy)
$g.Dispose()
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$bytes = $ms.ToArray()
$ms.Dispose()
[System.Convert]::ToBase64String($bytes)
`;

  try {
    const stdout = await runPs(script);
    return stdout.trim();
  } catch {
    return '';
  }
}

/**
 * Send a keyboard shortcut or key sequence to a window.
 *
 * Uses `System.Windows.Forms.SendKeys.SendWait`.  The window is focused first.
 *
 * Key format (SendKeys notation):
 *   - `{ENTER}`, `{TAB}`, `{ESC}`, `{F4}` — special keys
 *   - `^c` — Ctrl+C
 *   - `%{F4}` — Alt+F4
 *   - `+(abc)` — Shift+abc
 *   - Literal characters are sent as-is.
 *
 * @param keys  Key string in SendKeys notation.
 */
export async function sendKeys(
  windowTitle: string,
  keys: string,
): Promise<boolean> {
  const escapedKeys = psEscape(keys);

  const script = `
${UIA_PREAMBLE}
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinFocus {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  public const int SW_RESTORE = 9;
}
"@
${findWindowBlock(windowTitle)}
$hwnd = [IntPtr]$targetWindow.Current.NativeWindowHandle
[WinFocus]::ShowWindow($hwnd, [WinFocus]::SW_RESTORE) | Out-Null
[WinFocus]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 100
try {
  [System.Windows.Forms.SendKeys]::SendWait("${escapedKeys}")
  Write-Output 'true'
} catch {
  Write-Output 'false'
}
`;

  try {
    const stdout = await runPs(script);
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * List the direct children of a parent element inside a window.
 *
 * @param windowTitle  Case-insensitive partial window title.
 * @param parentQuery  Identifies the parent element.
 */
export async function listChildren(
  windowTitle: string,
  parentQuery: { name?: string; automationId?: string },
): Promise<UIElement[]> {
  const script = `
${UIA_PREAMBLE}
${findWindowBlock(windowTitle)}
${findElementBlock(parentQuery)}
if ($targetElement -eq $null) {
  Write-Output '[]'
  exit 0
}
$kids = $targetElement.FindAll(
  [System.Windows.Automation.TreeScope]::Children,
  [System.Windows.Automation.Condition]::TrueCondition)
$results = @()
foreach ($el in $kids) {
  $ct = $el.Current.ControlType
  $ctName = if ($ct -ne $null) { $ct.ProgrammaticName.Split('.')[-1] } else { '' }
  $rect = $el.Current.BoundingRectangle
  $valueStr = ''
  try {
    $vp = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    $valueStr = $vp.Current.Value
  } catch {}
  $results += @{
    name         = [string]$el.Current.Name
    automationId = [string]$el.Current.AutomationId
    controlType  = $ctName
    className    = [string]$el.Current.ClassName
    value        = $valueStr
    isEnabled    = [bool]$el.Current.IsEnabled
    boundingRect = @{
      x      = [int]$rect.X
      y      = [int]$rect.Y
      width  = [int]$rect.Width
      height = [int]$rect.Height
    }
  }
}
$results | ConvertTo-Json -Depth 4 -Compress
`;

  try {
    const stdout = await runPs(script);
    const raw = stdout.trim();
    if (!raw || raw === 'null') return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return (parsed as unknown[]).map((item) => {
      const el = item as Record<string, unknown>;
      const rect = (el['boundingRect'] ?? {}) as Record<string, unknown>;
      return {
        name: String(el['name'] ?? ''),
        automationId: String(el['automationId'] ?? ''),
        controlType: String(el['controlType'] ?? ''),
        className: String(el['className'] ?? ''),
        value: String(el['value'] ?? ''),
        isEnabled: Boolean(el['isEnabled'] ?? false),
        boundingRect: {
          x: Number(rect['x'] ?? 0),
          y: Number(rect['y'] ?? 0),
          width: Number(rect['width'] ?? 0),
          height: Number(rect['height'] ?? 0),
        },
      };
    });
  } catch {
    return [];
  }
}
