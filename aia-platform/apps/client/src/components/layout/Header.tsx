import { Menu, LogOut } from 'lucide-react';
import { useChatStore } from '@/stores/chat.store';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { getUser, logout } from '@/lib/auth';

export function Header() {
  const { toggleSidebar, modelPreference, selectedAgentId } = useChatStore();
  const user = getUser();

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
    </header>
  );
}
