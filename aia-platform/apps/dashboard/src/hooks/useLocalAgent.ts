import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiForTenant } from '@/lib/api';
import type { LocalAgentStatus, LocalAgentAction } from '@/types';

/**
 * Local Agent hooks — mapped to tenant-scoped /api/integrations/local-agent/* routes.
 *
 * Routes:
 *   GET  /api/integrations/local-agent/status        — check connection
 *   GET  /api/integrations/local-agent/capabilities  — list capabilities
 *   GET  /api/integrations/local-agent/history       — execution history
 *   PUT  /api/integrations/local-agent/directories   — update allowed dirs
 *   PATCH /api/integrations/local-agent/capabilities/:id — toggle capability
 */

// Gateway returns a single LocalAgentStatus for the current tenant.
// For the cross-tenant view we model an array where each element has a tenantId.

export function useLocalAgentStatus(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['integrations', 'local-agent', tenantId, 'status'],
    queryFn: async (): Promise<LocalAgentStatus> => {
      const raw = await apiForTenant<{
        connected: boolean;
        lastHeartbeat: string | null;
        version: string | null;
        allowedDirectories: string[];
        capabilities: { id: string; name: string; description: string; enabled: boolean }[];
      }>(tenantId!, '/integrations/local-agent/status');

      return {
        tenantId: tenantId!,
        status: raw.connected ? 'connected' : 'disconnected',
        lastHeartbeat: raw.lastHeartbeat,
        version: raw.version,
        allowedDirectories: raw.allowedDirectories ?? [],
        capabilities: raw.capabilities ?? [],
      };
    },
    enabled: !!tenantId,
    refetchInterval: 15_000,
  });
}

export function useAllLocalAgents() {
  return useQuery({
    queryKey: ['integrations', 'local-agents'],
    queryFn: async (): Promise<LocalAgentStatus[]> => {
      // Cross-tenant listing not available in current gateway implementation.
      // Return empty array so UI shows "no agents" state gracefully.
      return [];
    },
  });
}

export function useLocalAgentHistory(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['integrations', 'local-agent', tenantId, 'history'],
    queryFn: async (): Promise<LocalAgentAction[]> => {
      const r = await apiForTenant<{
        items: Array<{
          id: string;
          action: string;
          params: Record<string, unknown>;
          result: unknown;
          error: string | null;
          executedAt: number;
          durationMs: number;
        }>;
        total: number;
      }>(tenantId!, '/integrations/local-agent/history');

      return (r.items ?? []).map((entry) => ({
        id: entry.id,
        tenantId: tenantId!,
        action: entry.action,
        riskLevel: 'read_only' as const, // history doesn't carry risk level in current schema
        status: entry.error ? ('failed' as const) : ('success' as const),
        timestamp: new Date(entry.executedAt).toISOString(),
        details: entry.error ?? undefined,
      }));
    },
    enabled: !!tenantId,
  });
}

export function useUpdateAllowedDirectories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenantId, directories }: { tenantId: string; directories: string[] }) => {
      const { getToken } = await import('@/lib/auth');
      const token = getToken();
      const res = await fetch('/api/integrations/local-agent/directories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ directories }),
      });
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integrations', 'local-agent', variables.tenantId],
      });
    },
  });
}

export function useToggleAgentCapability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenantId,
      capabilityId,
      enabled,
    }: {
      tenantId: string;
      capabilityId: string;
      enabled: boolean;
    }) => {
      const { getToken } = await import('@/lib/auth');
      const token = getToken();
      const res = await fetch(`/api/integrations/local-agent/capabilities/${capabilityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['integrations', 'local-agent', variables.tenantId],
      });
    },
  });
}
