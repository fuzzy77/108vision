import { FileText, Trash2, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatFileSize } from '@/lib/format';
import type { Document } from '@/lib/api';

interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
}

const statusConfig: Record<Document['status'], { variant: 'info' | 'warning' | 'success' | 'error'; icon: typeof Clock; label: string }> = {
  pending: { variant: 'info', icon: Clock, label: 'Pending' },
  processing: { variant: 'warning', icon: Loader, label: 'Processing' },
  ready: { variant: 'success', icon: CheckCircle, label: 'Ready' },
  error: { variant: 'error', icon: AlertCircle, label: 'Error' },
};

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const status = statusConfig[document.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {document.name}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 dark:text-slate-500">
          <span>{formatFileSize(document.size)}</span>
          <span>{formatDate(document.createdAt)}</span>
          {document.chunkCount !== undefined && document.status === 'ready' && (
            <span>{document.chunkCount} chunks</span>
          )}
        </div>
        {document.errorMessage && (
          <p className="text-xs text-red-500 mt-1 truncate">{document.errorMessage}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={status.variant}>
          <StatusIcon
            className={`w-3 h-3 mr-1 ${document.status === 'processing' ? 'animate-spin' : ''}`}
          />
          {status.label}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(document.id)}
          aria-label={`Delete ${document.name}`}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
