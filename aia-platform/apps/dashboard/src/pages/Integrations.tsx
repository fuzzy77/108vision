import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { useAllEmailAccounts, useAddEmailAccount, useTestEmailConnection, useRemoveEmailAccount, useSyncEmail, useAllCrawlJobs, useStartCrawl, useAddCrawlToKb } from '@/hooks/useIntegrations';
import { useAllLocalAgents, useLocalAgentStatus, useLocalAgentHistory, useUpdateAllowedDirectories, useToggleAgentCapability } from '@/hooks/useLocalAgent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Dialog, DialogHeader, DialogBody } from '@/components/ui/Dialog';
import { EmailAccountCard } from '@/components/integrations/EmailAccountCard';
import { EmailAccountForm } from '@/components/integrations/EmailAccountForm';
import { CrawlJobCard } from '@/components/integrations/CrawlJobCard';
import { LocalAgentStatus as LocalAgentStatusWidget } from '@/components/integrations/LocalAgentStatus';
import { formatRelative } from '@/lib/utils';
import { Mail, Globe, Monitor, Plus, Loader2 } from 'lucide-react';
import type { EmailAccount, TestEmailConnectionResult, LocalAgentAction } from '@/types';

function IntegrationsPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlMaxPages, setCrawlMaxPages] = useState('50');
  const [crawlAddToKb, setCrawlAddToKb] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string | undefined>(undefined);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Integrazioni' }]);
  }, [setBreadcrumbs]);

  const { data: emailAccounts, isLoading: emailLoading } = useAllEmailAccounts();
  const { data: crawlJobs, isLoading: crawlLoading } = useAllCrawlJobs();
  const { data: localAgents, isLoading: agentsLoading } = useAllLocalAgents();

  const addEmailMutation = useAddEmailAccount();
  const testEmailMutation = useTestEmailConnection();
  const removeEmailMutation = useRemoveEmailAccount();
  const syncEmailMutation = useSyncEmail();
  const startCrawlMutation = useStartCrawl();
  const addToKbMutation = useAddCrawlToKb();

  // Local agent for selected/first tenant
  const firstTenantId = localAgents?.[0]?.tenantId || selectedTenant;
  const { data: agentStatus, isLoading: agentStatusLoading } = useLocalAgentStatus(firstTenantId);
  const { data: agentHistory } = useLocalAgentHistory(firstTenantId);
  const updateDirsMutation = useUpdateAllowedDirectories();
  const toggleCapMutation = useToggleAgentCapability();

  function handleStartCrawl() {
    if (!crawlUrl.trim()) return;
    startCrawlMutation.mutate({
      tenantId: firstTenantId || 'default',
      url: crawlUrl,
      maxPages: parseInt(crawlMaxPages, 10) || 50,
      addToKb: crawlAddToKb,
    });
    setCrawlUrl('');
  }

  async function handleTestConnection(data: Parameters<typeof testEmailMutation.mutateAsync>[0]): Promise<TestEmailConnectionResult> {
    try {
      const result = await testEmailMutation.mutateAsync(data);
      return result;
    } catch {
      return { success: false, message: 'Errore durante il test della connessione' };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Integrazioni</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestisci account email, automazione browser e agente locale
          </p>
        </div>
      </div>

      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Account Email
            </span>
          </TabsTrigger>
          <TabsTrigger value="browser">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Browser Automation
            </span>
          </TabsTrigger>
          <TabsTrigger value="agent">
            <span className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" /> Agente Locale
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Email Accounts Tab */}
        <TabsContent value="email">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account Email</h2>
              <Button onClick={() => setAddEmailOpen(true)}>
                <Plus className="h-4 w-4" /> Aggiungi account
              </Button>
            </div>

            {emailLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            ) : !emailAccounts || emailAccounts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Nessun account email configurato</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                    Aggiungi il primo account per abilitare le integrazioni email.
                  </p>
                  <Button onClick={() => setAddEmailOpen(true)}>
                    <Plus className="h-4 w-4" /> Aggiungi account
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {emailAccounts.map((account: EmailAccount) => (
                  <EmailAccountCard
                    key={account.id}
                    account={account}
                    onTest={() => {
                      testEmailMutation.mutate({
                        provider: account.provider,
                        email: account.email,
                        config: account.config,
                      });
                    }}
                    onSync={(id) => syncEmailMutation.mutate(id)}
                    onEdit={() => {}}
                    onRemove={(id) => removeEmailMutation.mutate(id)}
                    syncing={syncEmailMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Browser Automation Tab */}
        <TabsContent value="browser">
          <div className="space-y-6">
            {/* Crawl form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Crawla sito web</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label="URL del sito"
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                      placeholder="https://www.esempio.it"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label="Max pagine"
                      type="number"
                      value={crawlMaxPages}
                      onChange={(e) => setCrawlMaxPages(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <input
                      type="checkbox"
                      id="add-to-kb"
                      checked={crawlAddToKb}
                      onChange={(e) => setCrawlAddToKb(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600"
                    />
                    <label htmlFor="add-to-kb" className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      Aggiungi a KB
                    </label>
                  </div>
                  <Button onClick={handleStartCrawl} disabled={!crawlUrl.trim() || startCrawlMutation.isPending}>
                    {startCrawlMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    Avvia crawl
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Crawl jobs list */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Crawl recenti</h2>
              {crawlLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                </div>
              ) : !crawlJobs || crawlJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Globe className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Nessun crawl eseguito. Inserisci un URL per iniziare.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {crawlJobs.map((job) => (
                    <CrawlJobCard
                      key={job.id}
                      job={job}
                      onAddToKb={(id) => addToKbMutation.mutate(id)}
                      addingToKb={addToKbMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Local Agent Tab */}
        <TabsContent value="agent">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Stato agente</h2>
                <LocalAgentStatusWidget
                  agentStatus={agentStatus}
                  isLoading={agentStatusLoading}
                  onUpdateDirectories={(dirs) => {
                    if (firstTenantId) {
                      updateDirsMutation.mutate({ tenantId: firstTenantId, directories: dirs });
                    }
                  }}
                  onToggleCapability={(capId, enabled) => {
                    if (firstTenantId) {
                      toggleCapMutation.mutate({ tenantId: firstTenantId, capabilityId: capId, enabled });
                    }
                  }}
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Azioni recenti</h2>
                {!agentHistory || agentHistory.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Monitor className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Nessuna azione recente dell'agente locale.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Azione</TableHead>
                          <TableHead>Rischio</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agentHistory.map((action: LocalAgentAction) => (
                          <TableRow key={action.id}>
                            <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {action.action}
                            </TableCell>
                            <TableCell>
                              <Badge color={
                                action.riskLevel === 'high_risk' ? 'red' :
                                action.riskLevel === 'low_risk' ? 'amber' : 'slate'
                              }>
                                {action.riskLevel === 'high_risk' ? 'Alto' :
                                 action.riskLevel === 'low_risk' ? 'Basso' : 'Lettura'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge color={
                                action.status === 'success' ? 'emerald' :
                                action.status === 'failed' ? 'red' : 'amber'
                              }>
                                {action.status === 'success' ? 'Successo' :
                                 action.status === 'failed' ? 'Fallito' : 'Rifiutato'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                              {formatRelative(action.timestamp)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Email Dialog */}
      <Dialog open={addEmailOpen} onClose={() => setAddEmailOpen(false)} size="lg">
        <DialogHeader>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Aggiungi account email</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configura un nuovo account email per le integrazioni.
          </p>
        </DialogHeader>
        <DialogBody>
          <EmailAccountForm
            onSubmit={(data) => {
              addEmailMutation.mutate(
                { ...data, tenantId: firstTenantId || 'default' },
                { onSuccess: () => setAddEmailOpen(false) },
              );
            }}
            onTestConnection={handleTestConnection}
            onCancel={() => setAddEmailOpen(false)}
            isSubmitting={addEmailMutation.isPending}
            isTesting={testEmailMutation.isPending}
          />
        </DialogBody>
      </Dialog>
    </div>
  );
}

export { IntegrationsPage };
