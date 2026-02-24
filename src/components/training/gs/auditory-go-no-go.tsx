
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

const GAME_ID: GameId = 'gs_rapid_code';
const policy = difficultyPolicies[GAME_ID];

type Trial = {
    type: 'GO' | 'NO-GO';
    chord: number[];
};

export function AuditoryGoNoGo() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playChord, resumeContext, isAudioReady } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'finished'>('loading');
    const [lastTrial, setLastTrial] = useState<Trial | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    
    const startNewTrial = useCallback(() => {
        if (trialCount.current >= 30) { // More trials for a Gs task
            setGameState('finished');
            return;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[state.currentLevel]?.content_config['music']?.params || policy.levelMap[1].content_config['music']!.params;

        const isGo = Math.random() > levelParams.nogo_probability;
        const type = isGo ? 'GO' : 'NO-GO';
        
        // GO = Major Chord, NO-GO = Dissonant Tritone
        const chord = isGo ? [60, 64, 67] : [60, 66];
        playChord(chord, 300);
        
        setLastTrial({ type, chord });
        trialCount.current++;
    }, [getAdaptiveState, playChord]);

    const startNewSession = useCallback(() => {
        resumeContext();
        const sessionState = startSession(getAdaptiveState(GAME_ID, 'music'));
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        setGameState('running');
    }, [resumeContext, getAdaptiveState, updateAdaptiveState]);

    const handlePress = () => {
        if (!lastTrial || gameState !== 'running') return;

        const isCorrect = lastTrial.type === 'GO';
        logAndContinue(isCorrect, 'press');
    };

    const handleTimeout = () => {
        if (!lastTrial || gameState !== 'running') return;
        const isCorrect = lastTrial.type === 'NO-GO';
        logAndContinue(isCorrect, 'timeout');
    }

    const logAndContinue = (isCorrect: boolean, responseType: 'press' | 'timeout') => {
        const state = getAdaptiveState(GAME_ID, 'music');
        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs: 500, telemetry: {} };
        sessionTrials.current.push(trialResult);
        logTrial({
            module_id: GAME_ID,
            mode: 'music',
            levelPlayed: state.currentLevel,
            isCorrect,
            responseTime_ms: 500,
            meta: { trialType: lastTrial?.type, responseType }
        });
        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, 'music', newState);
        startNewTrial();
    };
    
    useEffect(() => {
        if(gameState === 'running') {
            timerRef.current = setInterval(startNewTrial, 1500)
            const timeoutTimer = setTimeout(handleTimeout, 1400);
            return () => {
                if(timerRef.current) clearInterval(timerRef.current)
                clearTimeout(timeoutTimer);
            }
        }
    }, [gameState, startNewTrial]);


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
                <CardDescription className="text-orange-300/70">Press the button for a pleasant (consonant) chord. Do NOT press for an unpleasant (dissonant) chord.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
                {gameState === 'start' ? (
                    <Button onClick={startNewSession} size="lg" className="bg-orange-600 hover:bg-orange-500 text-white">Start</Button>
                ) : (
                    <Button onClick={handlePress} className="w-48 h-48 rounded-full text-2xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700">PRESS</Button>
                )}
            </CardContent>
        </Card>
    );
}
