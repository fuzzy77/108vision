import { Link, useNavigate } from '@tanstack/react-router';
import { Plus, MessageSquare, BookOpen, Settings, X, Trash2 } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useChatStore } from '@/stores/chat.store';
import { formatDate, truncate } from '@/lib/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function Sidebar() {
  const { conversations, isLoading, deleteConversation } = useConversations();
  const { sidebarOpen, setSidebarOpen } = useChatStore();
  const navigate = useNavigate();

  const handleNewChat = () => {
    setSidebarOpen(false);
    navigate({ to: '/' });
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConversation(id);
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-700
          flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-lg font-semibold text-primary-600 dark:text-primary-400">
            AIA
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">
              No conversations yet
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <Link
                    to="/chat/$conversationId"
                    params={{ conversationId: conv.id }}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                    activeProps={{ className: 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300' }}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-slate-700 dark:text-slate-200">
                        {truncate(conv.title, 30)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatDate(conv.lastMessageAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-opacity"
                      aria-label={`Delete conversation: ${conv.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-1">
          <Link
            to="/knowledge"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            activeProps={{ className: 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300' }}
          >
            <BookOpen className="w-4 h-4" />
            Knowledge Base
          </Link>
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            activeProps={{ className: 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300' }}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
