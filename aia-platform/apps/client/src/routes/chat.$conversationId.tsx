import { useEffect, useRef } from 'react';
import { useParams } from '@tanstack/react-router';
import { MessageSquare } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { SmartTip } from '@/components/chat/SmartTip';
import { StreamingIndicator } from '@/components/chat/StreamingIndicator';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { detectTip } from '@/lib/tip-detector';

export function ChatPage() {
  const { conversationId } = useParams({ from: '/chat/$conversationId' });
  const { messages, isStreaming, sendMessage, isLoading, error } = useChat(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isStreaming]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <MessageSquare className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          Failed to load conversation
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No messages yet. Start the conversation below.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const tip = message.role === 'assistant' ? detectTip(message.content) : null;
              return (
                <div key={message.id}>
                  <MessageBubble message={message} />
                  {tip && <SmartTip tip={tip} />}
                </div>
              );
            })
          )}

          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <StreamingIndicator />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        onSend={sendMessage}
        disabled={isStreaming}
        placeholder={isStreaming ? 'Waiting for response...' : 'Type your message...'}
      />
    </div>
  );
}
