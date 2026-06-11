import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ActionRequest, ActionFilters, PaginatedResponse } from '@/types';

/**
 * Action queue hooks — wrapping /api/admin/actions/* endpoints.
 *
 * NOTE: The action approval queue is a planned feature not yet fully implemented
 * in the gateway. All queries fall back to empty results on 404/500 so the UI
 * degrades gracefully rather than crashing.
 */

function emptyPage<T>(): PaginatedResponse<T> {
  return { data: [], total: 0, page: 1, pageSize: 50 };
}

export function usePendingActions(filters?: ActionFilters) {
  return useQuery({
    queryKey: ['actions', 'pending', filters],
    queryFn: async () => {
      try {
        const r = await api.get<{ items: ActionRequest[]; total: number; page: number; pageSize: number }>(
          '/admin/actions/pending',
          {
            tenantId: filters?.tenantId,
            riskLevel: filters?.riskLevel,
            actionType: filters?.actionType,
            page: filters?.page ?? 1,
            pageSize: filters?.pageSize ?? 50,
          },
        );
        return { data: r.items, total: r.total, page: r.page, pageSize: r.pageSize } as PaginatedResponse<ActionRequest>;
      } catch {
        return emptyPage<ActionRequest>();
      }
    },
    refetchInterval: 10_000,
  });
}

export function usePendingActionsCount() {
  return useQuery({
    queryKey: ['actions', 'pending-count'],
    queryFn: async () => {
      try {
        return await api.get<{ count: number }>('/admin/actions/pending/count');
      } catch {
        return { count: 0 };
      }
    },
    refetchInterval: 10_000,
  });
}

export function useApproveAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) =>
      api.post(`/admin/actions/${actionId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}

export function useRejectAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) =>
      api.post(`/admin/actions/${actionId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}

export function useBatchApprove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionIds: string[]) =>
      api.post('/admin/actions/batch-approve', { actionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}

export function useBatchReject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionIds: string[]) =>
      api.post('/admin/actions/batch-reject', { actionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}

export function useActionHistory(tenantId?: string) {
  return useQuery({
    queryKey: ['actions', 'history', tenantId],
    queryFn: async () => {
      try {
        const r = await api.get<{ items: ActionRequest[]; total: number; page: number; pageSize: number }>(
          '/admin/actions/history',
          {
            tenantId,
            page: 1,
            pageSize: 50,
          },
        );
        return { data: r.items, total: r.total, page: r.page, pageSize: r.pageSize } as PaginatedResponse<ActionRequest>;
      } catch {
        return emptyPage<ActionRequest>();
      }
    },
  });
}
