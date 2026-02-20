
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Headphones, Volume2, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";

const GAME_ID: GameId = 'ga_auditory_lab';

// --- Core Audio Engine ---
const useAudioEngine = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const primaryGainRef = useRef<GainNode | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current && typeof window !== 'undefined') {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
            const gainNode = context.createGain();
            gainNode.connect(context.destination);
            primaryGainRef.current = gainNode;
        }
        return audioContextRef.current;
    }, []);

    const resumeContext = useCallback(() => {
        const context = getAudioContext();
        if (context && context.state === 'suspended') {
            context.resume();
        }
    }, [getAudioContext]);
    
    const setVolume = useCallback((volume: number) => {
        const context = getAudioContext();
        if (primaryGainRef.current && context) {
            primaryGainRef.current.gain.setValueAtTime(volume, context.currentTime);
        }
    }, [getAudioContext]);

    const playTone = useCallback(({ freq, duration, startTime, rampTime = 0.005 }: { freq: number, duration: number, startTime: number, rampTime?: number}) => {
        const context = getAudioContext();
        if (!context || !primaryGainRef.current) return;

        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.frequency.setValueAtTime(freq, context.currentTime);
        osc.connect(gain);
        gain.connect(primaryGainRef.current);

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
                context.close();
            }
        };
    }, [getAudioContext]);

    return { getAudioContext, resumeContext, setVolume, playTone };
};

const GapDetectionModule = ({ onComplete }: { onComplete: (result: { score: number }) => void }) => {
    const { getAudioContext, playTone, resumeContext } = useAudioEngine();
    const [trials, setTrials] = useState(0);
    const [gap, setGap] = useState(50);
    const [correctStreak, setCorrectStreak] = useState(0);
    const [isAnswering, setIsAnswering] = useState(false);
    const [feedback, setFeedback] = useState<'correct'|'incorrect'|null>(null);
    const currentTrialRef = useRef<{ hasGap: boolean } | null>(null);
    const baseFreq = 1000;

    const runTrial = useCallback(() => {
        resumeContext();
        setIsAnswering(false);
        setFeedback(null);
        const hasGap = Math.random() > 0.5;
        currentTrialRef.current = { hasGap };
        
        const context = getAudioContext();
        if (!context) return;
        
        const totalDuration = 0.3;
        const gapDuration = gap / 1000;
        const toneDuration = (totalDuration - gapDuration) / 2;
        const startTime = context.currentTime + 0.5;

        if (hasGap) {
            playTone({ freq: baseFreq, duration: toneDuration, startTime });
            playTone({ freq: baseFreq, duration: toneDuration, startTime: startTime + toneDuration + gapDuration });
        } else {
            playTone({ freq: baseFreq, duration: totalDuration, startTime });
        }

        setTimeout(() => setIsAnswering(true), (totalDuration + 0.5) * 1000);
    }, [gap, getAudioContext, playTone, resumeContext]);

    useEffect(() => {
        if (trials < 10) { // Reduced trial count for demo
            const trialTimeout = setTimeout(runTrial, 1500);
            return () => clearTimeout(trialTimeout);
        } else {
            onComplete({ score: 100 - gap }); // Score is inverse of final gap
        }
    }, [trials, runTrial, onComplete, gap]);

    const handleResponse = (userChoseGap: boolean) => {
        if (!isAnswering || !currentTrialRef.current) return;
        setIsAnswering(false);
        const isCorrect = userChoseGap === currentTrialRef.current.hasGap;
        setFeedback(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            const newStreak = correctStreak + 1;
            setCorrectStreak(newStreak);
            if (newStreak >= 2) {
                setGap(g => Math.max(2, g - 5));
                setCorrectStreak(0);
            }
        } else {
            setCorrectStreak(0);
            setGap(g => Math.min(100, g + 5));
        }
        setTrials(t => t + 1);
    };
    
    return (
        <div className="w-full max-w-md text-center space-y-6">
            <CardTitle>Module 1: Gap Detection</CardTitle>
            <p className="text-muted-foreground">Can you hear the silence?</p>
             <div className="h-24 flex items-center justify-center">
                {!isAnswering && !feedback && <Loader2 className="w-8 h-8 animate-spin" />}
                {feedback === 'correct' && <p className="text-green-500 font-bold text-2xl">Correct!</p>}
                {feedback === 'incorrect' && <p className="text-destructive font-bold text-2xl">Incorrect</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleResponse(true)} disabled={!isAnswering} size="lg" className="h-24">GAP</Button>
                <Button onClick={() => handleResponse(false)} disabled={!isAnswering} size="lg" className="h-24">NO GAP</Button>
            </div>
            <p className="text-sm text-muted-foreground">Trial: {trials + 1} / 10</p>
        </div>
    );
};

// Placeholder modules
const FrequencyDiscriminationModule = ({ onComplete }: { onComplete: (result: { score: number }) => void }) => {
     useEffect(() => {
        const timer = setTimeout(() => onComplete({ score: 80 }), 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);
    return <div className="text-center space-y-4"><CardTitle>Module 2: Frequency Discrimination</CardTitle><p>Coming soon...</p><Loader2 className="animate-spin mx-auto"/></div>;
};

// --- Main Lab Component ---
const moduleComponents = [GapDetectionModule, FrequencyDiscriminationModule];
const moduleRotation: [number, number][] = [[0, 1], [1, 0]];

export function AuditoryProcessingRouter() {
    const { setVolume, resumeContext } = useAudioEngine();
    const [gameState, setGameState] = useState<'idle' | 'headphoneCheck' | 'calibration' | 'running' | 'rest' | 'finished'>('idle');
    const [volume, setLocalVolume] = useState(0.5);
    const [sessionCount, setSessionCount] = useState(0);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [results, setResults] = useState<any[]>([]);
    const { updateAdaptiveState } = usePerformanceStore();
    const currentMode: TrainingFocus = 'neutral';

    const startSession = () => {
        resumeContext();
        setGameState('calibration');
    };

    const startTraining = () => {
        setVolume(volume);
        setResults([]);
        setCurrentModuleIndex(0);
        setGameState('running');
    };

    const handleModuleComplete = (result: { score: number }) => {
        const newResults = [...results, result];
        setResults(newResults);
        
        // This is a simplified integration. A real one would have a proper adaptive state.
        updateAdaptiveState(GAME_ID, currentMode, {
          gameId: GAME_ID,
          focus: 'neutral',
          tier: 1, levelFloor: 4, levelCeiling: 10,
          currentLevel: 5 + Math.floor(result.score / 20),
          uncertainty: 0.5, consecutiveCorrect: 0, consecutiveWrong: 0,
          recentTrials: [], smoothedAccuracy: 0.8, smoothedRT: 500,
          sessionCount: sessionCount + 1, lastSessionAt: Date.now(),
          levelHistory: [],
        });

        if (currentModuleIndex < 1) {
            setCurrentModuleIndex(1);
            setGameState('rest');
            setTimeout(() => setGameState('running'), 3000);
        } else {
            setGameState('finished');
            setSessionCount(s => s + 1);
        }
    };

    const modulesForSession = useMemo(() => {
        const [mod1, mod2] = moduleRotation[sessionCount % moduleRotation.length];
        return [moduleComponents[mod1], moduleComponents[mod2]];
    }, [sessionCount]);
    
    const CurrentModule = modulesForSession[currentModuleIndex];

    const renderGameState = () => {
        switch (gameState) {
            case 'idle':
                return <Button onClick={() => setGameState('headphoneCheck')} size="lg">Start Auditory Lab</Button>;
            
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
                            <AlertDialogAction onClick={startSession}>I am using headphones</AlertDialogAction>
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
                        <Button onClick={startTraining}>Start Training</Button>
                    </div>
                );

            case 'running':
                return <CurrentModule onComplete={handleModuleComplete} />;
            
            case 'rest':
                return <div className="text-center space-y-2"><p>Great work. Take a short break.</p><Loader2 className="animate-spin mx-auto"/></div>;

            case 'finished':
                return (
                    <div className="text-center space-y-4">
                        <CardTitle>Session Complete!</CardTitle>
                        <p>You've completed your auditory workout.</p>
                        {results.map((r, i) => (
                            <p key={i}>Module {i + 1} Score: {r.score.toFixed(0)}</p>
                        ))}
                        <Button onClick={() => setGameState('idle')}>Back to Menu</Button>
                    </div>
                );
        }
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
                <CardTitle>(Ga) Auditory Processing Lab</CardTitle>
                <CardDescription>Sharpen your brain's ability to analyze and distinguish sounds.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[350px]">
                {renderGameState()}
            </CardContent>
        </Card>
    );
}
