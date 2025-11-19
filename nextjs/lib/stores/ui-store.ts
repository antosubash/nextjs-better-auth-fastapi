"use client";

import { create } from "zustand";

interface DialogState {
  [key: string]: boolean;
}

interface ExpandedItemsState {
  [key: string]: Set<string>;
}

interface UIState {
  dialogs: DialogState;
  expandedItems: ExpandedItemsState;
}

interface UIActions {
  openDialog: (key: string) => void;
  closeDialog: (key: string) => void;
  toggleDialog: (key: string) => void;
  isDialogOpen: (key: string) => boolean;
  toggleExpandedItem: (key: string, itemId: string) => void;
  isItemExpanded: (key: string, itemId: string) => boolean;
  clearExpandedItems: (key: string) => void;
  reset: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set, get) => ({
  // State
  dialogs: {},
  expandedItems: {},

  // Actions
  openDialog: (key) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [key]: true },
    })),

  closeDialog: (key) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [key]: false },
    })),

  toggleDialog: (key) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [key]: !state.dialogs[key] },
    })),

  isDialogOpen: (key) => get().dialogs[key] ?? false,

  toggleExpandedItem: (key, itemId) =>
    set((state) => {
      const currentSet = state.expandedItems[key] ?? new Set<string>();
      const newSet = new Set(currentSet);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return {
        expandedItems: { ...state.expandedItems, [key]: newSet },
      };
    }),

  isItemExpanded: (key, itemId) => {
    const set = get().expandedItems[key];
    return set?.has(itemId) ?? false;
  },

  clearExpandedItems: (key) =>
    set((state) => {
      const newExpandedItems = { ...state.expandedItems };
      delete newExpandedItems[key];
      return { expandedItems: newExpandedItems };
    }),

  reset: () => set({ dialogs: {}, expandedItems: {} }),
}));
