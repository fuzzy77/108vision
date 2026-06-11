import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { streamTokens } from '@/lib/sse';
import { useChatStore } from '@/stores/chat.store';
import type { Message } from '@/lib/api';

export function useChat(conversationId: string | null) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    isStreaming,
    streamingMessage,
    selectedAgentId,
    modelPreference,
    startStreaming,
    appendToken,
    stopStreaming,
    setConversationId,
  } = useChatStore();

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => {
      if (!conversationId) return [] as Message[];
      return api.getMessages(conversationId);
    },
    enabled: !!conversationId,
  });

  const messages: Message[] = [
    ...(messagesQuery.data ?? []),
    ...(isStreaming && streamingMessage
      ? [
          {
            id: 'streaming',
            conversationId: conversationId ?? '',
            role: 'assistant' as const,
            content: streamingMessage,
            createdAt: new Date().toISOString(),
          },
        ]
      : []),
  ];

  const sendMessage = useCallback(
    async (text: string) => {
      if (!selectedAgentId || isStreaming) return;

      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: conversationId ?? '',
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        ['messages', conversationId],
        (prev) => [...(prev ?? []), userMessage],
      );

      startStreaming();

      try {
        const response = await api.sendMessage(
          conversationId,
          text,
          selectedAgentId,
          modelPreference,
        );

        const contentType = response.headers.get('content-type') ?? '';

        if (contentType.includes('text/event-stream')) {
          for await (const token of streamTokens(response)) {
            if (token.done) break;
            appendToken(token.content);
          }
        } else {
          const data = await response.json();
          if (data.conversationId && !conversationId) {
            setConversationId(data.conversationId);
            navigate({ to: '/chat/$conversationId', params: { conversationId: data.conversationId } });
          }
          if (data.content) {
            appendToken(data.content);
          }
        }

        const newConversationId =
          response.headers.get('x-conversation-id') ?? conversationId;

        if (newConversationId && newConversationId !== conversationId) {
          setConversationId(newConversationId);
          navigate({ to: '/chat/$conversationId', params: { conversationId: newConversationId } });
        }

        stopStreaming();

        const finalConvId = newConversationId ?? conversationId;
        if (finalConvId) {
          await queryClient.invalidateQueries({ queryKey: ['messages', finalConvId] });
          await queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      } catch (error) {
        stopStreaming();
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message';
        queryClient.setQueryData<Message[]>(
          ['messages', conversationId],
          (prev) => [
            ...(prev ?? []),
            {
              id: `error-${Date.now()}`,
              conversationId: conversationId ?? '',
              role: 'system',
              content: `Error: ${errorMessage}`,
              createdAt: new Date().toISOString(),
            },
          ],
        );
      }
    },
    [
      conversationId,
      selectedAgentId,
      modelPreference,
      isStreaming,
      queryClient,
      navigate,
      startStreaming,
      appendToken,
      stopStreaming,
      setConversationId,
    ],
  );

  return {
    messages,
    isStreaming,
    sendMessage,
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
  };
}
