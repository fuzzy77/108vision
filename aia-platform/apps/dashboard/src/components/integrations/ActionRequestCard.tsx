import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRelative } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Check, X, Clock, Loader2 } from 'lucide-react';
import type { ActionRequest } from '@/types';

interface ActionRequestCardProps {
  action: ActionRequest;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (actionId: string, selected: boolean) => void;
}

const riskConfig = {
  read_only: { label: 'Sola lettura', color: 'slate' as const, barColor: 'bg-slate-300 dark:bg-slate-600' },
  low_risk: { label: 'Rischio basso', color: 'amber' as const, barColor: 'bg-amber-400 dark:bg-amber-500' },
  high_risk: { label: 'Rischio alto', color: 'red' as const, barColor: 'bg-red-500 dark:bg-red-600' },
};

function ActionRequestCard({
  action,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  selectable,
  selected,
  onSelect,
}: ActionRequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const risk = riskConfig[action.riskLevel] || riskConfig.low_risk;
  const waitingTime = formatRelative(action.createdAt);

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', selected && 'ring-2 ring-primary-500')}>
      <div className="flex">
        {/* Risk color bar */}
        <div className={cn('w-1.5 shrink-0', risk.barColor)} />

        <CardContent className="flex-1 py-4 pl-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {selectable && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onSelect?.(action.id, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600"
                />
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {action.actionType}
                  </span>
                  <Badge color={risk.color}>{risk.label}</Badge>
                  <span className="text-xs text-slate-400">{action.tenantName}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{action.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>Agente: {action.agentName}</span>
                  {action.userName && <span>Utente: {action.userName}</span>}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {waitingTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(action.id)}
                disabled={isRejecting || isApproving}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                {isRejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Rifiuta
              </Button>
              <Button
                size="sm"
                onClick={() => onApprove(action.id)}
                disabled={isApproving || isRejecting}
              >
                {isApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Approva
              </Button>
            </div>
          </div>

          {/* Expandable parameters */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Nascondi parametri' : 'Mostra parametri'}
          </button>
          {expanded && (
            <div className="mt-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
              <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(action.parameters, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

export { ActionRequestCard };
