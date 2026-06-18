import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { RootLayout } from '@/routes/__root';
import { LoginPage } from '@/routes/login';
import { HomePage } from '@/routes/index';
import { ChatPage } from '@/routes/chat.$conversationId';
import { KnowledgePage } from '@/routes/knowledge';
import { SettingsPage } from '@/routes/settings';
import { DesktopAgentPage } from '@/routes/desktop-agent';
import { MemoryPage } from '@/routes/memory';
import './app.css';

const AdminUsersPage = lazy(() =>
  import('@/routes/admin/users').then((m) => ({ default: m.AdminUsersPage })),
);
const AdminSettingsPage = lazy(() =>
  import('@/routes/admin/settings').then((m) => ({ default: m.AdminSettingsPage })),
);
const AdminAgentsPage = lazy(() =>
  import('@/routes/admin/agents').then((m) => ({ default: m.AdminAgentsPage })),
);

function AdminFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <span className="text-sm text-slate-500">Loading...</span>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

const rootRoute = createRootRoute({
  component: RootLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/$conversationId',
  component: ChatPage,
});

const knowledgeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/knowledge',
  component: KnowledgePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  component: () => (
    <Suspense fallback={<AdminFallback />}>
      <AdminUsersPage />
    </Suspense>
  ),
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/settings',
  component: () => (
    <Suspense fallback={<AdminFallback />}>
      <AdminSettingsPage />
    </Suspense>
  ),
});

const adminAgentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/agents',
  component: () => (
    <Suspense fallback={<AdminFallback />}>
      <AdminAgentsPage />
    </Suspense>
  ),
});

const desktopAgentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/desktop-agent',
  component: DesktopAgentPage,
});

const memoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/memory',
  component: MemoryPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  chatRoute,
  knowledgeRoute,
  settingsRoute,
  adminUsersRoute,
  adminSettingsRoute,
  adminAgentsRoute,
  desktopAgentRoute,
  memoryRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
