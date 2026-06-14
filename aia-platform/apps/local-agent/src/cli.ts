/**
 * CLI Mode — One-shot question/answer via terminal.
 *
 * Usage:
 *   108ai Cerca nei miei documenti la fattura di marzo
 *   108ai Qual era la decisione sulla migrazione?
 *   echo "testo" | 108ai --pipe Riassumi questo
 *   108ai --install        (auto-install in PATH)
 *   108ai --uninstall      (remove from PATH)
 *   108ai agent            (start background agent - existing behavior)
 */

import { existsSync, copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, platform } from 'node:os';
import { execSync } from 'node:child_process';
import { loadConfig, saveConfig, getDefaultGatewayUrl, type AgentConfig } from './config.js';
import { performBrowserLogin } from './auth.js';
import { tryLocalExecution } from './local-router.js';
import { initCache, getCached, setCached, flushToDisk } from './local-cache.js';
import { findScript, executeScript, updateUsage } from './script-store.js';
import { smartChunk } from './smart-chunk.js';

const INSTALL_DIR_NAME = '.108ai';

function getInstallDir(): string {
  return join(homedir(), INSTALL_DIR_NAME, 'bin');
}

function getExeName(): string {
  return platform() === 'win32' ? '108ai.exe' : '108ai';
}

/**
 * Install the binary to ~/.108ai/bin/ and add to PATH.
 */
export async function handleInstall(): Promise<void> {
  const installDir = getInstallDir();
  const targetPath = join(installDir, getExeName());
  const sourcePath = process.execPath;

  process.stdout.write('\n  108 AI -- Installazione\n\n');

  // 1. Create install directory
  if (!existsSync(installDir)) {
    mkdirSync(installDir, { recursive: true });
  }

  // 2. Copy binary
  if (sourcePath !== targetPath) {
    process.stdout.write(`  > Copia in ${installDir}...\n`);
    copyFileSync(sourcePath, targetPath);
  } else {
    process.stdout.write(`  > Gia' installato in ${installDir}\n`);
  }

  // 3. Add to PATH
  const isInPath = isDirectoryInPath(installDir);

  if (!isInPath) {
    process.stdout.write(`  > Aggiunta al PATH di sistema...\n`);

    if (platform() === 'win32') {
      // Windows: add to user PATH via setx (persistent)
      try {
        const currentPath = execSync('echo %PATH%', { encoding: 'utf-8' }).trim();
        if (!currentPath.includes(installDir)) {
          // Read user PATH from registry (not the expanded one)
          const userPath = execSync(
            `reg query "HKCU\\Environment" /v Path`,
            { encoding: 'utf-8' },
          );
          const match = userPath.match(/Path\s+REG_(?:EXPAND_)?SZ\s+(.+)/i);
          const existingUserPath = match ? match[1]!.trim() : '';
          const newPath = existingUserPath ? `${existingUserPath};${installDir}` : installDir;
          execSync(`setx PATH "${newPath}"`, { stdio: 'pipe' });
        }
      } catch {
        process.stdout.write(`  [!] Non riesco ad aggiungere al PATH automaticamente.\n`);
        process.stdout.write(`      Aggiungi manualmente: ${installDir}\n`);
      }
    } else {
      // Unix: append to shell profile
      const shellProfile = getShellProfile();
      if (shellProfile) {
        try {
          const exportLine = `\nexport PATH="$HOME/${INSTALL_DIR_NAME}/bin:$PATH"\n`;
          const content = existsSync(shellProfile) ? readFileSync(shellProfile, 'utf-8') : '';
          if (!content.includes(INSTALL_DIR_NAME)) {
            const { appendFileSync } = await import('node:fs');
            appendFileSync(shellProfile, exportLine);
          }
        } catch {
          process.stdout.write(`  [!] Non riesco a modificare ${shellProfile}.\n`);
          process.stdout.write(`      Aggiungi manualmente: export PATH="$HOME/${INSTALL_DIR_NAME}/bin:$PATH"\n`);
        }
      }
    }
  } else {
    process.stdout.write(`  > PATH gia' configurato\n`);
  }

  process.stdout.write('\n  [OK] Installazione completata!\n\n');
  process.stdout.write('  Ora puoi usare 108ai da qualsiasi terminale:\n\n');
  process.stdout.write('    108ai Cerca nei documenti la fattura di marzo\n');
  process.stdout.write('    108ai Che file ho modificato oggi?\n');
  process.stdout.write('    type report.txt | 108ai --pipe Riassumi questo\n');
  process.stdout.write('    108ai agent    (avvia agente in background)\n');
  process.stdout.write('\n');

  if (!isInPath) {
    process.stdout.write('  [!] Riavvia il terminale per rendere effettivo il PATH.\n\n');
  }
}

/**
 * Uninstall: remove from PATH hint.
 */
export function handleUninstall(): void {
  const installDir = getInstallDir();
  process.stdout.write('\n  Per disinstallare:\n');
  process.stdout.write(`  1. Elimina la cartella: ${join(homedir(), INSTALL_DIR_NAME)}\n`);
  process.stdout.write(`  2. Rimuovi "${installDir}" dal PATH\n\n`);
}

/**
 * CLI one-shot: send a question to the gateway and print the answer.
 *
 * Pipeline (token-saving):
 *   1. Try local execution (no LLM needed)
 *   2. Try saved scripts (previously generated, re-run locally)
 *   3. Try local cache (identical query already answered)
 *   4. Smart-chunk pipe input before sending
 *   5. Call gateway LLM (last resort)
 *   6. Cache the response for next time
 */
export async function handleCliQuery(query: string, pipeInput?: string): Promise<void> {
  // Initialize cache on first use
  initCache();

  // Load or create config
  let config = loadConfig();

  if (!config) {
    config = createDefaultConfig();
  }

  // --- P0 Step 1: Try local execution (zero tokens) ---
  if (!pipeInput) {
    const localResult = await tryLocalExecution(query, config);
    if (localResult) {
      process.stdout.write('\n');
      process.stdout.write(localResult.content);
      process.stdout.write('\n\n');
      process.stdout.write('  \x1b[90m[local - 0 token]\x1b[0m\n');
      flushToDisk();
      return;
    }
  }

  // --- P0 Step 2: Try saved scripts ---
  if (!pipeInput) {
    const script = findScript(query);
    if (script) {
      process.stdout.write(`\n  \x1b[36m>\x1b[0m Eseguo script salvato: ${script.name}\n\n`);
      const result = await executeScript(script.id);
      updateUsage(script.id);
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      process.stdout.write(`\n  \x1b[90m[script locale - 0 token]\x1b[0m\n`);
      flushToDisk();
      return;
    }
  }

  // --- P0 Step 3: Try local cache ---
  const fullQuery = pipeInput ? `${query}\n\n---\n\n${pipeInput}` : query;
  const cached = getCached(fullQuery);
  if (cached) {
    process.stdout.write('\n');
    process.stdout.write(cached.response);
    process.stdout.write('\n\n');
    process.stdout.write(`  \x1b[90m[cache hit - 0 token | risparmiati: ${cached.tokens}]\x1b[0m\n`);
    flushToDisk();
    return;
  }

  // --- P0 Step 4: Smart-chunk pipe input to reduce tokens ---
  let processedQuery = fullQuery;
  if (pipeInput && pipeInput.length > 2000) {
    const chunked = smartChunk(pipeInput, query);
    if (chunked.reductionPercent > 10) {
      processedQuery = `${query}\n\n---\n\n${chunked.content}`;
    }
  }

  // Auth if needed (only if we actually need the LLM)
  const gatewayHttp = config.gatewayHttpUrl ?? getDefaultGatewayUrl();

  if (!config.authToken || isTokenExpired(config)) {
    process.stdout.write('  > Autenticazione necessaria -- apertura browser...\n');
    try {
      const authResult = await performBrowserLogin(gatewayHttp);
      config.authToken = authResult.token;
      config.tenantId = authResult.tenantId;
      config.tokenExpiresAt = authResult.expiresAt;
      config.gatewayHttpUrl = gatewayHttp;
      saveConfig(config);
    } catch (err) {
      process.stdout.write(`  [ERR] Autenticazione fallita: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    }
  }

  // --- P0 Step 5: Call gateway LLM ---
  process.stdout.write('\n');

  try {
    const response = await fetch(`${gatewayHttp}/api/chat/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
        'X-Tenant-ID': config.tenantId,
      },
      body: JSON.stringify({ message: processedQuery }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      const detail = (errorData as { detail?: string }).detail ?? `HTTP ${response.status}`;
      process.stdout.write(`  [ERR] ${detail}\n`);
      process.exit(1);
    }

    // Collect full response for caching
    let fullResponse = '';

    // Stream the response
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Handle SSE format (data: ...)
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data) as { content?: string; text?: string };
              const text = parsed.content ?? parsed.text ?? '';
              if (text) {
                process.stdout.write(text);
                fullResponse += text;
              }
            } catch {
              process.stdout.write(data);
              fullResponse += data;
            }
          } else if (line.trim() && !line.startsWith('event:') && !line.startsWith(':')) {
            process.stdout.write(line);
            fullResponse += line;
          }
        }
      }
    } else {
      // Non-streaming response
      const data = await response.json() as { content?: string; message?: string; response?: string; model?: string; tokens?: number };
      const text = data.content ?? data.message ?? data.response ?? JSON.stringify(data);
      process.stdout.write(text);
      fullResponse = text;

      // --- P0 Step 6: Cache the LLM response ---
      if (fullResponse) {
        setCached(fullQuery, fullResponse, data.model ?? 'unknown', data.tokens ?? 0);
      }
    }

    // Cache streaming responses too
    if (fullResponse && !response.headers.get('content-type')?.includes('json')) {
      setCached(fullQuery, fullResponse, 'fast-cheap', 0);
    }

    process.stdout.write('\n\n');
    flushToDisk();
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      process.stdout.write('  [ERR] Timeout -- il server non ha risposto entro 120s\n');
    } else {
      process.stdout.write(`  [ERR] ${err instanceof Error ? err.message : String(err)}\n`);
    }
    flushToDisk();
    process.exit(1);
  }
}

// --- Helpers ---

function isDirectoryInPath(dir: string): boolean {
  const pathVar = process.env['PATH'] ?? '';
  const separator = platform() === 'win32' ? ';' : ':';
  return pathVar.split(separator).some(p => p.toLowerCase() === dir.toLowerCase());
}

function getShellProfile(): string | null {
  const home = homedir();
  const shell = process.env['SHELL'] ?? '';

  if (shell.includes('zsh')) return join(home, '.zshrc');
  if (shell.includes('bash')) {
    const bashProfile = join(home, '.bash_profile');
    if (existsSync(bashProfile)) return bashProfile;
    return join(home, '.bashrc');
  }
  if (shell.includes('fish')) return join(home, '.config', 'fish', 'config.fish');

  // Fallback
  if (existsSync(join(home, '.zshrc'))) return join(home, '.zshrc');
  if (existsSync(join(home, '.bashrc'))) return join(home, '.bashrc');
  return null;
}

function createDefaultConfig(): AgentConfig {
  return {
    gatewayUrl: '',
    authToken: '',
    tenantId: '',
    allowedDirectories: [],
    autoStart: false,
    riskPreferences: {
      autoApproveReadOnly: true,
      autoApproveLowRisk: true,
      requireApprovalHighRisk: true,
    },
    maxActionsPerMinute: 10,
    desktopEnabled: false,
    desktopVisionEnabled: true,
    screenshotBeforeAction: true,
  };
}

function isTokenExpired(config: AgentConfig): boolean {
  if (!config.tokenExpiresAt) return false;
  return Date.now() > config.tokenExpiresAt - 5 * 60 * 1000;
}

/**
 * Read stdin if data is being piped.
 */
export function readStdin(): Promise<string | null> {
  return new Promise((resolve) => {
    // Check if stdin is a TTY (interactive) — if so, no pipe input
    if (process.stdin.isTTY) {
      resolve(null);
      return;
    }

    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data.trim() || null));
    process.stdin.on('error', () => resolve(null));

    // Timeout after 100ms if no data arrives (not piped)
    setTimeout(() => {
      if (!data) resolve(null);
    }, 100);
  });
}
