import { spawn, execFile, type ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:net';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { existsSync, mkdirSync } from 'node:fs';
import { promisify } from 'node:util';
import { getHistory, getEntry, type ClipboardEntry } from './clipboard-history.js';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOTKEY_DEFAULT = 'Ctrl+Shift+V';
const HISTORY_DISPLAY_LIMIT = 10;
const PREVIEW_WIDTH = 80;
const IPC_SOCKET_PATH = join(tmpdir(), '108ai-hotkey.sock');
const IPC_PIPE_PATH = `\\\\.\\pipe\\108ai-hotkey`;
const CONFIG_DIR = join(homedir(), '.108ai');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let listenerProcess: ChildProcess | null = null;
let ipcServer: Server | null = null;
let onHotkeyFired: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Display a numbered clipboard history list to stdout and return a formatted
 * string. Suitable for embedding in any UI layer (shell `/clip` handler,
 * notification overlay, etc.).
 *
 * @param limit Number of entries to show (default: HISTORY_DISPLAY_LIMIT)
 */
export function renderClipboardSelector(limit = HISTORY_DISPLAY_LIMIT): {
  entries: ClipboardEntry[];
  rendered: string;
} {
  const entries = getHistory(limit);
  const lines: string[] = ['\n  \x1b[1mClipboard History:\x1b[0m\n'];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const pin = entry.pinned ? ' \x1b[33m[pin]\x1b[0m' : '';
    const time = new Date(entry.timestamp).toLocaleTimeString('it-IT');
    const preview = entry.content
      .replace(/\r?\n/g, ' ')
      .slice(0, PREVIEW_WIDTH);
    const ellipsis = entry.content.length > PREVIEW_WIDTH ? '...' : '';
    lines.push(`  \x1b[36m${String(i).padStart(2)}\x1b[0m  \x1b[90m${time}\x1b[0m  ${preview}${ellipsis}${pin}`);
  }

  lines.push('');
  return { entries, rendered: lines.join('\n') };
}

/**
 * Write a clipboard entry by index (from getHistory result) to the system
 * clipboard so the user can Ctrl+V it anywhere.
 *
 * @param index Zero-based index from getHistory() (newest-first)
 * @returns The content that was set, or null on bad index / write failure
 */
export async function selectAndPasteEntry(index: number): Promise<string | null> {
  const entry = getEntry(index);
  if (!entry) return null;

  try {
    await writeToSystemClipboard(entry.content);
    return entry.content;
  } catch {
    return null;
  }
}

/**
 * Register a callback that fires each time the hotkey is detected.
 * The callback is responsible for showing the selector and calling
 * selectAndPasteEntry().
 *
 * Idempotent — calling this a second time replaces the callback.
 */
export function onHotkey(callback: () => void): void {
  onHotkeyFired = callback;
}

/**
 * Start the background PowerShell process that watches for the global hotkey
 * and notifies the agent via a named pipe.
 *
 * Safe to call multiple times — stops the existing listener first.
 *
 * @param hotkey Hotkey string (ignored in v1, always Ctrl+Shift+V via PS)
 */
export async function startHotkeyListener(hotkey = HOTKEY_DEFAULT): Promise<void> {
  void hotkey;

  await stopHotkeyListener();
  ensureConfigDir();

  startIpcServer();
  spawnPowerShellListener();
}

/**
 * Stop the hotkey listener and clean up the IPC pipe.
 */
export async function stopHotkeyListener(): Promise<void> {
  if (listenerProcess) {
    listenerProcess.kill('SIGKILL');
    listenerProcess = null;
  }
  if (ipcServer) {
    await new Promise<void>((resolve) => ipcServer!.close(() => resolve()));
    ipcServer = null;
  }
}

// ---------------------------------------------------------------------------
// IPC Server — named pipe on Windows, Unix socket elsewhere
// ---------------------------------------------------------------------------

function startIpcServer(): void {
  const pipePath = process.platform === 'win32' ? IPC_PIPE_PATH : IPC_SOCKET_PATH;

  const server = createServer((socket) => {
    socket.on('data', (buf) => {
      const msg = buf.toString('utf-8').trim();
      if (msg === 'HOTKEY') {
        onHotkeyFired?.();
      }
    });
  });

  server.listen(pipePath, () => {
    // Pipe is ready — PowerShell will connect to it.
  });

  server.on('error', () => {
    // If the pipe already exists (e.g. stale from crash), ignore and retry.
    // The listener will simply not receive events until the pipe clears.
  });

  ipcServer = server;
}

// ---------------------------------------------------------------------------
// PowerShell global hotkey watcher
// ---------------------------------------------------------------------------

function spawnPowerShellListener(): void {
  // The PowerShell script registers a low-level keyboard hook via
  // RegisterHotKey (user32). On Ctrl+Shift+V (0x0001 + 0x0002 flags, VK=0x56)
  // it connects to the named pipe and sends "HOTKEY\n".
  //
  // RegisterHotKey is simpler and more reliable than SetWindowsHookEx for
  // single hotkey registration — no DLL injection, no global hook privilege
  // escalation required.
  //
  // MOD_CONTROL=0x0002, MOD_SHIFT=0x0004, VK_V=0x56
  const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.IO.Pipes;
using System.Text;

public class HotkeyWatcher {
  [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);
  [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr hWnd, int id);
  [DllImport("user32.dll")] static extern int GetMessage(ref MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

  [StructLayout(LayoutKind.Sequential)]
  public struct MSG {
    public IntPtr hwnd;
    public uint message;
    public IntPtr wParam;
    public IntPtr lParam;
    public uint time;
    public System.Drawing.Point pt;
  }

  const uint MOD_CONTROL = 0x0002;
  const uint MOD_SHIFT   = 0x0004;
  const uint VK_V        = 0x56;
  const uint WM_HOTKEY   = 0x0312;
  const int  HOTKEY_ID   = 1;

  static void SendToPipe(string pipeName) {
    try {
      using var pipe = new NamedPipeClientStream(".", pipeName, PipeDirection.Out);
      pipe.Connect(1000);
      var buf = Encoding.UTF8.GetBytes("HOTKEY\\n");
      pipe.Write(buf, 0, buf.Length);
    } catch {}
  }

  public static void Run(string pipeName) {
    RegisterHotKey(IntPtr.Zero, HOTKEY_ID, MOD_CONTROL | MOD_SHIFT, VK_V);
    MSG msg = new MSG();
    while (GetMessage(ref msg, IntPtr.Zero, 0, 0) != 0) {
      if (msg.message == WM_HOTKEY && (int)msg.wParam == HOTKEY_ID) {
        SendToPipe(pipeName);
      }
    }
    UnregisterHotKey(IntPtr.Zero, HOTKEY_ID);
  }
}
"@

[HotkeyWatcher]::Run("108ai-hotkey")
`.trim();

  // Pipe name for NamedPipeClientStream must be just the name, not the full path
  const proc = spawn(
    'powershell',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      script,
    ],
    {
      detached: false,
      stdio: ['ignore', 'ignore', 'ignore'],
      windowsHide: true,
    },
  );

  proc.on('error', () => {
    // PowerShell not available or spawn failed — hotkey listener inactive.
    listenerProcess = null;
  });

  proc.on('exit', (code) => {
    // PS exited unexpectedly (e.g. after system sleep/wake).
    // Respawn after a short delay if we haven't been explicitly stopped.
    if (listenerProcess === proc && code !== null) {
      listenerProcess = null;
      setTimeout(() => {
        if (ipcServer) {
          spawnPowerShellListener();
        }
      }, 5_000);
    }
  });

  listenerProcess = proc;
}

// ---------------------------------------------------------------------------
// Shell /clip handler
// ---------------------------------------------------------------------------

/**
 * Interactive `/clip` command handler for the shell REPL.
 *
 * Shows the history, prompts for index selection, and writes the chosen
 * entry to the system clipboard. Returns the pasted content or null if
 * the user cancels (empty input).
 *
 * Designed to be called from shell.ts handleSlashCommand('clip-pick').
 *
 * @param promptFn Async function that writes a prompt and reads one line
 *                 (injected so this module stays independent of readline).
 */
export async function runClipSelector(
  promptFn: (msg: string) => Promise<string>,
): Promise<string | null> {
  const { entries, rendered } = renderClipboardSelector();

  if (entries.length === 0) {
    process.stdout.write('  Clipboard history vuota.\n');
    return null;
  }

  process.stdout.write(rendered);

  const raw = await promptFn('  Indice (Invio per annullare): ');
  const trimmed = raw.trim();

  if (!trimmed) return null;

  const idx = parseInt(trimmed, 10);
  if (isNaN(idx) || idx < 0 || idx >= entries.length) {
    process.stdout.write(`  Indice non valido: "${trimmed}"\n`);
    return null;
  }

  const content = await selectAndPasteEntry(idx);
  if (content === null) {
    process.stdout.write('  Errore nella scrittura del clipboard.\n');
    return null;
  }

  const preview = content.replace(/\r?\n/g, ' ').slice(0, 60);
  process.stdout.write(`  \x1b[32m[OK]\x1b[0m Clipboard: ${preview}${content.length > 60 ? '...' : ''}\n`);
  process.stdout.write('  Premi Ctrl+V per incollare.\n');
  return content;
}

// ---------------------------------------------------------------------------
// Clipboard write — Windows PowerShell, macOS pbcopy
// ---------------------------------------------------------------------------

async function writeToSystemClipboard(text: string): Promise<void> {
  if (process.platform === 'win32') {
    // Escape single quotes for PowerShell string literal
    const escaped = text.replace(/'/g, "''");
    await execFileAsync('powershell', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Set-Clipboard -Value '${escaped}'`,
    ]);
    return;
  }

  if (process.platform === 'darwin') {
    const { exec } = await import('node:child_process');
    await new Promise<void>((resolve, reject) => {
      const child = exec('pbcopy');
      child.stdin?.write(text);
      child.stdin?.end();
      child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pbcopy exited ${code}`))));
    });
    return;
  }

  // Linux: xclip required
  const { exec } = await import('node:child_process');
  await new Promise<void>((resolve, reject) => {
    const child = exec('xclip -selection clipboard');
    child.stdin?.write(text);
    child.stdin?.end();
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`xclip exited ${code}`))));
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}
