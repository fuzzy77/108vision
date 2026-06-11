import type { Tenant } from '@/types';
import { cn, formatCurrency, formatRelative } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Bot, FileText, MessageSquare, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface TenantCardProps {
  tenant: Tenant;
  onClick: () => void;
}

const statusLabels: Record<string, string> = {
  active: 'Attivo',
  inactive: 'Inattivo',
  trial: 'Trial',
  suspended: 'Sospeso',
};

function TenantCard({ tenant, onClick }: TenantCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={tenant.name} size="md" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{tenant.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{tenant.sector}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={STATUS_COLORS[tenant.status]}>{statusLabels[tenant.status]}</Badge>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Modifica
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Disattiva
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Bot className="h-3.5 w-3.5" />
          <span className="text-xs">{tenant.agentsCount} agenti</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <FileText className="h-3.5 w-3.5" />
          <span className="text-xs">{tenant.documentsCount} doc</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="text-xs">{tenant.conversationsThisMonth}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
        <span className={cn('text-sm font-semibold', 'text-slate-900 dark:text-slate-100')}>
          {formatCurrency(tenant.monthlyCost)}/mese
        </span>
        <span className="text-xs text-slate-400">{formatRelative(tenant.lastActivity)}</span>
      </div>
    </div>
  );
}

export { TenantCard };
