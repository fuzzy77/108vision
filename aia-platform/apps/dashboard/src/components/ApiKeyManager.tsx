import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Dialog, DialogHeader, DialogBody } from '@/components/ui/Dialog';
import { api } from '@/lib/api';
import { formatRelative } from '@/lib/utils';
import { Plus, Copy, Check, Key, Trash2, Shield } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[] | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

interface ApiKeyManagerProps {
  tenantId: string;
}

const AVAILABLE_SCOPES = [
  { id: 'chat', label: 'Chat', description: 'Accesso chat API standard' },
  { id: 'proxy', label: 'Proxy', description: 'Accesso endpoint proxy /v1/*' },
  { id: 'proxy:rag', label: 'Proxy: RAG', description: 'Injection automatica Knowledge Base nelle richieste proxy' },
  { id: 'proxy:memory', label: 'Proxy: Memory', description: 'Injection automatica memorie persistenti nelle richieste proxy' },
  { id: 'proxy:mcp', label: 'Proxy: MCP', description: 'Accesso server MCP (Knowledge Base, Memorie, Agenti)' },
];

function ApiKeyManager({ tenantId }: ApiKeyManagerProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['chat', 'proxy']);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ['api-keys', tenantId],
    queryFn: async () => {
      const result = await api.get<{ items: ApiKey[] }>(`/admin/tenants/${tenantId}/api-keys`);
      return result.items;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; scopes: string[] }) => {
      return api.post<ApiKey & { key: string }>(`/admin/tenants/${tenantId}/api-keys`, data);
    },
    onSuccess: (data) => {
      setCreatedKey(data.key);
      setNewKeyName('');
      setNewKeyScopes(['chat', 'proxy']);
      queryClient.invalidateQueries({ queryKey: ['api-keys', tenantId] });
    },
  });

  const updateScopesMutation = useMutation({
    mutationFn: async ({ keyId, scopes }: { keyId: string; scopes: string[] }) => {
      return api.patch(`/admin/tenants/${tenantId}/api-keys/${keyId}`, { scopes });
    },
    onSuccess: () => {
      setScopeDialogOpen(false);
      setEditingKey(null);
      queryClient.invalidateQueries({ queryKey: ['api-keys', tenantId] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      return api.delete(`/admin/tenants/${tenantId}/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', tenantId] });
    },
  });

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleCreate() {
    if (!newKeyName.trim()) return;
    createMutation.mutate({ name: newKeyName, scopes: newKeyScopes });
  }

  function handleOpenScopes(key: ApiKey) {
    setEditingKey(key);
    setNewKeyScopes(key.scopes ?? ['chat']);
    setScopeDialogOpen(true);
  }

  function handleSaveScopes() {
    if (!editingKey) return;
    updateScopesMutation.mutate({ keyId: editingKey.id, scopes: newKeyScopes });
  }

  function toggleScope(scopeId: string) {
    setNewKeyScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId],
    );
  }

  const activeKeys = (keys ?? []).filter((k) => !k.revokedAt);
  const revokedKeys = (keys ?? []).filter((k) => k.revokedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">API Keys</h2>
        <Button onClick={() => { setCreateDialogOpen(true); setCreatedKey(null); }}>
          <Plus className="h-4 w-4" /> Crea Key
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800" />)}
        </div>
      ) : activeKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Key className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Nessuna API key attiva</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Crea una key per abilitare l'accesso proxy da tool esterni.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Prefisso</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Ultimo uso</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                    {key.name}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {key.keyPrefix}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(key.scopes ?? ['chat']).map((scope) => (
                        <Badge key={scope} color={scope.startsWith('proxy') ? 'blue' : 'slate'}>
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                    {key.lastUsedAt ? formatRelative(key.lastUsedAt) : 'Mai'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenScopes(key)} title="Modifica scopes">
                        <Shield className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeMutation.mutate(key.id)}
                        title="Revoca"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {revokedKeys.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700">
            {revokedKeys.length} key revocate
          </summary>
          <div className="mt-2 space-y-1">
            {revokedKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-2 text-slate-400 line-through">
                <span>{key.name}</span>
                <code className="text-xs">{key.keyPrefix}...</code>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Create Key Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Crea API Key</h2>
        </DialogHeader>
        <DialogBody>
          {createdKey ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">
                  Key creata! Copiala ora — non sara piu visibile.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white dark:bg-slate-900 p-2 rounded border font-mono break-all">
                    {createdKey}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(createdKey, 'new')}>
                    {copiedId === 'new' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => setCreateDialogOpen(false)} className="w-full">Chiudi</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Nome key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="es. Cursor IDE, Claude Code, Open WebUI..."
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Scopes</label>
                <div className="space-y-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes(scope.id)}
                        onChange={() => toggleScope(scope.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{scope.label}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="flex-1">
                  Annulla
                </Button>
                <Button onClick={handleCreate} disabled={!newKeyName.trim() || createMutation.isPending} className="flex-1">
                  {createMutation.isPending ? 'Creazione...' : 'Crea Key'}
                </Button>
              </div>
            </div>
          )}
        </DialogBody>
      </Dialog>

      {/* Edit Scopes Dialog */}
      <Dialog open={scopeDialogOpen} onClose={() => setScopeDialogOpen(false)} size="md">
        <DialogHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Modifica Scopes — {editingKey?.name}
          </h2>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="space-y-2">
              {AVAILABLE_SCOPES.map((scope) => (
                <label
                  key={scope.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={newKeyScopes.includes(scope.id)}
                    onChange={() => toggleScope(scope.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{scope.label}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{scope.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setScopeDialogOpen(false)} className="flex-1">
                Annulla
              </Button>
              <Button onClick={handleSaveScopes} disabled={updateScopesMutation.isPending} className="flex-1">
                {updateScopesMutation.isPending ? 'Salvataggio...' : 'Salva Scopes'}
              </Button>
            </div>
          </div>
        </DialogBody>
      </Dialog>
    </div>
  );
}

export { ApiKeyManager };
