
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Headphones, Volume2, Loader2, Music, Check, X, MessageSquare, Mic2, Share2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { GameStub } from "../game-stub";
import { AuditoryDebugger } from "../logic/auditory-debugger";
import { GaAbstractAuditoryTasks } from "./ga-abstract-auditory-tasks";
import { GaAuditoryMath } from "./ga-auditory-math";
import { domainIcons } from "@/components/icons";


const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

// --- Core Audio Engine (used by non-Core modes) ---
const useAudioEngine = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const primaryGainRef = useRef<GainNode | null>(null);
    const noiseSourceRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null);

    const getAudioContext = useCallback(() => {
        if (typeof window !== 'undefined' && !audioContextRef.current) {
            try {
                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = context;
                const gainNode = context.createGain();
                gainNode.connect(context.destination);
                primaryGainRef.current = gainNode;
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
            }
        }
        return audioContextRef.current;
    }, []);

    const resumeContext = useCallback(() => {
        const context = getAudioContext();
        if (context && context.state === 'suspended') {
            context.resume().catch(e => console.error("Could not resume audio context", e));
        }
    }, [getAudioContext]);
    
    const setVolume = useCallback((volume: number) => {
        const context = getAudioContext();
        if (primaryGainRef.current && context) {
            primaryGainRef.current.gain.setValueAtTime(volume, context.currentTime);
        }
    }, [getAudioContext]);
    
     useEffect(() => {
        const context = getAudioContext();
        return () => {
            if (context && context.state !== 'closed') {
                context.close().catch(e => console.error("Could not close audio context", e));
            }
        };
    }, [getAudioContext]);
    
    const playNoise = useCallback((snr: number) => {
        const context = getAudioContext();
        if (!context || !primaryGainRef.current) return;
        if (noiseSourceRef.current) {
            noiseSourceRef.current.stop();
        }
        const gainValue = Math.pow(10, -snr / 20); // Simplified SNR to gain
        const noiseGain = context.createGain();
        noiseGain.gain.value = gainValue;

        const bufferSize = context.sampleRate * 2; // 2 seconds of noise
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; // white noise
        }
        const noiseSource = context.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        
        noiseSource.connect(noiseGain).connect(primaryGainRef.current);
        noiseSource.start();
        noiseSourceRef.current = noiseSource;
    }, [getAudioContext]);
    
    const stopNoise = useCallback(() => {
        if(noiseSourceRef.current) {
            noiseSourceRef.current.stop();
            noiseSourceRef.current = null;
        }
    }, []);


    return { getAudioContext, resumeContext, setVolume, playNoise, stopNoise };
};

const PhonemeInNoiseModule = ({ onComplete, level, focus }: { onComplete: (result: { score: number, hits: number, falseAlarms: number }) => void, level: number, focus: TrainingFocus }) => {
    const { resumeContext, playNoise, stopNoise } = useAudioEngine();
    const policyForLevel = policy.levelMap[level] || policy.levelMap[1];
    const contentConfig = policyForLevel.content_config[focus];
    
    const params = contentConfig?.params || { phonemes: ['p', 'b'], noise_level: 0 };

    const [trials, setTrials] = useState(0);
    const [score, setScore] = useState(0);
    const [hits, setHits] = useState(0);
    const [falseAlarms, setFalseAlarms] = useState(0);
    const [isAnswering, setIsAnswering] = useState(false);
    const [feedback, setFeedback] = useState<'correct'|'incorrect'|null>(null);
    const currentTarget = useRef<string>(params.phonemes[0]);

    const runTrial = useCallback(() => {
        resumeContext();
        setIsAnswering(false);
        setFeedback(null);

        const isTargetTrial = Math.random() > 0.5;
        const phonemeToPlay = isTargetTrial ? currentTarget.current : params.phonemes[1];

        const utterance = new SpeechSynthesisUtterance(phonemeToPlay);
        utterance.rate = 1.2;
        speechSynthesis.speak(utterance);
        
        playNoise(params.noise_level);

        setTimeout(() => {
            setIsAnswering(true);
            const trialTimeout = setTimeout(() => { // Auto-respond 'no' if user doesn't answer
                if(isAnswering) handleResponse(false, isTargetTrial);
            }, 2000);
            return () => clearTimeout(trialTimeout);
        }, 800);

    }, [params, resumeContext, playNoise, isAnswering]);

    useEffect(() => {
        if (trials < 15) { 
            const trialTimeout = setTimeout(runTrial, 2500);
            return () => clearTimeout(trialTimeout);
        } else {
            stopNoise();
            onComplete({ score, hits, falseAlarms });
        }
    }, [trials, runTrial, onComplete, score, stopNoise, hits, falseAlarms]);

    const handleResponse = (userChoseTarget: boolean, isTargetActuallyPresent: boolean) => {
        if (!isAnswering) return;
        setIsAnswering(false);
        
        const isCorrect = userChoseTarget === isTargetActuallyPresent;
        
        setFeedback(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) setScore(s => s + 1);
        if (userChoseTarget && isTargetActuallyPresent) setHits(h => h + 1);
        if (userChoseTarget && !isTargetActuallyPresent) setFalseAlarms(f => f + 1);

        setTrials(t => t + 1);
    };
    
    return (
        <div className="w-full max-w-md text-center space-y-6">
            <CardTitle>Phoneme Discrimination</CardTitle>
            <p className="text-muted-foreground">Did you hear the sound: "{currentTarget.current}"?</p>
             <div className="h-24 flex items-center justify-center">
                {!isAnswering && !feedback && <Mic2 className="w-8 h-8 animate-pulse" />}
                {feedback === 'correct' && <p className="text-green-500 font-bold text-2xl flex items-center gap-2"><Check /> Correct!</p>}
                {feedback === 'incorrect' && <p className="text-destructive font-bold text-2xl flex items-center gap-2"><X /> Incorrect</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleResponse(false, speech.speaking)} disabled={!isAnswering} size="lg" className="h-24 text-2xl">NO</Button>
                <Button onClick={() => handleResponse(true, speech.speaking)} disabled={!isAnswering} size="lg" className="h-24 text-2xl">YES</Button>
            </div>
            <p className="text-sm text-muted-foreground">Trial: {trials + 1} / 15 | Score: {score}</p>
        </div>
    );
};


// --- Main Lab Component ---
export function AuditoryProcessingRouter() {
    const { getAdaptiveState } = usePerformanceStore();
    const { setVolume, resumeContext } = useAudioEngine();
    
    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
    const [gameState, setGameState] = useState<'idle' | 'headphoneCheck' | 'calibration' | 'running' | 'finished'>('idle');
    const [volume, setLocalVolume] = useState(0.5);
    
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

    useEffect(() => {
        if (isComponentLoaded) {
            const initialState = getAdaptiveState(GAME_ID, currentMode);
            setAdaptiveState(initialState);
        }
    }, [isComponentLoaded, currentMode, getAdaptiveState]);

    const startSessionFlow = () => {
        if (!adaptiveState) return;
        resumeContext();
        setGameState('calibration');
    };

    const startTraining = () => {
        if (!adaptiveState) return;
        setVolume(volume);
        setGameState('running');
    };
    
    const handleGameComplete = () => {
        setGameState('finished');
    }

    if (currentMode === 'neutral') {
        return <GaAbstractAuditoryTasks focus={currentMode} />;
    }

    if (currentMode === 'math') {
        return <GaAuditoryMath focus={currentMode} />;
    }
    
    if (currentMode === 'spatial') {
        return <GameStub 
            name="Audio-Locator"
            description="A sound (beep or word) is played in a simulated 3D audio space. User clicks on a 2D map representing their 'room' to pinpoint the sound's origin (left/right, front/back)."
            chcFactor="Auditory Processing (Ga) / Spatial Orientation"
            techStack={['Web Audio API']}
            complexity="High"
            fallbackPlan="Use simple stereo panning (left/right only) instead of full 3D audio. The task becomes a 1D localization problem, which is less complex but preserves the core mechanic."
        />;
    }

    if (currentMode === 'logic') {
        return <AuditoryDebugger />;
    }

    if (currentMode === 'eq') {
        return <GameStub
            name="Vocal Prosody Lab"
            description="An audio clip of a neutral phrase ('The car is in the garage') spoken with a specific emotional tone (e.g., angry, happy, fearful). Discriminate the underlying emotional prosody of the voice and select the correct emotion label, ignoring the semantic content of the words."
            chcFactor="Auditory Processing (Ga) / Social Cognition"
            techStack={['RAVDESS Audio Dataset']}
            complexity="Medium"
            fallbackPlan="If audio clips cannot be loaded, use text descriptions of the tone (e.g., 'Spoken in a happy voice') which degrades the task to a Gc reading task, but maintains the EQ theme."
        />;
    }


    const renderContent = () => {
        if (!adaptiveState) return <Loader2 className="w-12 h-12 animate-spin text-primary" />;

        switch (gameState) {
            case 'idle':
                return <Button onClick={() => setGameState('headphoneCheck')} size="lg" className="bg-violet-600 hover:bg-violet-500 text-white">Auditory Processing Lab</Button>;
            
            case 'headphoneCheck':
                return (
                    <AlertDialog open={true}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2"><Headphones /> Use Headphones</AlertDialogTitle>
                                <AlertDialogDescription>
                                    For accurate training, please use headphones. Results without headphones may be unreliable.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogAction onClick={startSessionFlow}>I am using headphones</AlertDialogAction>
                        </AlertDialogContent>
                    </AlertDialog>
                );
            
            case 'calibration':
                return (
                    <div className="w-full max-w-sm text-center space-y-4">
                        <CardTitle>Volume Calibration</CardTitle>
                        <p>Adjust to a comfortable level.</p>
                        <div className="flex items-center gap-4">
                            <Volume2 />
                            <Slider value={[volume * 100]} onValueChange={([v]) => setLocalVolume(v/100)} />
                        </div>
                        <Button onClick={startTraining} className="bg-violet-600 hover:bg-violet-500 text-white">Start Training</Button>
                    </div>
                );

            case 'running':
                return <PhonemeInNoiseModule onComplete={handleGameComplete} level={adaptiveState.currentLevel} focus={currentMode}/>;

            case 'finished':
                return (
                    <div className="text-center space-y-4">
                        <CardTitle>Session Complete!</CardTitle>
                        <p>You've completed your auditory workout.</p>
                        <Button onClick={() => setGameState('idle')} className="bg-violet-600 hover:bg-violet-500 text-white">Back to Menu</Button>
                    </div>
                );
            default:
                return <Loader2 className="w-12 h-12 animate-spin text-primary" />;
        }
    };

    return (
        <Card className="w-full max-w-2xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
                    <span className="p-2 bg-violet-500/10 rounded-md"><domainIcons.Ga className="w-6 h-6 text-violet-400" /></span>
                    (Ga) Auditory Processing Lab
                </CardTitle>
                <CardDescription className="text-violet-300/70">A rotating lab of exercises to sharpen your brain's ability to analyze and distinguish sounds.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[350px]">
                {renderContent()}
            </CardContent>
        </Card>
    );
}

    