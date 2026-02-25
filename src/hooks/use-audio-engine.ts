'use client';

// This file is deprecated and its contents have been replaced by the new AudioEngineProvider.
// It is kept for backwards compatibility during the transition.
// New components should use the `useAudioEngine` hook from `@/hooks/useAudioEngine.tsx`.

import { useMemo } from 'react';
import { Howler } from 'howler';

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export const useAudioEngine = () => {
    
    const audioContext = Howler.ctx;

    const dummyFunction = () => {
        console.warn("useAudioEngine is deprecated. Please use the new AudioEngineProvider and hook.");
        return null;
    }
    
     const dummyFunctionWithPromise = () => {
        console.warn("useAudioEngine is deprecated. Please use the new AudioEngineProvider and hook.");
        return Promise.resolve();
    }

    const memoizedValue = useMemo(() => ({
        audioContext: audioContext,
        isAudioReady: audioContext?.state === 'running',
        resumeContext: () => Howler.ctx.resume(),
        getAudioContextTime: () => Howler.ctx.currentTime,
        getLatencyInfo: () => ({ baseLatency: (Howler.ctx as any).baseLatency || 0, outputLatency: (Howler.ctx as any).outputLatency || 0, sampleRate: Howler.ctx.sampleRate }),
        scheduleTone: dummyFunction,
        stopAll: () => Howler.stop(),
        playNote: dummyFunction,
        playChord: () => [],
        playSequence: () => [],
        playSimultaneous: () => [],
        playFlanker: () => [],
        playCachedAudio: dummyFunctionWithPromise,
        speak: () => {},
        isSupported: false,
    }), [audioContext]);

    return memoizedValue;
};

export { midiToFreq };
