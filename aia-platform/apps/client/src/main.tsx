import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { RootLayout } from '@/routes/__root';
import { LoginPage } from '@/routes/login';
import { HomePage } from '@/routes/index';
import { ChatPage } from '@/routes/chat.$conversationId';
import { KnowledgePage } from '@/routes/knowledge';
import { SettingsPage } from '@/routes/settings';
import { AdminUsersPage } from '@/routes/admin/users';
import { AdminSettingsPage } from '@/routes/admin/settings';
import { AdminAgentsPage } from '@/routes/admin/agents';
import './app.css';

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
  component: AdminUsersPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/settings',
  component: AdminSettingsPage,
});

const adminAgentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/agents',
  component: AdminAgentsPage,
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
