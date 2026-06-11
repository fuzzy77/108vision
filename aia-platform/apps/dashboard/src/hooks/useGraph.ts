import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiForTenant } from '@/lib/api';

// --- Types ---

export interface GraphEntity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, unknown>;
  confidence: number;
  sourceDocumentId?: string;
  connections: number;
}

export interface GraphRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, unknown>;
  weight: number;
}

export interface GraphFilters {
  types?: string[];
  minConfidence?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface GraphStatsData {
  totalEntities: number;
  totalRelations: number;
  entitiesByType: { type: string; count: number }[];
  mostConnected: { id: string; name: string; type: string; connections: number }[];
  recentExtractions: { documentId: string; documentTitle: string; entitiesCount: number; processedAt: string }[];
}

export interface SubgraphData {
  nodes: GraphEntity[];
  edges: GraphRelation[];
}

// --- Hooks ---

// Graph routes are tenant-scoped at /api/graph/* (require X-Tenant-ID header).
// The current tenant is inferred from context. For graph explorer we always have a tenantId.

export function useGraphEntities(tenantId: string | undefined, filters?: GraphFilters) {
  return useQuery({
    queryKey: ['graph', 'entities', tenantId, filters],
    queryFn: () =>
      apiForTenant<GraphEntity[]>(tenantId!, '/graph/entities', {
        types: filters?.types?.join(','),
        minConfidence: filters?.minConfidence,
        search: filters?.search,
        limit: filters?.limit ?? 50,
        offset: filters?.offset ?? 0,
      }),
    enabled: !!tenantId,
  });
}

export function useEntityDetail(tenantId: string | undefined, entityId: string | undefined) {
  return useQuery({
    queryKey: ['graph', 'entity', tenantId, entityId],
    queryFn: () =>
      apiForTenant<{ entity: GraphEntity; relations: GraphRelation[]; neighbors: GraphEntity[] }>(
        tenantId!,
        `/graph/entities/${entityId}`,
      ),
    enabled: !!tenantId && !!entityId,
  });
}

export function useEntityContext(tenantId: string | undefined, entityId: string | undefined) {
  return useQuery({
    queryKey: ['graph', 'entity', tenantId, entityId, 'context'],
    queryFn: () =>
      apiForTenant<SubgraphData>(tenantId!, `/graph/entities/${entityId}/context`),
    enabled: !!tenantId && !!entityId,
  });
}

export function useEntitySearch(tenantId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['graph', 'search', tenantId, query],
    queryFn: () =>
      apiForTenant<GraphEntity[]>(tenantId!, '/graph/search', { q: query, limit: 20 }),
    enabled: !!tenantId && query.length >= 2,
  });
}

export function useGraphStats(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['graph', 'stats', tenantId],
    queryFn: () => apiForTenant<GraphStatsData>(tenantId!, '/graph/stats'),
    enabled: !!tenantId,
  });
}

export function useSubgraph(tenantId: string | undefined, entityIds: string[]) {
  return useQuery({
    queryKey: ['graph', 'subgraph', tenantId, entityIds],
    queryFn: () =>
      apiForTenant<SubgraphData>(tenantId!, '/graph/subgraph', {
        ids: entityIds.join(','),
      }),
    enabled: !!tenantId && entityIds.length > 0,
  });
}

async function tenantFetch(
  method: string,
  tenantId: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const { getToken } = await import('@/lib/auth');
  const token = getToken();
  return fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export function useMergeEntities(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
      if (!tenantId) throw new Error('Tenant non selezionato');
      const res = await tenantFetch('POST', tenantId, `/graph/entities/${targetId}/merge`, { sourceId });
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      return res.json() as Promise<GraphEntity>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] });
    },
  });
}

export function useDeleteEntity(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entityId: string) => {
      if (!tenantId) throw new Error('Tenant non selezionato');
      const res = await tenantFetch('DELETE', tenantId, `/graph/entities/${entityId}`);
      if (!res.ok) throw new Error(`Errore ${res.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graph'] });
    },
  });
}
