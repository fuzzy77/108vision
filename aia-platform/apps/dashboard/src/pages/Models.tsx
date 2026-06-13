import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { usePlans, useCreatePlan, useUpdatePlan, useDeactivatePlan } from '@/hooks/usePlans';
import type { Plan, CreatePlanInput, PlanModelTier } from '@/hooks/usePlans';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/Dialog';
import { Plus, Pencil, PowerOff, Cpu, ChevronDown, ChevronUp } from 'lucide-react';

// ---------------------------------------------------------------------------
// Static tier reference data (sourced from LiteLLM config — display-only)
// ---------------------------------------------------------------------------

interface TierInfo {
  id: PlanModelTier;
  label: string;
  provider: string;
  model: string;
  costInput: string;
  costOutput: string;
  color: 'blue' | 'indigo' | 'purple' | 'emerald' | 'amber';
}

const TIER_INFO: TierInfo[] = [
  {
    id: 'fast-cheap',
    label: 'Basso',
    provider: 'DeepSeek',
    model: 'deepseek-chat (V3)',
    costInput: '$0.27/1M',
    costOutput: '$1.10/1M',
    color: 'emerald',
  },
  {
    id: 'balanced',
    label: 'Medio',
    provider: 'DeepSeek',
    model: 'deepseek-reasoner (R1)',
    costInput: '$0.55/1M',
    costOutput: '$2.19/1M',
    color: 'blue',
  },
  {
    id: 'powerful',
    label: 'Alto',
    provider: 'Alibaba',
    model: 'qwen3-235b-a22b',
    costInput: '$1.20/1M',
    costOutput: '$4.00/1M',
    color: 'purple',
  },
  {
    id: 'coding',
    label: 'Coding',
    provider: 'DeepSeek',
    model: 'deepseek-chat',
    costInput: '$0.27/1M',
    costOutput: '$1.10/1M',
    color: 'indigo',
  },
  {
    id: 'vision',
    label: 'Vision',
    provider: 'Alibaba',
    model: 'qwen-vl-max',
    costInput: 'varies',
    costOutput: 'varies',
    color: 'amber',
  },
];

const ALL_TIERS: PlanModelTier[] = ['fast-cheap', 'balanced', 'powerful', 'coding', 'vision'];

// ---------------------------------------------------------------------------
// Plan form state
// ---------------------------------------------------------------------------

interface PlanFormState {
  name: string;
  maxConversationsMonth: string;
  maxKbDocuments: string;
  maxKbSizeMb: string;
  allowedModels: PlanModelTier[];
  priceEurMonth: string;
}

const EMPTY_FORM: PlanFormState = {
  name: '',
  maxConversationsMonth: '200',
  maxKbDocuments: '100',
  maxKbSizeMb: '256',
  allowedModels: ['fast-cheap', 'balanced'],
  priceEurMonth: '0',
};

function planToForm(plan: Plan): PlanFormState {
  return {
    name: plan.name,
    maxConversationsMonth: String(plan.maxConversationsMonth),
    maxKbDocuments: String(plan.maxKbDocuments),
    maxKbSizeMb: String(plan.maxKbSizeMb),
    allowedModels: ((plan.allowedModels ?? []) as string[]).filter(
      (m): m is PlanModelTier => ALL_TIERS.includes(m as PlanModelTier),
    ),
    priceEurMonth: String(plan.priceEurMonth),
  };
}

function formToInput(form: PlanFormState): CreatePlanInput {
  return {
    name: form.name.trim(),
    maxConversationsMonth: Math.max(1, parseInt(form.maxConversationsMonth, 10) || 200),
    maxKbDocuments: Math.max(1, parseInt(form.maxKbDocuments, 10) || 100),
    maxKbSizeMb: Math.max(1, parseInt(form.maxKbSizeMb, 10) || 256),
    allowedModels: form.allowedModels,
    priceEurMonth: Math.max(0, parseFloat(form.priceEurMonth) || 0),
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TierBadge({ tier }: { tier: string }) {
  const info = TIER_INFO.find((t) => t.id === tier);
  if (!info) {
    return (
      <Badge variant="secondary" className="text-xs">
        {tier}
      </Badge>
    );
  }
  return (
    <Badge color={info.color} className="text-xs">
      {info.label} ({tier})
    </Badge>
  );
}

interface PlanFormProps {
  form: PlanFormState;
  onChange: (next: PlanFormState) => void;
  errors: Partial<PlanFormState>;
}

function PlanForm({ form, onChange, errors }: PlanFormProps) {
  function toggleTier(tier: PlanModelTier) {
    const current = form.allowedModels;
    const next = current.includes(tier)
      ? current.filter((t) => t !== tier)
      : [...current, tier];
    onChange({ ...form, allowedModels: next });
  }

  return (
    <div className="space-y-4">
      <Input
        label="Nome piano"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        error={errors.name}
        placeholder="es. Starter, Growth, Scale..."
      />

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Conv/mese max"
          type="number"
          min="1"
          value={form.maxConversationsMonth}
          onChange={(e) => onChange({ ...form, maxConversationsMonth: e.target.value })}
          error={errors.maxConversationsMonth}
        />
        <Input
          label="Documenti KB max"
          type="number"
          min="1"
          value={form.maxKbDocuments}
          onChange={(e) => onChange({ ...form, maxKbDocuments: e.target.value })}
          error={errors.maxKbDocuments}
        />
        <Input
          label="KB size max (MB)"
          type="number"
          min="1"
          value={form.maxKbSizeMb}
          onChange={(e) => onChange({ ...form, maxKbSizeMb: e.target.value })}
          error={errors.maxKbSizeMb}
        />
      </div>

      <Input
        label="Prezzo EUR/mese"
        type="number"
        min="0"
        step="0.01"
        value={form.priceEurMonth}
        onChange={(e) => onChange({ ...form, priceEurMonth: e.target.value })}
        error={errors.priceEurMonth}
      />

      {/* Tier checkboxes */}
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Livelli modello consentiti <span className="text-red-500">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_TIERS.map((tier) => {
            const info = TIER_INFO.find((t) => t.id === tier)!;
            const selected = form.allowedModels.includes(tier);
            return (
              <button
                key={tier}
                type="button"
                onClick={() => toggleTier(tier)}
                className={[
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  selected
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600',
                ].join(' ')}
              >
                <span
                  className={[
                    'h-2 w-2 rounded-full',
                    selected ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600',
                  ].join(' ')}
                />
                {info.label} <span className="opacity-60">({tier})</span>
              </button>
            );
          })}
        </div>
        {form.allowedModels.length === 0 && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            Seleziona almeno un livello.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan dialog (create / edit)
// ---------------------------------------------------------------------------

interface PlanDialogProps {
  open: boolean;
  editingPlan: Plan | null;
  onClose: () => void;
}

function PlanDialog({ open, editingPlan, onClose }: PlanDialogProps) {
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<PlanFormState>>({});

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const isPending = createPlan.isPending || updatePlan.isPending;

  useEffect(() => {
    if (open) {
      setForm(editingPlan ? planToForm(editingPlan) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, editingPlan]);

  function validate(): boolean {
    const next: Partial<PlanFormState> = {};
    if (!form.name.trim()) next.name = 'Il nome è obbligatorio';
    if (form.allowedModels.length === 0) {
      // Surface through the tier section; no string error needed here
    }
    setErrors(next);
    return Object.keys(next).length === 0 && form.allowedModels.length > 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    const input = formToInput(form);

    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ id: editingPlan.id, ...input });
      } else {
        await createPlan.mutateAsync(input);
      }
      onClose();
    } catch {
      // Errors are surfaced via the mutation state; no additional handling needed
    }
  }

  const serverError = createPlan.error ?? updatePlan.error;

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <DialogHeader>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {editingPlan ? 'Modifica piano' : 'Nuovo piano'}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configura i limiti e i livelli AI consentiti per questo piano.
        </p>
      </DialogHeader>
      <DialogBody>
        <PlanForm form={form} onChange={setForm} errors={errors} />
        {serverError && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400">
            {serverError instanceof Error ? serverError.message : 'Errore durante il salvataggio.'}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Annulla
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Salvataggio...' : editingPlan ? 'Salva modifiche' : 'Crea piano'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function ModelsPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Modelli AI' }]);
  }, [setBreadcrumbs]);

  const { data: plans, isLoading, error, refetch } = usePlans();
  const deactivatePlan = useDeactivatePlan();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [tiersExpanded, setTiersExpanded] = useState(false);

  function openCreate() {
    setEditingPlan(null);
    setDialogOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setDialogOpen(true);
  }

  function handleDeactivate(plan: Plan) {
    if (!confirm(`Disattivare il piano "${plan.name}"? I tenant già assegnati manterranno il piano fino alla prossima modifica manuale.`)) return;
    deactivatePlan.mutate(plan.id);
  }

  const activePlans = plans?.filter((p) => p.isActive) ?? [];
  const inactivePlans = plans?.filter((p) => !p.isActive) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Modelli AI</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Livelli modello disponibili e configurazione dei piani di accesso
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuovo piano
        </Button>
      </div>

      {/* Tier reference */}
      <Card>
        <button
          className="w-full"
          onClick={() => setTiersExpanded((v) => !v)}
        >
          <CardHeader className="flex-row items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <CardTitle className="text-base">Livelli modello configurati</CardTitle>
              <span className="text-xs text-slate-400 dark:text-slate-500">(da LiteLLM config — sola lettura)</span>
            </div>
            {tiersExpanded
              ? <ChevronUp className="h-4 w-4 text-slate-400" />
              : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </CardHeader>
        </button>

        {tiersExpanded && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livello</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Modello</TableHead>
                  <TableHead className="text-right">Input (1M tok)</TableHead>
                  <TableHead className="text-right">Output (1M tok)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIER_INFO.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell>
                      <Badge color={tier.color} className="text-xs">
                        {tier.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {tier.id}
                      </code>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{tier.provider}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-xs">{tier.model}</TableCell>
                    <TableCell className="text-right text-slate-600 dark:text-slate-400">{tier.costInput}</TableCell>
                    <TableCell className="text-right text-slate-600 dark:text-slate-400">{tier.costOutput}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      {/* Plans table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Piani di accesso</CardTitle>
              <CardDescription className="mt-1">
                Ogni piano definisce i limiti mensili e i livelli AI consentiti per i tenant assegnati.
              </CardDescription>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {activePlans.length} attivi · {inactivePlans.length} disattivati
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                Errore nel caricamento dei piani
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Riprova
              </Button>
            </div>
          ) : (plans?.length ?? 0) === 0 ? (
            <div className="py-10 text-center">
              <Cpu className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Nessun piano configurato. Crea il primo piano per assegnarlo ai tenant.
              </p>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Crea piano
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Livelli AI</TableHead>
                  <TableHead className="text-right">Conv/mese</TableHead>
                  <TableHead className="text-right">Documenti KB</TableHead>
                  <TableHead className="text-right">KB size</TableHead>
                  <TableHead className="text-right">Prezzo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans!.map((plan) => (
                  <TableRow key={plan.id} className={!plan.isActive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {plan.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {((plan.allowedModels ?? []) as string[]).length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          ((plan.allowedModels ?? []) as string[]).map((m) => (
                            <TierBadge key={m} tier={m} />
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-600 dark:text-slate-400">
                      {plan.maxConversationsMonth.toLocaleString('it-IT')}
                    </TableCell>
                    <TableCell className="text-right text-slate-600 dark:text-slate-400">
                      {plan.maxKbDocuments.toLocaleString('it-IT')}
                    </TableCell>
                    <TableCell className="text-right text-slate-600 dark:text-slate-400">
                      {plan.maxKbSizeMb} MB
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {parseFloat(plan.priceEurMonth).toLocaleString('it-IT', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                      <span className="text-xs font-normal text-slate-400">/mese</span>
                    </TableCell>
                    <TableCell>
                      <Badge color={plan.isActive ? 'emerald' : 'slate'}>
                        {plan.isActive ? 'Attivo' : 'Disattivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(plan)}
                          title="Modifica"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {plan.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeactivate(plan)}
                            title="Disattiva"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            disabled={deactivatePlan.isPending}
                          >
                            <PowerOff className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PlanDialog
        open={dialogOpen}
        editingPlan={editingPlan}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}

export { ModelsPage };
