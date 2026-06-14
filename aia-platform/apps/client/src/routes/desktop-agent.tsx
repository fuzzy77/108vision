import { useState } from 'react';
import {
  Monitor,
  Wifi,
  WifiOff,
  RefreshCw,
  Terminal,
  Clock,
  Zap,
  FileText,
  Clipboard,
  MousePointer,
  HardDrive,
  Search,
  Code,
  Download,
  Brain,
  Shield,
  ChevronDown,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { useDesktopAgent } from '@/hooks/useDesktopAgent';
import type { ActionHistoryEntry } from '@/hooks/useDesktopAgent';

const SETUP_STEPS = [
  {
    step: 1,
    title: 'Scarica l\'eseguibile per il tuo sistema',
    command: null,
    note: 'Windows (.exe), macOS (.app) o Linux. Un solo file, nessuna installazione richiesta.',
  },
  {
    step: 2,
    title: 'Avvia il Desktop Agent',
    command: null,
    note: 'Doppio click sull\'eseguibile scaricato. Si apre in background nella system tray.',
  },
  {
    step: 3,
    title: 'Login via browser',
    command: null,
    note: 'Si apre automaticamente il browser per l\'autenticazione. Usa le stesse credenziali di 108 AI.',
  },
  {
    step: 4,
    title: 'Pronto!',
    command: null,
    note: 'Il Desktop Agent si connette automaticamente. Puoi iniziare a chattare e l\'AI opererà sul tuo PC.',
  },
];

const DOWNLOAD_LINKS = [
  { os: 'Windows', file: '108ai-agent.exe', arch: 'x64' },
  { os: 'macOS (Intel)', file: '108ai-agent-macos-x64', arch: 'x64' },
  { os: 'macOS (Apple Silicon)', file: '108ai-agent-macos-arm64', arch: 'arm64' },
  { os: 'Linux', file: '108ai-agent-linux', arch: 'x64' },
];

interface CapabilityExample {
  prompt: string;
  description: string;
  risk: 'read-only' | 'low' | 'high';
}

interface CapabilityInfo {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
  borderColor: string;
  examples: CapabilityExample[];
}

const CAPABILITIES: CapabilityInfo[] = [
  {
    id: 'filesystem',
    title: 'File System',
    subtitle: 'Legge, scrive, edita e cerca file nelle cartelle consentite',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
    borderColor: 'border-blue-200 dark:border-blue-800',
    examples: [
      { prompt: 'Leggi il file fattura_2024.pdf sulla scrivania e fammi un riassunto', description: 'Legge un file e ne estrae il contenuto', risk: 'read-only' },
      { prompt: 'Trova tutti i file Excel nella cartella Documenti/Contabilita', description: 'Elenca file per tipo in una directory', risk: 'read-only' },
      { prompt: 'Crea un file report.txt con il riassunto della nostra conversazione', description: 'Scrive un nuovo file', risk: 'low' },
      { prompt: 'Rinomina tutti i file .jpeg in .jpg nella cartella Foto', description: 'Operazione batch su file', risk: 'low' },
    ],
  },
  {
    id: 'grep',
    title: 'Grep / Ricerca',
    subtitle: 'Cerca testo dentro i file con regex, filtra per tipo',
    icon: Search,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/10',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    examples: [
      { prompt: 'Cerca "IBAN" in tutti i PDF nella cartella Banca', description: 'Trova testo specifico in documenti', risk: 'read-only' },
      { prompt: 'In quale file del progetto e\' definita la funzione calculateTotal?', description: 'Trova definizioni nel codice', risk: 'read-only' },
      { prompt: 'Cerca tutte le email che contengono "fattura scaduta" nei file .eml', description: 'Ricerca in archivi email locali', risk: 'read-only' },
      { prompt: 'Quali file sono stati modificati oggi nella cartella Lavoro?', description: 'Filtra file per data modifica', risk: 'read-only' },
    ],
  },
  {
    id: 'shell',
    title: 'Shell / Terminale',
    subtitle: 'Esegue comandi (npm, git, python...) con sandbox e timeout',
    icon: Terminal,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/10',
    borderColor: 'border-rose-200 dark:border-rose-800',
    examples: [
      { prompt: 'Esegui git status nel progetto e dimmi cosa ho modificato', description: 'Controllo stato repository', risk: 'read-only' },
      { prompt: 'Installa le dipendenze del progetto con npm install', description: 'Esecuzione package manager', risk: 'high' },
      { prompt: 'Comprimi la cartella Backup in un file .zip', description: 'Creazione archivio', risk: 'low' },
      { prompt: 'Esegui i test del progetto e dimmi quali falliscono', description: 'Test runner con analisi risultati', risk: 'high' },
    ],
  },
  {
    id: 'edit',
    title: 'Edit Chirurgico',
    subtitle: 'Modifica file con find-and-replace senza riscrivere tutto',
    icon: Code,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/10',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    examples: [
      { prompt: 'Nel file config.json cambia la porta da 3000 a 8080', description: 'Modifica puntuale in un file di config', risk: 'low' },
      { prompt: 'Aggiungi "margin-top: 20px" al CSS del componente Header', description: 'Inserimento di codice in punto specifico', risk: 'low' },
      { prompt: 'Sostituisci tutti i console.log con logger.info nel progetto', description: 'Refactoring multi-file', risk: 'low' },
      { prompt: 'Correggi il typo "recieve" in "receive" in tutti i file .ts', description: 'Fix batch ortografico nel codice', risk: 'low' },
    ],
  },
  {
    id: 'clipboard',
    title: 'Clipboard',
    subtitle: 'Legge e scrive negli appunti di sistema',
    icon: Clipboard,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    examples: [
      { prompt: 'Cosa ho copiato negli appunti? Analizzalo.', description: 'Legge e interpreta il contenuto copiato', risk: 'read-only' },
      { prompt: 'Metti negli appunti il comando per connettersi al server', description: 'Copia un risultato per incollare altrove', risk: 'low' },
      { prompt: 'Prendi il testo che ho copiato e traducilo in inglese, poi rimettilo negli appunti', description: 'Trasforma e re-copia', risk: 'low' },
    ],
  },
  {
    id: 'desktop',
    title: 'Desktop (opt-in)',
    subtitle: 'Vede finestre, fa screenshot, click e digita testo',
    icon: MousePointer,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/10',
    borderColor: 'border-purple-200 dark:border-purple-800',
    examples: [
      { prompt: 'Fammi uno screenshot di quello che vedo adesso sullo schermo', description: 'Cattura schermo per analisi', risk: 'read-only' },
      { prompt: 'Quali finestre ho aperte? Ce ne sono di Outlook?', description: 'Elenca processi/finestre attivi', risk: 'read-only' },
      { prompt: 'Apri Chrome e vai su calendar.google.com', description: 'Automazione browser', risk: 'high' },
      { prompt: 'Compila il form con i dati che ti ho dato prima', description: 'Automazione GUI con input', risk: 'high' },
    ],
  },
  {
    id: 'system',
    title: 'Sistema',
    subtitle: 'Apre URL/file, notifiche, info sistema',
    icon: HardDrive,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/10',
    borderColor: 'border-amber-200 dark:border-amber-800',
    examples: [
      { prompt: 'Quanto spazio disco ho libero?', description: 'Info di sistema in linguaggio naturale', risk: 'read-only' },
      { prompt: 'Apri il file report.pdf con il programma predefinito', description: 'Lancia applicazioni native', risk: 'low' },
      { prompt: 'Mandami una notifica desktop tra 30 minuti per la call', description: 'Timer/promemoria locale', risk: 'low' },
      { prompt: 'Quanto RAM e CPU sta usando il mio PC adesso?', description: 'Monitoraggio risorse', risk: 'read-only' },
    ],
  },
  {
    id: 'cli',
    title: 'CLI / Terminale / VS Code',
    subtitle: 'Usa 108ai direttamente da PowerShell, terminale, o VS Code integrato',
    icon: Terminal,
    color: 'text-slate-600 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-700/30',
    borderColor: 'border-slate-300 dark:border-slate-600',
    examples: [
      { prompt: '108ai Cerca nei miei documenti la fattura di marzo', description: 'Domanda one-shot dal terminale', risk: 'read-only' },
      { prompt: 'git diff | 108ai Spiega queste modifiche', description: 'Pipe dell\'output di un comando all\'AI', risk: 'read-only' },
      { prompt: 'type report.txt | 108ai --pipe Traduci in inglese', description: 'Processa un file via pipe', risk: 'read-only' },
      { prompt: '108ai Crea un .gitignore per un progetto Node.js > .gitignore', description: 'Genera file direttamente da terminale', risk: 'low' },
    ],
  },
];

const RISK_BADGES: Record<string, { label: string; className: string }> = {
  'read-only': { label: 'Sola lettura', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  'low': { label: 'Basso rischio', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'high': { label: 'Conferma richiesta', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function CapabilityCard({ capability }: { capability: CapabilityInfo }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = capability.icon;

  return (
    <div className={`rounded-xl border transition-all duration-200 ${expanded ? capability.borderColor : 'border-slate-200 dark:border-slate-700'} ${expanded ? capability.bgColor : 'bg-white dark:bg-slate-800'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <Icon className={`w-5 h-5 shrink-0 ${capability.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{capability.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{capability.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400">{capability.examples.length} esempi</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-700/50 pt-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            {capability.id === 'cli' ? 'Prova a scrivere nel terminale:' : 'Prova a scrivere in chat:'}
          </p>
          {capability.examples.map((example, i) => {
            const badge = RISK_BADGES[example.risk] ?? RISK_BADGES['read-only']!;
            return (
              <div
                key={i}
                className="group p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-slate-200 italic leading-snug">
                      &ldquo;{example.prompt}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{example.description}</span>
                      <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CAPABILITY_ICONS: Record<string, typeof FileText> = {
  'filesystem': FileText,
  'clipboard': Clipboard,
  'desktop': MousePointer,
  'system': HardDrive,
  'shell': Terminal,
};

function getCapabilityIcon(action: string) {
  const prefix = action.split('.')[0] ?? '';
  return CAPABILITY_ICONS[prefix] ?? Zap;
}

function formatTime(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}


function HistoryEntry({ entry }: { entry: ActionHistoryEntry }) {
  const Icon = getCapabilityIcon(entry.action);
  const success = !entry.error;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <Icon className={`w-4 h-4 shrink-0 ${success ? 'text-slate-400' : 'text-red-400'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
            {entry.action}
          </span>
          {!success && (
            <span className="text-xs text-red-500 truncate">{entry.error}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
        <span>{formatDuration(entry.durationMs)}</span>
        <span>{formatTime(entry.executedAt)}</span>
      </div>
    </div>
  );
}

export function DesktopAgentPage() {
  const { status, history, isLoading, error, executeAction, refresh } = useDesktopAgent();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await executeAction('system.getSystemInfo');
      setTestResult(JSON.stringify(result.result, null, 2));
    } catch (err) {
      setTestResult(`Errore: ${err instanceof Error ? err.message : 'sconosciuto'}`);
    } finally {
      setTesting(false);
    }
  };

  const connected = status?.connected ?? false;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Desktop Agent</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                L'AI che opera sul tuo PC: file, comandi, ricerche, automazioni — come Claude Code, ma per tutti
              </p>
            </div>
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Status Card */}
        <div className={`rounded-xl border p-4 ${
          connected
            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connected ? (
                <Wifi className="w-5 h-5 text-emerald-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <p className={`font-medium ${connected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {connected ? 'Connesso' : 'Non connesso'}
                </p>
                {connected && status?.connectedAt && (
                  <p className="text-xs text-slate-500">
                    Connesso da: {formatTime(status.connectedAt)} • Ultimo heartbeat: {formatTime(status.lastHeartbeat)}
                  </p>
                )}
              </div>
            </div>

            {connected && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 inline mr-1" />
                {testing ? 'Testing...' : 'Test connessione'}
              </button>
            )}
          </div>

          {/* Capabilities */}
          {connected && status?.capabilities && status.capabilities.length > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Capabilities attive ({status.capabilities.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {status.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Test result */}
          {testResult && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <pre className="text-xs font-mono bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto max-h-40">
                {testResult}
              </pre>
            </div>
          )}
        </div>

        {/* Setup Guide (shown when not connected) */}
        {!connected && !isLoading && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Installa il Desktop Agent
            </h2>

            {/* Download buttons */}
            <div className="mb-5 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800">
              <p className="text-sm font-medium text-primary-800 dark:text-primary-300 mb-3">
                Scarica l'eseguibile per il tuo sistema operativo:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DOWNLOAD_LINKS.map((dl) => (
                  <a
                    key={dl.file}
                    href={`/api/desktop-agent/download/${dl.file}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    <Download className="w-3.5 h-3.5 text-primary-500" />
                    {dl.os}
                    <span className="text-xs text-slate-400 ml-auto">{dl.arch}</span>
                  </a>
                ))}
              </div>
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-2">
                Un solo file. Nessuna installazione. Nessun terminale richiesto.
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Come funziona in 4 passaggi:
            </p>

            <div className="space-y-4">
              {SETUP_STEPS.map((step) => (
                <div key={step.step} className="flex gap-3">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{step.step}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{step.title}</p>
                    {step.note && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{step.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Advantages */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800">
                <Brain className="w-4 h-4 text-violet-500 mb-1" />
                <p className="text-xs font-medium text-violet-800 dark:text-violet-300">Memoria persistente</p>
                <p className="text-xs text-violet-600 dark:text-violet-400">Ricorda tutto su ogni dispositivo</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                <Zap className="w-4 h-4 text-blue-500 mb-1" />
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Aggiornamento automatico</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Si aggiorna da solo, zero manutenzione</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
                <Shield className="w-4 h-4 text-emerald-500 mb-1" />
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Governance integrata</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Chiede conferma per azioni rischiose</p>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Sicurezza:</strong> Il Desktop Agent gira sul tuo PC locale. Ogni azione ha un livello di rischio:
                le operazioni critiche (esecuzione comandi, click) richiedono conferma esplicita. Tutte le azioni vengono
                registrate in un log di audit (<code className="text-amber-800 dark:text-amber-300">~/.108ai/audit.log</code>).
              </p>
            </div>
          </div>
        )}

        {/* What can it do — Interactive */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Cosa puo' fare il Desktop Agent
            </h2>
            <span className="text-xs text-slate-400">Clicca per vedere esempi</span>
          </div>

          {CAPABILITIES.map((cap) => (
            <CapabilityCard key={cap.id} capability={cap} />
          ))}

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>Come funziona:</strong> Quando chatti con l'AI e il Desktop Agent e' connesso, l'assistente puo'
              usare queste capabilities per aiutarti. Scrivi in linguaggio naturale quello che vuoi fare — l'AI traduce
              in azioni concrete. Le operazioni ad alto rischio richiedono conferma esplicita.
            </p>
          </div>
        </div>

        {/* Action History */}
        {history.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Azioni recenti
            </h2>
            <div className="space-y-1">
              {history.slice(0, 10).map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-3">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
