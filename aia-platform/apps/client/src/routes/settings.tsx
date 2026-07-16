import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sun, Moon, Monitor } from 'lucide-react';
import { useChatStore } from '@/stores/chat.store';
import { useAgents } from '@/hooks/useAgents';
import { Button } from '@/components/ui/Button';

type ThemeMode = 'light' | 'dark' | 'system';

function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem('aia_theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];


export function SettingsPage() {
  const { selectedAgentId, selectAgent } = useChatStore();
  const { agents } = useAgents();
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem('aia_notifications') !== 'false';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('aia_theme', theme);
  }, [theme]);

  const handleNotificationsToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('aia_notifications', String(newValue));
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
            <SettingsIcon className="w-5 h-5" />
            Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Customize your AIA experience.
          </p>
        </div>

        <section>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Theme
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                  aria-pressed={isActive}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`} />
                  <span className={`text-sm ${isActive ? 'font-medium text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Default Agent
          </h3>
          {agents.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No agents available
            </p>
          ) : (
            <select
              value={selectedAgentId ?? ''}
              onChange={(e) => selectAgent(e.target.value)}
              className="
                w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-800 text-sm
                text-slate-900 dark:text-slate-100
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              "
              aria-label="Select default agent"
            >
              <option value="">Select an agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          )}
        </section>

        <section>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Notifications
          </h3>
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Push Notifications
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive notifications when your AI responds
              </p>
            </div>
            <Button
              variant={notifications ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleNotificationsToggle}
              aria-pressed={notifications}
            >
              {notifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
