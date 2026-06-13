import { Bot, Brain, Code, FileText, HelpCircle, Sparkles } from 'lucide-react';
import { useChatStore } from '@/stores/chat.store';
import type { Agent } from '@/lib/api';

interface AgentSelectorProps {
  agents: Agent[];
}

const iconMap: Record<string, typeof Bot> = {
  bot: Bot,
  brain: Brain,
  code: Code,
  file: FileText,
  help: HelpCircle,
  sparkles: Sparkles,
};

const modelLabels: Record<string, string> = {
  'fast-cheap': 'Veloce',
  balanced: 'Bilanciato',
  powerful: 'Potente',
};

function getAgentIcon(icon?: string) {
  const IconComponent = iconMap[icon ?? 'bot'] ?? Bot;
  return <IconComponent className="w-6 h-6" />;
}

export function AgentSelector({ agents }: AgentSelectorProps) {
  const { selectedAgentId, selectAgent } = useChatStore();

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nessun agente disponibile</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => {
        const isSelected = selectedAgentId === agent.id;
        return (
          <button
            key={agent.id}
            onClick={() => selectAgent(agent.id)}
            className={`
              p-4 rounded-xl border-2 text-left transition-all duration-150
              hover:shadow-md
              ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }
            `}
            aria-pressed={isSelected}
          >
            <div
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center mb-3
                ${isSelected ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}
              `}
            >
              {getAgentIcon(agent.icon)}
            </div>
            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">
              {agent.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {agent.description || 'AI Assistant'}
            </p>
            {(agent.model || agent.defaultModel) && (
              <div className="mt-2">
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] rounded">
                  {modelLabels[agent.model ?? agent.defaultModel ?? ''] ?? agent.model ?? agent.defaultModel}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
