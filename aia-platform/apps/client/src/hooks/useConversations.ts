import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Conversation } from '@/lib/api';

interface PaginatedConversations {
  items: Conversation[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const data = query.data as PaginatedConversations | Conversation[] | undefined;
  const conversations: Conversation[] = Array.isArray(data)
    ? data
    : (data?.items ?? []);

  return {
    conversations,
    isLoading: query.isLoading,
    error: query.error,
    deleteConversation: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
