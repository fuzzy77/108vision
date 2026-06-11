import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ScreenshotViewer } from './ScreenshotViewer';
import { useDesktopMonitor } from '@/hooks/useDesktopActions';
import { cn, formatRelative } from '@/lib/utils';
import {
  Monitor,
  Wifi,
  WifiOff,
  Clock,
  Eye,
  Camera,
  Keyboard,
  Mouse,
  Layers,
  RefreshCw,
  Focus,
} from 'lucide-react';
import type { DesktopActivityEvent } from '@/hooks/useDesktopActions';

// ---------------------------------------------------------------------------
// Icon map for activity event types
// ---------------------------------------------------------------------------

const activityIcons: Record<string, React.ReactNode> = {
  screenshot: <Camera className="h-3.5 w-3.5" />,
  analyzeScreen: <Eye className="h-3.5 w-3.5" />,
  listWindows: <Layers className="h-3.5 w-3.5" />,
  readWindow: <Eye className="h-3.5 w-3.5" />,
  getUITree: <Layers className="h-3.5 w-3.5" />,
  focusWindow: <Focus className="h-3.5 w-3.5" />,
  scrollWindow: <Mouse className="h-3.5 w-3.5" />,
  typeText: <Keyboard className="h-3.5 w-3.5" />,
  clickElement: <Mouse className="h-3.5 w-3.5" />,
  pressHotkey: <Keyboard className="h-3.5 w-3.5" />,
  mouseClick: <Mouse className="h-3.5 w-3.5" />,
};

// ---------------------------------------------------------------------------
// Connection status indicator
// ---------------------------------------------------------------------------

function ConnectionBadge({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) {
  if (status === 'connected') {
    return (
      <Badge color="emerald">
        <Wifi className="mr-1 h-3 w-3" />
        Connesso
      </Badge>
    );
  }
  if (status === 'connecting') {
    return (
      <Badge color="amber">
        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
        Connessione...
      </Badge>
    );
  }
  return (
    <Badge color="red">
      <WifiOff className="mr-1 h-3 w-3" />
      Disconnesso
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Activity feed row
// ---------------------------------------------------------------------------

function ActivityRow({ event }: { event: DesktopActivityEvent }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <div className={cn(
        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded',
        event.riskLevel === 'high_risk'
          ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
          : event.riskLevel === 'low_risk'
          ? 'bg-amber-100 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
      )}>
        {activityIcons[event.actionType] ?? <Monitor className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{event.description}</p>
        {event.windowTitle && (
          <p className="text-xs text-slate-400 truncate">{event.windowTitle}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-slate-400 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {formatRelative(event.timestamp)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DesktopMonitor component
// ---------------------------------------------------------------------------

interface DesktopMonitorProps {
  tenantId: string;
}

function DesktopMonitor({ tenantId }: DesktopMonitorProps) {
  const { lastScreenshot, recentActions, focusedWindow, connectionStatus, isLoading } =
    useDesktopMonitor(tenantId);

  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  function openScreenshot(screenshotId: string) {
    setViewerSrc(`/api/integrations/local-agent/screenshots/${screenshotId}`);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Monitor Desktop
        </h2>
        <ConnectionBadge status={connectionStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Screenshot panel — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-400" />
              Ultimo screenshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : lastScreenshot ? (
              <button
                className="group relative w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                onClick={() => openScreenshot(lastScreenshot.id)}
                title="Clicca per ingrandire"
              >
                <img
                  src={`/api/integrations/local-agent/screenshots/${lastScreenshot.id}`}
                  alt="Ultimo screenshot"
                  className="w-full object-contain max-h-[280px]"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                  <Eye className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-lg" />
                </div>
                <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                  {formatRelative(lastScreenshot.capturedAt)}
                </div>
              </button>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <Camera className="h-8 w-8 mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {connectionStatus === 'disconnected'
                    ? 'Agente non connesso'
                    : 'Nessuno screenshot disponibile'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side panel — 1/3 width */}
        <div className="space-y-4">
          {/* Focused window */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Focus className="h-4 w-4 text-slate-400" />
                Finestra attiva
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : focusedWindow ? (
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {focusedWindow.title}
                  </p>
                  <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                    {focusedWindow.processName}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">—</p>
              )}
            </CardContent>
          </Card>

          {/* Connection stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wifi className="h-4 w-4 text-slate-400" />
                Stato connessione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Stato</span>
                <ConnectionBadge status={connectionStatus} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Azioni oggi</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {recentActions.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent activity feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Attivita recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentActions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              {connectionStatus === 'disconnected'
                ? 'Agente non connesso — nessuna attivita da mostrare.'
                : "Nessuna azione registrata. L'agente e in attesa."}
            </p>
          ) : (
            <div>
              {recentActions.map((event) => (
                <ActivityRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screenshot lightbox */}
      {viewerSrc && (
        <ScreenshotViewer
          src={viewerSrc}
          title="Screenshot agente"
          onClose={() => setViewerSrc(null)}
        />
      )}
    </div>
  );
}

export { DesktopMonitor };
