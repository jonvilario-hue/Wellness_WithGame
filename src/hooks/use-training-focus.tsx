'use client';

import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import type { TrainingFocus } from '@/types';
import { usePerformanceStore } from './use-performance-store';

const TRAINING_FOCUS_KEY = 'trainingFocus';

type TrainingFocusContextType = {
  focus: TrainingFocus;
  setFocus: (focus: TrainingFocus) => void;
  isLoaded: boolean;
};

const TrainingFocusContext = createContext<TrainingFocusContextType | undefined>(undefined);

export function TrainingFocusProvider({ children }: { children: React.ReactNode }) {
  const [focus, setFocusState] = useState<TrainingFocus>('neutral');
  const [isLoaded, setIsLoaded] = useState(false);
  const handleFocusChangeInPerformanceStore = usePerformanceStore((state) => state.handleFocusChange);

  useEffect(() => {
    try {
      const savedFocus = window.localStorage.getItem(TRAINING_FOCUS_KEY) as TrainingFocus | null;
      if (savedFocus && ['neutral', 'math', 'music', 'verbal', 'spatial', 'eq', 'logic'].includes(savedFocus)) {
        setFocusState(savedFocus);
      }
    } catch (error) {
      console.error("Failed to load training focus from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  const setFocus = useCallback((newFocus: TrainingFocus) => {
    try {
      setFocusState(newFocus);
      window.localStorage.setItem(TRAINING_FOCUS_KEY, newFocus);
      handleFocusChangeInPerformanceStore(newFocus);
    } catch (error) {
      console.error("Failed to save training focus to localStorage", error);
    }
  }, [handleFocusChangeInPerformanceStore]);

  const value = useMemo(() => ({ focus, setFocus, isLoaded }), [focus, setFocus, isLoaded]);

  return (
    <TrainingFocusContext.Provider value={value}>
      {children}
    </TrainingFocusContext.Provider>
  );
}

export const useTrainingFocus = (): TrainingFocusContextType => {
  const context = useContext(TrainingFocusContext);
  if (!context) {
    throw new Error('useTrainingFocus must be used within a TrainingFocusProvider');
  }
  return context;
};
