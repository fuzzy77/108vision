import { useState } from 'react';
import { Users as UsersIcon, UserPlus, Trash2, ShieldCheck, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type TenantUser, type CreateUserPayload } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/format';

const roleBadge: Record<TenantUser['role'], { label: string; variant: 'info' | 'success' }> = {
  tenant_admin: { label: 'Admin', variant: 'success' },
  client_user: { label: 'Utente', variant: 'info' },
};

const defaultForm: CreateUserPayload = { name: '', email: '', role: 'client_user' };

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateUserPayload>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => api.getTenantUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => api.createTenantUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      setForm(defaultForm);
      setShowForm(false);
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTenantUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Nome e email sono obbligatori.');
      return;
    }
    setFormError(null);
    createMutation.mutate(form);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <UsersIcon className="w-5 h-5" />
              Gestione Utenti
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aggiungi e gestisci gli utenti del tuo tenant.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setShowForm((v) => !v);
              setFormError(null);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Aggiungi utente
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4"
          >
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nuovo utente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Mario Rossi"
                  className="
                    w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                    bg-white dark:bg-slate-800 text-sm
                    text-slate-900 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  "
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="mario@azienda.it"
                  className="
                    w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                    bg-white dark:bg-slate-800 text-sm
                    text-slate-900 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  "
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Ruolo
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as CreateUserPayload['role'] }))
                }
                className="
                  w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-sm
                  text-slate-900 dark:text-slate-100
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                "
              >
                <option value="client_user">Utente</option>
                <option value="tenant_admin">Admin</option>
              </select>
            </div>

            {formError && (
              <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" variant="primary" size="sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvataggio...' : 'Crea utente'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setForm(defaultForm);
                  setFormError(null);
                }}
              >
                Annulla
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400 text-center py-8">
            Errore nel caricamento degli utenti.
          </p>
        ) : users.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <UsersIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Nessun utente presente</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Utente
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Ruolo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">
                    Ultimo accesso
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => {
                  const badge = roleBadge[user.role];
                  const Icon = user.role === 'tenant_admin' ? ShieldCheck : User;
                  return (
                    <tr
                      key={user.id}
                      className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteMutation.mutate(user.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                          aria-label={`Elimina ${user.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
