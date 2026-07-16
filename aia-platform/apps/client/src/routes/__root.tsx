import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ServiceStatusBanner } from '@/components/ui/ServiceStatusBanner';
import { isAuthenticated } from '@/lib/auth';
import { useEffect } from 'react';

export function RootLayout() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!authenticated && currentPath !== '/login') {
      navigate({ to: '/login' });
    }
  }, [authenticated, currentPath, navigate]);

  if (currentPath === '/login') {
    return <Outlet />;
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
      <ServiceStatusBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
