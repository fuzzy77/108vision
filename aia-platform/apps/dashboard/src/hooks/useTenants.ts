import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiForTenant } from '@/lib/api';
import type { Tenant, PaginatedResponse, Agent, KnowledgeDocument, KnowledgeCollection, Conversation, Message } from '@/types';

interface TenantFilters {
  status?: string;
  plan?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// Gateway returns { items, total, page, pageSize, hasMore } — normalise to PaginatedResponse<T>
async function normalisePage<T>(
  promise: Promise<{ items: T[]; total: number; page: number; pageSize: number; hasMore?: boolean }>,
): Promise<PaginatedResponse<T>> {
  const r = await promise;
  return { data: r.items, total: r.total, page: r.page, pageSize: r.pageSize };
}

export function useTenants(filters?: TenantFilters) {
  return useQuery({
    queryKey: ['tenants', filters],
    queryFn: async () => {
      const r = await normalisePage(
        api.get<{ items: Tenant[]; total: number; page: number; pageSize: number }>('/admin/tenants', {
          status: filters?.status,
          page: filters?.page ?? 1,
          pageSize: filters?.pageSize ?? 20,
        }),
      );
      // Plan filter and search are not supported by the gateway; apply client-side.
      let filtered = r.data;
      if (filters?.plan) {
        filtered = filtered.filter((t) => t.plan === filters.plan);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.contactEmail?.toLowerCase().includes(q) ||
            t.sector?.toLowerCase().includes(q),
        );
      }
      return { ...r, data: filtered, total: filtered.length };
    },
  });
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: async () => {
      const raw = await api.get<Tenant & { stats?: unknown }>(`/admin/tenants/${id}`);
      return raw;
    },
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Tenant>) => api.post<Tenant>('/admin/tenants', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Tenant> & { id: string }) =>
      api.put<Tenant>(`/admin/tenants/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenants', variables.id] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

// Tenant-scoped resources use X-Tenant-ID header via apiForTenant helper

export function useTenantAgents(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'agents'],
    queryFn: async () => {
      const r = await apiForTenant<{ items: Agent[] }>(tenantId!, '/agents');
      return r.items;
    },
    enabled: !!tenantId,
  });
}

export function useTenantDocuments(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'documents'],
    queryFn: async () => {
      const r = await apiForTenant<{ items: KnowledgeDocument[] }>(tenantId!, '/knowledge/documents');
      return r.items;
    },
    enabled: !!tenantId,
  });
}

export function useTenantCollections(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'collections'],
    queryFn: async () => {
      const r = await apiForTenant<{ items: KnowledgeCollection[] }>(tenantId!, '/knowledge/collections');
      return r.items;
    },
    enabled: !!tenantId,
  });
}

export function useTenantConversations(tenantId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'conversations', page],
    queryFn: async () => {
      const r = await apiForTenant<{ items: Conversation[]; total: number; page: number; pageSize: number }>(
        tenantId!,
        '/conversations',
        { page, pageSize: 20 },
      );
      return { data: r.items, total: r.total, page: r.page, pageSize: r.pageSize } as PaginatedResponse<Conversation>;
    },
    enabled: !!tenantId,
  });
}

export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: async () => {
      // Conversation messages: use base api since conversation id encodes tenant context
      const r = await api.get<{ items: Message[] }>(`/conversations/${conversationId}/messages`);
      return r.items;
    },
    enabled: !!conversationId,
  });
}
