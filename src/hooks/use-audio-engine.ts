

'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { getAsset } from '@/lib/asset-preloader'; // Import the new asset getter

// --- Type Definitions ---
interface ActiveVoice {
  osc: OscillatorNode;
  gain: GainNode;
  panner?: StereoPannerNode;
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
    const activeVoices = useRef<ActiveVoice[]>([]);
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

    const getLatencyInfo = useCallback(() => {
      if (!context) return { baseLatency: 0, outputLatency: 0, sampleRate: 0 };
      return {
        baseLatency: (context as any).baseLatency ?? 0,
        outputLatency: (context as any).outputLatency ?? 0,
        sampleRate: context.sampleRate,
      };
    }, [context]);

    const scheduleTone = useCallback((
        frequency: number, 
        startTime: number, 
        duration: number, 
        timbre: OscillatorType = 'sine',
        pan: number = 0,
        gain: number = 0.7
    ): ToneHandle | null => {
        if (!context || !masterGainRef.current) return null;

        const safeDuration = Math.max(duration, 0.1);
        const osc = context.createOscillator();
        const gainNode = context.createGain();
        const panner = context.createStereoPanner();
        
        panner.pan.setValueAtTime(pan, startTime);

        osc.type = timbre;
        osc.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.1 * gain, startTime + safeDuration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + safeDuration);
        
        osc.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(masterGainRef.current);
        
        osc.start(startTime);
        osc.stop(startTime + safeDuration);

        const voice: ActiveVoice = { osc, gain: gainNode, panner, scheduledEnd: startTime + safeDuration };
        activeVoices.current.push(voice);
        
        osc.onended = () => {
            activeVoices.current = activeVoices.current.filter(v => v !== voice);
            osc.disconnect();
            gainNode.disconnect();
            panner.disconnect();
        };

        return { scheduledOnset: startTime, scheduledEnd: startTime + safeDuration, voice };

    }, [context]);

    const playFlanker = useCallback((targetFreq: number, flankerFreq: number, durationMs: number, flankerGain: number) => {
        if (!context || !masterGainRef.current) return [];
        const now = context.currentTime;
        const durationSec = durationMs / 1000;

        const createPannedVoice = (freq: number, pan: number, gain: number) => {
            const osc = context.createOscillator();
            const gainNode = context.createGain();
            const panner = context.createStereoPanner();

            panner.pan.setValueAtTime(pan, now);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(gain, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(gain * 0.1, now + durationSec - 0.05);
            gainNode.gain.linearRampToValueAtTime(0, now + durationSec);
            osc.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(masterGainRef.current!);
            osc.start(now);
            osc.stop(now + durationSec);

            const voice: ActiveVoice = { osc, gain: gainNode, panner, scheduledEnd: now + durationSec };
            activeVoices.current.push(voice);
            
            osc.onended = () => {
                activeVoices.current = activeVoices.current.filter(v => v !== voice);
                osc.disconnect();
                gainNode.disconnect();
                panner.disconnect();
            };
            return { scheduledOnset: now, scheduledEnd: now + durationSec, voice };
        }

        const targetHandle = createPannedVoice(targetFreq, 0, 0.5);
        const leftFlankerHandle = createPannedVoice(flankerFreq, -1, 0.5 * flankerGain);
        const rightFlankerHandle = createPannedVoice(flankerFreq, 1, 0.5 * flankerGain);

        return [targetHandle, leftFlankerHandle, rightFlankerHandle];
    }, [context]);

    const playSimultaneous = useCallback((timbres: OscillatorType[], durationMs: number): ToneHandle[] => {
        if (!context) return [];
        const now = context.currentTime;
        const durationSec = durationMs / 1000;
        const handles: ToneHandle[] = [];

        const baseMidi = 60; // Base note C4

        timbres.forEach((timbre, index) => {
            const freq = midiToFreq(baseMidi) + (Math.random() - 0.5) * 2;
            const handle = scheduleTone(freq, now, durationSec, timbre);
            if(handle) handles.push(handle);
        });

        return handles;
    }, [context, scheduleTone]);

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
                // Ignore errors from trying to stop already-stopped nodes
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
                onEnd();
            }
         }
         return handles;
    }, [context, scheduleTone]);

    // New function to play from a cached URL
    const playCachedAudio = useCallback(async (url: string) => {
        if (!context) return;
        const audioBlob = await getAsset(url);
        if (!audioBlob) {
            console.error(`Audio asset not found for URL: ${url}`);
            return;
        }
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(masterGainRef.current!);
        source.start();
    }, [context]);
    
    const { speak, isSupported } = useSpeechSynthesis();

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
        playSimultaneous,
        playFlanker,
        playCachedAudio,
        speak,
        isSupported
    };
};


// --- Speech Synthesis Hook ---
type SpeechSynthesisState = {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string, onEnd?: () => void) => void;
  cancel: () => void;
};

let synthesis: SpeechSynthesis | null = null;
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synthesis = window.speechSynthesis;
}

export const useSpeechSynthesis = (): SpeechSynthesisState => {
  const [isSupported] = useState(!!synthesis);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string, onEnd?: () => void) => {
    if (!isSupported || !synthesis) return;
    
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = (event) => {
        console.error("SpeechSynthesis Error:", event.error);
        setIsSpeaking(false);
    };
    synthesis.speak(utterance);
  };

  const cancel = () => {
    if (!isSupported || !synthesis) return;
    synthesis.cancel();
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      if (synthesis) {
        synthesis.cancel();
      }
    };
  }, []);

  return { isSupported, isSpeaking, speak, cancel };
};
