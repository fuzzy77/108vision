import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { useCreateOnboarding } from '@/hooks/useOnboarding';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { TENANT_SECTORS, USE_CASES, MODEL_TIERS } from '@/lib/constants';
import { cn, navigate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check, Upload, Plus, Trash2, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';

const STEPS = [
  'Info azienda',
  'Use case',
  'Agenti',
  'Knowledge Base',
  'Invita utenti',
  'Riepilogo',
];

function OnboardingPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const {
    currentStep,
    data,
    nextStep,
    prevStep,
    updateCompany,
    setUseCases,
    setAgents,
    setDocuments,
    setCrawlUrls,
    setUsers,
    reset,
  } = useOnboardingStore();

  const createOnboarding = useCreateOnboarding();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Clienti', href: '/tenants' }, { label: 'Nuovo cliente' }]);
  }, [setBreadcrumbs]);

  const handleFinish = () => {
    createOnboarding.mutate(data, {
      onSuccess: () => {
        reset();
        navigate('/tenants');
      },
    });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!(data.company.name && data.company.sector && data.company.contactEmail);
      case 1:
        return data.useCases.length > 0;
      case 2:
        return data.agents.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Onboarding nuovo cliente</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Step {currentStep + 1} di {STEPS.length}: {STEPS[currentStep]}
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={((currentStep + 1) / STEPS.length) * 100} />
        <div className="flex justify-between">
          {STEPS.map((step, idx) => (
            <span
              key={step}
              className={cn(
                'text-xs',
                idx <= currentStep ? 'text-primary-600 font-medium dark:text-primary-400' : 'text-slate-400',
              )}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 0 && <StepCompany data={data.company} onUpdate={updateCompany} />}
          {currentStep === 1 && <StepUseCases selected={data.useCases} onUpdate={setUseCases} />}
          {currentStep === 2 && <StepAgents agents={data.agents} useCases={data.useCases} onUpdate={setAgents} />}
          {currentStep === 3 && <StepKnowledge documents={data.documents} crawlUrls={data.crawlUrls} onUpdateDocs={setDocuments} onUpdateUrls={setCrawlUrls} />}
          {currentStep === 4 && <StepUsers users={data.users} onUpdate={setUsers} />}
          {currentStep === 5 && <StepSummary data={data} />}
        </CardContent>
      </Card>

      {/* Error */}
      {createOnboarding.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Errore durante la creazione: {createOnboarding.error?.message || 'Riprova'}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
          <ChevronLeft className="h-4 w-4" /> Indietro
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Avanti <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={createOnboarding.isPending}>
            <Check className="h-4 w-4" /> {createOnboarding.isPending ? 'Creazione...' : 'Attiva cliente'}
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Company info
interface CompanyData {
  name: string;
  sector: string;
  size: string;
  contactName: string;
  contactEmail: string;
}

function StepCompany({ data, onUpdate }: { data: CompanyData; onUpdate: (d: Partial<CompanyData>) => void }) {
  return (
    <div className="space-y-4">
      <Input
        label="Nome azienda"
        value={data.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="es. Studio Rossi & Associati"
      />
      <Select
        label="Settore"
        options={TENANT_SECTORS.map((s) => ({ value: s, label: s }))}
        value={data.sector}
        onChange={(e) => onUpdate({ sector: e.target.value })}
        placeholder="Seleziona settore"
      />
      <Select
        label="Dimensione azienda"
        options={[
          { value: '1-5', label: '1-5 dipendenti' },
          { value: '6-20', label: '6-20 dipendenti' },
          { value: '21-50', label: '21-50 dipendenti' },
          { value: '51-200', label: '51-200 dipendenti' },
          { value: '200+', label: 'Oltre 200 dipendenti' },
        ]}
        value={data.size}
        onChange={(e) => onUpdate({ size: e.target.value })}
        placeholder="Seleziona dimensione"
      />
      <Input
        label="Nome referente"
        value={data.contactName}
        onChange={(e) => onUpdate({ contactName: e.target.value })}
        placeholder="Mario Rossi"
      />
      <Input
        label="Email referente"
        type="email"
        value={data.contactEmail}
        onChange={(e) => onUpdate({ contactEmail: e.target.value })}
        placeholder="mario@azienda.it"
      />
    </div>
  );
}

// Step 2: Use cases
function StepUseCases({ selected, onUpdate }: { selected: string[]; onUpdate: (v: string[]) => void }) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onUpdate(selected.filter((s) => s !== id));
    } else {
      onUpdate([...selected, id]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">Seleziona i casi d&apos;uso che il cliente vuole implementare</p>
      <div className="grid grid-cols-2 gap-3">
        {USE_CASES.map((uc) => (
          <button
            key={uc.id}
            onClick={() => toggle(uc.id)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
              selected.includes(uc.id)
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
              selected.includes(uc.id)
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
            )}>
              {selected.includes(uc.id) ? <Check className="h-4 w-4" /> : null}
            </div>
            <span className={cn(
              'text-sm font-medium',
              selected.includes(uc.id) ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300',
            )}>
              {uc.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 3: Agents
function StepAgents({ agents, useCases, onUpdate }: { agents: Partial<import('@/types').Agent>[]; useCases: string[]; onUpdate: (a: Partial<import('@/types').Agent>[]) => void }) {
  const addAgent = () => {
    const useCaseLabel = USE_CASES.find((uc) => uc.id === useCases[agents.length % useCases.length])?.label || 'Generale';
    onUpdate([
      ...agents,
      {
        name: `Agente ${useCaseLabel}`,
        description: `Assistente per ${useCaseLabel.toLowerCase()}`,
        systemPrompt: `Sei un assistente AI specializzato in ${useCaseLabel.toLowerCase()}. Rispondi in modo professionale e cortese in italiano.`,
        modelPreference: 'balanced',
        temperature: 0.7,
      },
    ]);
  };

  const removeAgent = (index: number) => {
    onUpdate(agents.filter((_, i) => i !== index));
  };

  const updateAgent = (index: number, updates: Partial<import('@/types').Agent>) => {
    onUpdate(agents.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  };

  useEffect(() => {
    if (agents.length === 0 && useCases.length > 0) {
      addAgent();
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">Configura gli agenti per il cliente</p>
        <Button variant="outline" size="sm" onClick={addAgent}>
          <Plus className="h-3.5 w-3.5" /> Aggiungi agente
        </Button>
      </div>
      <div className="space-y-4">
        {agents.map((agent, idx) => (
          <div key={idx} className="p-4 rounded-lg border border-slate-200 space-y-3 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Agente {idx + 1}</span>
              <Button variant="ghost" size="sm" onClick={() => removeAgent(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
            <Input
              label="Nome"
              value={agent.name || ''}
              onChange={(e) => updateAgent(idx, { name: e.target.value })}
            />
            <Textarea
              label="System prompt"
              value={agent.systemPrompt || ''}
              onChange={(e) => updateAgent(idx, { systemPrompt: e.target.value })}
              className="min-h-[100px] text-sm font-mono"
            />
            <Select
              label="Modello"
              options={Object.entries(MODEL_TIERS).map(([key, val]) => ({ value: key, label: val.label }))}
              value={agent.modelPreference || 'balanced'}
              onChange={(e) => updateAgent(idx, { modelPreference: e.target.value as import('@/types').Agent['modelPreference'] })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 4: Knowledge Base
function StepKnowledge({ documents, crawlUrls, onUpdateDocs, onUpdateUrls }: { documents: File[]; crawlUrls: string[]; onUpdateDocs: (f: File[]) => void; onUpdateUrls: (u: string[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newUrl, setNewUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpdateDocs([...documents, ...Array.from(e.target.files)]);
    }
  };

  const addUrl = () => {
    if (newUrl.trim()) {
      onUpdateUrls([...crawlUrls, newUrl.trim()]);
      setNewUrl('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3 dark:text-slate-300">Carica documenti</p>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors dark:border-slate-600 dark:hover:border-primary-500"
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Clicca o trascina file qui</p>
          <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT, MD (max 10MB per file)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        {documents.length > 0 && (
          <div className="mt-3 space-y-1">
            {documents.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span>
                <button
                  onClick={() => onUpdateDocs(documents.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-3 dark:text-slate-300">URL da indicizzare</p>
        <div className="flex gap-2">
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://www.azienda.it/faq"
            className="flex-1"
          />
          <Button variant="outline" onClick={addUrl} disabled={!newUrl.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {crawlUrls.length > 0 && (
          <div className="mt-3 space-y-1">
            {crawlUrls.map((url, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span className="text-sm text-slate-700 truncate dark:text-slate-300">{url}</span>
                <button
                  onClick={() => onUpdateUrls(crawlUrls.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Step 5: Users
function StepUsers({ users, onUpdate }: { users: { email: string; role: string }[]; onUpdate: (u: { email: string; role: string }[]) => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');

  const addUser = () => {
    if (email.trim()) {
      onUpdate([...users, { email: email.trim(), role }]);
      setEmail('');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Invita gli utenti che potranno accedere alla piattaforma per questo cliente
      </p>
      <div className="flex gap-2">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@azienda.it"
          className="flex-1"
        />
        <Select
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'Utente' },
          ]}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-32"
        />
        <Button variant="outline" onClick={addUser} disabled={!email.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {users.length > 0 && (
        <div className="space-y-1">
          {users.map((user, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-700 dark:text-slate-300">{user.email}</span>
                <Badge color={user.role === 'admin' ? 'purple' : 'slate'}>{user.role}</Badge>
              </div>
              <button
                onClick={() => onUpdate(users.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400">
        Gli utenti riceveranno un invito via email per completare la registrazione
      </p>
    </div>
  );
}

// Step 6: Summary
function StepSummary({ data }: { data: import('@/types').OnboardingData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
        <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm text-emerald-800 dark:text-emerald-300">Tutto pronto! Verifica i dati e attiva il cliente.</p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">Azienda</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-slate-500">Nome:</span>
            <span className="text-slate-900 dark:text-slate-100">{data.company.name}</span>
            <span className="text-slate-500">Settore:</span>
            <span className="text-slate-900 dark:text-slate-100">{data.company.sector}</span>
            <span className="text-slate-500">Referente:</span>
            <span className="text-slate-900 dark:text-slate-100">{data.company.contactName}</span>
            <span className="text-slate-500">Email:</span>
            <span className="text-slate-900 dark:text-slate-100">{data.company.contactEmail}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">Use case ({data.useCases.length})</h3>
          <div className="flex flex-wrap gap-1">
            {data.useCases.map((uc) => (
              <Badge key={uc} color="blue">{USE_CASES.find((u) => u.id === uc)?.label || uc}</Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">Agenti ({data.agents.length})</h3>
          <div className="space-y-1">
            {data.agents.map((agent, idx) => (
              <div key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                {agent.name} — {MODEL_TIERS[agent.modelPreference as keyof typeof MODEL_TIERS]?.label || agent.modelPreference}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">
            Knowledge Base ({data.documents.length} file, {data.crawlUrls.length} URL)
          </h3>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">Utenti invitati ({data.users.length})</h3>
          <div className="space-y-1">
            {data.users.map((user, idx) => (
              <div key={idx} className="text-sm text-slate-600 dark:text-slate-400">{user.email} ({user.role})</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { OnboardingPage };
