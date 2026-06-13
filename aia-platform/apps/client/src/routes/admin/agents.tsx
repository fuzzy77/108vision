import { useState } from 'react';
import { Bot, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type AgentConfig, type CreateAgentPayload } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const MODEL_TIER_LABELS: Record<string, string> = {
  'fast-cheap': 'Veloce — economico',
  balanced: 'Bilanciato — buon equilibrio',
  powerful: 'Potente — massima qualità',
};

const defaultForm: CreateAgentPayload = {
  name: '',
  description: '',
  systemPrompt: '',
  model: 'balanced',
};

function AgentForm({
  initial,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  initial: CreateAgentPayload;
  onSave: (data: CreateAgentPayload) => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<CreateAgentPayload>(initial);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.systemPrompt.trim()) {
      setValidationError('Nome e system prompt sono obbligatori.');
      return;
    }
    setValidationError(null);
    onSave(form);
  };

  const displayError = validationError ?? error;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-xl border border-primary-200 dark:border-primary-800 bg-white dark:bg-slate-900 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Nome *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Assistente Vendite"
            className="
              w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
              bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            "
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Modello
          </label>
          <select
            value={form.model ?? 'balanced'}
            onChange={(e) =>
              setForm((f) => ({ ...f, model: e.target.value }))
            }
            className="
              w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
              bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            "
          >
            {Object.entries(MODEL_TIER_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          Descrizione
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Breve descrizione dell'agente..."
          className="
            w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
            bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          "
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          System Prompt *
        </label>
        <textarea
          value={form.systemPrompt}
          onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
          rows={5}
          placeholder="Sei un assistente specializzato in..."
          className="
            w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
            bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            resize-none
          "
        />
      </div>

      {displayError && (
        <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          <Check className="w-3.5 h-3.5 mr-1.5" />
          {isPending ? 'Salvataggio...' : 'Salva'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          <X className="w-3.5 h-3.5 mr-1.5" />
          Annulla
        </Button>
      </div>
    </form>
  );
}

export function AdminAgentsPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agent-configs'],
    queryFn: () => api.getAgentConfigs(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAgentPayload) => api.createAgent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
      setShowCreateForm(false);
      setMutationError(null);
    },
    onError: (err: Error) => setMutationError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateAgentPayload & { id: string }) => api.updateAgent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
      setEditingId(null);
      setMutationError(null);
    },
    onError: (err: Error) => setMutationError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
    },
  });

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5" />
              Gestione Agenti
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Crea e configura gli agenti AI disponibili nel tuo tenant.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setShowCreateForm((v) => !v);
              setMutationError(null);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuovo agente
          </Button>
        </div>

        {showCreateForm && (
          <AgentForm
            initial={defaultForm}
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => {
              setShowCreateForm(false);
              setMutationError(null);
            }}
            isPending={createMutation.isPending}
            error={mutationError}
          />
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400 text-center py-8">
            Errore nel caricamento degli agenti.
          </p>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <Bot className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nessun agente configurato
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Crea il primo agente con il pulsante in alto
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent: AgentConfig) =>
              editingId === agent.id ? (
                <AgentForm
                  key={agent.id}
                  initial={{
                    name: agent.name,
                    description: agent.description ?? '',
                    systemPrompt: agent.systemPrompt,
                    model: agent.model ?? 'balanced',
                  }}
                  onSave={(data) => updateMutation.mutate({ ...data, id: agent.id })}
                  onCancel={() => {
                    setEditingId(null);
                    setMutationError(null);
                  }}
                  isPending={updateMutation.isPending}
                  error={mutationError}
                />
              ) : (
                <div
                  key={agent.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                          {agent.name}
                        </p>
                        {agent.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {agent.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {MODEL_TIER_LABELS[agent.model ?? ''] ?? agent.model ?? 'balanced'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(agent.id);
                          setShowCreateForm(false);
                          setMutationError(null);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        aria-label={`Modifica ${agent.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(agent.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                        aria-label={`Elimina ${agent.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {agent.systemPrompt && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-mono">
                        {agent.systemPrompt}
                      </p>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
