import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useKnowledge() {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.getDocuments(),
    refetchInterval: (query) => {
      const docs = query.state.data;
      const hasProcessing = docs?.some((d) => d.status === 'processing');
      return hasProcessing ? 3000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

export function useKnowledgeSearch() {
  const [query, setQuery] = useState('');

  const searchQuery = useQuery({
    queryKey: ['knowledge-search', query],
    queryFn: () => api.searchKnowledge(query),
    enabled: query.length >= 3,
  });

  return {
    query,
    setQuery,
    results: searchQuery.data ?? [],
    isSearching: searchQuery.isLoading,
    error: searchQuery.error,
  };
}
