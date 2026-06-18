import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiForTenant, tenantRequest } from '@/lib/api';

export interface JobSummary {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger?: { type: string; schedule?: string };
  stats: {
    totalRuns: number;
    successRate: number;
    totalTokens: number;
    lastRun: string | null;
    lastStatus: string | null;
  };
}

export interface JobRun {
  runId: string;
  jobId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  totalTokensUsed?: number;
  error?: string;
}

export interface JobDetail {
  job: JobSummary;
  stats: JobSummary['stats'];
  recentRuns: JobRun[];
}

export function useJobs(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['integrations', 'local-agent', tenantId, 'jobs'],
    queryFn: () =>
      apiForTenant<{
        jobs: JobSummary[];
        scheduler: { running: boolean; scheduledJobs: number };
      }>(tenantId!, '/integrations/local-agent/jobs'),
    enabled: !!tenantId,
    refetchInterval: 30_000,
  });
}

export function useJobDetail(tenantId: string | undefined, jobId: string | undefined) {
  return useQuery({
    queryKey: ['integrations', 'local-agent', tenantId, 'jobs', jobId],
    queryFn: () =>
      apiForTenant<JobDetail>(tenantId!, `/integrations/local-agent/jobs/${jobId}`),
    enabled: !!tenantId && !!jobId,
  });
}

export function useRunJob(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      tenantRequest<{ success: boolean; runId?: string; error?: string }>(
        tenantId!,
        `/integrations/local-agent/jobs/${jobId}/run`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['integrations', 'local-agent', tenantId, 'jobs'],
      });
    },
  });
}
