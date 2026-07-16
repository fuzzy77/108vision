import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Copy, Check, ExternalLink, Terminal, Code2, Boxes, Globe2, Sparkles } from 'lucide-react';

interface ToolConfig {
  id: string;
  name: string;
  icon: typeof Terminal;
  description: string;
  category: 'ide' | 'cli' | 'web';
  configSnippet: (baseUrl: string, apiKey: string) => string;
  configFormat: string;
  docsUrl?: string;
}

const TOOLS: ToolConfig[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: Terminal,
    description: 'CLI agent con shell, file system e tool completi. Usa il formato Anthropic Messages.',
    category: 'cli',
    configFormat: 'Environment variables',
    configSnippet: (baseUrl, apiKey) =>
      `# Aggiungi al tuo terminale o .bashrc/.zshrc
export ANTHROPIC_BASE_URL="${baseUrl}"
export ANTHROPIC_API_KEY="${apiKey}"

# Verifica connessione:
# claude "hello"`,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: Code2,
    description: 'IDE AI-native. Configura come provider OpenAI custom nelle impostazioni.',
    category: 'ide',
    configFormat: 'Settings > Models > OpenAI',
    configSnippet: (baseUrl, apiKey) =>
      `// Cursor Settings > Models > Add Model
// Provider: OpenAI
// Base URL: ${baseUrl}
// API Key: ${apiKey}
//
// Modelli disponibili:
//   gpt-4o        → bilanciato (DeepSeek R1 / Qwen)
//   gpt-4o-mini   → veloce ed economico
//   gpt-4-turbo   → potente
//   deepseek-coder → ottimizzato per codice`,
  },
  {
    id: 'continue',
    name: 'Continue (VS Code)',
    icon: Boxes,
    description: 'Extension VS Code / JetBrains con autocomplete, chat e agent. Supporta MCP.',
    category: 'ide',
    configFormat: '~/.continue/config.json',
    configSnippet: (baseUrl, apiKey) =>
      `// ~/.continue/config.json
{
  "models": [
    {
      "title": "108 AI (Balanced)",
      "provider": "openai",
      "model": "gpt-4o",
      "apiBase": "${baseUrl}",
      "apiKey": "${apiKey}"
    },
    {
      "title": "108 AI (Fast)",
      "provider": "openai",
      "model": "gpt-4o-mini",
      "apiBase": "${baseUrl}",
      "apiKey": "${apiKey}"
    }
  ],
  "mcpServers": [
    {
      "name": "108ai-knowledge",
      "url": "${baseUrl.replace('/v1', '/mcp')}",
      "headers": { "Authorization": "Bearer ${apiKey}" }
    }
  ]
}`,
  },
  {
    id: 'aider',
    name: 'aider',
    icon: Terminal,
    description: 'CLI pair programming, git-aware, multi-file edit. OpenAI-compatible.',
    category: 'cli',
    configFormat: 'Environment variables',
    configSnippet: (baseUrl, apiKey) =>
      `# Aggiungi al tuo terminale o .bashrc/.zshrc
export OPENAI_API_BASE="${baseUrl}"
export OPENAI_API_KEY="${apiKey}"

# Oppure usa direttamente:
aider --openai-api-base "${baseUrl}" --openai-api-key "${apiKey}" --model gpt-4o`,
  },
  {
    id: 'open-webui',
    name: 'Open WebUI',
    icon: Globe2,
    description: 'Interfaccia web self-hosted stile ChatGPT. Multi-utente, RAG integrato.',
    category: 'web',
    configFormat: 'Settings > Connections > OpenAI',
    configSnippet: (baseUrl, apiKey) =>
      `# Open WebUI → Admin Settings → Connections → OpenAI API
# URL:     ${baseUrl}
# API Key: ${apiKey}
#
# Oppure via environment (docker-compose):
# OPENAI_API_BASE_URL=${baseUrl}
# OPENAI_API_KEY=${apiKey}`,
  },
  {
    id: 'mcp-generic',
    name: 'MCP (qualsiasi client)',
    icon: Sparkles,
    description: 'Server MCP per accedere a Knowledge Base, Memorie e Agenti da qualsiasi client compatibile.',
    category: 'cli',
    configFormat: 'MCP config (JSON)',
    configSnippet: (baseUrl, apiKey) =>
      `// Configurazione MCP server (per Claude Code, Cursor, Continue, ecc.)
{
  "mcpServers": {
    "108ai": {
      "url": "${baseUrl.replace('/v1', '/mcp')}",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer ${apiKey}"
      }
    }
  }
}

// Tool disponibili:
//   search_knowledge — cerca nella Knowledge Base aziendale
//   get_memories     — recupera memorie persistenti
//   store_memory     — salva nuove memorie
//   list_agents      — lista agenti configurati
//   list_documents   — lista documenti nella KB`,
  },
];

interface ExternalToolsTabProps {
  apiKey?: string;
  gatewayUrl?: string;
}

function ExternalToolsTab({ apiKey, gatewayUrl }: ExternalToolsTabProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseUrl = gatewayUrl || `${window.location.origin}/v1`;
  const displayKey = apiKey || 'sk-108-YOUR-API-KEY';

  function handleCopy(toolId: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(toolId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Strumenti Esterni</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Collega IDE, CLI e interfacce web al gateway 108 AI. Tutti i consumi vengono tracciati e la Knowledge Base e accessibile via RAG o MCP.
        </p>
      </div>

      {!apiKey && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Nota:</strong> Crea una API key nella sezione Tenant per ottenere gli snippet pre-configurati.
            Gli snippet sotto usano un placeholder.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {TOOLS.map((tool) => {
          const snippet = tool.configSnippet(baseUrl, displayKey);
          const Icon = tool.icon;

          return (
            <Card key={tool.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{tool.name}</CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{tool.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={
                      tool.category === 'ide' ? 'blue' :
                      tool.category === 'cli' ? 'emerald' : 'purple'
                    }>
                      {tool.category === 'ide' ? 'IDE' :
                       tool.category === 'cli' ? 'CLI' : 'Web'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {tool.configFormat}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(tool.id, snippet)}
                    >
                      {copiedId === tool.id ? (
                        <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copiato</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Copia</>
                      )}
                    </Button>
                  </div>
                  <pre className="rounded-lg bg-slate-900 p-3 text-xs text-slate-100 overflow-x-auto font-mono leading-relaxed">
                    {snippet}
                  </pre>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-700 dark:text-slate-200">Come funziona</p>
              <ul className="mt-1 space-y-1 text-slate-500 dark:text-slate-400 list-disc list-inside">
                <li>Ogni richiesta e autenticata con la tua API key e tracciata nel billing</li>
                <li>Il model name viene mappato ai tier interni (gpt-4o → balanced, gpt-4o-mini → fast)</li>
                <li>Budget e rate limiting vengono applicati automaticamente</li>
                <li>Aggiungi lo scope <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">proxy:rag</code> alla key per iniettare automaticamente il contesto KB</li>
                <li>Usa il server MCP per accedere a Knowledge Base e Memorie come tool</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { ExternalToolsTab };
