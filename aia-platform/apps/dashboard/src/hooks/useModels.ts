import { useQuery } from '@tanstack/react-query';
import { apiForTenant } from '@/lib/api';

export interface ModelTierOption {
  id: string;
  label: string;
  description: string;
}

export function useTenantModels(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['tenant-models', tenantId],
    queryFn: async () => {
      const data = await apiForTenant<{ items: ModelTierOption[] }>(tenantId!, '/tenant/models');
      return data.items;
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}
