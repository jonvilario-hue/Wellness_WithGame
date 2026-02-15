
'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import type { TrainingFocus } from './use-training-focus';

type TrainingOverrideContextType = {
  override: TrainingFocus | null;
  setOverride: (focus: TrainingFocus | null) => void;
  isLoaded: boolean;
};

const TrainingOverrideContext = createContext<TrainingOverrideContextType | undefined>(undefined);

export function TrainingOverrideProvider({ children }: { children: React.ReactNode }) {
  const [override, setOverride] = useState<TrainingFocus | null>(null);

  const value = useMemo(() => ({
    override,
    setOverride,
    isLoaded: true, // This state is not persisted, so it's always "loaded"
  }), [override]);

  return (
    <TrainingOverrideContext.Provider value={value}>
      {children}
    </TrainingOverrideContext.Provider>
  );
}

export const useTrainingOverride = (): TrainingOverrideContextType => {
  const context = useContext(TrainingOverrideContext);
  if (context === undefined) {
    throw new Error('useTrainingOverride must be used within a TrainingOverrideProvider');
  }
  return context;
};
