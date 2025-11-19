"use client";

import { create } from "zustand";

interface JobHistoryState {
  page: number;
  pageSize: number;
  selectedJobId: string | undefined;
  expandedItems: Set<string>;
  copiedId: string | null;
}

interface JobHistoryActions {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSelectedJobId: (jobId: string | undefined) => void;
  toggleExpandedItem: (itemId: string) => void;
  setCopiedId: (id: string | null) => void;
  reset: () => void;
}

type JobHistoryStore = JobHistoryState & JobHistoryActions;

const initialState: JobHistoryState = {
  page: 1,
  pageSize: 10,
  selectedJobId: undefined,
  expandedItems: new Set(),
  copiedId: null,
};

export const useJobHistoryStore = create<JobHistoryStore>((set) => ({
  ...initialState,

  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setSelectedJobId: (jobId) => set({ selectedJobId: jobId, page: 1 }),
  toggleExpandedItem: (itemId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedItems);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return { expandedItems: newExpanded };
    }),
  setCopiedId: (id) => set({ copiedId: id }),
  reset: () => set(initialState),
}));
