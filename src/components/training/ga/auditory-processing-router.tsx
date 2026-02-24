'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Headphones, Volume2, Loader2, Ear, Check, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { GameStub } from "../game-stub";
import { AuditoryDebugger } from "../logic/auditory-debugger";
import { domainIcons } from "@/components/icons";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";


const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

// --- Core Audio Engine (used by non-Core modes) ---
const useAudioEngine = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const primaryGainRef = useRef<GainNode | null>(null);

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

    const resumeContext = useCallback(async () => {
        const context = getAudioContext();
        if (context && context.state === 'suspended') {
            await context.resume().catch(e => console.error("Could not resume audio context", e));
        }
    }, [getAudioContext]);
    
    const setVolume = useCallback((volume: number) => {
        const context = getAudioContext();
        if (primaryGainRef.current && context) {
            primaryGainRef.current.gain.setValueAtTime(volume, context.currentTime);
        }
    }, [getAudioContext]);

     const playTone = useCallback(({ freq, duration, startTime, type = 'sine'}: { freq: number, duration: number, startTime: number, type?: OscillatorType}) => {
        const context = getAudioContext();
        if (!context || !primaryGainRef.current) return;

        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.connect(gain);
        gain.connect(primaryGainRef.current);

        const rampTime = 0.01; // 10ms ramp to prevent clicks
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(1, startTime + rampTime);
        gain.gain.setValueAtTime(1, startTime + duration - rampTime);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }, [getAudioContext]);
    
    useEffect(() => {
        const context = getAudioContext();
        return () => {
            if (context && context.state !== 'closed') {
                context.close().catch(e => console.error("Could not close audio context", e));
            }
        };
    }, [getAudioContext]);


    return { getAudioContext, resumeContext, setVolume, playTone };
};

const PitchDiscriminationModule = ({ focus }: { focus: TrainingFocus }) => {
    const { playTone, resumeContext, getAudioContext } = useAudioEngine();
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore.getState();

    const [gameState, setGameState] = useState<'playing' | 'feedback' | 'finished'>('playing');
    const [feedback, setFeedback] = useState<string>('');
    const trialStartTime = useRef(0);
    const answerRef = useRef<'higher' | 'lower'>('higher');
    const currentTrialIndex = useRef(0);

    const startNewTrial = useCallback(() => {
        const audioContext = getAudioContext();
        if (!audioContext) return;
        resumeContext();
        
        const state = getAdaptiveState(GAME_ID, focus);
        const levelDef = policy.levelMap[state.currentLevel] || policy.levelMap[1];
        const params = levelDef.content_config[focus]?.params;
        if (!params) return;

        setGameState('playing');
        setFeedback('');
        
        const baseFreq = 440; // A4
        const isHigher = Math.random() > 0.5;
        answerRef.current = isHigher ? 'higher' : 'lower';
        const secondFreq = isHigher ? baseFreq * Math.pow(2, params.pitchDelta / 1200) : baseFreq / Math.pow(2, params.pitchDelta / 1200);

        const now = audioContext.currentTime;
        playTone({ freq: baseFreq, duration: 0.3, startTime: now });
        playTone({ freq: secondFreq, duration: 0.3, startTime: now + 0.5 });
        trialStartTime.current = Date.now();
    }, [playTone, resumeContext, getAudioContext, getAdaptiveState, focus]);

    useEffect(() => {
        startNewTrial();
    }, [startNewTrial]);
    
    const handleAnswer = (userChoice: 'higher' | 'lower') => {
        if (gameState !== 'playing') return;
        
        setGameState('feedback');
        currentTrialIndex.current++;
        const isCorrect = userChoice === answerRef.current;
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const state = getAdaptiveState(GAME_ID, focus);

        const trialResult: TrialResult = {
            correct: isCorrect,
            reactionTimeMs,
            telemetry: {
                pitchDeltaCents: state.currentLevel,
                baseFreq: 440,
            }
        };

        logTrial({
            module_id: GAME_ID,
            mode: focus,
            levelPlayed: state.currentLevel,
            isCorrect,
            responseTime_ms: reactionTimeMs,
            meta: trialResult.telemetry
        });

        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, focus, newState);

        setFeedback(isCorrect ? getSuccessFeedback('Ga') : getFailureFeedback('Ga'));

        setTimeout(() => {
            if (currentTrialIndex.current >= policy.sessionLength) {
                setGameState('finished');
            } else {
                startNewTrial();
            }
        }, 1500);
    };

    if(gameState === 'finished') {
        return (
             <div className="text-center space-y-4">
                <CardTitle>Session Complete!</CardTitle>
                <Button onClick={startNewTrial} className="bg-violet-600 hover:bg-violet-500 text-white">Play Again</Button>
            </div>
        )
    }

    const state = getAdaptiveState(GAME_ID, focus);

    return (
        <div className="flex flex-col items-center gap-6 w-full text-violet-200">
             <div className="w-full flex justify-between font-mono text-sm">
                <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                <span>Level: {state.currentLevel}</span>
             </div>
            <div className="w-full h-24 bg-violet-900/50 rounded-lg flex items-center justify-center p-4">
                <svg width="100%" height="100%" viewBox="0 0 200 50" preserveAspectRatio="none">
                    <path d="M 0 25 C 20 10, 40 40, 60 25 S 100 40, 120 25 S 160 10, 180 25, 200 25" stroke="hsl(var(--primary))" fill="none" strokeWidth="1.5"/>
                </svg>
            </div>
            
            <div className="h-8">
                {feedback && (
                    <div className={cn("text-2xl font-bold flex items-center gap-2", feedback.includes('Incorrect') ? 'text-red-400' : 'text-green-400')}>
                        {feedback.includes('Incorrect') ? <X /> : <Check />}
                        {feedback}
                    </div>
                )}
            </div>

            <p className="font-semibold text-lg">Was the second tone higher or lower?</p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <Button onClick={() => handleAnswer('lower')} disabled={gameState === 'feedback'} size="lg" className="h-24 text-xl bg-violet-600 hover:bg-violet-500">Lower</Button>
                <Button onClick={() => handleAnswer('higher')} disabled={gameState === 'feedback'} size="lg" className="h-24 text-xl bg-fuchsia-600 hover:bg-fuchsia-500">Higher</Button>
            </div>
        </div>
    )
};


// --- Main Lab Component ---
export function AuditoryProcessingRouter() {
    const { setVolume, resumeContext } = useAudioEngine();
    
    const [gameState, setGameState] = useState<'idle' | 'headphoneCheck' | 'calibration' | 'running'>('idle');
    const [volume, setLocalVolume] = useState(0.5);
    
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

    const startSessionFlow = () => {
        resumeContext();
        setGameState('headphoneCheck');
    };

    const startTraining = () => {
        setVolume(volume);
        setGameState('running');
    };
    
    if (currentMode === 'logic') {
        return <AuditoryDebugger />;
    }

    if (currentMode === 'math' || currentMode === 'spatial' || currentMode === 'eq' || currentMode === 'verbal' || currentMode === 'neutral') {
         return <GameStub 
            name="Auditory Lab"
            description="This module contains various auditory discrimination tasks."
            chcFactor="Auditory Processing (Ga)"
            techStack={['Web Audio API']}
            complexity="High"
            fallbackPlan="Visual representation of sound waves."
        />;
    }


    const renderContent = () => {
        if (!isComponentLoaded) return <Loader2 className="w-12 h-12 animate-spin text-primary" />;

        switch (gameState) {
            case 'idle':
                return <Button onClick={startSessionFlow} size="lg" className="bg-violet-600 hover:bg-violet-500 text-white">Auditory Processing Lab</Button>;
            
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
                            <AlertDialogAction onClick={() => setGameState('calibration')}>I am using headphones</AlertDialogAction>
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
                return <PitchDiscriminationModule focus={currentMode}/>;

            default:
                return <Loader2 className="w-12 h-12 animate-spin text-primary" />;
        }
    };

    return (
        <Card className="w-full max-w-2xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
                    <span className="p-2 bg-violet-500/10 rounded-md"><domainIcons.Ga className="w-6 h-6 text-violet-400" /></span>
                    Auditory Processing Lab
                </CardTitle>
                <CardDescription className="text-violet-300/70">A rotating lab of exercises to sharpen your brain's ability to analyze and distinguish sounds.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[350px]">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
