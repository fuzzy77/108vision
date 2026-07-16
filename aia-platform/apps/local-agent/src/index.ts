#!/usr/bin/env node
/**
 * 108 AI — Desktop Agent
 *
 * Entry point for the desktop agent that provides OS-level capabilities
 * (file system, clipboard, shell, code editing, desktop automation) to
 * AI agents running on the 108 AI platform.
 *
 * The agent connects to the Gateway via WebSocket and executes actions
 * requested by the AI assistant, with all operations sandboxed and audited.
 *
 * Usage:
 *   108ai --gateway-url wss://api.108ai.dev --tenant-id <UUID> --token <token>
 *
 * Or configure interactively on first run (writes to ~/.108ai/config.json).
 */

import { loadConfig, parseCliArgs, saveConfig, isTokenExpired, getDefaultGatewayUrl, type AgentConfig } from './config.js';
import { performBrowserLogin, gatewayWsToHttp } from './auth.js';
import { startUpdateLoop, applyPendingUpdate, setUpdateNotificationHandler, scheduleRestart, loadPendingUpdateVersion } from './updater.js';
import { getAppVersion } from './version.js';
import { AgentConnection, type AgentMessage } from './connection.js';
import { executeAction, getRegisteredActions } from './capabilities/index.js';
import { setShellStreamHandler } from './capabilities/shell.js';
import { stopAllWatchers } from './capabilities/filesystem.js';
import { initializeTray, computeDesktopTrayStatus, openSettingsInBrowser, type TrayState } from './tray.js';
import { handleToolCall } from '@aia/desktop-bridge';
import { handleInstall, handleUninstall, handleCliQuery, readStdin } from './cli.js';
import { startShell } from './shell.js';
import { ensureInstalled } from './installer.js';
import { applyFirstRunDefaults, isFirstRunComplete } from './first-run.js';
import { openShellInTerminal } from './shell-launcher.js';
import { startTriageScheduler, stopTriageScheduler } from './triage/scheduler.js';
import { startJobScheduler, stopJobScheduler } from './jobs/scheduler.js';
import { startResourceMonitor, stopResourceMonitor } from './resources/monitor.js';
import { runAutoHealing } from './resources/auto-healer.js';

// --- Entry Point Router ---

const args = process.argv.slice(2);
const firstArg = args[0] ?? '';

// Route to appropriate mode based on arguments
if (firstArg === '--install' || firstArg === 'install') {
  handleInstall().then(() => process.exit(0)).catch((e) => {
    process.stderr.write(`Errore: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  });
} else if (firstArg === '--uninstall' || firstArg === 'uninstall') {
  handleUninstall();
  process.exit(0);
} else if (firstArg === '--version' || firstArg === '-v') {
  process.stdout.write(`108ai v${getAppVersion()}\n`);
  process.exit(0);
} else if (firstArg === 'setup' || firstArg === '--setup') {
  handleInstall().then(() => process.exit(0)).catch((e) => {
    process.stderr.write(`Errore: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  });
} else if (firstArg === 'agent' || firstArg === '--agent' || firstArg === '--daemon') {
  // Explicit agent mode
  startAgent();
} else if (firstArg === '--help' || firstArg === '-h') {
  printUsage();
  process.exit(0);
} else if (firstArg === '--pipe' || firstArg === '-p') {
  // Pipe mode: echo "text" | 108ai --pipe Riassumi questo
  const query = args.slice(1).join(' ') || 'Analizza questo input';
  readStdin().then((pipeInput) => {
    if (!pipeInput) {
      process.stderr.write('Nessun input ricevuto via pipe.\n');
      process.exit(1);
    }
    return handleCliQuery(query, pipeInput);
  }).then(() => process.exit(0)).catch((e) => {
    process.stderr.write(`Errore: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  });
} else if (firstArg && !firstArg.startsWith('--')) {
  // CLI query mode — no quotes needed:
  //   108ai Cerca nei miei documenti la fattura di marzo
  const query = args.join(' ');
  readStdin().then((pipeInput) => {
    return handleCliQuery(query, pipeInput ?? undefined);
  }).then(() => process.exit(0)).catch((e) => {
    process.stderr.write(`Errore: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  });
} else if (firstArg === 'shell' || firstArg === '--shell') {
  // Explicit shell mode
  startShell();
} else {
  // No args: if TTY (interactive terminal) → auto-install + shell, otherwise → agent mode
  if (process.stdin.isTTY) {
    (async () => {
      const result = await ensureInstalled();
      if (result && result.action === 'fresh') {
        const { printInstallSuccess } = await import('./installer.js');
        printInstallSuccess(result);
        process.stdout.write('\n  Avvio shell interattiva...\n\n');
      } else if (result && result.action === 'updated') {
        process.stdout.write(`\n  [OK] Aggiornato a v${getAppVersion()}\n\n`);
      }
      startShell();
    })();
  } else {
    startAgent();
  }
}

function printUsage(): void {
  process.stdout.write(`
  108 AI -- Desktop Agent & CLI

  USO:
    108ai                        Shell interattiva (come Claude Code)
    108ai domanda qui            Chiedi qualcosa all'AI (risposta e esci)
    108ai agent                  Avvia l'agente in background (WebSocket)
    108ai --install              Installa nel PATH + autostart
    108ai setup                  Ripara installazione (alias --install)
    108ai --pipe istruzione      Leggi da stdin e processa
    108ai --version              Mostra versione

  ESEMPI:
    108ai                        Apre la shell interattiva
    108ai Cerca nei miei documenti la fattura di marzo
    108ai Che file ho modificato oggi nel progetto?
    type report.txt | 108ai --pipe Fammi un riassunto
    git diff | 108ai Spiega queste modifiche
    108ai agent                  (usa dalla chat web)

  MODALITA':
    (nessun arg)          Shell interattiva con storico e memoria
    domanda               One-shot: risponde e esce
    agent                 Background daemon per chat web
    shell                 Shell interattiva (esplicito)

  OPZIONI:
    --gateway-url <url>   URL del gateway (default: ${getDefaultGatewayUrl()})
    --install             Copia in ~/.108ai/bin/ e aggiunge al PATH
    --uninstall           Istruzioni per rimuovere
    --version, -v         Versione
    --help, -h            Questo messaggio

  DATI LOCALI:
    ~/.108ai/config.json      Credenziali e preferenze
    ~/.108ai/cache/           Cache risposte LLM
    ~/.108ai/scripts/         Script riusabili generati dall'AI
    ~/.108ai/sessions/        Storico sessioni shell
    ~/.108ai/history/         Cronologia comandi

`);
}

// --- Main ---

function write(text: string): void {
  process.stdout.write(text + '\n');
}

function printBanner(): void {
  const version = getAppVersion();
  write('');
  write('  \x1b[32m+========================================+\x1b[0m');
  write('  \x1b[32m|\x1b[0m                                        \x1b[32m|\x1b[0m');
  write('  \x1b[32m|\x1b[0m   \x1b[1m108 AI\x1b[0m -- Desktop Agent              \x1b[32m|\x1b[0m');
  write(`  \x1b[32m|\x1b[0m   v${version.padEnd(36)}\x1b[32m|\x1b[0m`);
  write('  \x1b[32m|\x1b[0m                                        \x1b[32m|\x1b[0m');
  write('  \x1b[32m+========================================+\x1b[0m');
  write('');
}

function status(msg: string): void {
  write(`  \x1b[36m>\x1b[0m ${msg}`);
}

function statusOk(msg: string): void {
  write(`  \x1b[32m[OK]\x1b[0m ${msg}`);
}

function statusError(msg: string): void {
  write(`  \x1b[31m[ERR]\x1b[0m ${msg}`);
}

function startAgent(): void {
  main().catch((error) => {
    process.stderr.write(`Errore fatale: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}

async function main(): Promise<void> {
  printBanner();
  status('Avvio in corso...');

  if (applyPendingUpdate()) {
    statusOk('Aggiornamento applicato dalla sessione precedente');
  }

  // Silent install when launched from downloaded binary (not ~/.108ai/bin)
  const installResult = await ensureInstalled();
  if (installResult) {
    statusOk(`Installato in ${installResult.binaryPath}`);
    if (installResult.pathAdded) {
      status('Riavvia il terminale per aggiornare il PATH');
    }
    if (installResult.action === 'fresh') {
      applyFirstRunDefaults();
      statusOk('Primo avvio: triage mattutino lun-ven 07:00 attivato');
    }
  } else if (!isFirstRunComplete()) {
    applyFirstRunDefaults();
  }

  startTriageScheduler();
  startJobScheduler();
  startResourceMonitor(async (snapshot, changed) => {
    if (changed && snapshot.overall !== 'normal') {
      await runAutoHealing(snapshot);
    }
  });

  status('Caricamento configurazione...');

  // Load or create configuration — no interactive wizard.
  // First run: create default config and proceed to browser login.
  let config = loadConfig();

  if (!config) {
    config = {
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

  // Override config with CLI args (--gateway-url, --token, --tenant-id)
  config = parseCliArgs(config);

  // Determine gateway HTTP URL — use default if none configured
  const gatewayHttpUrl = config.gatewayHttpUrl ??
    (config.gatewayUrl ? gatewayWsToHttp(config.gatewayUrl) : getDefaultGatewayUrl());

  // If no token or token expired → browser login (automatic, no wizard)
  if (!config.authToken || isTokenExpired(config)) {
    const loginGateway = gatewayHttpUrl || getDefaultGatewayUrl();

    status('Autenticazione necessaria -- apertura browser...');
    write('');
    write('  \x1b[33m[!] Completa il login nel browser per continuare.\x1b[0m');
    write(`  \x1b[90m    Gateway: ${loginGateway}\x1b[0m`);
    write('');

    try {
      const authResult = await performBrowserLogin(loginGateway);
      config.authToken = authResult.token;
      config.tenantId = authResult.tenantId;
      config.tokenExpiresAt = authResult.expiresAt;
      config.gatewayHttpUrl = loginGateway;

      // Ensure gateway WS URL is set
      if (!config.gatewayUrl) {
        config.gatewayUrl = loginGateway
          .replace(/^https:\/\//, 'wss://')
          .replace(/^http:\/\//, 'ws://') + '/ws/local-agent';
      }

      saveConfig(config);
      statusOk('Autenticazione completata');
    } catch (error) {
      statusError(`Autenticazione fallita: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  } else {
    statusOk('Token valido trovato');
  }

  // Validate required config (post-auth)
  if (!config.gatewayUrl || !config.authToken || !config.tenantId) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Missing required configuration: gatewayUrl, authToken, and tenantId are required',
    }));
    process.exit(1);
  }

  // Start auto-update loop
  if (gatewayHttpUrl) {
    setUpdateNotificationHandler((info) => {
      tray?.notify(
        info.type === 'staged' ? '108 AI — Aggiornamento pronto' : '108 AI — Aggiornamento disponibile',
        info.type === 'staged'
          ? `v${info.version} scaricato. Riavvia l'agent per applicare.`
          : `Nuova versione v${info.version}`,
      );
      if (info.type === 'staged') {
        tray?.setPendingUpdate(info.version);
      }
    });
    startUpdateLoop(gatewayHttpUrl);
  }

  let connection: AgentConnection | null = null;
  let traySetState: ((state: TrayState) => void) | null = null;

  const shutdown = (signal: string): void => {
    console.log(JSON.stringify({
      level: 'info',
      message: `Shutting down (${signal})`,
    }));

    connection?.disconnect();
    setShellStreamHandler(null);
    stopAllWatchers();
    stopTriageScheduler();
    stopJobScheduler();
    stopResourceMonitor();
    tray?.destroy();

    process.exit(0);
  };

  const tray = await initializeTray({
    onOpenShell: () => {
      openShellInTerminal();
    },
    onOpenDashboard: () => {
      import('open').then((open) => {
        const dashUrl = config!.gatewayUrl
          .replace('wss://', 'https://')
          .replace('ws://', 'http://')
          .replace('/ws/local-agent', '');
        open.default(dashUrl).catch(() => {});
      }).catch(() => {});
    },
    onOpenSettings: () => {
      if (config) openSettingsInBrowser(config);
    },
    onPause: () => {
      connection?.pause();
      traySetState?.('paused');
      console.log(JSON.stringify({ level: 'info', message: 'Agent paused by user' }));
    },
    onResume: () => {
      connection?.resume();
      console.log(JSON.stringify({ level: 'info', message: 'Agent resumed by user' }));
    },
    onQuit: () => {
      shutdown('USER_QUIT');
    },
    onToggleDesktopAccess: (enabled: boolean) => {
      if (!config) return;

      const previous = config.desktopEnabled;
      config.desktopEnabled = enabled;

      try {
        saveConfig(config);
      } catch {
        console.log(JSON.stringify({
          level: 'warn',
          message: 'Failed to persist desktop access toggle',
        }));
      }

      console.log(JSON.stringify({
        level: 'info',
        message: `Desktop Access ${enabled ? 'enabled' : 'disabled'} by user`,
        previous,
        current: enabled,
      }));

      if (tray) {
        tray.setDesktopStatus(computeDesktopTrayStatus(config));
      }
    },
    onRestartForUpdate: () => {
      scheduleRestart();
    },
  }, {
    pendingUpdateVersion: loadPendingUpdateVersion(),
  });

  if (tray) {
    traySetState = tray.setState;
    // Set initial desktop indicator
    tray.setDesktopStatus(computeDesktopTrayStatus(config));
  }

  // Get registered capabilities
  const capabilities = getRegisteredActions();

  status(`${capabilities.length} capabilities registrate`);
  status(`Connessione a ${config.gatewayUrl}...`);

  // Create WebSocket connection
  const agentConnection = new AgentConnection({
    gatewayUrl: config.gatewayUrl,
    authToken: config.authToken,
    tenantId: config.tenantId,
    capabilities,
    onMessage: async (message: AgentMessage) => {
      await handleIncomingMessage(message, config!, agentConnection, traySetState);
    },
    onConnect: () => {
      traySetState?.('connected');
      write('');
      statusOk('\x1b[1mConnesso a 108 AI Gateway\x1b[0m');
      write('');
      write('  \x1b[90m-----------------------------------------\x1b[0m');
      write('  \x1b[90mL\'agent e\' attivo. Premi Ctrl+C per uscire.\x1b[0m');
      write('  \x1b[90m-----------------------------------------\x1b[0m');
      write('');
    },
    onDisconnect: () => {
      traySetState?.(agentConnection.isPaused() ? 'paused' : 'disconnected');
    },
  });

  connection = agentConnection;

  setShellStreamHandler((event) => {
    agentConnection.sendEvent('shell.stream', { ...event });
  });

  // Connect
  agentConnection.connect();

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Unhandled rejection',
      error: reason instanceof Error ? reason.message : String(reason),
    }));
  });

  process.on('uncaughtException', (error) => {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Uncaught exception',
      error: error.message,
      stack: error.stack,
    }));
    shutdown('UNCAUGHT_EXCEPTION');
  });
}

/**
 * Handle incoming action requests from the gateway.
 *
 * Supports two message types:
 *   - `request`   : legacy action dispatch via capabilities/index.ts
 *   - `tool_call` : new tool dispatch via @aia/desktop-bridge handleToolCall
 */
async function handleIncomingMessage(
  message: AgentMessage,
  config: AgentConfig,
  connection: AgentConnection,
  setTrayState: ((state: TrayState) => void) | null,
): Promise<void> {
  // --- tool_call: route via desktop-bridge dispatcher ---
  if (message.type === 'tool_call') {
    if (!message.tool) {
      connection.sendResponse(message.id, undefined, 'tool_call message missing "tool" field');
      return;
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Executing tool call',
      tool: message.tool,
      requestId: message.id,
    }));

    setTrayState?.('processing');

    const startTime = Date.now();
    const toolResult = await handleToolCall(
      message.tool,
      message.params ?? {},
      { allowedPaths: config.allowedDirectories },
    );

    setTrayState?.('connected');

    const durationMs = Date.now() - startTime;

    if (toolResult.ok) {
      connection.sendResponse(message.id, toolResult.result);
    } else {
      connection.sendResponse(message.id, undefined, toolResult.error);
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Tool call completed',
      tool: message.tool,
      requestId: message.id,
      success: toolResult.ok,
      durationMs,
    }));

    return;
  }

  // --- request: legacy action dispatch ---
  if (message.type !== 'request' || !message.action) {
    return;
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'Executing action',
    action: message.action,
    requestId: message.id,
  }));

  setTrayState?.('processing');

  const result = await executeAction(
    message.action,
    message.params ?? {},
    config,
  );

  setTrayState?.('connected');

  if (result.success) {
    connection.sendResponse(message.id, result.result);
  } else {
    connection.sendResponse(message.id, undefined, result.error);
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'Action completed',
    action: message.action,
    requestId: message.id,
    success: result.success,
    durationMs: result.durationMs,
  }));
}

