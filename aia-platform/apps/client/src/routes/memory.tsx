import { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, Search, Tag, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface Memory {
  id: string;
  content: string;
  tags: string[];
  category: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  general: { label: 'Generale', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  preference: { label: 'Preferenza', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  project: { label: 'Progetto', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  decision: { label: 'Decisione', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  person: { label: 'Persona', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  workflow: { label: 'Workflow', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
};

export function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [adding, setAdding] = useState(false);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      if (searchQuery.trim()) {
        const data = await api.get<{ items: Memory[] }>(`/memory/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
        setMemories(data.items);
        setTotal(data.items.length);
      } else {
        const data = await api.get<{ items: Memory[]; total: number }>('/memory?pageSize=50');
        setMemories(data.items);
        setTotal(data.total);
      }
    } catch {
      // Non-critical
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setAdding(true);
    try {
      await api.post<Memory>('/memory', {
        content: newContent.trim(),
        category: newCategory,
      });
      setNewContent('');
      await fetchMemories();
    } catch {
      // Handle error
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.post<{ deleted: boolean }>(`/memory/${id}`, {});
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      // Fallback: use DELETE via fetch directly
      try {
        const token = localStorage.getItem('auth_token');
        await fetch(`/api/memory/${id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setMemories((prev) => prev.filter((m) => m.id !== id));
        setTotal((prev) => prev - 1);
      } catch {
        // ignore
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Memoria</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                L'AI ricorda le tue preferenze, il contesto dei tuoi progetti e le decisioni prese — su ogni dispositivo.
              </p>
            </div>
          </div>
          <button
            onClick={fetchMemories}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Info card */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/10 dark:to-blue-900/10 border border-violet-200 dark:border-violet-800">
          <p className="text-sm text-violet-800 dark:text-violet-300">
            <strong>Come funziona:</strong> Dì semplicemente all'AI "ricorda che..." durante una conversazione.
            Le memorie vengono richiamate automaticamente quando sono rilevanti — non devi fare nulla.
            Funziona su ogni dispositivo e in ogni sessione.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca nelle memorie..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Cerca
          </button>
        </form>

        {/* Add new memory */}
        <form onSubmit={handleAdd} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="flex gap-3">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Aggiungi una memoria manualmente... (es: 'Il nostro stack e' React + Node.js su AWS')"
              rows={2}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1.5 text-slate-700 dark:text-slate-300"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!newContent.trim() || adding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {adding ? 'Salvo...' : 'Aggiungi'}
            </button>
          </div>
        </form>

        {/* Memory list */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 px-1">
            {total} memori{total === 1 ? 'a' : 'e'} salvat{total === 1 ? 'a' : 'e'}
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-600 border-t-transparent" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {searchQuery ? 'Nessuna memoria trovata per questa ricerca.' : 'Nessuna memoria ancora. Prova a dire all\'AI "ricorda che..." in chat.'}
              </p>
            </div>
          ) : (
            memories.map((memory) => {
              const cat = CATEGORY_LABELS[memory.category] ?? CATEGORY_LABELS.general!;
              return (
                <div
                  key={memory.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-slate-200">{memory.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${cat.color}`}>
                        {cat.label}
                      </span>
                      {memory.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-slate-400">
                          <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                      <span className="text-xs text-slate-400">{formatDate(memory.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(memory.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                    aria-label="Elimina memoria"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
