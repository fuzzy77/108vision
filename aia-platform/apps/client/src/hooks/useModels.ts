import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ModelTierOption {
  id: string;
  label: string;
  description: string;
}

export function useModels() {
  return useQuery({
    queryKey: ['tenant-models'],
    queryFn: async () => {
      const data = await api.get<{ items: ModelTierOption[] }>('/tenant/models');
      return data.items;
    },
    staleTime: 60_000,
  });
}
