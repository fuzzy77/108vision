import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Send, Bot, User, RotateCcw } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AgentTestChatProps {
  agentName: string;
  onSendMessage: (message: string) => Promise<string>;
  className?: string;
}

function AgentTestChat({ agentName, onSendMessage, className }: AgentTestChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await onSendMessage(userMessage.content);
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-resp`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: 'Errore nella risposta. Riprova.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className={cn('flex flex-col h-full border border-slate-200 rounded-xl bg-white dark:border-slate-700 dark:bg-slate-800', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary-100 p-1.5 dark:bg-primary-900/30">
            <Bot className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Test: {agentName}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Invia un messaggio per testare l&apos;agente</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2',
              msg.role === 'assistant' ? 'justify-start' : 'justify-end',
            )}
          >
            {msg.role === 'assistant' && (
              <div className="rounded-full bg-primary-100 p-1 h-fit mt-0.5 dark:bg-primary-900/30">
                <Bot className="h-3 w-3 text-primary-600 dark:text-primary-400" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                msg.role === 'assistant'
                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                  : 'bg-primary-600 text-white',
              )}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="rounded-full bg-slate-200 p-1 h-fit mt-0.5 dark:bg-slate-600">
                <User className="h-3 w-3 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="rounded-full bg-primary-100 p-1 h-fit dark:bg-primary-900/30">
              <Bot className="h-3 w-3 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="bg-slate-100 rounded-lg px-3 py-2 dark:bg-slate-700">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi un messaggio di test..."
            className="flex-1 h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            disabled={isLoading}
          />
          <Button type="submit" size="sm" disabled={!input.trim() || isLoading}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export { AgentTestChat };
