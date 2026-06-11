/**
 * Windows desktop provider.
 *
 * Strategy:
 *   - Win32 window enumeration and manipulation via `koffi` FFI (user32.dll).
 *   - UI Automation tree reads via PowerShell subprocess (`[System.Windows.Automation]`).
 *     Pure FFI UIAutomation via COM is ~500 lines and fragile; PowerShell subprocess
 *     is the pragmatic choice until a dedicated native addon ships.
 *   - Screenshots via `screenshot-desktop`.
 *   - Input simulation via `@nut-tree-fork/nut-js`.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import type { DesktopProvider, WindowInfo, UIElement, ScreenCapture, Bounds } from '../types.js';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// koffi — lazy import so the module still loads on non-Windows at test time
// ---------------------------------------------------------------------------

type KoffiLib = {
  func(sig: string): KoffiFn;
};
type KoffiFn = (...args: unknown[]) => unknown;

let _user32: KoffiLib | null = null;

async function getUser32(): Promise<KoffiLib> {
  if (_user32) return _user32;
  // Dynamic import so TypeScript does not choke on missing types
  const koffi = await import('koffi');
  _user32 = koffi.default.load('user32.dll') as KoffiLib;
  return _user32;
}

// ---------------------------------------------------------------------------
// Win32 helpers
// ---------------------------------------------------------------------------

interface RectStruct {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Call EnumWindows and collect all HWNDs that pass IsWindowVisible.
 * We use a PowerShell fallback for the enumeration to keep koffi usage
 * minimal and to avoid COM callback complexity.
 */
async function enumVisibleWindows(): Promise<number[]> {
  // PowerShell: Get-Process returns visible main-window handles
  const script = `
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class WinApi {
      [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
      [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hwnd, System.Text.StringBuilder lpString, int nMaxCount);
      public delegate bool WNDENUMPROC(IntPtr hwnd, IntPtr lParam);
      [DllImport("user32.dll")] public static extern bool EnumWindows(WNDENUMPROC lpEnumFunc, IntPtr lParam);
    }
"@
    $handles = [System.Collections.Generic.List[int]]::new()
    $cb = [WinApi+WNDENUMPROC]{
      param($hwnd, $lp)
      if ([WinApi]::IsWindowVisible($hwnd)) {
        $sb = New-Object System.Text.StringBuilder 256
        [void][WinApi]::GetWindowText($hwnd, $sb, 256)
        if ($sb.Length -gt 0) { $handles.Add([int]$hwnd) }
      }
      return $true
    }
    [WinApi]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null
    $handles -join ','
  `.trim();

  const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', script]);
  const raw = stdout.trim();
  if (!raw) return [];
  return raw.split(',').map((h) => parseInt(h, 10)).filter((h) => !isNaN(h));
}

/**
 * Retrieve window information for a single HWND using a focused PS script.
 */
async function getWindowInfoForHandle(handle: number): Promise<WindowInfo | null> {
  const script = `
    Add-Type @"
    using System;
    using System.Text;
    using System.Diagnostics;
    using System.Runtime.InteropServices;
    public class WinInfo {
      [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECT lpRect);
      [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hwnd, StringBuilder lpString, int nMaxCount);
      [DllImport("user32.dll")] public static extern int GetClassName(IntPtr hwnd, StringBuilder lpClassName, int nMaxCount);
      [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint lpdwProcessId);
      [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
      [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    }
"@
    $hwnd = [IntPtr]${handle}
    $sb = New-Object System.Text.StringBuilder 512
    $cn = New-Object System.Text.StringBuilder 512
    [WinInfo]::GetWindowText($hwnd, $sb, 512) | Out-Null
    [WinInfo]::GetClassName($hwnd, $cn, 512) | Out-Null
    $rect = New-Object WinInfo+RECT
    [WinInfo]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
    $pid = [uint32]0
    [WinInfo]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
    try { $proc = (Get-Process -Id $pid -ErrorAction Stop).ProcessName } catch { $proc = '' }
    $fg = [WinInfo]::GetForegroundWindow()
    $focused = ($fg -eq $hwnd)
    "$($sb.ToString())|$($cn.ToString())|$pid|$proc|$($rect.Left)|$($rect.Top)|$($rect.Right)|$($rect.Bottom)|$focused"
  `.trim();

  try {
    const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', script]);
    const parts = stdout.trim().split('|');
    if (parts.length < 9) return null;
    const [title, className, pidStr, processName, left, top, right, bottom, focusedStr] = parts;
    const x = parseInt(left, 10);
    const y = parseInt(top, 10);
    const width = parseInt(right, 10) - x;
    const height = parseInt(bottom, 10) - y;
    if (width <= 0 || height <= 0) return null;
    return {
      handle,
      title: title.trim(),
      processName: processName.trim(),
      processId: parseInt(pidStr, 10),
      bounds: { x, y, width, height },
      isVisible: true,
      isFocused: focusedStr.trim().toLowerCase() === 'true',
      className: className.trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Use PowerShell + System.Windows.Automation to read the UI tree of a window.
 * Returns a flat JSON array that we reconstruct into a tree client-side.
 */
async function readUITreeViaPS(handle: number, depth: number): Promise<UIElement[]> {
  const script = `
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    $root = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]${handle})
    if (-not $root) { '[]'; exit }

    function Traverse($el, $currentDepth) {
      $obj = @{
        role = $el.GetCurrentPropertyValue([System.Windows.Automation.AutomationElement]::ControlTypeProperty).ProgrammaticName
        name = $el.GetCurrentPropertyValue([System.Windows.Automation.AutomationElement]::NameProperty)
        value = ''
        x    = [int]$el.Current.BoundingRectangle.X
        y    = [int]$el.Current.BoundingRectangle.Y
        w    = [int]$el.Current.BoundingRectangle.Width
        h    = [int]$el.Current.BoundingRectangle.Height
        enabled   = [bool]$el.Current.IsEnabled
        automationId = $el.Current.AutomationId
        children = @()
      }
      try {
        $vp = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
        $obj.value = $vp.Current.Value
        $obj.editable = -not $vp.Current.IsReadOnly
      } catch { $obj.editable = $false }

      if ($currentDepth -lt ${depth}) {
        $walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
        $child = $walker.GetFirstChild($el)
        while ($child) {
          $obj.children += Traverse $child ($currentDepth + 1)
          $child = $walker.GetNextSibling($child)
        }
      }
      return $obj
    }

    $tree = Traverse $root 0
    $tree | ConvertTo-Json -Depth 20 -Compress
  `.trim();

  try {
    const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', script], {
      maxBuffer: 10 * 1024 * 1024, // 10 MB — large trees can be verbose
    });
    const raw = stdout.trim();
    if (!raw || raw === '[]') return [];

    const parsed = JSON.parse(raw);
    const nodes: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    return nodes.map(mapPSNodeToUIElement);
  } catch {
    return [];
  }
}

function mapPSNodeToUIElement(node: unknown): UIElement {
  const n = node as Record<string, unknown>;
  const children = Array.isArray(n['children'])
    ? (n['children'] as unknown[]).map(mapPSNodeToUIElement)
    : [];

  // Normalize ControlType.ProgrammaticName → short role (e.g. "ControlType.Button" → "button")
  const rawRole = String(n['role'] ?? '');
  const role = rawRole.replace(/^ControlType\./, '').toLowerCase();

  return {
    role,
    name: String(n['name'] ?? ''),
    value: String(n['value'] ?? ''),
    bounds: {
      x: Number(n['x'] ?? 0),
      y: Number(n['y'] ?? 0),
      width: Number(n['w'] ?? 0),
      height: Number(n['h'] ?? 0),
    },
    children,
    isEnabled: Boolean(n['enabled'] ?? true),
    isEditable: Boolean(n['editable'] ?? false),
    automationId: n['automationId'] ? String(n['automationId']) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Screenshot helper — delegates to screenshot-desktop
// ---------------------------------------------------------------------------

async function captureScreenshot(opts?: {
  windowHandle?: number;
  bounds?: Bounds;
}): Promise<ScreenCapture> {
  // screenshot-desktop does not support per-window capture natively on Windows.
  // For window-specific capture we use PrintWindow via PowerShell.
  if (opts?.windowHandle !== undefined) {
    return captureWindowViaPS(opts.windowHandle);
  }

  const screenshotDesktop = await import('screenshot-desktop');
  const imgBuffer: Buffer = await screenshotDesktop.default({ format: 'png' });

  if (opts?.bounds) {
    return cropCapture(imgBuffer, opts.bounds);
  }

  // Parse dimensions from PNG header (bytes 16-23)
  const width = imgBuffer.readUInt32BE(16);
  const height = imgBuffer.readUInt32BE(20);

  return {
    buffer: imgBuffer,
    width,
    height,
    format: 'png',
    timestamp: Date.now(),
  };
}

async function captureWindowViaPS(handle: number): Promise<ScreenCapture> {
  const tmpPath = `${process.env['TEMP'] ?? 'C:\\Windows\\Temp'}\\aia_capture_${handle}_${Date.now()}.png`;

  const script = `
    Add-Type @"
    using System;
    using System.Drawing;
    using System.Drawing.Imaging;
    using System.Runtime.InteropServices;
    public class CapWin {
      [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
      [DllImport("user32.dll")] public static extern IntPtr GetDC(IntPtr hwnd);
      [DllImport("user32.dll")] public static extern int ReleaseDC(IntPtr hwnd, IntPtr hdc);
      [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);
      [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
    }
"@
    $hwnd = [IntPtr]${handle}
    $rect = New-Object CapWin+RECT
    [CapWin]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
    $w = $rect.Right - $rect.Left
    $h = $rect.Bottom - $rect.Top
    if ($w -le 0 -or $h -le 0) { exit 1 }
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $hdc = $g.GetHdc()
    [CapWin]::PrintWindow($hwnd, $hdc, 2) | Out-Null
    $g.ReleaseHdc($hdc)
    $g.Dispose()
    $bmp.Save('${tmpPath}', [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    "$w|$h"
  `.trim();

  const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', script]);
  const parts = stdout.trim().split('|');
  const width = parseInt(parts[0] ?? '0', 10);
  const height = parseInt(parts[1] ?? '0', 10);

  const fs = await import('fs/promises');
  const buffer = await fs.readFile(tmpPath);
  await fs.unlink(tmpPath).catch(() => undefined);

  return { buffer, width, height, format: 'png', windowHandle: handle, timestamp: Date.now() };
}

async function cropCapture(pngBuffer: Buffer, bounds: Bounds): Promise<ScreenCapture> {
  const sharp = (await import('sharp')).default;
  const cropped = await sharp(pngBuffer)
    .extract({ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height })
    .png()
    .toBuffer();
  return {
    buffer: cropped,
    width: bounds.width,
    height: bounds.height,
    format: 'png',
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Input simulation helpers — nut-js
// ---------------------------------------------------------------------------

async function getNutJs() {
  const nut = await import('@nut-tree-fork/nut-js');
  return nut;
}

// ---------------------------------------------------------------------------
// Provider class
// ---------------------------------------------------------------------------

export class WindowsProvider implements DesktopProvider {
  async getWindows(): Promise<WindowInfo[]> {
    const handles = await enumVisibleWindows();
    const results = await Promise.all(handles.map((h) => getWindowInfoForHandle(h)));
    return results.filter((w): w is WindowInfo => w !== null);
  }

  async getFocusedWindow(): Promise<WindowInfo | null> {
    const script = `
      Add-Type @"
      using System.Runtime.InteropServices;
      public class Fg { [DllImport("user32.dll")] public static extern System.IntPtr GetForegroundWindow(); }
"@
      [int][Fg]::GetForegroundWindow()
    `.trim();
    const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', script]);
    const handle = parseInt(stdout.trim(), 10);
    if (!handle) return null;
    return getWindowInfoForHandle(handle);
  }

  async focusWindow(handle: number): Promise<void> {
    const script = `
      Add-Type @"
      using System.Runtime.InteropServices;
      public class Sw { [DllImport("user32.dll")] public static extern bool SetForegroundWindow(System.IntPtr hwnd); }
"@
      [Sw]::SetForegroundWindow([IntPtr]${handle}) | Out-Null
    `.trim();
    await execFileAsync('powershell', ['-NoProfile', '-Command', script]);
  }

  async getUITree(handle: number, depth = 5): Promise<UIElement[]> {
    return readUITreeViaPS(handle, depth);
  }

  async captureWindow(handle: number): Promise<ScreenCapture> {
    return captureScreenshot({ windowHandle: handle });
  }

  async captureScreen(): Promise<ScreenCapture> {
    return captureScreenshot();
  }

  async captureRegion(x: number, y: number, w: number, h: number): Promise<ScreenCapture> {
    const full = await captureScreenshot();
    const cropped = await cropCapture(full.buffer, { x, y, width: w, height: h });
    return cropped;
  }

  async typeText(text: string): Promise<void> {
    const { keyboard, Key } = await getNutJs();
    await keyboard.type(text);
    void Key; // imported for side-effects, may be used in pressKey
  }

  async pressKey(key: string, modifiers: string[] = []): Promise<void> {
    const { keyboard, Key } = await getNutJs();

    const keyMap: Record<string, unknown> = {
      enter: Key.Enter,
      return: Key.Return,
      tab: Key.Tab,
      escape: Key.Escape,
      esc: Key.Escape,
      backspace: Key.Backspace,
      delete: Key.Delete,
      space: Key.Space,
      up: Key.Up,
      down: Key.Down,
      left: Key.Left,
      right: Key.Right,
      home: Key.Home,
      end: Key.End,
      pageup: Key.PageUp,
      pagedown: Key.PageDown,
      f1: Key.F1, f2: Key.F2, f3: Key.F3, f4: Key.F4,
      f5: Key.F5, f6: Key.F6, f7: Key.F7, f8: Key.F8,
      f9: Key.F9, f10: Key.F10, f11: Key.F11, f12: Key.F12,
      a: Key.A, b: Key.B, c: Key.C, d: Key.D, e: Key.E,
      f: Key.F, g: Key.G, h: Key.H, i: Key.I, j: Key.J,
      k: Key.K, l: Key.L, m: Key.M, n: Key.N, o: Key.O,
      p: Key.P, q: Key.Q, r: Key.R, s: Key.S, t: Key.T,
      u: Key.U, v: Key.V, w: Key.W, x: Key.X, y: Key.Y,
      z: Key.Z,
      '0': Key.Num0, '1': Key.Num1, '2': Key.Num2, '3': Key.Num3, '4': Key.Num4,
      '5': Key.Num5, '6': Key.Num6, '7': Key.Num7, '8': Key.Num8, '9': Key.Num9,
    };

    const modMap: Record<string, unknown> = {
      ctrl: Key.LeftControl,
      control: Key.LeftControl,
      alt: Key.LeftAlt,
      shift: Key.LeftShift,
      meta: Key.LeftSuper,
      win: Key.LeftSuper,
    };

    const targetKey = keyMap[key.toLowerCase()];
    if (!targetKey) throw new Error(`Unknown key: "${key}"`);

    const modKeys = modifiers
      .map((m) => modMap[m.toLowerCase()])
      .filter((k): k is unknown => k !== undefined);

    if (modKeys.length > 0) {
      await keyboard.pressKey(...(modKeys as Parameters<typeof keyboard.pressKey>), targetKey as Parameters<typeof keyboard.pressKey>[0]);
      await keyboard.releaseKey(...(modKeys as Parameters<typeof keyboard.releaseKey>), targetKey as Parameters<typeof keyboard.releaseKey>[0]);
    } else {
      await keyboard.pressKey(targetKey as Parameters<typeof keyboard.pressKey>[0]);
      await keyboard.releaseKey(targetKey as Parameters<typeof keyboard.releaseKey>[0]);
    }
  }

  async mouseClick(x: number, y: number, button: 'left' | 'right' = 'left'): Promise<void> {
    const { mouse, Button, Point } = await getNutJs();
    await mouse.setPosition(new Point(x, y));
    await mouse.click(button === 'right' ? Button.RIGHT : Button.LEFT);
  }

  async mouseMove(x: number, y: number): Promise<void> {
    const { mouse, Point } = await getNutJs();
    await mouse.setPosition(new Point(x, y));
  }

  async mouseScroll(x: number, y: number, delta: number): Promise<void> {
    const { mouse, Point, scroll } = await getNutJs();
    await mouse.setPosition(new Point(x, y));
    // nut-js scroll: positive = down
    await mouse.scroll(scroll(delta));
  }
}
