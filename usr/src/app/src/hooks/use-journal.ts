'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type JournalEntry = {
  id: string;
  date: string;
  content: string;
  mood?: number;
};

type JournalState = {
  entries: Record<string, JournalEntry>;
};

type JournalActions = {
  addOrUpdateEntry: (entry: JournalEntry) => void;
  deleteEntry: (id: string) => void;
  getTodaysEntry: () => JournalEntry | undefined;
};

const useJournalStore = create<JournalState & JournalActions>()(
  persist(
    immer((set, get) => ({
      entries: {},
      addOrUpdateEntry: (entry) =>
        set((state) => {
          state.entries[entry.id] = entry;
        }),
      deleteEntry: (id) =>
        set((state) => {
          delete state.entries[id];
        }),
      getTodaysEntry: () => {
        const today = new Date().toISOString().split('T')[0];
        const entries = Object.values(get().entries);
        return entries.find((entry) => entry.date.startsWith(today));
      }
    })),
    {
      name: 'journal-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useHydratedJournalStore = useJournalStore;
