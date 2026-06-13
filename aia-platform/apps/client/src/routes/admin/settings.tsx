import { useState, useEffect } from 'react';
import { SlidersHorizontal, MessageSquare, Coins, TrendingUp, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [tenantName, setTenantName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant-info'],
    queryFn: () => api.getTenantInfo(),
  });

  useEffect(() => {
    if (tenant) {
      setTenantName(tenant.name);
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: (name: string) => api.updateTenantName(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-info'] });
      setSaveSuccess(true);
      setSaveError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: Error) => {
      setSaveError(err.message);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) return;
    setSaveError(null);
    updateMutation.mutate(tenantName.trim());
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400 text-center py-12">
        Errore nel caricamento delle impostazioni.
      </p>
    );
  }

  const usage = tenant.usageThisMonth ?? { conversations: 0, tokens: 0, estimatedCostUsd: 0 };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
            <SlidersHorizontal className="w-5 h-5" />
            Impostazioni Tenant
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configurazione e statistiche del tuo account.
          </p>
        </div>

        <section className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Informazioni generali
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Nome tenant
              </label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="
                  w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-sm
                  text-slate-900 dark:text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                "
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Piano attivo
              </label>
              <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400">
                {PLAN_LABELS[tenant.plan ?? ''] ?? tenant.plan ?? tenant.status ?? 'active'}
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Modifiche salvate con successo.
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={updateMutation.isPending || !tenantName.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </form>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Utilizzo questo mese
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={MessageSquare}
              label="Conversazioni"
              value={(usage.conversations ?? 0).toLocaleString('it-IT')}
            />
            <StatCard
              icon={TrendingUp}
              label="Token usati"
              value={(usage.tokens ?? 0).toLocaleString('it-IT')}
            />
            <StatCard
              icon={Coins}
              label="Costo stimato"
              value={`$${(usage.estimatedCostUsd ?? 0).toFixed(2)}`}
              sub="USD"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
