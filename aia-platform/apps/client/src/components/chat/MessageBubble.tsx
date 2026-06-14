import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { Message } from '@/lib/api';

interface MessageBubbleProps {
  message: Message;
}

const CONFIDENCE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  '[verificato]': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'verificato' },
  '[probabile]': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'probabile' },
  '[non verificato]': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'non verificato' },
  '[ignoto]': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'ignoto' },
};

function renderConfidenceBadges(html: string): string {
  for (const [marker, style] of Object.entries(CONFIDENCE_BADGES)) {
    const escaped = marker.replace(/[[\]]/g, '\\$&');
    html = html.replace(
      new RegExp(escaped, 'g'),
      `<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}">${style.label}</span>`,
    );
  }
  return html;
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    '<pre class="bg-slate-900 text-slate-100 rounded-lg p-3 my-2 overflow-x-auto text-sm"><code>$2</code></pre>',
  );

  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
  );

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  html = html.replace(
    /^[-*] (.+)$/gm,
    '<li class="ml-4 list-disc">$1</li>',
  );
  html = html.replace(
    /^(\d+)\. (.+)$/gm,
    '<li class="ml-4 list-decimal">$2</li>',
  );

  html = html.replace(/\n/g, '<br/>');

  html = renderConfidenceBadges(html);

  return html;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'system') {
    return (
      <div className="flex justify-center my-3">
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-500 dark:text-slate-400 max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div
        className={`
          relative max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl
          ${
            isUser
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-md shadow-sm'
          }
        `}
      >
        <div
          className="text-sm leading-relaxed break-words prose-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />

        <div
          className={`
            flex items-center gap-2 mt-2 text-xs
            ${isUser ? 'text-primary-200' : 'text-slate-400 dark:text-slate-500'}
          `}
        >
          <span>{formatDate(message.createdAt)}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
