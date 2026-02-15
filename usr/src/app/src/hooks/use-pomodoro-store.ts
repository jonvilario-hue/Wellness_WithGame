'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type PomodoroState = {
  sessionsCompleted: number;
  lastSessionDate: string | null;
  incrementSessions: () => void;
};

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set) => ({
      sessionsCompleted: 0,
      lastSessionDate: null,
      incrementSessions: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          sessionsCompleted: state.sessionsCompleted + 1,
          lastSessionDate: today,
        }));
      },
    }),
    {
      name: 'pomodoro-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
