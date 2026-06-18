import { ShieldCheck, AlertTriangle, OctagonAlert } from 'lucide-react';

interface ProportionalityCardProps {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  benefit: string;
  risk: string;
  onProceed: () => void;
  onStop: () => void;
}

const RISK_CONFIG = {
  low: {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    label: 'Rischio basso',
    Icon: ShieldCheck,
    iconClass: 'text-emerald-500',
  },
  medium: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    label: 'Rischio medio',
    Icon: AlertTriangle,
    iconClass: 'text-amber-500',
  },
  high: {
    border: 'border-l-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    label: 'Rischio alto',
    Icon: AlertTriangle,
    iconClass: 'text-orange-500',
  },
  critical: {
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    label: 'Rischio critico',
    Icon: OctagonAlert,
    iconClass: 'text-red-500',
  },
} as const;

export function ProportionalityCard({
  riskLevel,
  action,
  benefit,
  risk,
  onProceed,
  onStop,
}: ProportionalityCardProps) {
  const config = RISK_CONFIG[riskLevel];
  const { Icon } = config;

  return (
    <div
      className={`
        border-l-4 ${config.border}
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        rounded-r-lg shadow-sm
        p-3 my-2
        max-w-[80%] md:max-w-[70%]
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 shrink-0 ${config.iconClass}`} />
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}
        >
          {config.label}
        </span>
      </div>

      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
        {action}
      </p>

      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 mb-3">
        <div className="flex items-start gap-1.5">
          <span className="font-medium text-emerald-600 dark:text-emerald-400 shrink-0">Beneficio:</span>
          <span>{benefit}</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="font-medium text-red-600 dark:text-red-400 shrink-0">Rischio:</span>
          <span>{risk}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onProceed}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          Procedi
        </button>
        <button
          onClick={onStop}
          className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Ferma
        </button>
      </div>
    </div>
  );
}
