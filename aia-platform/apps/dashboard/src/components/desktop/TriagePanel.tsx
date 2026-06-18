import { RefreshCw, Play, AlertTriangle, Info, Clock, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTriage, useRunTriage, type TriageItem } from '@/hooks/useTriage';
import { useLocalAgentStatus } from '@/hooks/useLocalAgent';
import { cn, formatRelative } from '@/lib/utils';

interface TriagePanelProps {
  tenantId: string;
}

const urgencyStyles: Record<TriageItem['urgency'], { badge: 'red' | 'amber' | 'slate'; label: string }> = {
  urgent: { badge: 'red', label: 'Urgente' },
  important: { badge: 'amber', label: 'Importante' },
  informative: { badge: 'slate', label: 'Info' },
};

function TriageItemRow({ item }: { item: TriageItem }) {
  const style = urgencyStyles[item.urgency];
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-700/50">
      <Badge color={style.badge} className="h-fit shrink-0">
        {style.label}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{item.title}</p>
        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{item.detail}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
          <span>{item.source}</span>
          <span>·</span>
          <span>{formatRelative(item.timestamp)}</span>
        </div>
        {item.actionSuggestion && (
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            → {item.actionSuggestion}
          </p>
        )}
      </div>
    </div>
  );
}

export function TriagePanel({ tenantId }: TriagePanelProps) {
  const { data: agentStatus } = useLocalAgentStatus(tenantId);
  const { data, isLoading, isError, refetch, isFetching } = useTriage(tenantId);
  const runTriage = useRunTriage(tenantId);

  const connected = agentStatus?.status === 'connected';
  const report = data?.report;
  const schedule = data?.schedule;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-emerald-500" />
            Daily Triage
          </CardTitle>
          {schedule && (
            <p className="mt-1 text-xs text-slate-500">
              Cron: {schedule.cron}
              {schedule.nextRun && ` · Prossimo: ${formatRelative(schedule.nextRun)}`}
              {schedule.lastRun && ` · Ultimo: ${formatRelative(schedule.lastRun)}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={!connected || isFetching}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </Button>
          <Button
            size="sm"
            onClick={() => runTriage.mutate()}
            disabled={!connected || runTriage.isPending}
          >
            <Play className="mr-1 h-3.5 w-3.5" />
            {runTriage.isPending ? 'In corso...' : 'Esegui triage'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!connected && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Desktop agent non connesso per questo tenant.
          </div>
        )}

        {connected && isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {connected && isError && (
          <p className="text-sm text-red-500">Errore nel caricamento del triage.</p>
        )}

        {connected && !isLoading && !report && (
          <p className="text-sm text-slate-500">
            Nessun report salvato. Esegui il triage per generare il briefing.
          </p>
        )}

        {report && (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              <StatPill label="Urgenti" value={report.stats.urgent} color="text-red-500" />
              <StatPill label="Importanti" value={report.stats.important} color="text-amber-500" />
              <StatPill label="Info" value={report.stats.informative} color="text-slate-500" />
              <StatPill
                label="Fonti"
                value={`${report.stats.sourcesChecked}/${report.stats.sourcesAvailable}`}
                color="text-emerald-500"
              />
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {formatRelative(report.generatedAt)} · {report.stats.executionMs}ms
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {report.items.length === 0 ? (
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Nessun elemento da segnalare — inbox pulita.
                </p>
              ) : (
                report.items.map((item) => <TriageItemRow key={item.id} item={item} />)
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-md bg-slate-50 px-2.5 py-1 text-xs dark:bg-slate-800/50">
      <span className="text-slate-500">{label}: </span>
      <span className={cn('font-semibold', color)}>{value}</span>
    </div>
  );
}
