import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/ui.store';
import { useTenant, useTenantAgents, useTenantDocuments, useTenantConversations, useConversationMessages, useTenantUsers, useInviteTenantUser, useUpdateTenantUser, useRemoveTenantUser } from '@/hooks/useTenants';
import { useTenantUsage } from '@/hooks/useUsage';
import { useGraphEntities } from '@/hooks/useGraph';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { UsageChart } from '@/components/UsageChart';
import { ModelBreakdown } from '@/components/ModelBreakdown';
import { ConversationBrowser } from '@/components/ConversationBrowser';
import { GraphCanvas, type GraphNode, type GraphEdge } from '@/components/graph/GraphCanvas';
import { GraphStats } from '@/components/graph/GraphStats';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { STATUS_COLORS, PLAN_TYPES, type PlanType } from '@/lib/constants';
import { formatCurrency, formatDate, formatRelative, formatTokens, navigate } from '@/lib/utils';
import { uploadForTenant } from '@/lib/api';
import { Bot, FileText, MessageSquare, Plus, Upload, Settings, AlertTriangle, ExternalLink, Pencil, Network, Monitor, Loader2, Users, UserPlus, Trash2, Shield } from 'lucide-react';
import { DesktopMonitor } from '@/components/desktop/DesktopMonitor';
import type { Message, TenantUser } from '@/types';

interface TenantDetailPageProps {
  tenantId: string;
}

const statusLabels: Record<string, string> = {
  active: 'Attivo',
  inactive: 'Inattivo',
  trial: 'Trial',
  suspended: 'Sospeso',
  cancelled: 'Cancellato',
};

function TenantDetailPage({ tenantId }: TenantDetailPageProps) {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const { data: tenant, isLoading } = useTenant(tenantId);
  const { data: agents, isLoading: agentsLoading } = useTenantAgents(tenantId);
  const { data: documents, isLoading: docsLoading } = useTenantDocuments(tenantId);
  const { data: conversations, isLoading: convsLoading } = useTenantConversations(tenantId);
  const { data: usage, isLoading: usageLoading } = useTenantUsage(tenantId);
  const [loadedMessages, setLoadedMessages] = useState<Record<string, Message[]>>({});
  const [expandedConv, setExpandedConv] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: messages } = useConversationMessages(expandedConv);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !tenantId) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadForTenant(tenantId, '/knowledge/upload', file);
      }
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId, 'documents'] });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Errore durante il caricamento');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  useEffect(() => {
    if (messages && expandedConv) {
      setLoadedMessages((prev) => ({ ...prev, [expandedConv]: messages }));
    }
  }, [messages, expandedConv]);

  useEffect(() => {
    if (tenant) {
      setBreadcrumbs([
        { label: 'Clienti', href: '/tenants' },
        { label: tenant.name },
      ]);
    }
  }, [tenant, setBreadcrumbs]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400">Cliente non trovato</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/tenants')}>
          Torna alla lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={tenant.name} size="lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tenant.name}</h1>
              <Badge color={(STATUS_COLORS[tenant.status as TenantStatus] ?? 'slate') as 'emerald' | 'slate' | 'amber' | 'red'}>
                {statusLabels[tenant.status] ?? tenant.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {tenant.sector}
              {tenant.plan ? ` · Piano ${PLAN_TYPES[tenant.plan as PlanType]?.label ?? tenant.plan}` : ''}
              {' · Dal '}{formatDate(tenant.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/agents/new?tenant=${tenantId}`)}>
            <Plus className="h-4 w-4" /> Nuovo agente
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4" /> Impostazioni
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="agents">Agenti</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="graph">Grafo</TabsTrigger>
          <TabsTrigger value="conversations">Conversazioni</TabsTrigger>
          <TabsTrigger value="usage">Utilizzo</TabsTrigger>
          <TabsTrigger value="users">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Utenti
            </span>
          </TabsTrigger>
          <TabsTrigger value="desktop">
            <span className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </span>
          </TabsTrigger>
          <TabsTrigger value="settings">Impostazioni</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-50 p-2.5 dark:bg-primary-900/30">
                    <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tenant.agentsCount}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Agenti attivi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 dark:bg-blue-900/30">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tenant.documentsCount}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Documenti caricati</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-900/30">
                    <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tenant.conversationsThisMonth}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Conversazioni mese</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informazioni</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Referente</span>
                  <span className="text-slate-900 dark:text-slate-100">{tenant.contactName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Email</span>
                  <span className="text-slate-900 dark:text-slate-100">{tenant.contactEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Costo mensile</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(tenant.monthlyCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Revenue mensile</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(tenant.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Ultima attivita</span>
                  <span className="text-slate-900 dark:text-slate-100">{formatRelative(tenant.lastActivity)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agenti</CardTitle>
              </CardHeader>
              <CardContent>
                {agentsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : agents?.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4 dark:text-slate-400">Nessun agente configurato</p>
                ) : (
                  <div className="space-y-2">
                    {agents?.slice(0, 5).map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{agent.name}</span>
                        </div>
                        <span className="text-xs text-slate-400">{agent.conversationsCount} conv</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Agenti</h2>
            <Button onClick={() => navigate(`/agents/new?tenant=${tenantId}`)}>
              <Plus className="h-4 w-4" /> Nuovo agente
            </Button>
          </div>
          {agentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : agents?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bot className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Nessun agente configurato per questo cliente</p>
                <Button onClick={() => navigate(`/agents/new?tenant=${tenantId}`)}>
                  <Plus className="h-4 w-4" /> Crea il primo agente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {agents?.map((agent) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary-50 p-2.5 dark:bg-primary-900/30">
                          <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-slate-900 dark:text-slate-100">{agent.name}</h3>
                            {!agent.isActive && <Badge color="slate">Disattivo</Badge>}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{agent.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span>{agent.conversationsCount} conversazioni</span>
                            <span>{agent.modelPreference}</span>
                            {agent.lastUsed && <span>Ultimo uso: {formatRelative(agent.lastUsed)}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/agents/${agent.id}`)}>
                          <Pencil className="h-3.5 w-3.5" /> Modifica
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" /> Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".txt,.md,.pdf,.docx,.doc,.csv,.json"
            onChange={handleFileUpload}
          />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Knowledge Base</h2>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Caricamento...' : 'Carica documenti'}
            </Button>
          </div>
          {uploadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
              {uploadError}
            </div>
          )}
          {docsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : documents?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Nessun documento nella knowledge base</p>
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Caricamento...' : 'Carica il primo documento'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Collezione</TableHead>
                    <TableHead className="text-center">Chunks</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Caricato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents?.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">{doc.collectionName}</TableCell>
                      <TableCell className="text-center text-sm text-slate-600 dark:text-slate-400">{doc.chunksCount}</TableCell>
                      <TableCell>
                        <Badge color={doc.status === 'ready' ? 'emerald' : doc.status === 'processing' ? 'amber' : 'red'}>
                          {doc.status === 'ready' ? 'Pronto' : doc.status === 'processing' ? 'In elaborazione' : 'Errore'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400">{formatDate(doc.uploadedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Graph Tab */}
        <TabsContent value="graph">
          <GraphTabContent tenantId={tenantId} />
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Conversazioni</h2>
          </div>
          <ConversationBrowser
            conversations={conversations?.data || []}
            messages={loadedMessages}
            onExpand={(id) => setExpandedConv(id)}
            loading={convsLoading}
          />
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Costo giornaliero (ultimi 30 giorni)</CardTitle>
                </CardHeader>
                <CardContent>
                  {usageLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <UsageChart
                      data={(usage?.byDay || []).map((d) => ({ date: d.date, value: d.cost }))}
                      color="#4f46e5"
                      label="Costo"
                      formatValue={(v) => formatCurrency(v)}
                    />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuzione per modello</CardTitle>
                </CardHeader>
                <CardContent>
                  {usageLoading ? (
                    <Skeleton className="h-[280px] w-full" />
                  ) : (
                    <ModelBreakdown data={usage?.byModel || []} type="cost" />
                  )}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Token giornalieri</CardTitle>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <UsageChart
                    data={(usage?.byDay || []).map((d) => ({ date: d.date, value: d.tokens }))}
                    color="#10b981"
                    label="Token"
                    formatValue={(v) => formatTokens(v)}
                    height={250}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <UsersTabContent tenantId={tenantId} />
        </TabsContent>

        {/* Desktop Tab */}
        <TabsContent value="desktop">
          <DesktopMonitor tenantId={tenantId} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informazioni generali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Nome azienda" defaultValue={tenant.name} />
                <Select
                  label="Piano"
                  options={[
                    { value: 'starter', label: 'Starter' },
                    { value: 'professional', label: 'Professional' },
                    { value: 'enterprise', label: 'Enterprise' },
                  ]}
                  defaultValue={tenant.plan}
                />
                <Input label="Email referente" defaultValue={tenant.contactEmail} />
                <Button>Salva modifiche</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alert budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Soglia di allarme mensile"
                  type="number"
                  defaultValue={String(tenant.config.budgetAlert || '')}
                  helperText="Ricevi una notifica quando il costo supera questa soglia"
                />
                <Button variant="outline">Configura alert</Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-base text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Zona pericolosa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Disattiva cliente</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Il cliente non potra piu usare gli agenti</p>
                  </div>
                  <Switch checked={tenant.status !== 'active'} onChange={() => {}} />
                </div>
                <Button variant="destructive" size="sm">Elimina cliente</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Users Tab Content ---

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  tenant_admin: 'Admin',
  tenant_operator: 'Operatore',
  client_user: 'Utente',
};

const ROLE_COLORS: Record<string, 'emerald' | 'amber' | 'slate' | 'red'> = {
  platform_admin: 'red',
  tenant_admin: 'emerald',
  tenant_operator: 'amber',
  client_user: 'slate',
};

function UsersTabContent({ tenantId }: { tenantId: string }) {
  const { data: users, isLoading } = useTenantUsers(tenantId);
  const inviteMutation = useInviteTenantUser(tenantId);
  const updateMutation = useUpdateTenantUser(tenantId);
  const removeMutation = useRemoveTenantUser(tenantId);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'tenant_admin' | 'tenant_operator' | 'client_user'>('client_user');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'tenant_admin' | 'tenant_operator' | 'client_user'>('client_user');

  async function handleInvite() {
    if (!inviteEmail || !inviteName) return;
    setInviteError(null);
    try {
      await inviteMutation.mutateAsync({ email: inviteEmail, name: inviteName, role: inviteRole });
      setInviteEmail('');
      setInviteName('');
      setInviteRole('client_user');
      setShowInviteForm(false);
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Errore durante l\'invito');
    }
  }

  async function handleEditRole(user: TenantUser) {
    try {
      await updateMutation.mutateAsync({ userId: user.id, role: editRole });
      setEditingUserId(null);
    } catch {
      // silently ignore — query will not update on failure
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Rimuovere questo utente dal tenant?')) return;
    try {
      await removeMutation.mutateAsync(userId);
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Utenti</h2>
        <Button onClick={() => setShowInviteForm((v) => !v)}>
          <UserPlus className="h-4 w-4" /> Invita utente
        </Button>
      </div>

      {/* Invite form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Invita nuovo utente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inviteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
                {inviteError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Nome"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Mario Rossi"
              />
              <Input
                label="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="mario@azienda.it"
              />
              <Select
                label="Ruolo"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                options={[
                  { value: 'tenant_admin', label: 'Admin' },
                  { value: 'tenant_operator', label: 'Operatore' },
                  { value: 'client_user', label: 'Utente' },
                ]}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInvite} disabled={inviteMutation.isPending || !inviteEmail || !inviteName}>
                {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {inviteMutation.isPending ? 'Invio...' : 'Aggiungi utente'}
              </Button>
              <Button variant="outline" onClick={() => { setShowInviteForm(false); setInviteError(null); }}>
                Annulla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !users?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Nessun utente in questo tenant</p>
            <Button onClick={() => setShowInviteForm(true)}>
              <UserPlus className="h-4 w-4" /> Invita il primo utente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Ultimo accesso</TableHead>
                <TableHead>Creato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={user.name ?? user.email} size="sm" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user.name ?? '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">{user.email}</TableCell>
                  <TableCell>
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as typeof editRole)}
                          options={[
                            { value: 'tenant_admin', label: 'Admin' },
                            { value: 'tenant_operator', label: 'Operatore' },
                            { value: 'client_user', label: 'Utente' },
                          ]}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditRole(user)}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Salva'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingUserId(null)}>
                          Annulla
                        </Button>
                      </div>
                    ) : (
                      <Badge color={ROLE_COLORS[user.role] ?? 'slate'}>
                        <Shield className="h-3 w-3 mr-1 inline" />
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                    {user.lastLoginAt ? formatRelative(user.lastLoginAt) : 'Mai'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingUserId(user.id);
                          setEditRole(user.role as typeof editRole);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(user.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// --- Graph Tab Content ---

function GraphTabContent({ tenantId }: { tenantId: string }) {
  const { data: entities, isLoading: graphLoading } = useGraphEntities(tenantId, { limit: 20 });

  // Convert entities to mini-graph preview nodes
  const previewNodes: GraphNode[] = (entities ?? []).map((e) => ({
    id: e.id,
    label: e.name,
    type: e.type,
    connections: e.connections,
  }));

  // No edges available in the list endpoint; show nodes only in preview
  const previewEdges: GraphEdge[] = [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Grafo della conoscenza</h2>
        <Button onClick={() => navigate(`/graph/${tenantId}`)}>
          <Network className="h-4 w-4" /> Apri Explorer
        </Button>
      </div>

      {/* Stats */}
      <GraphStats tenantId={tenantId} />

      {/* Mini graph preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anteprima grafo</CardTitle>
        </CardHeader>
        <CardContent>
          {graphLoading ? (
            <Skeleton className="h-[300px] w-full rounded-xl" />
          ) : previewNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px]">
              <Network className="h-10 w-10 mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Nessuna entita estratta. Carica documenti nella Knowledge Base per popolare il grafo.
              </p>
            </div>
          ) : (
            <GraphCanvas
              nodes={previewNodes}
              edges={previewEdges}
              onNodeSelect={() => {}}
              onNodeExpand={() => navigate(`/graph/${tenantId}`)}
              width={700}
              height={300}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { TenantDetailPage };
