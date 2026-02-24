
'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

// Singleton instance of the AudioContext
let audioContextInstance: AudioContext | null = null;
const getAudioContext = () => {
    if (typeof window !== 'undefined' && !audioContextInstance) {
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
    const activeSources = useRef<AudioNode[]>([]);

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

    // Function to get the high-precision current time of the AudioContext
    const getAudioContextTime = useCallback(() => {
        return context?.currentTime ?? 0;
    }, [context]);

    const scheduleTone = useCallback((frequency: number, startTime: number, duration: number, timbre: OscillatorType = 'sine') => {
        if (!context) return;

        const osc = context.createOscillator();
        const gainNode = context.createGain();

        osc.type = timbre;
        osc.frequency.setValueAtTime(frequency, startTime);

        // ADSR Envelope to prevent clicks
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.01); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.1, startTime + duration - 0.05); // Decay/Sustain
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Release

        osc.connect(gainNode);
        gainNode.connect(context.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);

        activeSources.current.push(osc, gainNode);
        
        // Clean up finished sources
        osc.onended = () => {
            activeSources.current = activeSources.current.filter(node => node !== osc && node !== gainNode);
            osc.disconnect();
            gainNode.disconnect();
        };

    }, [context]);

    const stopAll = useCallback(() => {
        activeSources.current.forEach(node => {
            try {
                if (node instanceof OscillatorNode) {
                    node.stop();
                }
                node.disconnect();
            } catch (e) {
                // Ignore errors from trying to stop already-stopped nodes
            }
        });
        activeSources.current = [];
    }, []);
    
    // Resume context on any user interaction
    useEffect(() => {
        const handleFirstInteraction = async () => {
            if (context && context.state !== 'running') {
                await resumeContext();
            }
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
        window.addEventListener('click', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);
        
        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        }
    }, [resumeContext, context]);

    return {
        audioContext: context,
        isAudioReady,
        resumeContext,
        getAudioContextTime,
        scheduleTone,
        stopAll,
        // Keep existing methods for now, can be deprecated later
        playNote: (pitch: number, timbre: string, durationMs: number) => {
            if (!context) return;
            const now = context.currentTime;
            scheduleTone(midiToFreq(pitch), now, durationMs / 1000, timbre as OscillatorType);
        },
        playChord: (notes: number[], durationMs: number) => {
             if (!context) return;
             const now = context.currentTime;
             notes.forEach(note => {
                scheduleTone(midiToFreq(note), now, durationMs / 1000, 'sine');
             });
        },
        playSequence: (notes: (string | number)[], intervalSeconds: number, onEnd?: () => void) => {
             if (!context) { onEnd?.(); return; }
             let time = context.currentTime + 0.1;
             notes.forEach(note => {
                if (typeof note === 'number' && note > 0) {
                   scheduleTone(midiToFreq(note), time, intervalSeconds);
                }
                time += intervalSeconds;
             });
             if (onEnd) {
                setTimeout(onEnd, (time - context.currentTime) * 1000);
             }
        },
    };
};
