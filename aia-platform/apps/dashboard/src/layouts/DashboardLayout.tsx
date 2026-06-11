import { type ReactNode } from 'react';
import { cn, navigate } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Menu,
  Moon,
  Sun,
  LogOut,
  Plug,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Clienti', href: '/tenants', icon: Users },
  { label: 'Marketplace', href: '/marketplace', icon: Store },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Integrazioni', href: '/integrations', icon: Plug },
  { label: 'Azioni', href: '/actions', icon: ShieldCheck, badge: true },
  { label: 'Impostazioni', href: '/settings', icon: Settings },
];

function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme, breadcrumbs, notificationCount } = useUIStore();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const currentPath = window.location.pathname;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 text-white transition-all duration-300 dark:bg-slate-950',
          sidebarCollapsed ? 'w-[72px]' : 'w-[280px]',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-5 border-b border-slate-800', sidebarCollapsed && 'justify-center px-0')}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary-600 font-bold text-sm">
                108
              </div>
              <div>
                <span className="text-sm font-semibold">108</span>
                <p className="text-[10px] text-slate-400">Consultant Platform</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary-600 font-bold text-xs">
              108
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => { e.preventDefault(); navigate(item.href); }}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  sidebarCollapsed && 'justify-center px-0',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge && notificationCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {notificationCount}
                      </span>
                    )}
                  </span>
                )}
                {sidebarCollapsed && item.badge && notificationCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
              </a>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={cn('border-t border-slate-800 p-3', sidebarCollapsed && 'flex justify-center')}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-800 transition-colors">
              <Avatar name={user?.name || 'Consulente'} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'Consulente'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
          ) : (
            <Avatar name={user?.name || 'C'} size="sm" />
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className={cn('flex-1 flex flex-col transition-all duration-300', sidebarCollapsed ? 'ml-[72px]' : 'ml-[280px]')}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-slate-600 dark:text-slate-400">
              <Menu className="h-5 w-5" />
            </Button>
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1 text-sm">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">Dashboard</a>
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                  {crumb.href ? (
                    <a href={crumb.href} onClick={(e) => { e.preventDefault(); navigate(crumb.href!); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-slate-700 font-medium dark:text-slate-200">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca clienti, agenti..."
                className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-800"
              />
            </div>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-600 dark:text-slate-400">
              {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </Button>

            {/* Notifications — navigates to action queue */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-600 dark:text-slate-400"
                onClick={() => navigate('/actions')}
                title="Coda azioni"
              >
                <Bell className="h-4.5 w-4.5" />
              </Button>
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {notificationCount}
                </span>
              )}
            </div>

            {/* User avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Avatar name={user?.name || 'Consulente'} size="sm" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <a href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700">
                    <Settings className="h-4 w-4" /> Impostazioni
                  </a>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" /> Esci
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
