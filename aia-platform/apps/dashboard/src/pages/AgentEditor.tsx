import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import { AgentTestChat } from '@/components/AgentTestChat';
import { MODEL_TIERS, AGENT_CATEGORIES } from '@/lib/constants';
import { navigate } from '@/lib/utils';
import { useTenant, useTenantCollections } from '@/hooks/useTenants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiForTenant } from '@/lib/api';
import type { Agent } from '@/types';
import { Save, X, Bot } from 'lucide-react';
import { PrinciplesPanel } from '@/components/PrinciplesPanel';

interface AgentEditorPageProps {
  agentId?: string;
  tenantId?: string;
}

const AVAILABLE_TOOLS = [
  { id: 'web_search', label: 'Ricerca web' },
  { id: 'document_qa', label: 'Q&A documenti' },
  { id: 'email_send', label: 'Invio email' },
  { id: 'calendar_read', label: 'Lettura calendario' },
  { id: 'calendar_write', label: 'Scrittura calendario' },
  { id: 'crm_read', label: 'Lettura CRM' },
  { id: 'crm_write', label: 'Scrittura CRM' },
  { id: 'code_interpreter', label: 'Interprete codice' },
];

function AgentEditorPage({ agentId, tenantId }: AgentEditorPageProps) {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const queryClient = useQueryClient();

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agents', agentId],
    queryFn: () => {
      // Tenant-scoped agent detail requires X-Tenant-ID.
      // At this point tenantId may not yet be known; we use the effectiveTenantId once
      // set, or fall back to a plain get (gateway will reject without tenant header —
      // this is a loading edge case resolved once tenant is available).
      if (tenantId) {
        return apiForTenant<Agent>(tenantId, `/agents/${agentId}`);
      }
      return api.get<Agent>(`/agents/${agentId}`);
    },
    enabled: !!agentId,
  });

  const effectiveTenantId = tenantId || agent?.tenantId;
  const { data: tenant } = useTenant(effectiveTenantId);
  const { data: collections } = useTenantCollections(effectiveTenantId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelPreference, setModelPreference] = useState<string>('balanced');
  const [temperature, setTemperature] = useState(0.7);
  const [category, setCategory] = useState('general');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [enabledTools, setEnabledTools] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [principlesOverrides, setPrinciplesOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description);
      setSystemPrompt(agent.systemPrompt);
      setModelPreference(agent.modelPreference);
      setTemperature(agent.temperature);
      setCategory(agent.category);
      setSelectedCollections(agent.knowledgeCollections);
      setEnabledTools(agent.tools);
      setIsActive(agent.isActive);
      const config = (agent as unknown as { config?: { principlesOverrides?: Record<string, boolean> } }).config;
      if (config?.principlesOverrides) {
        setPrinciplesOverrides(config.principlesOverrides);
      }
    }
  }, [agent]);

  useEffect(() => {
    const crumbs = [{ label: 'Clienti', href: '/tenants' }];
    if (tenant) {
      crumbs.push({ label: tenant.name, href: `/tenants/${tenant.id}` });
    }
    crumbs.push({ label: agentId ? 'Modifica agente' : 'Nuovo agente' });
    setBreadcrumbs(crumbs);
  }, [tenant, agentId, setBreadcrumbs]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Agent>) => {
      const tid = effectiveTenantId;
      if (!tid) throw new Error('Nessun tenant selezionato');
      const { getToken } = await import('@/lib/auth');
      const token = getToken();
      const url = agentId ? `/api/agents/${agentId}` : `/api/agents`;
      const res = await fetch(url, {
        method: agentId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tid,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(agentId ? data : { ...data, tenantId: tid }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `Errore ${res.status}`);
      }
      return res.json() as Promise<Agent>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['tenants', effectiveTenantId, 'agents'] });
      navigate(`/tenants/${effectiveTenantId}`);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      name,
      description,
      systemPrompt,
      modelPreference: modelPreference as Agent['modelPreference'],
      temperature,
      category: category as Agent['category'],
      knowledgeCollections: selectedCollections,
      tools: enabledTools,
      isActive,
      config: { principlesOverrides },
    } as Partial<Agent>);
  };

  const handleTestMessage = async (message: string): Promise<string> => {
    const tid = effectiveTenantId;
    if (!tid) throw new Error('Nessun tenant selezionato');
    // Use the /api/chat endpoint (tenant-scoped) with a test system prompt.
    // This requires an agentId; for new agents without an id, we use the test endpoint if available,
    // otherwise fall back to a synthetic response indicating the agent isn't saved yet.
    if (!agentId) {
      return `[Test non disponibile per nuovi agenti non salvati. Salva prima l'agente, poi testalo.]`;
    }
    const { getToken } = await import('@/lib/auth');
    const token = getToken();
    const res = await fetch(`/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tid,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ agentId, message }),
    });
    if (!res.ok) {
      throw new Error(`Errore ${res.status}`);
    }
    const data = await res.json() as { content?: string; message?: string; reply?: string };
    return data.content ?? data.message ?? data.reply ?? '(nessuna risposta)';
  };

  if (isLoading && agentId) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[600px] rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-50 p-2.5 dark:bg-primary-900/30">
            <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {agentId ? 'Modifica agente' : 'Nuovo agente'}
            </h1>
            {tenant && <p className="text-sm text-slate-500 dark:text-slate-400">per {tenant.name}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            <X className="h-4 w-4" /> Annulla
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || !name.trim()}>
            <Save className="h-4 w-4" /> {saveMutation.isPending ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Errore nel salvataggio: {saveMutation.error?.message || 'Riprova'}
        </div>
      )}

      {/* Main content: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Configuration (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informazioni base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nome agente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Assistente Clienti"
              />
              <Input
                label="Descrizione"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Una breve descrizione del ruolo dell'agente"
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Categoria"
                  options={AGENT_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <div className="flex items-end">
                  <Switch
                    checked={isActive}
                    onChange={setIsActive}
                    label="Attivo"
                    description="L'agente puo ricevere messaggi"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <PrinciplesPanel
            overrides={principlesOverrides}
            onChange={setPrinciplesOverrides}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Sei un assistente utile per... Rispondi in modo professionale e cortese..."
                className="min-h-[200px] font-mono text-sm"
                maxLength={8000}
                showCount
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                I principi di governance vengono automaticamente preposti al tuo system prompt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modello e parametri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select
                label="Preferenza modello"
                options={Object.entries(MODEL_TIERS).map(([key, val]) => ({
                  value: key,
                  label: `${val.label} — ${val.description}`,
                }))}
                value={modelPreference}
                onChange={(e) => setModelPreference(e.target.value)}
              />
              <Slider
                label="Temperature"
                value={temperature}
                onChange={setTemperature}
                min={0}
                max={2}
                step={0.1}
                showValue
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              {collections?.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nessuna collezione disponibile. Carica prima dei documenti.</p>
              ) : (
                <div className="space-y-2">
                  {collections?.map((col) => (
                    <label key={col.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-700/50">
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(col.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollections([...selectedCollections, col.id]);
                          } else {
                            setSelectedCollections(selectedCollections.filter((id) => id !== col.id));
                          }
                        }}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{col.name}</span>
                        <span className="text-xs text-slate-400 ml-2">({col.documentsCount} documenti)</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Strumenti abilitati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_TOOLS.map((tool) => (
                  <label key={tool.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-700/50">
                    <input
                      type="checkbox"
                      checked={enabledTools.includes(tool.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEnabledTools([...enabledTools, tool.id]);
                        } else {
                          setEnabledTools(enabledTools.filter((id) => id !== tool.id));
                        }
                      }}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{tool.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Test panel (2/5) */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <AgentTestChat
              agentName={name || 'Nuovo agente'}
              onSendMessage={handleTestMessage}
              className="h-[600px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { AgentEditorPage };
