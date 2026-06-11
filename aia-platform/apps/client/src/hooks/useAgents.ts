import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAgents() {
  const query = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    agents: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
