import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { PrincipleWarningDialog } from './PrincipleWarningDialog';
import { PRINCIPLES } from '@/lib/principles';

interface PrinciplesPanelProps {
  overrides: Record<string, boolean>;
  onChange: (overrides: Record<string, boolean>) => void;
}

export function PrinciplesPanel({ overrides, onChange }: PrinciplesPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [pendingDisable, setPendingDisable] = useState<string | null>(null);

  const isEnabled = (id: string) => overrides[id] !== false;
  const enabledCount = PRINCIPLES.filter((p) => isEnabled(p.id)).length;

  const handleToggle = (id: string, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      setPendingDisable(id);
    } else {
      const next = { ...overrides };
      delete next[id];
      onChange(next);
    }
  };

  const confirmDisable = () => {
    if (!pendingDisable) return;
    onChange({ ...overrides, [pendingDisable]: false });
    setPendingDisable(null);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const pendingPrinciple = PRINCIPLES.find((p) => p.id === pendingDisable);

  return (
    <>
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <CardTitle className="text-base">Principi di Governance AI</CardTitle>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                ({enabledCount}/{PRINCIPLES.length} attivi)
              </span>
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-1 pt-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Questi principi vengono automaticamente preposti al system prompt dell'agente.
              Disattivarne uno rimuove quel comportamento dall'AI.
            </p>

            {PRINCIPLES.map((principle) => {
              const enabled = isEnabled(principle.id);
              const isExpanded = expandedIds.has(principle.id);

              return (
                <div
                  key={principle.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    enabled
                      ? 'border-slate-200 dark:border-slate-700'
                      : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleExpand(principle.id)}
                        className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <span className={`text-sm font-medium truncate ${
                        enabled
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {principle.label}
                      </span>
                    </div>
                    <Switch
                      checked={enabled}
                      onChange={() => handleToggle(principle.id, enabled)}
                    />
                  </div>

                  {isExpanded && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-6">
                      {principle.description}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>

      {pendingPrinciple && (
        <PrincipleWarningDialog
          principleLabel={pendingPrinciple.label}
          riskWarning={pendingPrinciple.riskWarning}
          onConfirm={confirmDisable}
          onCancel={() => setPendingDisable(null)}
        />
      )}
    </>
  );
}
