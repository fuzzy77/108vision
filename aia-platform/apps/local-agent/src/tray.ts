/**
 * System Tray — Native menu via systray2 when available, else desktop notifications.
 */

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AgentConfig } from './config.js';
import { getAppVersion } from './version.js';

export type TrayState = 'connected' | 'disconnected' | 'processing' | 'paused';

export type DesktopTrayStatus = 'enabled' | 'partial' | 'disabled';

export interface TrayInitOptions {
  pendingUpdateVersion?: string | null;
}

export interface TrayCallbacks {
  onOpenShell: () => void;
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
  onToggleDesktopAccess: (enabled: boolean) => void;
  onRestartForUpdate?: () => void;
}

interface TrayInstance {
  setState: (state: TrayState) => void;
  setTooltip: (text: string) => void;
  setDesktopStatus: (status: DesktopTrayStatus) => void;
  setPendingUpdate: (version: string | null) => void;
  notify: (title: string, message: string) => void;
  destroy: () => void;
}

/** 16×16 PNG icons per connection state (base64). */
const TRAY_ICONS: Record<TrayState, string> = {
  connected:
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGwwAGBgZGBgYoBhQjI2MIJgYAABQAB3pLkZ0AAAAASUVORK5CYII=',
  disconnected:
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGwwAGBgZGBgYoBhQjI2MIJgYAABQAB3pLkZ0AAAAASUVORK5CYII=',
  processing:
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGwwAGBgZGBgYoBhQjI2MIJgYAABQAB3pLkZ0AAAAASUVORK5CYII=',
  paused:
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGwwAGBgZGBgYoBhQjI2MIJgYAABQAB3pLkZ0AAAAASUVORK5CYII=',
};

const MENU = {
  shell: 'Apri Shell',
  dashboard: 'Apri Dashboard',
  settings: 'Impostazioni',
  restartUpdate: 'Riavvia per aggiornare',
  pause: 'Pausa agente',
  resume: 'Riprendi agente',
  desktopOn: 'Abilita Desktop Access',
  desktopOff: 'Disabilita Desktop Access',
  quit: 'Esci',
} as const;

function resolveSystrayBinDir(): string | null {
  const candidates = [
    join(process.cwd(), 'node_modules', 'systray2', 'traybin'),
    join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', 'systray2', 'traybin'),
    join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'systray2', 'traybin'),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return null;
}

async function sendDesktopNotification(title: string, message: string): Promise<void> {
  if (!hasDisplay()) return;
  try {
    const notifier = await import('node-notifier');
    notifier.default.notify({ title, message, sound: false, wait: false });
  } catch {
    // best-effort
  }
}

type SystrayModule = {
  default: new (config: {
    copyDirectory: string;
    icon: string;
    title: string;
    tooltip: string;
    items: Array<{ title: string; tooltip: string; checked: boolean; enabled: boolean } | unknown>;
  }) => {
    onClick: (cb: (action: { item?: { title?: string } }) => void) => void;
    sendAction: (action: unknown) => void;
    kill: () => void;
  };
  separator?: unknown;
};

async function tryNativeTray(
  callbacks: TrayCallbacks,
  initialDesktop: DesktopTrayStatus,
  options: TrayInitOptions,
): Promise<TrayInstance | null> {
  const copyDirectory = resolveSystrayBinDir();
  if (!copyDirectory) return null;

  let SysTray: SystrayModule['default'];
  let separator: unknown;
  try {
    const mod = (await import('systray2')) as SystrayModule;
    SysTray = mod.default;
    separator = mod.separator;
  } catch {
    return null;
  }

  let connectionState: TrayState = 'disconnected';
  let desktopStatus = initialDesktop;
  let pendingUpdate = options.pendingUpdateVersion ?? null;
  let tooltip = `108 AI v${getAppVersion()}`;

  const statusLabel = (): string => {
    const labels: Record<TrayState, string> = {
      connected: 'Connesso',
      disconnected: 'Disconnesso',
      processing: 'Elaborazione…',
      paused: 'In pausa',
    };
    return `108 AI v${getAppVersion()} — ${labels[connectionState]}`;
  };

  const buildItems = () => {
    const items: Array<{ title: string; tooltip: string; checked: boolean; enabled: boolean } | unknown> = [
      { title: statusLabel(), tooltip: '', checked: false, enabled: false },
      separator,
      { title: MENU.shell, tooltip: 'Terminale interattivo', checked: false, enabled: true },
      { title: MENU.dashboard, tooltip: 'Browser', checked: false, enabled: true },
      { title: MENU.settings, tooltip: 'Browser', checked: false, enabled: true },
      separator,
    ];

    if (pendingUpdate && callbacks.onRestartForUpdate) {
      items.push({
        title: `${MENU.restartUpdate} (v${pendingUpdate})`,
        tooltip: '',
        checked: false,
        enabled: true,
      });
      items.push(separator);
    }

    items.push(
      connectionState === 'paused' || connectionState === 'disconnected'
        ? { title: MENU.resume, tooltip: '', checked: false, enabled: true }
        : { title: MENU.pause, tooltip: '', checked: false, enabled: true },
      separator,
      desktopStatus === 'disabled'
        ? { title: MENU.desktopOn, tooltip: '', checked: false, enabled: true }
        : { title: MENU.desktopOff, tooltip: '', checked: false, enabled: true },
      separator,
      { title: MENU.quit, tooltip: '', checked: false, enabled: true },
    );

    return items;
  };

  const systray = new SysTray({
    copyDirectory,
    icon: TRAY_ICONS[connectionState],
    title: '108 AI',
    tooltip,
    items: buildItems(),
  });

  const refreshMenu = () => {
    try {
      systray.sendAction({
        type: 'update-item',
        item: buildItems(),
      });
    } catch {
      // systray2 may not support dynamic refresh on all platforms
    }
  };

  systray.onClick((action) => {
    const title = action.item?.title ?? '';
    if (title.startsWith(MENU.restartUpdate)) {
      callbacks.onRestartForUpdate?.();
      return;
    }
    switch (title) {
      case MENU.shell:
        callbacks.onOpenShell();
        break;
      case MENU.dashboard:
        callbacks.onOpenDashboard();
        break;
      case MENU.settings:
        callbacks.onOpenSettings();
        break;
      case MENU.pause:
        callbacks.onPause();
        connectionState = 'paused';
        refreshMenu();
        break;
      case MENU.resume:
        callbacks.onResume();
        connectionState = 'connected';
        refreshMenu();
        break;
      case MENU.desktopOn:
        callbacks.onToggleDesktopAccess(true);
        desktopStatus = 'enabled';
        refreshMenu();
        break;
      case MENU.desktopOff:
        callbacks.onToggleDesktopAccess(false);
        desktopStatus = 'disabled';
        refreshMenu();
        break;
      case MENU.quit:
        callbacks.onQuit();
        break;
      default:
        break;
    }
  });

  return {
    setState(state: TrayState) {
      connectionState = state;
      tooltip = statusLabel();
      refreshMenu();
    },
    setTooltip(text: string) {
      tooltip = text;
    },
    setDesktopStatus(status: DesktopTrayStatus) {
      desktopStatus = status;
      refreshMenu();
    },
    setPendingUpdate(version: string | null) {
      pendingUpdate = version;
      refreshMenu();
    },
    notify(title: string, message: string) {
      void sendDesktopNotification(title, message);
    },
    destroy() {
      try {
        systray.kill();
      } catch {
        // ignore
      }
    },
  };
}

async function fallbackTray(callbacks: TrayCallbacks): Promise<TrayInstance> {
  let currentState: TrayState = 'disconnected';

  return {
    setState(state: TrayState) {
      if (currentState !== state) {
        currentState = state;
        const labels: Record<TrayState, string> = {
          connected: 'Connesso',
          disconnected: 'Disconnesso',
          processing: 'Elaborazione...',
          paused: 'In pausa',
        };
        void sendDesktopNotification('108 AI', labels[state]);
      }
    },
    setTooltip() { /* noop */ },
    setDesktopStatus() { /* noop */ },
    setPendingUpdate() { /* noop */ },
    notify(title: string, message: string) {
      void sendDesktopNotification(title, message);
    },
    destroy() {
      void callbacks;
    },
  };
}

export async function initializeTray(
  callbacks: TrayCallbacks,
  options: TrayInitOptions = {},
): Promise<TrayInstance | null> {
  if (!hasDisplay()) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'System tray not available (no display). Running headless.',
    }));
    return null;
  }

  const native = await tryNativeTray(callbacks, 'disabled', options);
  if (native) {
    console.log(JSON.stringify({ level: 'info', message: 'Native system tray initialized (systray2)' }));
    return native;
  }

  console.log(JSON.stringify({
    level: 'info',
    message: 'Native tray unavailable — using desktop notifications fallback',
  }));
  return fallbackTray(callbacks);
}

export function computeDesktopTrayStatus(config: {
  desktopEnabled: boolean;
  desktopVisionEnabled: boolean;
  allowedProcesses?: string[];
  blockedProcesses?: string[];
}): DesktopTrayStatus {
  if (!config.desktopEnabled) return 'disabled';

  const hasRestrictions =
    !config.desktopVisionEnabled ||
    (config.allowedProcesses !== undefined && config.allowedProcesses.length > 0) ||
    (config.blockedProcesses !== undefined && config.blockedProcesses.length > 0);

  return hasRestrictions ? 'partial' : 'enabled';
}

export function openSettingsInBrowser(config: AgentConfig): void {
  const base =
    config.gatewayHttpUrl ??
    config.gatewayUrl
      .replace(/^wss:\/\//, 'https://')
      .replace(/^ws:\/\//, 'http://')
      .replace(/\/ws\/local-agent\/?$/, '');

  const settingsUrl = `${base.replace(/\/$/, '')}/settings`;
  import('open').then((open) => {
    open.default(settingsUrl).catch(() => {});
  }).catch(() => {});
}

function hasDisplay(): boolean {
  const { platform } = process;

  if (platform === 'win32') return true;
  if (platform === 'darwin') return !!process.env['DISPLAY'] || !!process.env['HOME'];
  if (platform === 'linux') return !!process.env['DISPLAY'] || !!process.env['WAYLAND_DISPLAY'];
  return false;
}
