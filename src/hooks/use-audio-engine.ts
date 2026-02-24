
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
    const activeSources = useRef<AudioBufferSourceNode[]>([]);

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

    const playTone = useCallback((freq: number, duration: number, onEnd?: () => void): { scheduledTime: number } => {
        if (!context || context.state !== 'running') { onEnd?.(); return { scheduledTime: 0 }; }
        
        const time = context.currentTime;
        const scheduledTime = time + 0.01;
        const osc = context.createOscillator();
        const gainNode = context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, scheduledTime);
        
        gainNode.gain.setValueAtTime(0, scheduledTime);
        gainNode.gain.linearRampToValueAtTime(0.5, scheduledTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, scheduledTime + duration - 0.01);

        osc.connect(gainNode);
        gainNode.connect(context.destination);
        
        osc.start(scheduledTime);
        osc.stop(scheduledTime + duration);
        
        if (onEnd) {
            const endTimer = setTimeout(onEnd, duration * 1000 + 50);
        }
        
        return { scheduledTime };
    }, [context]);

    const playNote = useCallback((pitch: number, timbre: string, durationMs: number) => {
        if (!context || context.state !== 'running') return;
        const freq = midiToFreq(pitch);
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = timbre as OscillatorType || 'sine';
        osc.frequency.setValueAtTime(freq, context.currentTime);

        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationMs / 1000);
        
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start();
        osc.stop(context.currentTime + durationMs / 1000);
    }, [context]);
    
    const playChord = useCallback((notes: number[], durationMs: number) => {
        if (!context || context.state !== 'running') return;
        notes.forEach(note => {
            playNote(note, 'sine', durationMs);
        });
    }, [context, playNote]);

    const playFlanker = useCallback((targetFreq: number, flankerFreq: number, durationMs: number) => {
        if (!context || context.state !== 'running') return;

        const play = (freq: number, pan: number) => {
            const osc = context.createOscillator();
            const panner = context.createStereoPanner();
            const gain = context.createGain();
            
            osc.frequency.value = freq;
            panner.pan.value = pan;
            
            osc.connect(panner).connect(gain).connect(context.destination);
            
            gain.gain.setValueAtTime(0, context.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationMs/1000);
            
            osc.start();
            osc.stop(context.currentTime + durationMs/1000);
        };
        
        play(targetFreq, 0); // Center
        play(flankerFreq, -1); // Left
        play(flankerFreq, 1); // Right
    }, [context]);
    
    const playSequence = useCallback((notes: (string | number)[], intervalSeconds: number, onEnd?: () => void): { scheduledTime: number } => {
        if (!context || context.state !== 'running') { onEnd?.(); return { scheduledTime: 0 }; }
        
        let time = context.currentTime + 0.1;
        const scheduledTime = time;
        
        notes.forEach(note => {
            if (typeof note !== 'number' || note === 0) {
                time += intervalSeconds;
                return;
            }

            const freq = midiToFreq(note);
            const osc = context.createOscillator();
            const gainNode = context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.5, time + 0.01);
            const releaseTime = time + intervalSeconds - 0.02;
            if (releaseTime > time) {
                gainNode.gain.setValueAtTime(0.5, releaseTime);
                gainNode.gain.linearRampToValueAtTime(0, time + intervalSeconds - 0.01);
            }
            
            osc.connect(gainNode);
            gainNode.connect(context.destination);
            
            osc.start(time);
            osc.stop(time + intervalSeconds);

            time += intervalSeconds;
        });

        if (onEnd) {
            const totalDuration = (time - scheduledTime) * 1000;
            setTimeout(onEnd, totalDuration);
        }
        return { scheduledTime };
    }, [context]);
    
    const stopAll = useCallback(() => {
        // This is a simplified stop. A more robust engine would track all active sources.
    }, []);
    
    const playSimultaneous = useCallback((instruments: string[], durationMs: number = 3000) => {
        if (!context) return;
        const freqs: Record<string, number> = {
            'drums': 110, // A2 as a kick
            'bass': 220, // A3
            'piano': 440, // A4
            'flute': 880, // A5
            'guitar': 330 // E4
        };
         const timbres: Record<string, OscillatorType> = {
            'drums': 'sine',
            'bass': 'square',
            'piano': 'triangle',
            'flute': 'sine',
            'guitar': 'sawtooth'
        };

        instruments.forEach(inst => {
            playNote(midiToFreq(freqs[inst] ? Math.log2(freqs[inst]/440) * 12 + 69 : 69), timbres[inst] || 'sine', durationMs);
        });

    }, [context, playNote]);


    return { playTone, playChord, playSequence, playNote, playFlanker, playSimultaneous, stopAll, resumeContext, isAudioReady, audioContext: context };
};
