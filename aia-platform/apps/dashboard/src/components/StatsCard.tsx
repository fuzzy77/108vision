import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

function StatsCard({ label, value, trend, icon: Icon, iconColor = 'text-primary-600', className }: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</span>
        </div>
        <div className={cn('rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {trend >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
            )}
          >
            {trend >= 0 ? '+' : ''}{trend}% vs mese scorso
          </span>
        </div>
      )}
    </div>
  );
}

export { StatsCard };
