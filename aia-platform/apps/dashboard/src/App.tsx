import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/ui.store';
import { usePendingActionsCount } from '@/hooks/useActions';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DashboardPage } from '@/pages/Dashboard';
import { TenantsPage } from '@/pages/Tenants';
import { TenantDetailPage } from '@/pages/TenantDetail';
import { AgentEditorPage } from '@/pages/AgentEditor';
import { OnboardingPage } from '@/pages/Onboarding';
import { MarketplacePage } from '@/pages/Marketplace';
import { BillingPage } from '@/pages/Billing';
import { SettingsPage } from '@/pages/Settings';
import { IntegrationsPage } from '@/pages/Integrations';
import { ActionQueuePage } from '@/pages/ActionQueue';
import { GraphExplorerPage } from '@/pages/GraphExplorer';
import { LoginPage } from '@/pages/Login';
import { Skeleton } from '@/components/ui/Skeleton';

function useLocation() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('popstate', callback);
      window.addEventListener('pushstate', callback);
      return () => {
        window.removeEventListener('popstate', callback);
        window.removeEventListener('pushstate', callback);
      };
    },
    () => window.location.pathname + window.location.search,
  );
}

function Router() {
  const location = useLocation();
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  // Track location to trigger re-renders
  void location;

  // Extract route segments
  const segments = path.split('/').filter(Boolean);
  const route = segments[0] || '';
  const subRoute = segments[1] || '';
  const detailId = segments[1] || '';

  switch (route) {
    case '':
      return <DashboardPage />;

    case 'tenants':
      if (detailId) {
        return <TenantDetailPage tenantId={detailId} />;
      }
      return <TenantsPage />;

    case 'agents':
      if (subRoute === 'new') {
        return <AgentEditorPage tenantId={searchParams.get('tenant') || undefined} />;
      }
      if (subRoute) {
        return <AgentEditorPage agentId={subRoute} />;
      }
      return <TenantsPage />;

    case 'graph':
      if (subRoute) {
        return <GraphExplorerPage tenantId={subRoute} />;
      }
      return <TenantsPage />;

    case 'onboarding':
      return <OnboardingPage />;

    case 'marketplace':
      return <MarketplacePage />;

    case 'billing':
      return <BillingPage />;

    case 'integrations':
      return <IntegrationsPage />;

    case 'actions':
      return <ActionQueuePage />;

    case 'settings':
      return <SettingsPage />;

    default:
      return (
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Pagina non trovata</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">La pagina richiesta non esiste</p>
          <a href="/" className="text-primary-600 hover:underline dark:text-primary-400">
            Torna alla dashboard
          </a>
        </div>
      );
  }
}

function PendingActionsSync() {
  const { setNotificationCount } = useUIStore();
  const { data: pendingCount } = usePendingActionsCount();

  useEffect(() => {
    if (pendingCount) {
      setNotificationCount(pendingCount.count);
    }
  }, [pendingCount, setNotificationCount]);

  return null;
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useUIStore();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="space-y-4 w-64">
          <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-3 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout>
      <PendingActionsSync />
      <Router />
    </DashboardLayout>
  );
}

export { App };
