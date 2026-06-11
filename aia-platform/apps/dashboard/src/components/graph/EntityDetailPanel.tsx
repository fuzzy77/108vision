import { useEntityDetail, useDeleteEntity, useMergeEntities } from '@/hooks/useGraph';
import { getEntityColor, getEntityLabel } from '@/lib/graph-colors';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { X, Expand, Trash2, Merge, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface EntityDetailPanelProps {
  tenantId: string;
  entityId: string;
  onClose: () => void;
  onExpand: (entityId: string) => void;
  onNavigateToDocument?: (documentId: string) => void;
}

function EntityDetailPanel({ tenantId, entityId, onClose, onExpand, onNavigateToDocument }: EntityDetailPanelProps) {
  const { data, isLoading } = useEntityDetail(tenantId, entityId);
  const deleteEntity = useDeleteEntity(tenantId);
  const mergeEntities = useMergeEntities(tenantId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

  const handleDelete = () => {
    deleteEntity.mutate(entityId, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleMerge = (targetId: string) => {
    mergeEntities.mutate(
      { sourceId: entityId, targetId },
      {
        onSuccess: () => {
          setMergeTargetId(null);
          onClose();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="w-[300px] border-l border-slate-700 bg-slate-800 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-32" />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <Skeleton className="h-4 w-20 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-[300px] border-l border-slate-700 bg-slate-800 p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-slate-400">Entita non trovata</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const { entity, relations, neighbors } = data;
  const color = getEntityColor(entity.type);
  const typeLabel = getEntityLabel(entity.type);

  // Build properties list (excluding internal fields)
  const propertyEntries = Object.entries(entity.properties).filter(
    ([key]) => !['name', 'type', 'id'].includes(key),
  );

  return (
    <div className="w-[300px] border-l border-slate-700 bg-slate-800 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-slate-100 leading-tight pr-2">
            {entity.name}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {typeLabel}
          </span>
          <span className="text-xs text-slate-400">
            Confidenza: {Math.round(entity.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Properties */}
      {propertyEntries.length > 0 && (
        <div className="p-4 border-b border-slate-700">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Proprieta
          </h4>
          <div className="space-y-1.5">
            {propertyEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-slate-400 truncate mr-2">{key}</span>
                <span className="text-slate-200 text-right truncate max-w-[140px]">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source document */}
      {entity.sourceDocumentId && (
        <div className="p-4 border-b border-slate-700">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Documento sorgente
          </h4>
          <button
            onClick={() => onNavigateToDocument?.(entity.sourceDocumentId!)}
            className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Vai al documento
          </button>
        </div>
      )}

      {/* Connected entities */}
      <div className="p-4 border-b border-slate-700 flex-1">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Entita collegate ({neighbors.length})
        </h4>
        {neighbors.length === 0 ? (
          <p className="text-xs text-slate-500">Nessuna connessione</p>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {neighbors.map((neighbor) => {
              const rel = relations.find(
                (r) =>
                  (r.sourceId === entity.id && r.targetId === neighbor.id) ||
                  (r.targetId === entity.id && r.sourceId === neighbor.id),
              );
              const neighborColor = getEntityColor(neighbor.type);

              return (
                <div
                  key={neighbor.id}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-700/50 cursor-pointer"
                  onClick={() => onExpand(neighbor.id)}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: neighborColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{neighbor.name}</p>
                    {rel && (
                      <p className="text-xs text-slate-500 truncate">
                        {rel.type.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-slate-300 border-slate-600"
          onClick={() => onExpand(entityId)}
        >
          <Expand className="h-3.5 w-3.5" /> Espandi connessioni
        </Button>

        {mergeTargetId === null ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-slate-300 border-slate-600"
            onClick={() => {
              if (neighbors.length > 0) {
                setMergeTargetId(neighbors[0].id);
              }
            }}
            disabled={neighbors.length === 0}
          >
            <Merge className="h-3.5 w-3.5" /> Unisci duplicato
          </Button>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400">Seleziona entita destinazione:</p>
            <select
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
              className="w-full text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-slate-200"
            >
              {neighbors.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleMerge(mergeTargetId)}
                disabled={mergeEntities.isPending}
              >
                Conferma
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setMergeTargetId(null)}
              >
                Annulla
              </Button>
            </div>
          </div>
        )}

        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Elimina entita
          </Button>
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs text-red-400">Confermi l&apos;eliminazione?</p>
            <div className="flex gap-1.5">
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleDelete}
                disabled={deleteEntity.isPending}
              >
                Elimina
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annulla
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { EntityDetailPanel };
