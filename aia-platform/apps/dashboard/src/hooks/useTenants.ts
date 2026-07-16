import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiForTenant } from '@/lib/api';
import type { Tenant, PaginatedResponse, Agent, KnowledgeDocument, KnowledgeCollection, Conversation, Message, TenantUser } from '@/types';

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
      const raw = await api.get<Record<string, unknown>>(`/admin/tenants/${id}`);
      const stats = (raw.stats ?? {}) as Record<string, unknown>;
      const config = (raw.config ?? {}) as Record<string, unknown>;
      return {
        id: raw.id as string,
        name: raw.name as string,
        planId: (raw.planId as string) ?? '',
        sector: (config.sector as string) ?? '',
        plan: (config.plan as string) ?? 'starter',
        status: raw.status as string,
        contactName: '',
        contactEmail: '',
        agentsCount: (stats.agentsCount as number) ?? (raw.agentsCount as number) ?? 0,
        documentsCount: (stats.documentsCount as number) ?? (raw.documentsCount as number) ?? 0,
        conversationsThisMonth: (stats.conversationsCount as number) ?? 0,
        monthlyCost: (stats.monthlyCostUsd as number) ?? (raw.monthlyCostUsd as number) ?? 0,
        monthlyRevenue: 0,
        lastActivity: (raw.lastActivity as string) ?? '',
        createdAt: raw.createdAt as string,
        config: {
          allowedModels: [],
          maxTokensPerMonth: 0,
          ...config,
        },
      } as Tenant;
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
      const r = await apiForTenant<{ items: Record<string, unknown>[] }>(tenantId!, '/knowledge/documents');
      return (r.items ?? []).map((d) => ({
        id: d.id as string,
        tenantId: (d.tenantId as string) ?? tenantId!,
        collectionId: (d.collectionId as string) ?? '',
        collectionName: (d.collectionName as string) ?? (d.sourceType as string) ?? '—',
        fileName: (d.fileName as string) ?? (d.title as string) ?? '—',
        fileSize: (d.sizeBytes as number) ?? (d.fileSize as number) ?? 0,
        status: (d.status as 'processing' | 'ready' | 'error') ?? 'processing',
        chunksCount: (d.chunksCount as number) ?? (d.chunkCount as number) ?? 0,
        uploadedAt: (d.uploadedAt as string) ?? (d.createdAt as string) ?? '',
        processedAt: (d.processedAt as string) ?? (d.updatedAt as string) ?? null,
      })) as KnowledgeDocument[];
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

export function useTenantUsers(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenants', tenantId, 'users'],
    queryFn: async () => {
      const r = await api.get<{ items: TenantUser[] }>(`/admin/tenants/${tenantId}/users`);
      return r.items;
    },
    enabled: !!tenantId,
  });
}

export function useInviteTenantUser(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; name: string; role: string }) =>
      api.post<TenantUser>(`/admin/tenants/${tenantId}/users`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId, 'users'] });
    },
  });
}

export function useUpdateTenantUser(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ...data }: { userId: string; name?: string; role?: string }) =>
      api.put<TenantUser>(`/admin/tenants/${tenantId}/users/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId, 'users'] });
    },
  });
}

export function useRemoveTenantUser(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/admin/tenants/${tenantId}/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId, 'users'] });
    },
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
