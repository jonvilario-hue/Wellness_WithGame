
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
            await resumeContext();
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        };
        window.addEventListener('click', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);
        
        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
        }
    }, [resumeContext]);


    const playTone = useCallback((freq: number, duration: number, onEnd?: () => void): { scheduledTime: number } => {
        if (!context || context.state !== 'running') { onEnd?.(); return { scheduledTime: 0 }; }
        
        const time = context.currentTime;
        const scheduledTime = time + 0.01; // Schedule slightly in the future for precision
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
            return () => clearTimeout(endTimer);
        }
        
        return { scheduledTime };
    }, [context]);
    
    const playSequence = useCallback((notes: (string | number)[], intervalSeconds: number, onEnd?: () => void): { scheduledTime: number } => {
        if (!context || context.state !== 'running') { onEnd?.(); return { scheduledTime: 0 }; }
        
        let time = context.currentTime + 0.1;
        const scheduledTime = time;
        
        notes.forEach(note => {
            if (typeof note !== 'number' || note === 0) { // Handle rests
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

    // Other methods like playChord, playSimultaneous would be here...

    return { playTone, playSequence, resumeContext, isAudioReady, audioContext: context };
};
