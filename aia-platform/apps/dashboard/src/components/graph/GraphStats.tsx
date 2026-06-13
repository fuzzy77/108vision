import { useState } from 'react';
import { useGraphStats } from '@/hooks/useGraph';
import { getEntityColor, getEntityLabel } from '@/lib/graph-colors';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChevronDown, ChevronUp, Network, Link2, Star, FileText } from 'lucide-react';
import { formatRelative } from '@/lib/utils';

interface GraphStatsProps {
  tenantId: string;
  collapsible?: boolean;
}

function GraphStats({ tenantId, collapsible = true }: GraphStatsProps) {
  const { data: stats, isLoading } = useGraphStats(tenantId);
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700">
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 ${collapsible ? 'cursor-pointer' : ''} ${
          collapsed ? '' : 'border-b border-slate-700'
        }`}
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-primary-400" />
          <h3 className="text-sm font-semibold text-slate-200">Statistiche grafo</h3>
        </div>
        {collapsible && (
          <button className="text-slate-400 hover:text-slate-200">
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Summary counts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-750 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <Network className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-slate-400">Entita</span>
              </div>
              <p className="text-xl font-bold text-slate-100">{stats.totalEntities}</p>
            </div>
            <div className="bg-slate-750 rounded-lg p-3 border border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-slate-400">Relazioni</span>
              </div>
              <p className="text-xl font-bold text-slate-100">{stats.totalRelations}</p>
            </div>
          </div>

          {/* Entities by type */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Per tipo
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(stats.entitiesByType) ? stats.entitiesByType : []).map(({ type, count }) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getEntityColor(type) }}
                >
                  {getEntityLabel(type)} {count}
                </span>
              ))}
            </div>
          </div>

          {/* Most connected */}
          {stats.mostConnected.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Star className="h-3 w-3" /> Piu connesse
              </h4>
              <div className="space-y-1">
                {(Array.isArray(stats.mostConnected) ? stats.mostConnected : []).slice(0, 5).map((entity) => (
                  <div key={entity.id} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: getEntityColor(entity.type) }}
                    />
                    <span className="text-slate-300 truncate flex-1">{entity.name}</span>
                    <span className="text-xs text-slate-500">{entity.connections} conn.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent extractions */}
          {stats.recentExtractions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <FileText className="h-3 w-3" /> Estrazioni recenti
              </h4>
              <div className="space-y-1.5">
                {(Array.isArray(stats.recentExtractions) ? stats.recentExtractions : []).slice(0, 5).map((doc) => (
                  <div key={doc.documentId} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[160px]">{doc.documentTitle}</span>
                    <span className="text-slate-500 shrink-0 ml-2">
                      {doc.entitiesCount} ent. - {formatRelative(doc.processedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { GraphStats };
