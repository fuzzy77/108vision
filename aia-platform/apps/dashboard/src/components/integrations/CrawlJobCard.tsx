import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { formatRelative } from '@/lib/utils';
import { Globe, Clock, BookOpen } from 'lucide-react';
import type { CrawlJob } from '@/types';

interface CrawlJobCardProps {
  job: CrawlJob;
  onAddToKb?: (jobId: string) => void;
  addingToKb?: boolean;
}

const statusConfig = {
  running: { label: 'In corso', color: 'blue' as const },
  completed: { label: 'Completato', color: 'emerald' as const },
  failed: { label: 'Fallito', color: 'red' as const },
};

function formatDuration(ms: number | null): string {
  if (ms === null) return '-';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function CrawlJobCard({ job, onAddToKb, addingToKb }: CrawlJobCardProps) {
  const config = statusConfig[job.status] || statusConfig.running;
  const progressPercent = job.maxPages > 0 ? (job.pagesCrawled / job.maxPages) * 100 : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/30 shrink-0">
              <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[300px]">
                  {job.url}
                </span>
                <Badge color={config.color}>{config.label}</Badge>
                {job.addedToKb && (
                  <Badge color="indigo">
                    <BookOpen className="h-3 w-3 mr-0.5" /> In KB
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <span>{job.pagesCrawled} / {job.maxPages} pagine</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDuration(job.duration)}
                </span>
                <span>{formatRelative(job.startedAt)}</span>
              </div>
              {job.status === 'running' && (
                <div className="mt-2 max-w-xs">
                  <Progress value={progressPercent} color="primary" showLabel />
                </div>
              )}
              {job.errorMessage && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">{job.errorMessage}</p>
              )}
            </div>
          </div>

          {job.status === 'completed' && !job.addedToKb && onAddToKb && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddToKb(job.id)}
              disabled={addingToKb}
              className="shrink-0 ml-4"
            >
              <BookOpen className="h-3.5 w-3.5" /> Aggiungi a KB
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { CrawlJobCard };
