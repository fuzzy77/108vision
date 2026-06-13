import { useQuery } from '@tanstack/react-query';
import { api, type Agent } from '@/lib/api';

export function useAgents() {
  const query = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
    staleTime: 5 * 60 * 1000,
  });

  const data = query.data as { items: Agent[] } | Agent[] | undefined;
  const agents: Agent[] = Array.isArray(data) ? data : (data?.items ?? []);

  return {
    agents,
    isLoading: query.isLoading,
    error: query.error,
  };
}
