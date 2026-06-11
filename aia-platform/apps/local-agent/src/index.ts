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

import { loadConfig, parseCliArgs, runSetupWizard, saveConfig, type AgentConfig } from './config.js';
import { AgentConnection, type AgentMessage } from './connection.js';
import { executeAction, getRegisteredActions } from './capabilities/index.js';
import { stopAllWatchers } from './capabilities/filesystem.js';
import { initializeTray, computeDesktopTrayStatus, type TrayState } from './tray.js';

// --- Main ---

async function main(): Promise<void> {
  console.log(JSON.stringify({
    level: 'info',
    message: '108 AI — Desktop Agent starting',
    version: '0.2.0',
    pid: process.pid,
    platform: process.platform,
  }));

  // Load or create configuration
  let config = loadConfig();

  if (!config) {
    // Check if CLI args provide enough info
    const cliConfig = parseCliArgs({
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
    });

    if (cliConfig.gatewayUrl && cliConfig.authToken && cliConfig.tenantId) {
      config = cliConfig;
    } else {
      // Interactive setup
      config = await runSetupWizard();
    }
  } else {
    // Override config with CLI args
    config = parseCliArgs(config);
  }

  // Validate required config
  if (!config.gatewayUrl || !config.authToken || !config.tenantId) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Missing required configuration: gatewayUrl, authToken, and tenantId are required',
    }));
    process.exit(1);
  }

  // Initialize system tray (optional, graceful degradation)
  let traySetState: ((state: TrayState) => void) | null = null;

  const tray = await initializeTray({
    onOpenDashboard: () => {
      import('open').then((open) => {
        const dashUrl = config!.gatewayUrl
          .replace('wss://', 'https://')
          .replace('ws://', 'http://')
          .replace('/ws/local-agent', '');
        open.default(dashUrl).catch(() => {});
      }).catch(() => {});
    },
    onPause: () => {
      console.log(JSON.stringify({ level: 'info', message: 'Agent paused by user' }));
    },
    onResume: () => {
      console.log(JSON.stringify({ level: 'info', message: 'Agent resumed by user' }));
    },
    onQuit: () => {
      shutdown('USER_QUIT');
    },
    onToggleDesktopAccess: (enabled: boolean) => {
      if (!config) return;

      const previous = config.desktopEnabled;
      config.desktopEnabled = enabled;

      // Persist the toggle so it survives restarts
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

      // Update tray indicator
      if (tray) {
        tray.setDesktopStatus(computeDesktopTrayStatus(config));
      }
    },
  });

  if (tray) {
    traySetState = tray.setState;
    // Set initial desktop indicator
    tray.setDesktopStatus(computeDesktopTrayStatus(config));
  }

  // Get registered capabilities
  const capabilities = getRegisteredActions();

  console.log(JSON.stringify({
    level: 'info',
    message: 'Agent configured',
    tenantId: config.tenantId,
    capabilities: capabilities.length,
    allowedDirectories: config.allowedDirectories.length,
    gateway: config.gatewayUrl,
  }));

  // Create WebSocket connection
  const connection = new AgentConnection({
    gatewayUrl: config.gatewayUrl,
    authToken: config.authToken,
    tenantId: config.tenantId,
    capabilities,
    onMessage: async (message: AgentMessage) => {
      await handleIncomingMessage(message, config!, connection, traySetState);
    },
    onConnect: () => {
      traySetState?.('connected');
      console.log(JSON.stringify({
        level: 'info',
        message: 'Connected to 108 AI Gateway',
      }));
    },
    onDisconnect: () => {
      traySetState?.('disconnected');
    },
  });

  // Connect
  connection.connect();

  // Graceful shutdown
  const shutdown = (signal: string): void => {
    console.log(JSON.stringify({
      level: 'info',
      message: `Shutting down (${signal})`,
    }));

    connection.disconnect();
    stopAllWatchers();
    tray?.destroy();

    process.exit(0);
  };

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
 */
async function handleIncomingMessage(
  message: AgentMessage,
  config: AgentConfig,
  connection: AgentConnection,
  setTrayState: ((state: TrayState) => void) | null,
): Promise<void> {
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

// Run
main().catch((error) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Fatal startup error',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  }));
  process.exit(1);
});
