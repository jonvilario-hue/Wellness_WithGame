
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Loader2, Ear, Hand } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

const GAME_ID: GameId = 'ef_focus_switch'; // Go/No-Go is an EF task
const policy = difficultyPolicies[GAME_ID];

type Trial = {
    type: 'GO' | 'NO-GO';
    chord: number[];
};

export function AuditoryGoNoGo() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playChord, resumeContext, isAudioReady, audioContext } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'finished'>('loading');
    const [lastTrial, setLastTrial] = useState<Trial | null>(null);
    const [feedback, setFeedback] = useState('');

    const trialTimer = useRef<NodeJS.Timeout | null>(null);
    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    const canRespond = useRef(true);
    const trialStartTime = useRef(0);

    const startNewTrial = useCallback(() => {
        if (!audioContext) return;
        if (trialCount.current >= 30) {
            setGameState('finished');
            return;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[state.currentLevel]?.content_config['music']?.params || policy.levelMap[1].content_config['music']!.params;

        const isGo = Math.random() > levelParams.nogo_probability;
        const type = isGo ? 'GO' : 'NO-GO';
        
        const chord = isGo ? [60, 64, 67] : [60, 66];
        trialStartTime.current = audioContext.currentTime;
        playChord(chord, 300);
        
        setLastTrial({ type, chord });
        canRespond.current = true;
        setFeedback('');
        trialCount.current++;
        
        setTimeout(() => {
            if(canRespond.current && type === 'NO-GO') {
                handleTimeout();
            }
        }, 1000);

    }, [getAdaptiveState, playChord, audioContext]);

    const startNewSession = useCallback(() => {
        resumeContext();
        const sessionState = startSession(getAdaptiveState(GAME_ID, 'music'));
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        setGameState('running');
    }, [resumeContext, getAdaptiveState, updateAdaptiveState]);

    useEffect(() => {
        if (gameState === 'running') {
            startNewTrial(); // Start first trial
            trialTimer.current = setInterval(startNewTrial, 2000);
        } else if (trialTimer.current) {
            clearInterval(trialTimer.current);
        }
        return () => {
            if(trialTimer.current) clearInterval(trialTimer.current);
        }
    }, [gameState, startNewTrial]);
    
    const handlePress = () => {
        if (!lastTrial || !canRespond.current || !audioContext) return;
        
        canRespond.current = false;
        const reactionTimeMs = (audioContext.currentTime - trialStartTime.current) * 1000;
        const isCorrect = lastTrial.type === 'GO';
        
        setFeedback(isCorrect ? 'Good' : 'Oops!');
        logAndContinue(isCorrect, 'press', reactionTimeMs);
    };

    const handleTimeout = () => {
        if (!lastTrial || !canRespond.current || !audioContext) return;

        canRespond.current = false;
        const isCorrect = lastTrial.type === 'NO-GO';

        setFeedback(isCorrect ? '' : 'Missed!');
        logAndContinue(isCorrect, 'timeout', 1000);
    }

    const logAndContinue = (isCorrect: boolean, responseType: 'press' | 'timeout', reactionTimeMs: number) => {
        const state = getAdaptiveState(GAME_ID, 'music');
        const trialResult: TrialResult = { 
            correct: isCorrect, 
            reactionTimeMs, 
            telemetry: { trialType: lastTrial?.type, responseType } 
        };
        sessionTrials.current.push(trialResult);
        logTrial({
            module_id: GAME_ID,
            mode: 'music',
            levelPlayed: state.currentLevel,
            isCorrect,
            responseTime_ms: reactionTimeMs,
            meta: trialResult.telemetry
        });
        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, 'music', newState);
    };
    
    useEffect(() => {
        if(isAudioReady) setGameState('start');
    }, [isAudioReady]);
    
    if (gameState === 'loading' || (gameState === 'start' && !isAudioReady)) {
        return (
             <Card className="w-full max-w-md text-center bg-orange-950 border-orange-500/20 text-orange-100 p-8">
                <CardTitle>Enable Audio</CardTitle>
                <Button onClick={resumeContext} size="lg" className="mt-4">Tap to Start</Button>
            </Card>
        )
    }

    if (gameState === 'finished') {
        return (
             <Card className="w-full max-w-md text-center bg-orange-950 border-orange-500/20 text-orange-100 p-8">
                 <CardTitle>Session Complete</CardTitle>
                 <Button onClick={startNewSession} className="mt-4">Play Again</Button>
             </Card>
        )
    }

    return (
        <Card className="w-full max-w-md text-center bg-orange-950 border-orange-500/20 text-orange-100">
            <CardHeader>
                <CardTitle className="text-orange-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-orange-500/10 rounded-md"><Hand className="w-6 h-6 text-orange-400" /></span>
                    Auditory Go/No-Go
                </CardTitle>
                <CardDescription className="text-orange-300/70">Press for a pleasant (Major) chord. Do NOT press for a dissonant chord. Wired headphones recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
                {gameState === 'start' ? (
                    <Button onClick={startNewSession} size="lg" className="bg-orange-600 hover:bg-orange-500 text-white">Start</Button>
                ) : (
                    <>
                        <div className="h-8 text-xl font-bold">
                            <p className={cn(feedback === 'Good' ? 'text-green-400' : 'text-red-400')}>{feedback}</p>
                        </div>
                        <Button onPointerDown={handlePress} className="w-48 h-48 rounded-full text-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700">PRESS</Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
