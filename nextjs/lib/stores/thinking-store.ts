"use client";

import { create } from "zustand";

interface ThinkingSession {
  id: string;
  chunkId?: number;
  content: string;
  updatedAt: number;
}

interface ThinkingState {
  current: ThinkingSession | null;
  isVisible: boolean;
}

interface ThinkingActions {
  startThinking: (sessionId: string, chunkId?: number) => void;
  updateThinking: (sessionId: string, content: string, chunkId?: number) => void;
  stopThinking: (sessionId: string) => void;
  resetThinking: () => void;
  toggleVisibility: () => void;
  hideThinking: () => void;
}

export type ThinkingStore = ThinkingState & ThinkingActions;

export const useThinkingStore = create<ThinkingStore>((set, get) => ({
  current: null,
  isVisible: true,

  startThinking: (sessionId, chunkId) => {
    const current = get().current;
    if (current && current.id === sessionId) {
      return;
    }

    set({
      current: {
        id: sessionId,
        chunkId,
        content: "",
        updatedAt: Date.now(),
      },
    });
  },

  updateThinking: (sessionId, content, chunkId) => {
    set((state) => {
      if (state.current?.id !== sessionId) {
        return state;
      }

      return {
        ...state,
        current: {
          id: sessionId,
          chunkId: chunkId ?? state.current.chunkId,
          content: (state.current?.content || "") + content,
          updatedAt: Date.now(),
        },
      };
    });
  },

  stopThinking: (sessionId) => {
    set((state) => {
      if (state.current?.id !== sessionId) {
        return state;
      }
      return {
        ...state,
        current: null,
      };
    });
  },

  resetThinking: () => {
    set((state) => ({
      ...state,
      current: null,
    }));
  },

  toggleVisibility: () => set((state) => ({ ...state, isVisible: !state.isVisible })),

  hideThinking: () => set((state) => (state.isVisible ? { ...state, isVisible: false } : state)),
}));
