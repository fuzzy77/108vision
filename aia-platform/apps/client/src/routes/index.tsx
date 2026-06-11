import { MessageSquarePlus, Sparkles } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useChatStore } from '@/stores/chat.store';
import { useChat } from '@/hooks/useChat';
import { AgentSelector } from '@/components/chat/AgentSelector';
import { MessageInput } from '@/components/chat/MessageInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function HomePage() {
  const { agents, isLoading } = useAgents();
  const { selectedAgentId } = useChatStore();
  const { sendMessage, isStreaming } = useChat(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 pt-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Welcome to AIA Assistant
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              Select an AI agent below and start a conversation. Your assistant is ready to help
              with any task.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4" />
              Choose an Agent
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <AgentSelector agents={agents} />
            )}
          </div>

          {!selectedAgentId && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
              Select an agent above to start chatting
            </p>
          )}
        </div>
      </div>

      <MessageInput
        onSend={sendMessage}
        disabled={!selectedAgentId || isStreaming}
        placeholder={
          selectedAgentId
            ? 'Start a new conversation...'
            : 'Select an agent first...'
        }
      />
    </div>
  );
}
