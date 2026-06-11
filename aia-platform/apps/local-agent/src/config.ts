/**
 * Configuration — Loads and manages 108 AI desktop agent settings.
 *
 * Config is stored at ~/.108ai/config.json.
 * On first run, a setup wizard prompts for gateway URL and auth token.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

export interface AgentConfig {
  gatewayUrl: string;
  authToken: string;
  tenantId: string;
  allowedDirectories: string[];
  autoStart: boolean;
  riskPreferences: {
    autoApproveReadOnly: boolean;
    autoApproveLowRisk: boolean;
    requireApprovalHighRisk: boolean;
  };
  maxActionsPerMinute: number;

  /**
   * Master switch for desktop automation capabilities.
   * Default: false (must be explicitly opted-in).
   * Can be toggled at runtime via the system tray "Desktop Access" menu item.
   */
  desktopEnabled: boolean;

  /**
   * Enable LLM vision analysis on screenshots (desktop.analyzeScreen).
   * Requires an AI client to be configured.
   * Default: true when desktopEnabled is true.
   */
  desktopVisionEnabled: boolean;

  /**
   * Capture a screenshot immediately before each HIGH-RISK desktop action
   * (typeText, clickElement, pressHotkey, mouseClick) for audit purposes.
   * The screenshot is returned as base64 in the action result under `screenshotBefore`.
   * Default: true.
   */
  screenshotBeforeAction: boolean;

  /**
   * Process allowlist for desktop actions.
   * When non-empty, desktop actions targeting a process NOT in this list are denied.
   * Example: ['chrome', 'code', 'notepad']
   * Default: undefined (all processes allowed).
   */
  allowedProcesses?: string[];

  /**
   * Process blocklist for desktop actions.
   * Desktop actions targeting a process in this list are always denied.
   * Example: ['cmd', 'powershell', 'bash']
   * Default: undefined (no processes blocked).
   */
  blockedProcesses?: string[];
}

const CONFIG_DIR_NAME = '.108ai';
const CONFIG_FILE_NAME = 'config.json';
const AUDIT_FILE_NAME = 'audit.log';

function getConfigDir(): string {
  return join(homedir(), CONFIG_DIR_NAME);
}

function getConfigPath(): string {
  return join(getConfigDir(), CONFIG_FILE_NAME);
}

export function getAuditLogPath(): string {
  return join(getConfigDir(), AUDIT_FILE_NAME);
}

function getDefaultAllowedDirectories(): string[] {
  const home = homedir();
  const dirs: string[] = [];

  const candidates = ['Documents', 'Desktop', 'Downloads'];
  for (const dir of candidates) {
    const fullPath = join(home, dir);
    if (existsSync(fullPath)) {
      dirs.push(fullPath);
    }
  }

  return dirs;
}

const DEFAULT_CONFIG: AgentConfig = {
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
  allowedProcesses: undefined,
  blockedProcesses: undefined,
};

/**
 * Load config from disk. Returns null if not found.
 */
export function loadConfig(): AgentConfig | null {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AgentConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return null;
  }
}

/**
 * Save config to disk. Creates directory if needed.
 */
export function saveConfig(config: AgentConfig): void {
  const configDir = getConfigDir();

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const configPath = getConfigPath();
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Parse CLI arguments and override config.
 * Supported args: --gateway-url, --tenant-id, --token
 */
export function parseCliArgs(config: AgentConfig): AgentConfig {
  const args = process.argv.slice(2);
  const result = { ...config };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--gateway-url':
      case '--gateway':
        if (next) {
          result.gatewayUrl = next;
          i++;
        }
        break;
      case '--tenant-id':
      case '--tenant':
        if (next) {
          result.tenantId = next;
          i++;
        }
        break;
      case '--token':
      case '--auth-token':
        if (next) {
          result.authToken = next;
          i++;
        }
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
108 AI — Desktop Agent

Usage:
  108ai [options]

Options:
  --gateway-url <url>   Gateway WebSocket URL (e.g., wss://api.108ai.dev)
  --tenant-id <id>      Tenant UUID
  --token <token>       Authentication token
  --help, -h            Show this help message

Configuration:
  Config file: ${getConfigPath()}
  Audit log:   ${getAuditLogPath()}

First Run:
  On first run without config, an interactive setup wizard will guide you.
`);
}

/**
 * Interactive first-run setup wizard.
 */
export async function runSetupWizard(): Promise<AgentConfig> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  };

  console.log('\n--- 108 AI — Desktop Agent Setup ---\n');
  console.log('This wizard will configure your local agent connection.\n');

  const gatewayUrl = await ask('Gateway URL (e.g., wss://api.108ai.dev): ');
  const tenantId = await ask('Tenant ID (UUID): ');
  const authToken = await ask('Auth Token: ');

  const defaultDirs = getDefaultAllowedDirectories();
  console.log(`\nDefault allowed directories: ${defaultDirs.join(', ')}`);
  const addMore = await ask('Add more directories? (comma-separated, or press Enter to skip): ');

  const allowedDirectories = [...defaultDirs];
  if (addMore) {
    const extra = addMore.split(',').map((d) => d.trim()).filter(Boolean);
    allowedDirectories.push(...extra);
  }

  rl.close();

  const config: AgentConfig = {
    gatewayUrl,
    authToken,
    tenantId,
    allowedDirectories,
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

  saveConfig(config);
  console.log(`\nConfiguration saved to: ${getConfigPath()}\n`);

  return config;
}
