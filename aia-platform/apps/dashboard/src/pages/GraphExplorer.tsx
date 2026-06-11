import { useState, useCallback, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { useGraphEntities, useEntityContext } from '@/hooks/useGraph';
import { GraphCanvas, type GraphNode, type GraphEdge } from '@/components/graph/GraphCanvas';
import { EntityDetailPanel } from '@/components/graph/EntityDetailPanel';
import { GraphFilters } from '@/components/graph/GraphFilters';
import { GraphStats } from '@/components/graph/GraphStats';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { navigate } from '@/lib/utils';

interface GraphExplorerPageProps {
  tenantId: string;
}

function GraphExplorerPage({ tenantId }: GraphExplorerPageProps) {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minConfidence, setMinConfidence] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection and expansion state
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([]);

  // Track nodes and edges for the canvas
  const [canvasNodes, setCanvasNodes] = useState<GraphNode[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<GraphEdge[]>([]);

  // Fetch entities for this tenant
  const { data: entities, isLoading } = useGraphEntities(tenantId, {
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    minConfidence: minConfidence > 0 ? minConfidence / 100 : undefined,
    search: searchQuery || undefined,
    limit: 200,
  });

  // Fetch context for expanded node
  const [expandingNodeId, setExpandingNodeId] = useState<string | undefined>(undefined);
  const { data: expandedContext } = useEntityContext(tenantId, expandingNodeId);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Clienti', href: '/tenants' },
      { label: 'Dettaglio', href: `/tenants/${tenantId}` },
      { label: 'Grafo della conoscenza' },
    ]);
  }, [tenantId, setBreadcrumbs]);

  // Measure container size
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: Math.max(400, rect.width),
          height: Math.max(400, rect.height),
        });
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Convert entities to canvas nodes/edges when data changes
  useEffect(() => {
    if (!entities) {
      setCanvasNodes([]);
      setCanvasEdges([]);
      return;
    }

    // Build nodes from entities
    const nodes: GraphNode[] = entities.map((entity) => ({
      id: entity.id,
      label: entity.name,
      type: entity.type,
      connections: entity.connections,
    }));

    // We don't have edges from the entity list endpoint alone.
    // Edges come from the subgraph/context endpoint.
    // Keep existing edges that reference valid node IDs.
    const nodeIds = new Set(nodes.map((n) => n.id));

    setCanvasNodes(nodes);
    setCanvasEdges((prevEdges) =>
      prevEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)),
    );
  }, [entities]);

  // Merge expanded context into canvas
  useEffect(() => {
    if (!expandedContext) return;

    setCanvasNodes((prevNodes) => {
      const existingIds = new Set(prevNodes.map((n) => n.id));
      const newNodes: GraphNode[] = [];

      for (const entity of expandedContext.nodes) {
        if (!existingIds.has(entity.id)) {
          newNodes.push({
            id: entity.id,
            label: entity.name,
            type: entity.type,
            connections: entity.connections,
          });
        }
      }

      return [...prevNodes, ...newNodes];
    });

    setCanvasEdges((prevEdges) => {
      const existingIds = new Set(prevEdges.map((e) => e.id));
      const newEdges: GraphEdge[] = [];

      for (const rel of expandedContext.edges) {
        if (!existingIds.has(rel.id)) {
          newEdges.push({
            id: rel.id,
            source: rel.sourceId,
            target: rel.targetId,
            label: rel.type,
            weight: rel.weight,
          });
        }
      }

      return [...prevEdges, ...newEdges];
    });

    setExpandingNodeId(undefined);
  }, [expandedContext]);

  // Node selection handler
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Node expand handler (double-click)
  const handleNodeExpand = useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => {
      if (prev.includes(nodeId)) return prev;
      return [...prev, nodeId];
    });
    setExpandingNodeId(nodeId);
  }, []);

  // Entity select from search
  const handleEntitySelectFromSearch = useCallback((entityId: string) => {
    setSelectedNodeId(entityId);
    // Also expand to get context
    setExpandingNodeId(entityId);
    setExpandedNodeIds((prev) => {
      if (prev.includes(entityId)) return prev;
      return [...prev, entityId];
    });
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSelectedTypes([]);
    setMinConfidence(0);
    setSearchQuery('');
  }, []);

  // Close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedNodeId(undefined);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/tenants/${tenantId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Grafo della conoscenza
        </h1>
      </div>

      {/* Filters */}
      <GraphFilters
        tenantId={tenantId}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        minConfidence={minConfidence}
        onMinConfidenceChange={setMinConfidence}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onEntitySelect={handleEntitySelectFromSearch}
        onReset={handleResetFilters}
      />

      {/* Main content */}
      <div className="flex flex-1 mt-3 gap-3 min-h-0">
        {/* Left sidebar: stats */}
        <div className="w-[260px] shrink-0 overflow-y-auto hidden xl:block">
          <GraphStats tenantId={tenantId} collapsible={false} />
        </div>

        {/* Graph canvas */}
        <div ref={containerRef} className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full rounded-xl border border-slate-700 bg-slate-800">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Caricamento grafo...</p>
              </div>
            </div>
          ) : (
            <GraphCanvas
              nodes={canvasNodes}
              edges={canvasEdges}
              selectedNodeId={selectedNodeId}
              onNodeSelect={handleNodeSelect}
              onNodeExpand={handleNodeExpand}
              width={containerSize.width - (selectedNodeId ? 300 : 0)}
              height={containerSize.height}
            />
          )}
        </div>

        {/* Right panel: entity detail */}
        {selectedNodeId && (
          <EntityDetailPanel
            tenantId={tenantId}
            entityId={selectedNodeId}
            onClose={handleCloseDetail}
            onExpand={handleNodeExpand}
          />
        )}
      </div>
    </div>
  );
}

export { GraphExplorerPage };
