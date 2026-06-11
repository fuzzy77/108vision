import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRelative } from '@/lib/utils';
import { Mail, MoreVertical, RefreshCw, Pencil, Trash2, Wifi, WifiOff } from 'lucide-react';
import type { EmailAccount } from '@/types';

interface EmailAccountCardProps {
  account: EmailAccount;
  onTest: (accountId: string) => void;
  onSync: (accountId: string) => void;
  onEdit: (account: EmailAccount) => void;
  onRemove: (accountId: string) => void;
  syncing?: boolean;
}

const statusConfig: Record<string, { label: string; color: 'emerald' | 'red' | 'slate'; icon: typeof Wifi }> = {
  active: { label: 'Attivo', color: 'emerald', icon: Wifi },
  error: { label: 'Errore', color: 'red', icon: WifiOff },
  disconnected: { label: 'Disconnesso', color: 'slate', icon: WifiOff },
};

const providerLabels: Record<string, string> = {
  imap: 'IMAP',
  microsoft365: 'Microsoft 365',
  google: 'Google',
};

function EmailAccountCard({ account, onTest, onSync, onEdit, onRemove, syncing }: EmailAccountCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const config = statusConfig[account.status] || statusConfig.disconnected;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="rounded-lg bg-blue-50 p-2.5 dark:bg-blue-900/30">
                {account.provider === 'microsoft365' ? (
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 21 21" fill="currentColor">
                    <rect x="1" y="1" width="9" height="9" />
                    <rect x="11" y="1" width="9" height="9" />
                    <rect x="1" y="11" width="9" height="9" />
                    <rect x="11" y="11" width="9" height="9" />
                  </svg>
                ) : (
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              {account.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {account.unreadCount > 99 ? '99+' : account.unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">{account.email}</h3>
                <Badge color={config.color}>{config.label}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span>{providerLabels[account.provider] || account.provider}</span>
                {account.lastSync && (
                  <span>Ultima sincronizzazione: {formatRelative(account.lastSync)}</span>
                )}
                {!account.lastSync && <span>Mai sincronizzato</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <StatusIcon className={`h-3.5 w-3.5 ${config.color === 'emerald' ? 'text-emerald-500' : config.color === 'red' ? 'text-red-500' : 'text-slate-400'}`} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSync(account.id)}
              disabled={syncing}
              title="Sincronizza ora"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setMenuOpen(!menuOpen)}>
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <button
                      onClick={() => { onTest(account.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Wifi className="h-4 w-4" /> Test connessione
                    </button>
                    <button
                      onClick={() => { onSync(account.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <RefreshCw className="h-4 w-4" /> Sincronizza
                    </button>
                    <button
                      onClick={() => { onEdit(account); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Pencil className="h-4 w-4" /> Modifica
                    </button>
                    <hr className="my-1 border-slate-100 dark:border-slate-700" />
                    <button
                      onClick={() => { onRemove(account.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" /> Rimuovi
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { EmailAccountCard };
