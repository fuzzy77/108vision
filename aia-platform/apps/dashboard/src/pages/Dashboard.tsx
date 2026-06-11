import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { useDashboardStats, useRecentActivity } from '@/hooks/useUsage';
import { useTenants } from '@/hooks/useTenants';
import { StatsCard } from '@/components/StatsCard';
import { TenantCard } from '@/components/TenantCard';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Users, MessageSquare, DollarSign, TrendingUp, Plus, Sparkles } from 'lucide-react';
import { formatCurrency, formatNumber, navigate } from '@/lib/utils';

function DashboardPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);

  useEffect(() => {
    setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity(10);
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants({ pageSize: 6 });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Panoramica della piattaforma</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/marketplace')}>
            <Sparkles className="h-4 w-4" /> Nuovo template
          </Button>
          <Button onClick={() => navigate('/onboarding')}>
            <Plus className="h-4 w-4" /> Nuovo cliente
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))
        ) : stats ? (
          <>
            <StatsCard
              label="Clienti attivi"
              value={formatNumber(stats.activeTenants)}
              trend={stats.tenantsTrend}
              icon={Users}
              iconColor="text-primary-600"
            />
            <StatsCard
              label="Conversazioni mese"
              value={formatNumber(stats.conversationsThisMonth)}
              trend={stats.conversationsTrend}
              icon={MessageSquare}
              iconColor="text-blue-600"
            />
            <StatsCard
              label="Costo LLM mese"
              value={formatCurrency(stats.llmCostThisMonth)}
              trend={stats.costTrend}
              icon={DollarSign}
              iconColor="text-amber-600"
            />
            <StatsCard
              label="Revenue mese"
              value={formatCurrency(stats.revenueThisMonth)}
              trend={stats.revenueTrend}
              icon={TrendingUp}
              iconColor="text-emerald-600"
            />
          </>
        ) : null}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant grid (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Clienti</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tenants')}>
              Vedi tutti
            </Button>
          </div>
          {tenantsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : tenantsData?.data.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Nessun cliente ancora. Inizia creando il primo!</p>
                <Button onClick={() => navigate('/onboarding')}>
                  <Plus className="h-4 w-4" /> Nuovo cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenantsData?.data.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onClick={() => navigate(`/tenants/${tenant.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Activity feed (1/3 width) */}
        <div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Attivita recente</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-3 w-full mb-1.5" />
                        <Skeleton className="h-2.5 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ActivityFeed events={activity || []} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { DashboardPage };
