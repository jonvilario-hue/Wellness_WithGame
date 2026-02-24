'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

// --- Type Definitions ---
interface ActiveVoice {
  osc: OscillatorNode;
  gain: GainNode;
  scheduledEnd: number;
}

export interface ToneHandle {
  scheduledOnset: number;
  scheduledEnd: number;
  voice: ActiveVoice;
}

// --- Singleton AudioContext ---
let audioContextInstance: AudioContext | null = null;
const getAudioContext = () => {
    // 7. Guard the singleton against a closed AudioContext.
    if (typeof window !== 'undefined' && (!audioContextInstance || audioContextInstance.state === 'closed')) {
        if (audioContextInstance && audioContextInstance.state === 'closed') {
            audioContextInstance = null;
        }
        try {
            audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }
    }
    return audioContextInstance;
};

export const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export const useAudioEngine = () => {
    const context = getAudioContext();
    const [isAudioReady, setIsAudioReady] = useState(context ? context.state === 'running' : false);
    // 1. Restructure activeSources to use a typed voice interface.
    const activeVoices = useRef<ActiveVoice[]>([]);

    // 2. Add a master output chain with a limiter.
    const masterGainRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);

    if (context && !masterGainRef.current) {
        masterGainRef.current = context.createGain();
        masterGainRef.current.gain.value = 0.5;

        compressorRef.current = context.createDynamicsCompressor();
        compressorRef.current.threshold.value = -6;
        compressorRef.current.knee.value = 30;
        compressorRef.current.ratio.value = 12;
        compressorRef.current.attack.value = 0.003;
        compressorRef.current.release.value = 0.25;

        masterGainRef.current.connect(compressorRef.current);
        compressorRef.current.connect(context.destination);
    }
    
    const resumeContext = useCallback(async () => {
        if (context && context.state === 'suspended') {
            try {
                await context.resume();
                setIsAudioReady(true);
            } catch (e) {
                console.error("Could not resume audio context", e);
                setIsAudioReady(false);
            }
        } else if (context && context.state === 'running') {
            setIsAudioReady(true);
        }
    }, [context]);

    const getAudioContextTime = useCallback(() => {
        return context?.currentTime ?? 0;
    }, [context]);

    // 4. Add getLatencyInfo()
    const getLatencyInfo = useCallback(() => {
      if (!context) return { baseLatency: 0, outputLatency: 0, sampleRate: 0 };
      return {
        baseLatency: (context as any).baseLatency ?? 0,
        outputLatency: (context as any).outputLatency ?? 0,
        sampleRate: context.sampleRate,
      };
    }, [context]);

    // 3. Make scheduleTone return onset timing info.
    const scheduleTone = useCallback((frequency: number, startTime: number, duration: number, timbre: OscillatorType = 'sine'): ToneHandle | null => {
        if (!context || !masterGainRef.current) return null;

        // 8. Add a minimum duration guard in scheduleTone.
        const safeDuration = Math.max(duration, 0.1);

        const osc = context.createOscillator();
        const gainNode = context.createGain();

        osc.type = timbre;
        osc.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.01); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.1, startTime + safeDuration - 0.05); // Decay/Sustain
        gainNode.gain.linearRampToValueAtTime(0, startTime + safeDuration); // Release

        // Connect to master chain
        osc.connect(gainNode);
        gainNode.connect(masterGainRef.current);

        osc.start(startTime);
        osc.stop(startTime + safeDuration);

        const voice: ActiveVoice = { osc, gain: gainNode, scheduledEnd: startTime + safeDuration };
        activeVoices.current.push(voice);
        
        osc.onended = () => {
            activeVoices.current = activeVoices.current.filter(v => v !== voice);
            osc.disconnect();
            gainNode.disconnect();
        };

        return { scheduledOnset: startTime, scheduledEnd: startTime + safeDuration, voice };

    }, [context]);

    // 5. Fix stopAll() to ramp down gain before stopping.
    const stopAll = useCallback(() => {
        if (!context) return;
        const now = context.currentTime;
        activeVoices.current.forEach(voice => {
            try {
                voice.gain.gain.cancelScheduledValues(now);
                voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
                voice.gain.gain.linearRampToValueAtTime(0, now + 0.015);
                voice.osc.stop(now + 0.02);
            } catch (e) {
                // Ignore errors
            }
        });
        activeVoices.current = [];
    }, [context]);
    
    useEffect(() => {
        const handleFirstInteraction = async () => {
            if (context && context.state !== 'running') {
                await resumeContext();
            }
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
        window.addEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
        
        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        }
    }, [resumeContext, context]);

    // 9. Update convenience wrappers to return timing info.
    const playNote = useCallback((pitch: number, timbre: string, durationMs: number): ToneHandle | null => {
        if (!context) return null;
        const now = context.currentTime;
        return scheduleTone(midiToFreq(pitch), now, durationMs / 1000, timbre as OscillatorType);
    }, [context, scheduleTone]);
    
    const playChord = useCallback((notes: number[], durationMs: number): ToneHandle[] => {
         if (!context) return [];
         const now = context.currentTime;
         return notes.map(note => scheduleTone(midiToFreq(note), now, durationMs / 1000, 'sine')).filter(Boolean) as ToneHandle[];
    }, [context, scheduleTone]);

    // 6. Fix playSequence — replace setTimeout for onEnd with osc.onended.
    const playSequence = useCallback((notes: (string | number)[], intervalSeconds: number, onEnd?: () => void): ToneHandle[] => {
         if (!context) { onEnd?.(); return []; }
         let time = context.currentTime + 0.1;
         const handles: ToneHandle[] = [];

         notes.forEach(note => {
            if (typeof note === 'number' && note > 0) {
               const handle = scheduleTone(midiToFreq(note), time, intervalSeconds);
               if(handle) handles.push(handle);
            }
            time += intervalSeconds;
         });
         
         if (onEnd) {
            if (handles.length > 0) {
                const lastHandle = handles[handles.length - 1];
                const originalOnEnded = lastHandle.voice.osc.onended;
                lastHandle.voice.osc.onended = (e) => {
                    if (originalOnEnded) originalOnEnded.call(lastHandle.voice.osc, e);
                    onEnd();
                };
            } else {
                // If no notes were played (empty sequence), call immediately
                onEnd();
            }
         }
         return handles;
    }, [context, scheduleTone]);

    return {
        audioContext: context,
        isAudioReady,
        resumeContext,
        getAudioContextTime,
        getLatencyInfo,
        scheduleTone,
        stopAll,
        playNote,
        playChord,
        playSequence,
    };
};