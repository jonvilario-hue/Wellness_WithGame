'use client';

import { useRef, useCallback, useState } from 'react';

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

    const playTone = useCallback((freq: number, duration: number, onEnd?: () => void) => {
        if (!context) { onEnd?.(); return; }
        
        const time = context.currentTime;
        const osc = context.createOscillator();
        const gainNode = context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.5, time + 0.01); // 10ms attack, lowered volume
        gainNode.gain.linearRampToValueAtTime(0, time + duration - 0.01); // 10ms release

        osc.connect(gainNode);
        gainNode.connect(context.destination);
        
        osc.start(time);
        osc.stop(time + duration);

        const endTimer = setTimeout(() => {
            try {
                if (osc.context.state !== "closed") {
                    osc.disconnect();
                }
                gainNode.disconnect();
            } catch (e) {
                // Ignore errors from trying to disconnect already disconnected nodes
            }
            if(onEnd) onEnd();
        }, duration * 1000 + 50);
            
        // Clean up the timer if component unmounts
        return () => clearTimeout(endTimer);
        
    }, [context]);
    
    const playSequence = useCallback((notes: (string | number)[], intervalSeconds: number, onEnd?: () => void) => {
        if (!context) { onEnd?.(); return; }
        
        let time = context.currentTime + 0.1; // Small delay to ensure scheduling
        
        notes.forEach(note => {
            const freq = typeof note === 'number' ? 440 * Math.pow(2, (note - 69) / 12) : 440;
            const osc = context.createOscillator();
            const gainNode = context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.5, time + 0.01); // 10ms attack, lowered volume
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
            const totalDuration = (time - (context.currentTime + 0.1) + 0.1) * 1000;
            setTimeout(onEnd, totalDuration);
        }
    }, [context]);

    return { playTone, playSequence, resumeContext, isAudioReady };
};
