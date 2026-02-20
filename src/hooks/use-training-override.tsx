'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { TrainingFocus } from '@/hooks/use-training-focus';
import { usePathname } from 'next/navigation';

type TrainingOverrideContextType = {
  override: TrainingFocus | null;
  setOverride: (focus: TrainingFocus | null) => void;
  isLoaded: boolean;
};

const TrainingOverrideContext = createContext<TrainingOverrideContextType | undefined>(undefined);

export function TrainingOverrideProvider({ children }: { children: React.ReactNode }) {
  // This state is ephemeral and should not be persisted.
  // It only applies to the current game session view.
  const [override, setOverride] = useState<TrainingFocus | null>(null);
  const pathname = usePathname();

  // If the user navigates away from a training page, clear the override.
  useEffect(() => {
    if (!pathname.startsWith('/training/')) {
        setOverride(null);
    }
  }, [pathname]);

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
