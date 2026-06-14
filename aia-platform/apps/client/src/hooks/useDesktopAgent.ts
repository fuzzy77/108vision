import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export interface AgentStatus {
  connected: boolean;
  agentId: string | null;
  capabilities: string[];
  connectedAt: number | null;
  lastHeartbeat: number | null;
}

export interface ActionHistoryEntry {
  id: string;
  action: string;
  params: Record<string, unknown>;
  result: unknown;
  error: string | null;
  executedAt: number;
  durationMs: number;
}

export interface SetupInfo {
  gatewayUrl: string;
  tenantId: string;
  version: string;
  downloads: {
    windows: string;
    macosIntel: string;
    macosArm: string;
    linux: string;
  };
  instructions: string[];
}

export function useDesktopAgent() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [history, setHistory] = useState<ActionHistoryEntry[]>([]);
  const [setupInfo, setSetupInfo] = useState<SetupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.get<AgentStatus>('/integrations/local-agent/status');
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      setStatus({ connected: false, agentId: null, capabilities: [], connectedAt: null, lastHeartbeat: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await api.get<{ items: ActionHistoryEntry[] }>('/integrations/local-agent/history?pageSize=20');
      setHistory(data.items);
    } catch {
      // Non-critical
    }
  }, []);

  const fetchSetup = useCallback(async () => {
    try {
      const data = await api.get<SetupInfo>('/integrations/local-agent/setup');
      setSetupInfo(data);
    } catch {
      // Non-critical — fallback to hardcoded steps
    }
  }, []);

  const executeAction = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    const data = await api.post<{ action: string; result: unknown; durationMs: number }>(
      '/integrations/local-agent/execute',
      { action, params },
    );
    await fetchHistory();
    return data;
  }, [fetchHistory]);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    fetchSetup();

    pollRef.current = setInterval(() => {
      fetchStatus();
    }, 10_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchStatus, fetchHistory, fetchSetup]);

  return {
    status,
    history,
    setupInfo,
    isLoading,
    error,
    executeAction,
    refresh: () => { fetchStatus(); fetchHistory(); },
  };
}
