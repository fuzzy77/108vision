import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PrincipleWarningDialogProps {
  principleLabel: string;
  riskWarning: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PrincipleWarningDialog({
  principleLabel,
  riskWarning,
  onConfirm,
  onCancel,
}: PrincipleWarningDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Disattivare &ldquo;{principleLabel}&rdquo;?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {riskWarning}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
          >
            Disattiva — accetto il rischio
          </Button>
        </div>
      </div>
    </div>
  );
}
