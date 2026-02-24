
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { Headphones, Loader2, Check, X } from "lucide-react";
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
import { useAudioEngine, midiToFreq } from "@/hooks/use-audio-engine";


const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];


const PitchDiscriminationModule = ({ focus }: { focus: TrainingFocus }) => {
    const { playTone, resumeContext, isAudioReady, audioContext } = useAudioEngine();
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();

    const [gameState, setGameState] = useState<'loading' | 'playing' | 'feedback' | 'finished'>('loading');
    const [feedback, setFeedback] = useState<string>('');
    const trialStartTime = useRef(0);
    const answerRef = useRef<'higher' | 'lower'>('higher');
    const currentTrialIndex = useRef(0);

    const startNewTrial = useCallback(() => {
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

        const { scheduledTime } = playTone(baseFreq, 0.3);
        trialStartTime.current = scheduledTime; // Set start time based on audio scheduling
        setTimeout(() => playTone(secondFreq, 0.3), 500);

    }, [playTone, getAdaptiveState, focus]);
    
    const startNewSession = useCallback(() => {
        resumeContext();
        const sessionState = startSession(getAdaptiveState(GAME_ID, focus));
        updateAdaptiveState(GAME_ID, focus, sessionState);
        currentTrialIndex.current = 0;
        startNewTrial();
    }, [resumeContext, getAdaptiveState, updateAdaptiveState, focus, startNewTrial]);
    
    useEffect(() => {
        if(isAudioReady) {
           startNewSession();
        }
    }, [isAudioReady, startNewSession]);

    const handleAnswer = (userChoice: 'higher' | 'lower') => {
        const state = getAdaptiveState(GAME_ID, focus);
        if (gameState !== 'playing' || !state || !audioContext) return;
        
        setGameState('feedback');
        
        // Use audioContext.currentTime for precise reaction time
        const reactionTimeMs = (audioContext.currentTime - trialStartTime.current) * 1000;
        const isCorrect = userChoice === answerRef.current;
        const levelPlayed = state.currentLevel;
        const levelDef = policy.levelMap[levelPlayed] || policy.levelMap[1];
        const params = levelDef.content_config[focus]?.params;

        const trialResult: TrialResult = {
            correct: isCorrect,
            reactionTimeMs,
            telemetry: {
                trialType: 'pitch_discrimination',
                discriminationGap: params?.pitchDelta,
                baseFreq: 440,
                userAnswer: userChoice,
                correctAnswer: answerRef.current,
            }
        };

        logTrial({
            module_id: GAME_ID,
            mode: focus,
            levelPlayed,
            isCorrect,
            responseTime_ms: reactionTimeMs,
            meta: trialResult.telemetry
        });

        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, focus, newState);

        setFeedback(isCorrect ? getSuccessFeedback('Ga') : getFailureFeedback('Ga'));

        setTimeout(() => {
            currentTrialIndex.current++;
            if (currentTrialIndex.current >= policy.sessionLength) {
                setGameState('finished');
                endSession(newState, []); // Placeholder for session trials
            } else {
                startNewTrial();
            }
        }, 1500);
    };

    if(gameState === 'finished') {
        const state = getAdaptiveState(GAME_ID, focus);
        return (
             <div className="text-center space-y-4">
                <CardTitle>Session Complete!</CardTitle>
                <Button onClick={startNewSession} className="bg-violet-600 hover:bg-violet-500 text-white">Play Again</Button>
            </div>
        )
    }

    const state = getAdaptiveState(GAME_ID, focus);
    if (gameState === 'loading' || !state) {
         if (!isAudioReady) {
            return (
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">Audio required for this mode.</p>
                    <Button onClick={resumeContext} size="lg" className="bg-violet-600 hover:bg-violet-500 text-white">Tap to Enable Audio & Start</Button>
                </div>
            )
        }
        return <Loader2 className="w-12 h-12 animate-spin text-primary" />;
    }

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
    const { isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { isLoaded: isOverrideLoaded } = useTrainingOverride();
    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    
    // We can get the focus here, but the actual logic will be inside the routed component
    const { focus: globalFocus } = useTrainingFocus();
    const { override } = useTrainingOverride();
    const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

    if (!isComponentLoaded) {
        return <Card className="w-full max-w-2xl min-h-[400px] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></Card>;
    }
    
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

    return (
        <Card className="w-full max-w-2xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
                    <span className="p-2 bg-violet-500/10 rounded-md"><domainIcons.Ga className="w-6 h-6 text-violet-400" /></span>
                    Auditory Processing Lab
                </CardTitle>
                <CardDescription className="text-violet-300/70">A rotating lab of exercises to sharpen your brain's ability to analyze and distinguish sounds. Wired headphones recommended for best results.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[350px]">
                {<PitchDiscriminationModule focus={currentMode}/>}
            </CardContent>
        </Card>
    );
}
