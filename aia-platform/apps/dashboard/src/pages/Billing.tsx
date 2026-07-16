import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { useUsageSummary, useUsageBySource } from '@/hooks/useUsage';
import { StatsCard } from '@/components/StatsCard';
import { UsageChart } from '@/components/UsageChart';
import { ModelBreakdown } from '@/components/ModelBreakdown';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatTokens } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, TrendingUp, AlertTriangle, Download, CreditCard } from 'lucide-react';
import { format, subDays } from 'date-fns';

function BillingPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Billing' }]);
  }, [setBreadcrumbs]);

  const from = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const to = format(new Date(), 'yyyy-MM-dd');
  const { data: usage, isLoading, error, refetch } = useUsageSummary({ from, to });
  const { data: bySource } = useUsageBySource({ from, to });

  const totalCost = usage?.totalCost ?? 0;
  const projectedCost = totalCost * (30 / Math.max(1, new Date().getDate()));
  const totalRevenue = usage?.byTenant.reduce((acc, t) => acc + t.revenue, 0) ?? 0;
  const margin = totalRevenue - totalCost;

  const handleExportCSV = () => {
    if (!usage) return;
    const headers = 'Cliente,Token,Costo,Revenue,Margine\n';
    const rows = usage.byTenant
      .map((t) => `${t.tenantName},${t.tokens},${t.cost.toFixed(2)},${t.revenue.toFixed(2)},${(t.revenue - t.cost).toFixed(2)}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitoraggio costi e revenue (ultimi 30 giorni)
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={!usage}>
          <Download className="h-4 w-4" /> Esporta CSV
        </Button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400 mb-3">Errore nel caricamento dei dati di billing</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Riprova
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              label="Costo totale mese"
              value={formatCurrency(totalCost)}
              icon={DollarSign}
              iconColor="text-amber-600"
            />
            <StatsCard
              label="Proiezione fine mese"
              value={formatCurrency(projectedCost)}
              icon={AlertTriangle}
              iconColor="text-red-600"
            />
            <StatsCard
              label="Revenue totale"
              value={formatCurrency(totalRevenue)}
              icon={TrendingUp}
              iconColor="text-emerald-600"
            />
            <StatsCard
              label="Margine"
              value={formatCurrency(margin)}
              icon={CreditCard}
              iconColor={margin >= 0 ? 'text-emerald-600' : 'text-red-600'}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Trend costo giornaliero</CardTitle>
              </CardHeader>
              <CardContent>
                <UsageChart
                  data={(usage?.byDay || []).map((d) => ({ date: d.date, value: d.cost }))}
                  color="#4f46e5"
                  label="Costo"
                  formatValue={(v) => formatCurrency(v)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per modello</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelBreakdown data={usage?.byModel || []} type="cost" />
              </CardContent>
            </Card>
          </div>

          {/* Usage by source */}
          {bySource && bySource.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per sorgente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {bySource.map((item) => (
                    <div key={item.source} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge color={item.source.startsWith('proxy') ? 'blue' : item.source === 'chat_cached' ? 'emerald' : 'slate'}>
                          {item.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.label}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        {formatCurrency(item.cost)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.requests.toLocaleString()} req · {formatTokens(item.tokens)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-tenant table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dettaglio per cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {usage?.byTenant.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6 dark:text-slate-400">Nessun dato disponibile</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Token usati</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Margine</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usage?.byTenant.map((tenant) => {
                      const tenantMargin = tenant.revenue - tenant.cost;
                      return (
                        <TableRow key={tenant.tenantId}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{tenant.tenantName}</TableCell>
                          <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatTokens(tenant.tokens)}</TableCell>
                          <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatCurrency(tenant.cost)}</TableCell>
                          <TableCell className="text-right text-slate-600 dark:text-slate-400">{formatCurrency(tenant.revenue)}</TableCell>
                          <TableCell className={`text-right font-medium ${tenantMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(tenantMargin)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export { BillingPage };
