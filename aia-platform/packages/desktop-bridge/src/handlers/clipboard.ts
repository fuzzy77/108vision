/**
 * Clipboard handler — cross-platform clipboard read/write.
 *
 * Implementation strategy (no external dependencies):
 *   Windows : PowerShell `Get-Clipboard` / `Set-Clipboard`
 *   macOS   : `pbpaste` / `pbcopy`
 *   Linux   : `xclip -selection clipboard` (requires xclip installed)
 *
 * Limits:
 *   - Read returns at most 1 MB of text.
 *   - Write rejects content > 1 MB.
 *
 * No external npm packages — only Node.js `child_process` built-in.
 */

import { execFile, spawn as _spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MAX_CLIPBOARD_BYTES = 1 * 1024 * 1024; // 1 MB

// ---------------------------------------------------------------------------
// readClipboard
// ---------------------------------------------------------------------------

export async function readClipboard(): Promise<{ content: string; length: number }> {
  let content: string;

  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync(
        'powershell',
        ['-NoProfile', '-NonInteractive', '-Command', 'Get-Clipboard'],
        { encoding: 'utf-8', maxBuffer: MAX_CLIPBOARD_BYTES + 1024 },
      );
      content = stdout;
    } else if (process.platform === 'darwin') {
      const { stdout } = await execFileAsync(
        'pbpaste',
        [],
        { encoding: 'utf-8', maxBuffer: MAX_CLIPBOARD_BYTES + 1024 },
      );
      content = stdout;
    } else {
      // Linux — xclip required
      const { stdout } = await execFileAsync(
        'xclip',
        ['-selection', 'clipboard', '-o'],
        { encoding: 'utf-8', maxBuffer: MAX_CLIPBOARD_BYTES + 1024 },
      );
      content = stdout;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Clipboard read failed: ${msg}`);
  }

  // Cap at 1 MB
  const byteLength = Buffer.byteLength(content, 'utf-8');
  if (byteLength > MAX_CLIPBOARD_BYTES) {
    content = Buffer.from(content, 'utf-8').slice(0, MAX_CLIPBOARD_BYTES).toString('utf-8') +
      `\n... [truncated — ${byteLength} bytes total]`;
  }

  return { content, length: content.length };
}

// ---------------------------------------------------------------------------
// writeClipboard
// ---------------------------------------------------------------------------

export async function writeClipboard(text: string): Promise<{ written: true; length: number }> {
  if (text === undefined || text === null) {
    throw new Error('text must not be null or undefined');
  }

  const byteLength = Buffer.byteLength(text, 'utf-8');
  if (byteLength > MAX_CLIPBOARD_BYTES) {
    throw new Error(
      `Content too large for clipboard: ${byteLength} bytes (max ${MAX_CLIPBOARD_BYTES} / 1 MB)`,
    );
  }

  try {
    if (process.platform === 'win32') {
      // Use Set-Clipboard. Single-quote the value and escape internal single quotes.
      const escaped = text.replace(/'/g, "''");
      await execFileAsync(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `Set-Clipboard -Value '${escaped}'`,
        ],
        { encoding: 'utf-8' },
      );
    } else if (process.platform === 'darwin') {
      // pbcopy reads from stdin
      await writeToStdin('pbcopy', [], text);
    } else {
      // Linux — xclip required
      await writeToStdin('xclip', ['-selection', 'clipboard'], text);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Clipboard write failed: ${msg}`);
  }

  return { written: true, length: text.length };
}

// ---------------------------------------------------------------------------
// Private: write text to a process's stdin
// ---------------------------------------------------------------------------

function writeToStdin(binary: string, args: string[], text: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Use a dynamic require-style import that works in ESM via createRequire,
    // but since child_process is a built-in we can import it at module level.
    // The spawn reference is captured via the module-level import below.
    const child = _spawn(binary, args, { stdio: ['pipe', 'ignore', 'pipe'] });

    let stderrOutput = '';
    child.stderr?.on('data', (chunk: unknown) => {
      stderrOutput += Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : String(chunk);
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${binary} exited with code ${code}. stderr: ${stderrOutput}`));
      }
    });

    child.on('error', (err: Error) => reject(err));

    child.stdin?.write(text, 'utf-8');
    child.stdin?.end();
  });
}
