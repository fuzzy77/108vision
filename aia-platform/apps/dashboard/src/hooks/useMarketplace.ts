import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MarketplaceTemplate } from '@/types';

interface MarketplaceFilters {
  category?: string;
  search?: string;
}

// Gateway returns { items, total, page, pageSize } from /admin/marketplace/templates
async function fetchTemplates(
  filters?: MarketplaceFilters,
): Promise<MarketplaceTemplate[]> {
  const r = await api.get<{ items: MarketplaceTemplate[]; total: number }>(
    '/admin/marketplace/templates',
    {
      category: filters?.category,
      pageSize: 100,
    },
  );
  // Filter by search client-side (gateway doesn't support free-text search on templates)
  const items = r.items ?? [];
  if (!filters?.search) return items;
  const q = filters.search.toLowerCase();
  return items.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q),
  );
}

export function useMarketplaceTemplates(filters?: MarketplaceFilters) {
  return useQuery({
    queryKey: ['marketplace', 'templates', filters],
    queryFn: () => fetchTemplates(filters),
  });
}

export function useMarketplaceTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['marketplace', 'templates', id],
    queryFn: () => api.get<MarketplaceTemplate>(`/admin/marketplace/templates/${id}`),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MarketplaceTemplate>) =>
      api.post<MarketplaceTemplate>('/admin/marketplace/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'templates'] });
    },
  });
}

export function useInstallTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, tenantId }: { templateId: string; tenantId: string }) =>
      api.post(`/admin/marketplace/templates/${templateId}/install`, { tenantId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'templates'] });
      queryClient.invalidateQueries({ queryKey: ['tenants', variables.tenantId, 'agents'] });
    },
  });
}
