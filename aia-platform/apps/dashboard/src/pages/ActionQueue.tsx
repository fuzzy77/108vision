import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { usePendingActions, useApproveAction, useRejectAction, useBatchApprove, useBatchReject, useActionHistory } from '@/hooks/useActions';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { ActionRequestCard } from '@/components/integrations/ActionRequestCard';
import { formatRelative } from '@/lib/utils';
import { ShieldCheck, Check, X, Filter, Inbox } from 'lucide-react';
import type { ActionRiskLevel, ActionRequest } from '@/types';

function ActionQueuePage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Azioni' }]);
  }, [setBreadcrumbs]);

  const filters = {
    riskLevel: riskFilter ? (riskFilter as ActionRiskLevel) : undefined,
  };

  const { data: pendingData, isLoading: pendingLoading } = usePendingActions(filters);
  const { data: historyData, isLoading: historyLoading } = useActionHistory();
  const approveMutation = useApproveAction();
  const rejectMutation = useRejectAction();
  const batchApproveMutation = useBatchApprove();
  const batchRejectMutation = useBatchReject();

  const pendingActions = pendingData?.data || [];
  const historyActions = historyData?.data || [];

  function handleApprove(actionId: string) {
    setApprovingId(actionId);
    approveMutation.mutate(actionId, {
      onSettled: () => setApprovingId(null),
    });
  }

  function handleReject(actionId: string) {
    setRejectingId(actionId);
    rejectMutation.mutate(actionId, {
      onSettled: () => setRejectingId(null),
    });
  }

  function handleSelectAction(actionId: string, selected: boolean) {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(actionId);
      } else {
        next.delete(actionId);
      }
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedActions.size === pendingActions.length) {
      setSelectedActions(new Set());
    } else {
      setSelectedActions(new Set(pendingActions.map((a) => a.id)));
    }
  }

  function handleBatchApprove() {
    const ids = Array.from(selectedActions);
    batchApproveMutation.mutate(ids, {
      onSuccess: () => setSelectedActions(new Set()),
    });
  }

  function handleBatchReject() {
    const ids = Array.from(selectedActions);
    batchRejectMutation.mutate(ids, {
      onSuccess: () => setSelectedActions(new Set()),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Coda azioni</h1>
            {pendingActions.length > 0 && (
              <Badge color="red">{pendingActions.length} in attesa</Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Approva o rifiuta le azioni ad alto rischio richieste dagli agenti
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> In attesa
              {pendingActions.length > 0 && (
                <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {pendingActions.length}
                </span>
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="history">
            <span className="flex items-center gap-1.5">
              Cronologia
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <div className="space-y-4">
            {/* Filters and batch actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <Select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Tutti i livelli' },
                    { value: 'high_risk', label: 'Rischio alto' },
                    { value: 'low_risk', label: 'Rischio basso' },
                    { value: 'read_only', label: 'Sola lettura' },
                  ]}
                />
              </div>

              {selectedActions.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedActions.size} selezionati
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchReject}
                    disabled={batchRejectMutation.isPending}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    <X className="h-3.5 w-3.5" /> Rifiuta tutti
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBatchApprove}
                    disabled={batchApproveMutation.isPending}
                  >
                    <Check className="h-3.5 w-3.5" /> Approva tutti
                  </Button>
                </div>
              )}

              {pendingActions.length > 0 && selectedActions.size === 0 && (
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  Seleziona tutti
                </Button>
              )}
            </div>

            {/* Actions list */}
            {pendingLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              </div>
            ) : pendingActions.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Inbox className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nessuna azione in attesa</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Le azioni ad alto rischio richieste dagli agenti appariranno qui per la tua approvazione.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingActions.map((action: ActionRequest) => (
                  <ActionRequestCard
                    key={action.id}
                    action={action}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isApproving={approvingId === action.id}
                    isRejecting={rejectingId === action.id}
                    selectable
                    selected={selectedActions.has(action.id)}
                    onSelect={handleSelectAction}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : historyActions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nessuna azione nella cronologia.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Azione</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Rischio</TableHead>
                    <TableHead>Decisione</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyActions.map((action: ActionRequest) => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{action.actionType}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">{action.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {action.tenantName}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {action.agentName}
                      </TableCell>
                      <TableCell>
                        <Badge color={
                          action.riskLevel === 'high_risk' ? 'red' :
                          action.riskLevel === 'low_risk' ? 'amber' : 'slate'
                        }>
                          {action.riskLevel === 'high_risk' ? 'Alto' :
                           action.riskLevel === 'low_risk' ? 'Basso' : 'Lettura'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge color={action.status === 'approved' ? 'emerald' : 'red'}>
                          {action.status === 'approved' ? 'Approvato' : 'Rifiutato'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                        {action.resolvedAt ? formatRelative(action.resolvedAt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { ActionQueuePage };
