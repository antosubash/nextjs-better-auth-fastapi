"use client";

import { create } from "zustand";

interface ChatState {
  selectedConversationId: string | null;
  sidebarOpen: boolean;
  showTimestamps: boolean;
  model: string;
  initializedConversationId: string | null;
  input: string;
}

interface ChatActions {
  setSelectedConversationId: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setShowTimestamps: (show: boolean) => void;
  toggleTimestamps: () => void;
  setModel: (model: string) => void;
  setInitializedConversationId: (id: string | null) => void;
  setInput: (input: string) => void;
  clearChat: () => void;
  initializeModel: (models: Array<{ name: string }>) => void;
  shouldInitializeMessages: (
    conversationId: string | null,
    hasMessages: boolean,
    messagesCount: number
  ) => boolean;
  clearMessages: () => void;
  shouldClearMessages: (conversationId: string | null) => boolean;
}

type ChatStore = ChatState & ChatActions;

const initialState: ChatState = {
  selectedConversationId: null,
  sidebarOpen: false,
  showTimestamps: true,
  model: "",
  initializedConversationId: null,
  input: "",
};

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  setSelectedConversationId: (id) => {
    const currentId = get().selectedConversationId;
    set({ selectedConversationId: id });
    // Clear initialized conversation when switching to a different one
    if (id !== currentId && id !== get().initializedConversationId) {
      set({ initializedConversationId: null });
    }
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setShowTimestamps: (show) => set({ showTimestamps: show }),

  toggleTimestamps: () => set((state) => ({ showTimestamps: !state.showTimestamps })),

  setModel: (model) => set({ model }),

  setInitializedConversationId: (id) => set({ initializedConversationId: id }),

  setInput: (input) => set({ input }),

  clearChat: () =>
    set({
      selectedConversationId: null,
      initializedConversationId: null,
      input: "",
    }),

  initializeModel: (models) => {
    const { model } = get();
    if (!model && models.length > 0) {
      const defaultModel = models.find((m) => m.name.includes("qwen3:8b"))?.name || models[0]?.name;
      if (defaultModel) {
        set({ model: defaultModel });
      }
    }
  },

  clearMessages: () => {
    // This will be called from the component to clear useChat messages
  },

  shouldClearMessages: (conversationId) => {
    const { selectedConversationId } = get();
    return conversationId !== selectedConversationId;
  },

  shouldInitializeMessages: (conversationId, hasMessages, messagesCount) => {
    const { initializedConversationId } = get();
    return (
      conversationId !== null &&
      hasMessages &&
      initializedConversationId !== conversationId &&
      messagesCount === 0
    );
  },
}));
