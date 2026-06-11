import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  color?: 'slate' | 'emerald' | 'blue' | 'amber' | 'red' | 'purple' | 'pink' | 'indigo';
}

const colorMap = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  pink: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

function Badge({ className, variant = 'default', color, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          [color ? colorMap[color] : 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400']: variant === 'default',
          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300': variant === 'secondary' && !color,
          'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': variant === 'destructive',
          'border border-current bg-transparent': variant === 'outline',
        },
        color && variant !== 'outline' && colorMap[color],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
