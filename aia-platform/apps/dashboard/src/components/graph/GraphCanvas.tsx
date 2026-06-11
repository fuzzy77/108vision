import { useRef, useEffect, useState, useCallback } from 'react';
import { getEntityColor, getRelationColor } from '@/lib/graph-colors';

// --- Types ---

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
  connections: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string;
  onNodeSelect: (nodeId: string) => void;
  onNodeExpand: (nodeId: string) => void;
  width?: number;
  height?: number;
}

// --- Force Simulation ---

interface SimNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number;
  pinned: boolean;
}

interface SimEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}

const REPULSION_FORCE = 5000;
const ATTRACTION_FORCE = 0.005;
const DAMPING = 0.85;
const MIN_VELOCITY = 0.1;
const MAX_ITERATIONS = 300;
const IDEAL_EDGE_LENGTH = 150;

function initializeSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
): { simNodes: SimNode[]; simEdges: SimEdge[] } {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  const simNodes: SimNode[] = nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return {
      id: node.id,
      label: node.label,
      type: node.type,
      x: node.x ?? centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
      y: node.y ?? centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      connections: node.connections,
      pinned: false,
    };
  });

  const simEdges: SimEdge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    weight: edge.weight,
  }));

  return { simNodes, simEdges };
}

function simulateStep(nodes: SimNode[], edges: SimEdge[]): boolean {
  let totalMovement = 0;

  // Calculate repulsion between all pairs
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].pinned) continue;

    let fx = 0;
    let fy = 0;

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;

      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq) || 1;

      // Repulsion (Coulomb's law)
      const force = REPULSION_FORCE / distSq;
      fx += (dx / dist) * force;
      fy += (dy / dist) * force;
    }

    // Attraction along edges (Hooke's law)
    for (const edge of edges) {
      let other: SimNode | undefined;
      if (edge.source === nodes[i].id) {
        other = nodes.find((n) => n.id === edge.target);
      } else if (edge.target === nodes[i].id) {
        other = nodes.find((n) => n.id === edge.source);
      }

      if (other) {
        const dx = other.x - nodes[i].x;
        const dy = other.y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const displacement = dist - IDEAL_EDGE_LENGTH;

        fx += (dx / dist) * displacement * ATTRACTION_FORCE;
        fy += (dy / dist) * displacement * ATTRACTION_FORCE;
      }
    }

    // Center gravity (weak)
    fx -= (nodes[i].x - 400) * 0.0001;
    fy -= (nodes[i].y - 300) * 0.0001;

    // Update velocity with damping
    nodes[i].vx = (nodes[i].vx + fx) * DAMPING;
    nodes[i].vy = (nodes[i].vy + fy) * DAMPING;

    // Update position
    nodes[i].x += nodes[i].vx;
    nodes[i].y += nodes[i].vy;

    totalMovement += Math.abs(nodes[i].vx) + Math.abs(nodes[i].vy);
  }

  // Return true if simulation has converged
  return totalMovement / nodes.length < MIN_VELOCITY;
}

// --- Component ---

function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  onNodeExpand,
  width = 800,
  height = 600,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simEdges, setSimEdges] = useState<SimEdge[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const iterRef = useRef(0);

  // Initialize simulation when nodes/edges change
  useEffect(() => {
    if (nodes.length === 0) {
      setSimNodes([]);
      setSimEdges([]);
      return;
    }

    const { simNodes: newNodes, simEdges: newEdges } = initializeSimulation(
      nodes,
      edges,
      width,
      height,
    );
    setSimNodes(newNodes);
    setSimEdges(newEdges);
    iterRef.current = 0;
  }, [nodes, edges, width, height]);

  // Run simulation
  useEffect(() => {
    if (simNodes.length === 0) return;

    let running = true;

    function tick() {
      if (!running) return;

      setSimNodes((prevNodes) => {
        const nodesCopy = prevNodes.map((n) => ({ ...n }));
        const converged = simulateStep(nodesCopy, simEdges);
        iterRef.current++;

        if (converged || iterRef.current >= MAX_ITERATIONS) {
          running = false;
        }

        return nodesCopy;
      });

      if (running) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [simNodes.length, simEdges]);

  // Get node radius based on connection count
  const getNodeRadius = useCallback((connections: number) => {
    return Math.max(12, Math.min(30, 12 + connections * 2));
  }, []);

  // Truncate label
  const truncateLabel = useCallback((label: string, maxLen: number) => {
    if (label.length <= maxLen) return label;
    return label.slice(0, maxLen - 1) + '…';
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.3, Math.min(3, prev.scale * scaleFactor)),
    }));
  }, []);

  // Handle mouse down on background (pan)
  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform.x, transform.y]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    } else if (dragNode) {
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;

      const mx = (e.clientX - svgRect.left - transform.x) / transform.scale;
      const my = (e.clientY - svgRect.top - transform.y) / transform.scale;

      setSimNodes((prev) =>
        prev.map((n) =>
          n.id === dragNode ? { ...n, x: mx, y: my, vx: 0, vy: 0, pinned: true } : n,
        ),
      );
    }
  }, [isPanning, panStart, dragNode, transform]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (dragNode) {
      setSimNodes((prev) =>
        prev.map((n) => (n.id === dragNode ? { ...n, pinned: false } : n)),
      );
      setDragNode(null);
    }
  }, [dragNode]);

  // Handle node mouse down (drag start)
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDragNode(nodeId);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!dragNode) {
      onNodeSelect(nodeId);
    }
  }, [dragNode, onNodeSelect]);

  // Handle node double click (expand)
  const handleNodeDoubleClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    onNodeExpand(nodeId);
  }, [onNodeExpand]);

  // Build node position map for edge rendering
  const nodeMap = new Map<string, SimNode>();
  for (const node of simNodes) {
    nodeMap.set(node.id, node);
  }

  if (nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800"
        style={{ width, height }}
      >
        <p className="text-slate-400 text-sm">
          Nessuna entita estratta. Carica documenti nella Knowledge Base per popolare il grafo.
        </p>
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="rounded-xl border border-slate-700 cursor-grab active:cursor-grabbing select-none"
      style={{ backgroundColor: '#1E293B' }}
      onWheel={handleWheel}
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Defs for glow filter */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background (for pan detection) */}
      <rect width={width} height={height} fill="transparent" />

      {/* Transform group */}
      <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
        {/* Edges */}
        {simEdges.map((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;

          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          const edgeColor = getRelationColor(edge.label);
          const thickness = Math.max(1, Math.min(3, edge.weight * 2));

          return (
            <g key={edge.id}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={edgeColor}
                strokeWidth={thickness}
                strokeOpacity={0.5}
              />
              {transform.scale > 0.7 && (
                <text
                  x={midX}
                  y={midY - 6}
                  textAnchor="middle"
                  className="pointer-events-none"
                  fill="#94A3B8"
                  fontSize={9}
                  fontFamily="system-ui, sans-serif"
                >
                  {edge.label.replace(/_/g, ' ').toLowerCase()}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {simNodes.map((node) => {
          const radius = getNodeRadius(node.connections);
          const color = getEntityColor(node.type);
          const isSelected = node.id === selectedNodeId;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.id)}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
              className="cursor-pointer"
            >
              {/* Node circle */}
              <circle
                r={radius}
                fill={color}
                fillOpacity={0.85}
                stroke={isSelected ? '#FFFFFF' : color}
                strokeWidth={isSelected ? 3 : 1.5}
                strokeOpacity={isSelected ? 1 : 0.6}
                filter={isSelected ? 'url(#glow)' : undefined}
              />
              {/* Label */}
              {transform.scale > 0.5 && (
                <text
                  y={radius + 14}
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize={11}
                  fontFamily="system-ui, sans-serif"
                  fontWeight={isSelected ? 600 : 400}
                  className="pointer-events-none"
                >
                  {truncateLabel(node.label, 18)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export { GraphCanvas };
