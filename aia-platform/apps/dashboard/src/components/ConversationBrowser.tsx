import { useState } from 'react';
import type { Conversation, Message } from '@/types';
import { cn, formatRelative, formatTokens } from '@/lib/utils';
import { ChevronDown, ChevronRight, MessageSquare, Bot, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ConversationBrowserProps {
  conversations: Conversation[];
  messages?: Record<string, Message[]>;
  onExpand: (conversationId: string) => void;
  loading?: boolean;
}

function ConversationBrowser({ conversations, messages = {}, onExpand, loading }: ConversationBrowserProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nessuna conversazione trovata</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const isExpanded = expanded === conv.id;
        const convMessages = messages[conv.id];

        return (
          <div key={conv.id} className="border border-slate-200 rounded-lg dark:border-slate-700">
            <button
              onClick={() => {
                if (isExpanded) {
                  setExpanded(null);
                } else {
                  setExpanded(conv.id);
                  if (!convMessages) onExpand(conv.id);
                }
              }}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {conv.agentName}
                  </span>
                  {conv.userName && (
                    <span className="text-xs text-slate-400">con {conv.userName}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>{conv.messagesCount} messaggi</span>
                  <span>{formatTokens(conv.tokensUsed)} token</span>
                  <span>{formatRelative(conv.lastMessageAt)}</span>
                </div>
              </div>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                conv.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
              )}>
                {conv.status === 'active' ? 'Attiva' : 'Chiusa'}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-3 max-h-96 overflow-y-auto">
                {!convMessages ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-12 w-2/3 ml-auto" />
                    <Skeleton className="h-12 w-3/4" />
                  </div>
                ) : (
                  convMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2',
                        msg.role === 'assistant' ? 'justify-start' : 'justify-end',
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="rounded-full bg-primary-100 p-1.5 h-fit dark:bg-primary-900/30">
                          <Bot className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                          msg.role === 'assistant'
                            ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                            : 'bg-primary-600 text-white',
                        )}
                      >
                        {msg.content}
                      </div>
                      {msg.role === 'user' && (
                        <div className="rounded-full bg-slate-200 p-1.5 h-fit dark:bg-slate-600">
                          <User className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { ConversationBrowser };
