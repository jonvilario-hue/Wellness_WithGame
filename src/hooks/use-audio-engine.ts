'use client';

// This file is deprecated and its contents have been replaced by the new AudioEngineProvider.
// It is kept for backwards compatibility during the transition.
// New components should use the `useAudioEngine` hook from `@/hooks/useAudioEngine.tsx`.

import { useAudioEngine as useNewAudioEngine } from './useAudioEngine';

export const useAudioEngine = () => {
    console.warn("DEPRECATION: `useAudioEngine` from `use-audio-engine.ts` is deprecated. Please import from `@/hooks/useAudioEngine.tsx`");
    const { engine, isReady } = useNewAudioEngine();
    
    // Maintain a semi-compatible API for older components
    return {
        audioContext: engine ? (engine as any).audioContext : null,
        isAudioReady: isReady,
        resumeContext: () => engine?.resumeContext(),
        getAudioContextTime: () => engine ? (engine as any).audioContext.currentTime : 0,
        getLatencyInfo: () => ({ baseLatency: 0, outputLatency: 0, sampleRate: 44100 }),
        scheduleTone: (freq: number, time: number, dur: number) => engine?.playTone({frequency: freq, duration: dur}),
        stopAll: () => engine?.stopAll(),
        playNote: (midi: number, type: OscillatorType, dur: number) => engine?.playTone({frequency: midiToFreq(midi), duration: dur, type}),
        playChord: (notes: number[], dur: number) => { 
            // This is a simplification; a real chord implementation is more complex
            notes.forEach(note => engine?.playTone({frequency: midiToFreq(note), duration: dur}));
            return [];
        },
        playSequence: (notes: (number | AssetId)[], interval: number, onEnd?: () => void) => {
            // This is a simplification
            if (typeof notes[0] === 'string') {
                 engine?.playSequence(notes as any, interval, onEnd);
            }
        },
        playSimultaneous: () => [],
        playFlanker: () => [],
        playCachedAudio: () => Promise.resolve(),
        speak: (text: string, onEnd?: () => void) => engine?.speak(text, onEnd),
        isSupported: engine?.isSpeechSupported ?? false,
    };
};

export const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
