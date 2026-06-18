import { useState } from 'react';
import { Play, RefreshCw, ListTodo, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useJobs, useJobDetail, useRunJob, type JobSummary } from '@/hooks/useJobs';
import { useLocalAgentStatus } from '@/hooks/useLocalAgent';
import { cn, formatRelative } from '@/lib/utils';

interface JobListPanelProps {
  tenantId: string;
}

function statusBadge(enabled: boolean, lastStatus: string | null) {
  if (!enabled) return <Badge color="slate">Disabilitato</Badge>;
  if (lastStatus === 'failed') return <Badge color="red">Ultimo fallito</Badge>;
  if (lastStatus === 'completed') return <Badge color="emerald">OK</Badge>;
  if (lastStatus === 'running') return <Badge color="amber">In esecuzione</Badge>;
  return <Badge color="slate">Idle</Badge>;
}

function JobDetailRow({ tenantId, jobId }: { tenantId: string; jobId: string }) {
  const { data, isLoading } = useJobDetail(tenantId, jobId);

  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!data) return null;

  return (
    <div className="bg-slate-50/80 px-4 py-3 text-xs dark:bg-slate-800/30">
      {data.job.description && (
        <p className="mb-2 text-slate-600 dark:text-slate-300">{data.job.description}</p>
      )}
      <p className="text-slate-500">
        Success rate: {(data.stats.successRate * 100).toFixed(0)}% · Token totali:{' '}
        {data.stats.totalTokens}
      </p>
      {data.recentRuns.length > 0 && (
        <ul className="mt-2 space-y-1">
          {data.recentRuns.slice(0, 5).map((run) => (
            <li key={run.runId} className="flex justify-between text-slate-500">
              <span>{run.status}</span>
              <span>{formatRelative(run.startedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JobRow({
  job,
  tenantId,
  onRun,
  running,
}: {
  job: JobSummary;
  tenantId: string;
  onRun: (id: string) => void;
  running: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
        <TableCell className="w-8" onClick={() => setExpanded((v) => !v)}>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </TableCell>
        <TableCell onClick={() => setExpanded((v) => !v)}>
          <p className="font-medium text-sm">{job.name}</p>
          <p className="text-xs text-slate-400 font-mono">{job.id}</p>
        </TableCell>
        <TableCell onClick={() => setExpanded((v) => !v)}>
          {statusBadge(job.enabled, job.stats.lastStatus)}
        </TableCell>
        <TableCell className="text-sm text-slate-500" onClick={() => setExpanded((v) => !v)}>
          {job.stats.lastRun ? formatRelative(job.stats.lastRun) : '—'}
        </TableCell>
        <TableCell className="text-sm text-slate-500" onClick={() => setExpanded((v) => !v)}>
          {job.stats.totalRuns}
        </TableCell>
        <TableCell>
          <Button
            variant="outline"
            size="sm"
            disabled={!job.enabled || running}
            onClick={(e) => {
              e.stopPropagation();
              onRun(job.id);
            }}
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={6} className="p-0">
            <JobDetailRow tenantId={tenantId} jobId={job.id} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function JobListPanel({ tenantId }: JobListPanelProps) {
  const { data: agentStatus } = useLocalAgentStatus(tenantId);
  const { data, isLoading, isError, refetch, isFetching } = useJobs(tenantId);
  const runJob = useRunJob(tenantId);

  const connected = agentStatus?.status === 'connected';
  const jobs = data?.jobs ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-violet-500" />
            Job Engine
          </CardTitle>
          {data?.scheduler && (
            <p className="mt-1 text-xs text-slate-500">
              Scheduler {data.scheduler.running ? 'attivo' : 'fermo'} ·{' '}
              {data.scheduler.scheduledJobs} job schedulati
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={!connected || isFetching}
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent>
        {!connected && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Desktop agent non connesso.
          </div>
        )}

        {connected && isLoading && <Skeleton className="h-40 w-full" />}

        {connected && isError && (
          <p className="text-sm text-red-500">Errore nel caricamento dei job.</p>
        )}

        {connected && !isLoading && jobs.length === 0 && (
          <p className="text-sm text-slate-500">Nessun job definito sull&apos;agent locale.</p>
        )}

        {connected && jobs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Nome</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Ultimo run</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  tenantId={tenantId}
                  onRun={(id) => runJob.mutate(id)}
                  running={runJob.isPending}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
