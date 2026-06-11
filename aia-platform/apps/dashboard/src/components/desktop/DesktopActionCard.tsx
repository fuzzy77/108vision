import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatRelative } from '@/lib/utils';
import {
  Keyboard,
  Mouse,
  Camera,
  Eye,
  Layers,
  Focus,
  Clipboard,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Clock,
  Loader2,
  Zap,
} from 'lucide-react';
import type { ActionRiskLevel } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DesktopActionType =
  | 'listWindows'
  | 'readWindow'
  | 'screenshot'
  | 'analyzeScreen'
  | 'getUITree'
  | 'focusWindow'
  | 'scrollWindow'
  | 'typeText'
  | 'clickElement'
  | 'pressHotkey'
  | 'mouseClick'
  | 'clipboard';

export interface DesktopAction {
  id: string;
  tenantId: string;
  actionType: DesktopActionType;
  targetWindowTitle: string | null;
  targetProcessName: string | null;
  description: string;
  riskLevel: ActionRiskLevel;
  parameters: Record<string, unknown>;
  screenshotBeforeId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  createdAt: string;
  resolvedAt: string | null;
}

interface DesktopActionCardProps {
  action: DesktopAction;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
  onViewScreenshot?: (screenshotId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const actionIcons: Record<DesktopActionType, React.ReactNode> = {
  listWindows: <Layers className="h-4 w-4" />,
  readWindow: <Eye className="h-4 w-4" />,
  screenshot: <Camera className="h-4 w-4" />,
  analyzeScreen: <Eye className="h-4 w-4" />,
  getUITree: <Layers className="h-4 w-4" />,
  focusWindow: <Focus className="h-4 w-4" />,
  scrollWindow: <Mouse className="h-4 w-4" />,
  typeText: <Keyboard className="h-4 w-4" />,
  clickElement: <Mouse className="h-4 w-4" />,
  pressHotkey: <Keyboard className="h-4 w-4" />,
  mouseClick: <Mouse className="h-4 w-4" />,
  clipboard: <Clipboard className="h-4 w-4" />,
};

const actionLabels: Record<DesktopActionType, string> = {
  listWindows: 'Elenca finestre',
  readWindow: 'Leggi finestra',
  screenshot: 'Screenshot',
  analyzeScreen: 'Analizza schermo',
  getUITree: 'UI Tree',
  focusWindow: 'Porta in primo piano',
  scrollWindow: 'Scorri finestra',
  typeText: 'Scrivi testo',
  clickElement: 'Click elemento',
  pressHotkey: 'Tasto rapido',
  mouseClick: 'Click mouse',
  clipboard: 'Appunti',
};

const riskConfig: Record<ActionRiskLevel, {
  label: string;
  color: 'slate' | 'amber' | 'red';
  barColor: string;
  bgColor: string;
}> = {
  read_only: {
    label: 'Sola lettura',
    color: 'slate',
    barColor: 'bg-slate-300 dark:bg-slate-600',
    bgColor: 'bg-slate-50 dark:bg-slate-800/30',
  },
  low_risk: {
    label: 'Rischio basso',
    color: 'amber',
    barColor: 'bg-amber-400 dark:bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/10',
  },
  high_risk: {
    label: 'Rischio alto',
    color: 'red',
    barColor: 'bg-red-500 dark:bg-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DesktopActionCard({
  action,
  onApprove,
  onReject,
  onViewScreenshot,
  isApproving,
  isRejecting,
}: DesktopActionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const risk = riskConfig[action.riskLevel];
  const isAutoApproved = action.riskLevel === 'read_only';
  const requiresApproval = action.riskLevel === 'high_risk';

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', risk.bgColor)}>
      <div className="flex">
        {/* Risk color bar */}
        <div className={cn('w-1.5 shrink-0', risk.barColor)} />

        <CardContent className="flex-1 py-4 pl-4 pr-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {/* Action type icon */}
              <div className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                action.riskLevel === 'high_risk'
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : action.riskLevel === 'low_risk'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
              )}>
                {actionIcons[action.actionType]}
              </div>

              <div className="min-w-0">
                {/* Title + badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {actionLabels[action.actionType]}
                  </span>
                  <Badge color={risk.color}>{risk.label}</Badge>
                  {isAutoApproved && (
                    <Badge color="emerald">
                      <Zap className="mr-1 h-2.5 w-2.5" />
                      Auto-approvato
                    </Badge>
                  )}
                </div>

                {/* Target window */}
                {(action.targetWindowTitle || action.targetProcessName) && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {action.targetWindowTitle && (
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {action.targetWindowTitle}
                      </span>
                    )}
                    {action.targetWindowTitle && action.targetProcessName && ' · '}
                    {action.targetProcessName && (
                      <span className="font-mono">{action.targetProcessName}</span>
                    )}
                  </p>
                )}

                {/* Description */}
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  {action.description}
                </p>

                {/* Meta row */}
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelative(action.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: screenshot thumbnail + action buttons */}
            <div className="flex shrink-0 flex-col items-end gap-2">
              {/* Pre-action screenshot thumbnail */}
              {action.screenshotBeforeId && onViewScreenshot && (
                <button
                  onClick={() => onViewScreenshot(action.screenshotBeforeId!)}
                  className="group relative h-16 w-24 overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-700"
                  title="Visualizza screenshot pre-azione"
                >
                  <img
                    src={`/api/integrations/local-agent/screenshots/${action.screenshotBeforeId}`}
                    alt="Screenshot pre-azione"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <Camera className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              )}

              {/* Approve / Reject (only for high-risk pending) */}
              {requiresApproval && action.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject(action.id)}
                    disabled={isRejecting || isApproving}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    {isRejecting
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <X className="h-3.5 w-3.5" />}
                    Rifiuta
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onApprove(action.id)}
                    disabled={isApproving || isRejecting}
                  >
                    {isApproving
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Check className="h-3.5 w-3.5" />}
                    Approva
                  </Button>
                </div>
              )}

              {/* Auto-approve indicator for non-high-risk */}
              {!requiresApproval && action.status === 'pending' && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Esecuzione automatica
                </span>
              )}
            </div>
          </div>

          {/* Expand parameters */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Nascondi parametri' : 'Mostra parametri'}
          </button>
          {expanded && (
            <div className="mt-2 rounded-lg bg-slate-900/5 p-3 dark:bg-slate-900/50">
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

export { DesktopActionCard };
