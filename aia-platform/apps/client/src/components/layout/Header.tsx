import { useState } from 'react';
import { Menu, LogOut, HelpCircle, Monitor } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useChatStore } from '@/stores/chat.store';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { GovernanceDrawer } from '@/components/chat/GovernanceDrawer';
import { useDesktopAgent } from '@/hooks/useDesktopAgent';
import { getUser, logout } from '@/lib/auth';

export function Header() {
  const { toggleSidebar, modelPreference, selectedAgentId } = useChatStore();
  const user = getUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { status: agentStatus } = useDesktopAgent();

  const modelBadge: Record<string, { label: string; variant: 'info' | 'warning' | 'success' }> = {
    'fast-cheap': { label: 'Fast', variant: 'info' },
    balanced: { label: 'Balanced', variant: 'warning' },
    powerful: { label: 'Powerful', variant: 'success' },
  };

  const current = modelBadge[modelPreference] ?? { label: 'Balanced', variant: 'warning' as const };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>

        <div className="flex items-center gap-2">
          {selectedAgentId && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Agent Active
            </span>
          )}
          <Badge variant={current.variant}>{current.label}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/desktop-agent"
          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            agentStatus?.connected
              ? 'text-emerald-500 hover:text-emerald-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          title={agentStatus?.connected ? 'Desktop Agent connesso' : 'Desktop Agent non connesso'}
        >
          <Monitor className="w-4 h-4" />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          aria-label="Come funziona l'AI"
          title="Come funziona l'AI"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <Avatar name={user.name} size="sm" />
            <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:inline">
              {user.name}
            </span>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <GovernanceDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}
