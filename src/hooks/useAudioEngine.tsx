'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { AudioEngine } from '@/lib/audio/AudioEngine';

type AudioEngineContextType = {
  engine: AudioEngine | null;
  isReady: boolean;
};

const AudioEngineContext = createContext<AudioEngineContextType | undefined>(undefined);

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const engine = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new AudioEngine();
    }
    return null;
  }, []);

  const isReady = !!engine;

  const value = useMemo(() => ({ engine, isReady }), [engine, isReady]);

  return (
    <AudioEngineContext.Provider value={value}>
      {children}
    </AudioEngineContext.Provider>
  );
}

export const useAudioEngine = (): AudioEngineContextType => {
  const context = useContext(AudioEngineContext);
  if (context === undefined) {
    throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  }
  return context;
};
