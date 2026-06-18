import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiForTenant, tenantRequest } from '@/lib/api';

export interface TriageItem {
  id: string;
  source: string;
  urgency: 'urgent' | 'important' | 'informative';
  title: string;
  detail: string;
  timestamp: string;
  actionSuggestion?: string;
}

export interface TriageReport {
  generatedAt: string;
  sources: string[];
  items: TriageItem[];
  stats: {
    urgent: number;
    important: number;
    informative: number;
    sourcesChecked: number;
    sourcesAvailable: number;
    executionMs: number;
    tokensUsed: number;
  };
}

export interface TriageSchedule {
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  cron: string;
}

export function useTriage(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['integrations', 'local-agent', tenantId, 'triage'],
    queryFn: () =>
      apiForTenant<{ report: TriageReport | null; schedule: TriageSchedule }>(
        tenantId!,
        '/integrations/local-agent/triage',
      ),
    enabled: !!tenantId,
    refetchInterval: 60_000,
  });
}

export function useRunTriage(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      tenantRequest<{ report: TriageReport }>(
        tenantId!,
        '/integrations/local-agent/triage/run',
        { method: 'POST' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['integrations', 'local-agent', tenantId, 'triage'],
      });
    },
  });
}
