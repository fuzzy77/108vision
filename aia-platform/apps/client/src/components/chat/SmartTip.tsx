import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import type { SmartTipData } from '@/lib/tip-detector';

interface SmartTipProps {
  tip: SmartTipData;
}

export function SmartTip({ tip }: SmartTipProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-2 px-4 py-2.5 mx-auto max-w-[80%] md:max-w-[70%] mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
      <p className="text-xs text-blue-700 dark:text-blue-300 flex-1 leading-relaxed">
        {tip.message}
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
        aria-label="Dismiss tip"
      >
        <X className="w-3 h-3 text-blue-400" />
      </button>
    </div>
  );
}
