import type { ActivityEvent } from '@/types';
import { formatRelative } from '@/lib/utils';
import { MessageSquare, FileUp, Bot, UserPlus, AlertTriangle, Plus } from 'lucide-react';

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const eventIcons: Record<ActivityEvent['type'], typeof MessageSquare> = {
  conversation_started: MessageSquare,
  document_uploaded: FileUp,
  agent_modified: Bot,
  tenant_created: UserPlus,
  agent_created: Plus,
  alert_triggered: AlertTriangle,
};

const eventColors: Record<ActivityEvent['type'], string> = {
  conversation_started: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  document_uploaded: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  agent_modified: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  tenant_created: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  agent_created: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  alert_triggered: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nessuna attivita recente</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event) => {
        const Icon = eventIcons[event.type];
        return (
          <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className={`rounded-lg p-2 ${eventColors[event.type]}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{event.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400">{event.tenantName}</span>
                <span className="text-xs text-slate-400">{formatRelative(event.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { ActivityFeed };
