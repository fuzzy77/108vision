import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { useMarketplaceTemplates, useInstallTemplate } from '@/hooks/useMarketplace';
import { useTenants } from '@/hooks/useTenants';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { AGENT_CATEGORIES, MODEL_TIERS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Search, Plus, Download, Bot, Sparkles } from 'lucide-react';
import type { MarketplaceTemplate } from '@/types';

function MarketplacePage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);
  const [installTenantId, setInstallTenantId] = useState('');

  const { data: templates, isLoading, error, refetch } = useMarketplaceTemplates({
    category: categoryFilter || undefined,
    search: searchQuery || undefined,
  });

  const { data: tenants } = useTenants({ pageSize: 100 });
  const installMutation = useInstallTemplate();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Marketplace' }]);
  }, [setBreadcrumbs]);

  const handleInstall = () => {
    if (!selectedTemplate || !installTenantId) return;
    installMutation.mutate(
      { templateId: selectedTemplate.id, tenantId: installTenantId },
      { onSuccess: () => setSelectedTemplate(null) },
    );
  };

  const getCategoryColor = (category: string): 'slate' | 'emerald' | 'blue' | 'amber' | 'purple' | 'pink' => {
    const found = AGENT_CATEGORIES.find((c) => c.id === category);
    return (found?.color as 'slate' | 'emerald' | 'blue' | 'amber' | 'purple' | 'pink') || 'slate';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Marketplace</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Template agenti pronti all&apos;uso</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" /> Crea template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategoryFilter('')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              !categoryFilter
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400',
            )}
          >
            Tutti
          </button>
          {AGENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                categoryFilter === cat.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400 mb-3">Errore nel caricamento dei template</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Riprova
          </Button>
        </div>
      ) : templates?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              {searchQuery || categoryFilter
                ? 'Nessun template corrisponde ai filtri'
                : 'Il marketplace e vuoto. Crea il primo template!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => (
            <Card
              key={template.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="rounded-lg bg-primary-50 p-2.5 dark:bg-primary-900/30">
                    <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <Badge color={getCategoryColor(template.category)}>
                    {AGENT_CATEGORIES.find((c) => c.id === template.category)?.label || template.category}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 dark:text-slate-100">{template.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{template.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" /> {template.installCount} installazioni
                  </span>
                  <span>{MODEL_TIERS[template.modelPreference]?.label}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template detail dialog */}
      <Dialog
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        size="lg"
      >
        {selectedTemplate && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-50 p-2.5 dark:bg-primary-900/30">
                  <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedTemplate.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedTemplate.description}</p>
                </div>
              </div>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge color={getCategoryColor(selectedTemplate.category)}>
                  {AGENT_CATEGORIES.find((c) => c.id === selectedTemplate.category)?.label}
                </Badge>
                <Badge color="blue">{MODEL_TIERS[selectedTemplate.modelPreference]?.label}</Badge>
                <Badge color="slate">{selectedTemplate.installCount} installazioni</Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">System Prompt</h4>
                <pre className="p-4 rounded-lg bg-slate-50 text-xs text-slate-700 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto dark:bg-slate-900 dark:text-slate-300">
                  {selectedTemplate.systemPrompt}
                </pre>
              </div>
              {selectedTemplate.tools.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">Strumenti</h4>
                  <div className="flex gap-1 flex-wrap">
                    {selectedTemplate.tools.map((tool) => (
                      <Badge key={tool} color="slate">{tool}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Select
                  label="Installa per cliente"
                  options={(tenants?.data || []).map((t) => ({ value: t.id, label: t.name }))}
                  value={installTenantId}
                  onChange={(e) => setInstallTenantId(e.target.value)}
                  placeholder="Seleziona un cliente"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Chiudi
              </Button>
              <Button onClick={handleInstall} disabled={!installTenantId || installMutation.isPending}>
                <Download className="h-4 w-4" /> {installMutation.isPending ? 'Installazione...' : 'Installa'}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}

export { MarketplacePage };
