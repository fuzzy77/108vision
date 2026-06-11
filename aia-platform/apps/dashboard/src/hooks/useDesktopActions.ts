import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getToken } from '@/lib/auth';
import type { ActionRiskLevel } from '@/types';
import type { DesktopAction, DesktopActionType } from '@/components/desktop/DesktopActionCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesktopActivityEvent {
  id: string;
  actionType: DesktopActionType;
  description: string;
  windowTitle: string | null;
  processName: string | null;
  riskLevel: ActionRiskLevel;
  timestamp: string;
  screenshotId: string | null;
}

export interface FocusedWindow {
  title: string;
  processName: string;
}

export interface ScreenshotMeta {
  id: string;
  capturedAt: string;
}

// Gateway response shapes
interface PendingDesktopActionsResponse {
  data: DesktopAction[];
  total: number;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

const desktopKeys = {
  all: (tenantId: string) => ['desktop', tenantId] as const,
  pending: (tenantId: string) => ['desktop', tenantId, 'pending'] as const,
  screenshot: (screenshotId: string) => ['desktop', 'screenshot', screenshotId] as const,
};

// ---------------------------------------------------------------------------
// Tenant-scoped fetch helper (mirrors apiForTenant but with method support)
// ---------------------------------------------------------------------------

async function tenantFetch<T>(
  tenantId: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Errore ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// useDesktopActions — pending desktop action queue + approve/reject
// ---------------------------------------------------------------------------

export function useDesktopActions(tenantId: string) {
  const queryClient = useQueryClient();

  // Fetch pending desktop actions
  const pendingQuery = useQuery({
    queryKey: desktopKeys.pending(tenantId),
    queryFn: () =>
      tenantFetch<PendingDesktopActionsResponse>(
        tenantId,
        '/integrations/local-agent/actions?type=desktop',
      ),
    refetchInterval: 10_000,
    enabled: !!tenantId,
  });

  // Approve action
  const approve = useMutation({
    mutationFn: (actionId: string) =>
      tenantFetch<void>(tenantId, `/integrations/local-agent/actions/${actionId}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desktopKeys.pending(tenantId) });
    },
  });

  // Reject action
  const reject = useMutation({
    mutationFn: (actionId: string) =>
      tenantFetch<void>(tenantId, `/integrations/local-agent/actions/${actionId}/reject`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: desktopKeys.pending(tenantId) });
    },
  });

  // Fetch screenshot by ID — returns a blob URL
  function useScreenshotUrl(screenshotId: string | null) {
    return useQuery({
      queryKey: desktopKeys.screenshot(screenshotId ?? ''),
      queryFn: async () => {
        const token = getToken();
        const res = await fetch(
          `/api/integrations/local-agent/screenshots/${screenshotId}`,
          {
            headers: {
              'X-Tenant-ID': tenantId,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );
        if (!res.ok) throw new Error(`Errore ${res.status}`);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      },
      enabled: !!screenshotId,
      staleTime: 5 * 60_000, // screenshots don't change — cache for 5 min
    });
  }

  return {
    pendingActions: pendingQuery.data?.data ?? [],
    isLoading: pendingQuery.isLoading,
    isError: pendingQuery.isError,
    approve,
    reject,
    useScreenshotUrl,
  };
}

// ---------------------------------------------------------------------------
// useDesktopMonitor — real-time activity feed via WebSocket
// ---------------------------------------------------------------------------

type MonitorConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface MonitorState {
  lastScreenshot: ScreenshotMeta | null;
  recentActions: DesktopActivityEvent[];
  focusedWindow: FocusedWindow | null;
  connectionStatus: MonitorConnectionStatus;
  isLoading: boolean;
}

// WebSocket message from the gateway
interface WsMessage {
  type: 'activity' | 'screenshot' | 'focus' | 'ping';
  event?: DesktopActivityEvent;
  screenshot?: ScreenshotMeta;
  window?: FocusedWindow;
}

const MAX_RECENT_ACTIONS = 50;

export function useDesktopMonitor(tenantId: string): MonitorState {
  const [connectionStatus, setConnectionStatus] = useState<MonitorConnectionStatus>('connecting');
  const [lastScreenshot, setLastScreenshot] = useState<ScreenshotMeta | null>(null);
  const [recentActions, setRecentActions] = useState<DesktopActivityEvent[]>([]);
  const [focusedWindow, setFocusedWindow] = useState<FocusedWindow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!tenantId) return;

    setConnectionStatus('connecting');

    const token = getToken();
    const wsBase = (import.meta.env.VITE_WS_URL || window.location.origin).replace(
      /^http/,
      'ws',
    );
    const url = `${wsBase}/api/integrations/local-agent/monitor?tenantId=${tenantId}${
      token ? `&token=${encodeURIComponent(token)}` : ''
    }`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      setIsLoading(false);
    };

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg: WsMessage = JSON.parse(e.data as string);

        if (msg.type === 'activity' && msg.event) {
          setRecentActions((prev) => [msg.event!, ...prev].slice(0, MAX_RECENT_ACTIONS));
        } else if (msg.type === 'screenshot' && msg.screenshot) {
          setLastScreenshot(msg.screenshot);
        } else if (msg.type === 'focus' && msg.window) {
          setFocusedWindow(msg.window);
        }
        // 'ping' is silently ignored
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
      setIsLoading(false);
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      setIsLoading(false);
      // Reconnect after 5 s
      reconnectTimerRef.current = setTimeout(connect, 5_000);
    };
  }, [tenantId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    lastScreenshot,
    recentActions,
    focusedWindow,
    connectionStatus,
    isLoading,
  };
}
