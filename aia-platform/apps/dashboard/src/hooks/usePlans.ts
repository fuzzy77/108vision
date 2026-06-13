import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type PlanModelTier = 'fast-cheap' | 'balanced' | 'powerful' | 'coding' | 'vision';

export interface Plan {
  id: string;
  name: string;
  maxConversationsMonth: number;
  maxKbDocuments: number;
  maxKbSizeMb: number;
  allowedModels: PlanModelTier[] | string[] | null;
  priceEurMonth: string;
  features: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePlanInput {
  name: string;
  maxConversationsMonth: number;
  maxKbDocuments: number;
  maxKbSizeMb: number;
  allowedModels: PlanModelTier[];
  priceEurMonth: number;
  features?: Record<string, unknown>;
}

export type UpdatePlanInput = Partial<CreatePlanInput>;

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const r = await api.get<{ items: Plan[] }>('/admin/plans');
      return r.items;
    },
  });
}

export function usePlan(id: string | undefined) {
  return useQuery({
    queryKey: ['plans', id],
    queryFn: () => api.get<Plan>(`/admin/plans/${id}`),
    enabled: !!id,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlanInput) => api.post<Plan>('/admin/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePlanInput & { id: string }) =>
      api.put<Plan>(`/admin/plans/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plans', variables.id] });
    },
  });
}

export function useDeactivatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
