import { create } from 'zustand';

export type ModelPreference = 'fast' | 'balanced' | 'powerful';

interface ChatState {
  currentConversationId: string | null;
  isStreaming: boolean;
  streamingMessage: string;
  selectedAgentId: string | null;
  modelPreference: ModelPreference;
  sidebarOpen: boolean;
}

interface ChatActions {
  setConversationId: (id: string | null) => void;
  startStreaming: () => void;
  appendToken: (token: string) => void;
  stopStreaming: () => void;
  selectAgent: (agentId: string) => void;
  selectModel: (model: ModelPreference) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const getStoredModel = (): ModelPreference => {
  const stored = localStorage.getItem('aia_model_preference');
  if (stored === 'fast' || stored === 'balanced' || stored === 'powerful') {
    return stored;
  }
  return 'balanced';
};

const getStoredAgent = (): string | null => {
  return localStorage.getItem('aia_default_agent');
};

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  currentConversationId: null,
  isStreaming: false,
  streamingMessage: '',
  selectedAgentId: getStoredAgent(),
  modelPreference: getStoredModel(),
  sidebarOpen: false,

  setConversationId: (id) => set({ currentConversationId: id }),

  startStreaming: () => set({ isStreaming: true, streamingMessage: '' }),

  appendToken: (token) =>
    set((state) => ({
      streamingMessage: state.streamingMessage + token,
    })),

  stopStreaming: () => set({ isStreaming: false }),

  selectAgent: (agentId) => {
    localStorage.setItem('aia_default_agent', agentId);
    set({ selectedAgentId: agentId });
  },

  selectModel: (model) => {
    localStorage.setItem('aia_model_preference', model);
    set({ modelPreference: model });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
