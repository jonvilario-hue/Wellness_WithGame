
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CHCDomain } from '@/types';

type TrainingMode = 'neutral' | 'math' | 'music';

type PerformanceMetric = {
  score: number;
  totalTime: number; // in seconds
  sessions: number;
  trend: number; // calculated on the fly
  history: number[]; // last 5 scores
};

type DomainPerformance = {
  neutral: PerformanceMetric;
  math: PerformanceMetric;
  music: PerformanceMetric;
};

type PerformanceState = {
  performance: Record<CHCDomain, DomainPerformance>;
  logGameResult: (domain: CHCDomain, mode: TrainingMode, result: { score: number; time: number }) => void;
};

const initialMetric = (): PerformanceMetric => ({
  score: 0,
  totalTime: 0,
  sessions: 0,
  trend: 0,
  history: [],
});

const initialDomainPerformance = (): DomainPerformance => ({
  neutral: initialMetric(),
  math: initialMetric(),
  music: initialMetric(),
});

const initialPerformanceState = (): Record<CHCDomain, DomainPerformance> => ({
  Gf: initialDomainPerformance(),
  Gc: initialDomainPerformance(),
  Gwm: initialDomainPerformance(),
  Gs: initialDomainPerformance(),
  Gv: initialDomainPerformance(),
  Ga: initialDomainPerformance(),
  Glr: initialDomainPerformance(),
  EF: initialDomainPerformance(),
});


export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      performance: initialPerformanceState(),
      
      logGameResult: (domain, mode, result) => {
        set((state) => {
          const newPerformance = { ...state.performance };
          const domainData = { ...newPerformance[domain] };
          const modeData = { ...domainData[mode] };
          
          const newHistory = [...modeData.history, result.score].slice(-5);
          const oldAverageScore = modeData.score;
          const newAverageScore = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;

          const newModeData: PerformanceMetric = {
            sessions: modeData.sessions + 1,
            score: Math.round(newAverageScore),
            totalTime: modeData.totalTime + result.time,
            history: newHistory,
            trend: oldAverageScore > 0 ? Math.round(((newAverageScore - oldAverageScore) / oldAverageScore) * 100) : 0,
          };

          newPerformance[domain] = {
            ...domainData,
            [mode]: newModeData,
          };
          
          return { performance: newPerformance };
        });
      },
    }),
    {
      name: 'cognitive-performance-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
