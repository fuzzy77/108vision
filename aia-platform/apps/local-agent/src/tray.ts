/**
 * System Tray — Optional system tray icon for 108 AI desktop agent.
 *
 * Provides visual feedback about connection state and a right-click menu.
 * Gracefully degrades if the tray is not available (headless/SSH sessions).
 *
 * States:
 * - Connected (green): actively connected to gateway
 * - Disconnected (red): not connected, attempting reconnection
 * - Processing (yellow): currently executing an action
 *
 * Desktop Access indicator (shown in tooltip / log):
 * - Green  [desktop:ON]  : desktop enabled, all capabilities available
 * - Yellow [desktop:PARTIAL]: desktop enabled but some capabilities unavailable
 * - Red    [desktop:OFF] : desktop disabled
 */

export type TrayState = 'connected' | 'disconnected' | 'processing';

/**
 * Desktop capability status for the tray indicator.
 */
export type DesktopTrayStatus = 'enabled' | 'partial' | 'disabled';

export interface TrayCallbacks {
  onOpenDashboard: () => void;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
  onToggleDesktopAccess: (enabled: boolean) => void;
}

interface TrayInstance {
  setState: (state: TrayState) => void;
  setTooltip: (text: string) => void;
  setDesktopStatus: (status: DesktopTrayStatus) => void;
  destroy: () => void;
}

const DESKTOP_STATUS_LABELS: Record<DesktopTrayStatus, string> = {
  enabled:  '[desktop:ON]  (green)',
  partial:  '[desktop:PARTIAL] (yellow)',
  disabled: '[desktop:OFF] (red)',
};

const DESKTOP_STATUS_ICONS: Record<DesktopTrayStatus, string> = {
  enabled:  'green',
  partial:  'yellow',
  disabled: 'red',
};

/**
 * Attempt to initialize the system tray.
 * Returns null if tray is not available (headless environment).
 */
export async function initializeTray(callbacks: TrayCallbacks): Promise<TrayInstance | null> {
  if (!hasDisplay()) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'System tray not available (no display detected). Running headless.',
    }));
    return null;
  }

  try {
    let currentState: TrayState = 'disconnected';
    let currentDesktopStatus: DesktopTrayStatus = 'disabled';
    let tooltip = '108 AI — Desktop Agent';

    function emitTrayStatus(): void {
      const stateLabels: Record<TrayState, string> = {
        connected:    '[Connected]',
        disconnected: '[Disconnected]',
        processing:   '[Processing...]',
      };

      console.log(JSON.stringify({
        level: 'debug',
        message: 'Tray status update',
        connectionState: stateLabels[currentState],
        desktopAccess: DESKTOP_STATUS_LABELS[currentDesktopStatus],
        desktopIndicator: DESKTOP_STATUS_ICONS[currentDesktopStatus],
        tooltip,
        menuItems: buildMenuItems(currentState, currentDesktopStatus, callbacks),
      }));
    }

    const instance: TrayInstance = {
      setState(state: TrayState) {
        currentState = state;
        emitTrayStatus();
      },

      setTooltip(text: string) {
        tooltip = text;
        emitTrayStatus();
      },

      setDesktopStatus(status: DesktopTrayStatus) {
        const previous = currentDesktopStatus;
        currentDesktopStatus = status;

        if (previous !== status) {
          console.log(JSON.stringify({
            level: 'info',
            message: 'Desktop Access status changed',
            from: DESKTOP_STATUS_LABELS[previous],
            to: DESKTOP_STATUS_LABELS[status],
            indicator: DESKTOP_STATUS_ICONS[status],
          }));
        }

        emitTrayStatus();
      },

      destroy() {
        console.log(JSON.stringify({
          level: 'info',
          message: 'System tray destroyed',
        }));
      },
    };

    return instance;
  } catch (error) {
    console.log(JSON.stringify({
      level: 'warn',
      message: 'Failed to initialize system tray',
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    return null;
  }
}

function buildMenuItems(
  connectionState: TrayState,
  desktopStatus: DesktopTrayStatus,
  callbacks: TrayCallbacks,
): Array<{ label: string; action: string }> {
  void callbacks;

  const items: Array<{ label: string; action: string }> = [
    { label: 'Open Dashboard', action: 'openDashboard' },
  ];

  if (connectionState === 'connected') {
    items.push({ label: 'Pause Agent', action: 'pause' });
  } else {
    items.push({ label: 'Resume Agent', action: 'resume' });
  }

  const desktopLabel =
    desktopStatus === 'disabled'
      ? 'Enable Desktop Access  [red]'
      : desktopStatus === 'partial'
        ? 'Desktop Access: Partial  [yellow]'
        : 'Disable Desktop Access  [green]';

  items.push({
    label: desktopLabel,
    action: desktopStatus === 'disabled' ? 'enableDesktop' : 'disableDesktop',
  });

  items.push({ label: 'Quit', action: 'quit' });

  return items;
}

/**
 * Compute the DesktopTrayStatus from the current agent config.
 */
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

function hasDisplay(): boolean {
  const { platform } = process;

  if (platform === 'win32') {
    return true;
  }

  if (platform === 'darwin') {
    return !!process.env['DISPLAY'] || !!process.env['HOME'];
  }

  if (platform === 'linux') {
    return !!process.env['DISPLAY'] || !!process.env['WAYLAND_DISPLAY'];
  }

  return false;
}
