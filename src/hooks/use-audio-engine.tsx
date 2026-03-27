
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { AudioEngine } from '@/lib/audio/AudioEngine';

type AudioEngineContextType = {
  engine: AudioEngine | null;
  isReady: boolean;
  initializeAudio: () => Promise<void>;
};

const AudioEngineContext = createContext<AudioEngineContextType | undefined>(undefined);

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initializeAudio = useCallback(async () => {
    if (isReady || !engine) return;
    await engine.resumeContext();
    if (engine.isReady) {
        setIsReady(true);
        console.log('[AudioEngineProvider] Audio is now ready.');
    }
  }, [engine, isReady]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !engine) {
        const newEngine = new AudioEngine();
        setEngine(newEngine);
        // Do not set isReady here; wait for user gesture.
    }
    // Cleanup on unmount
    return () => {
      engine?.cleanup();
    };
  }, [engine]);

  const value = useMemo(() => ({
    engine,
    isReady,
    initializeAudio,
  }), [engine, isReady, initializeAudio]);

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
