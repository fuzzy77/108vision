import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelative } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Download, FolderOpen, Plus, X, Shield } from 'lucide-react';
import type { LocalAgentStatus as LocalAgentStatusType, LocalAgentCapability } from '@/types';

interface LocalAgentStatusProps {
  agentStatus: LocalAgentStatusType | undefined;
  isLoading: boolean;
  onUpdateDirectories: (directories: string[]) => void;
  onToggleCapability: (capabilityId: string, enabled: boolean) => void;
}

function LocalAgentStatus({ agentStatus, isLoading, onUpdateDirectories, onToggleCapability }: LocalAgentStatusProps) {
  const [newDirectory, setNewDirectory] = useState('');
  const [editingDirs, setEditingDirs] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!agentStatus) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <WifiOff className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Agente locale non configurato</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Scarica e installa l'agente locale per abilitare l'automazione desktop.
          </p>
          <Button>
            <Download className="h-4 w-4" /> Scarica agente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isConnected = agentStatus.status === 'connected';

  function handleAddDirectory() {
    if (!newDirectory.trim() || !agentStatus) return;
    const updated = [...agentStatus.allowedDirectories, newDirectory.trim()];
    onUpdateDirectories(updated);
    setNewDirectory('');
  }

  function handleRemoveDirectory(dir: string) {
    if (!agentStatus) return;
    const updated = agentStatus.allowedDirectories.filter((d) => d !== dir);
    onUpdateDirectories(updated);
  }

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'rounded-full p-2',
                isConnected ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'
              )}>
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-emerald-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Agente locale
                  </span>
                  <Badge color={isConnected ? 'emerald' : 'red'}>
                    {isConnected ? 'Connesso' : 'Disconnesso'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                  {agentStatus.lastHeartbeat && (
                    <span>Ultimo heartbeat: {formatRelative(agentStatus.lastHeartbeat)}</span>
                  )}
                  {agentStatus.version && <span>v{agentStatus.version}</span>}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" /> Scarica agente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Capacita
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {agentStatus.capabilities.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nessuna capacita configurata</p>
          ) : (
            agentStatus.capabilities.map((cap: LocalAgentCapability) => (
              <div key={cap.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{cap.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{cap.description}</p>
                </div>
                <Switch
                  checked={cap.enabled}
                  onChange={(enabled) => onToggleCapability(cap.id, enabled)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Allowed directories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4" /> Directory consentite
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditingDirs(!editingDirs)}>
              {editingDirs ? 'Chiudi' : 'Modifica'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {agentStatus.allowedDirectories.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nessuna directory configurata</p>
          ) : (
            agentStatus.allowedDirectories.map((dir) => (
              <div key={dir} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
                <code className="text-xs text-slate-600 dark:text-slate-400">{dir}</code>
                {editingDirs && (
                  <button
                    onClick={() => handleRemoveDirectory(dir)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
          {editingDirs && (
            <div className="flex items-center gap-2 pt-2">
              <Input
                value={newDirectory}
                onChange={(e) => setNewDirectory(e.target.value)}
                placeholder="/percorso/directory"
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleAddDirectory} disabled={!newDirectory.trim()}>
                <Plus className="h-3.5 w-3.5" /> Aggiungi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Install instructions */}
      {!isConnected && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="py-4">
            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">Istruzioni di installazione</h4>
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4">
              <li>Scarica l'agente locale dal pulsante qui sopra</li>
              <li>Estrai l'archivio nella directory desiderata</li>
              <li>Esegui <code className="bg-slate-100 px-1 rounded dark:bg-slate-800">./aia-agent setup</code> e inserisci il token del tenant</li>
              <li>Avvia con <code className="bg-slate-100 px-1 rounded dark:bg-slate-800">./aia-agent start</code></li>
              <li>Lo stato si aggiornera automaticamente entro 10 secondi</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { LocalAgentStatus };
