import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { useTenants } from '@/hooks/useTenants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { STATUS_COLORS, PLAN_TYPES, type PlanType, type TenantStatus } from '@/lib/constants';
import { formatCurrency, formatRelative, navigate } from '@/lib/utils';
import { Plus, Search, Users } from 'lucide-react';

const statusLabels: Record<string, string> = {
  active: 'Attivo',
  inactive: 'Inattivo',
  trial: 'Trial',
  suspended: 'Sospeso',
  cancelled: 'Cancellato',
};

function TenantsPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Clienti' }]);
  }, [setBreadcrumbs]);

  const { data, isLoading, error, refetch } = useTenants({
    search: search || undefined,
    status: statusFilter || undefined,
    plan: planFilter || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clienti</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestisci tutti i clienti della piattaforma
          </p>
        </div>
        <Button onClick={() => navigate('/onboarding')}>
          <Plus className="h-4 w-4" /> Nuovo cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'Tutti gli stati' },
            { value: 'active', label: 'Attivo' },
            { value: 'inactive', label: 'Inattivo' },
            { value: 'trial', label: 'Trial' },
            { value: 'suspended', label: 'Sospeso' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={[
            { value: '', label: 'Tutti i piani' },
            { value: 'starter', label: 'Starter' },
            { value: 'professional', label: 'Professional' },
            { value: 'enterprise', label: 'Enterprise' },
          ]}
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400 mb-3">Errore nel caricamento dei clienti</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Riprova
          </Button>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
          <Users className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-base font-medium text-slate-700 dark:text-slate-300 mb-2">Nessun cliente trovato</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {search || statusFilter || planFilter
              ? 'Prova a modificare i filtri di ricerca'
              : 'Inizia aggiungendo il primo cliente alla piattaforma'}
          </p>
          {!search && !statusFilter && !planFilter && (
            <Button onClick={() => navigate('/onboarding')}>
              <Plus className="h-4 w-4" /> Nuovo cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Settore</TableHead>
                <TableHead>Piano</TableHead>
                <TableHead className="text-center">Agenti</TableHead>
                <TableHead className="text-center">Documenti</TableHead>
                <TableHead className="text-right">Costo/mese</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Ultima attivita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/tenants/${tenant.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={tenant.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{tenant.name}</p>
                        <p className="text-xs text-slate-500">{tenant.contactEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">{tenant.sector}</TableCell>
                  <TableCell>
                    <Badge color={(PLAN_TYPES[tenant.plan as PlanType]?.color ?? 'slate') as 'slate' | 'blue' | 'purple'}>
                      {PLAN_TYPES[tenant.plan as PlanType]?.label || tenant.plan || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-slate-600 dark:text-slate-400">{tenant.agentsCount}</TableCell>
                  <TableCell className="text-center text-sm text-slate-600 dark:text-slate-400">{tenant.documentsCount}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(tenant.monthlyCost)}
                  </TableCell>
                  <TableCell>
                    <Badge color={(STATUS_COLORS[tenant.status as TenantStatus] ?? 'slate') as 'emerald' | 'slate' | 'amber' | 'red'}>
                      {statusLabels[tenant.status] ?? tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                    {formatRelative(tenant.lastActivity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export { TenantsPage };
