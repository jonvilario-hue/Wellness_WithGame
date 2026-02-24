
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Loader2, Ear } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";
import { domainIcons } from "@/components/icons";
import { cn } from "@/lib/utils";

const GAME_ID: GameId = 'ef_focus_switch';
const policy = difficultyPolicies[GAME_ID];

type Trial = {
    word: 'High' | 'Low';
    pitch: 'High' | 'Low';
    isCongruent: boolean;
};

export function AuditoryStroop() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playTone, resumeContext, isAudioReady } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
    const [trial, setTrial] = useState<Trial | null>(null);
    const [feedback, setFeedback] = useState('');

    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    
    const startNewTrial = useCallback(() => {
        if (trialCount.current >= 20) {
            setGameState('finished');
            return;
        }

        const state = getAdaptiveState(GAME_ID, 'music');
        const levelParams = policy.levelMap[state.currentLevel]?.content_config['music']?.params || policy.levelMap[1].content_config['music']!.params;

        const isCongruent = Math.random() > levelParams.incongruent_ratio;
        const word = Math.random() > 0.5 ? 'High' : 'Low';
        let pitch: 'High' | 'Low';

        if (isCongruent) {
            pitch = word;
        } else {
            pitch = word === 'High' ? 'Low' : 'High';
        }
        
        setTrial({ word, pitch, isCongruent });
        // This is a simplified "sung word" for now. A real implementation
        // would use a speech synthesizer with pitch control.
        const freq = pitch === 'High' ? 880 : 220;
        playTone(freq, 0.5);

        trialCount.current++;
        setGameState('running');
    }, [getAdaptiveState, playTone]);

    const startNewSession = useCallback(() => {
        resumeContext();
        const sessionState = startSession(getAdaptiveState(GAME_ID, 'music'));
        updateAdaptiveState(GAME_ID, 'music', sessionState);
        trialCount.current = 0;
        sessionTrials.current = [];
        startNewTrial();
    }, [resumeContext, getAdaptiveState, updateAdaptiveState, startNewTrial]);

    const handleResponse = (response: 'High' | 'Low') => {
        if (!trial) return;
        const isCorrect = response === trial.pitch;
        
        const state = getAdaptiveState(GAME_ID, 'music');
        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs: 500, telemetry: {} };
        sessionTrials.current.push(trialResult);
        logTrial({
            module_id: GAME_ID,
            mode: 'music',
            levelPlayed: state.currentLevel,
            isCorrect,
            responseTime_ms: 500,
            meta: { congruent: trial.isCongruent }
        });
        const newState = adjustDifficulty(trialResult, state, policy);
        updateAdaptiveState(GAME_ID, 'music', newState);

        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setGameState('feedback');
        setTimeout(startNewTrial, 1500);
    };
    
    useEffect(() => {
        if(isAudioReady) setGameState('start');
    }, [isAudioReady]);

    const renderContent = () => {
        if (gameState === 'loading' || (gameState === 'start' && !isAudioReady)) {
            return <Button onClick={resumeContext} size="lg">Tap to Enable Audio</Button>
        }
        if (gameState === 'start') {
            return <Button onClick={startNewSession} size="lg">Start Auditory Stroop</Button>
        }
        if (gameState === 'finished') {
            return (
                <div className="text-center">
                    <CardTitle>Session Complete</CardTitle>
                    <Button onClick={startNewSession} className="mt-4">Play Again</Button>
                </div>
            )
        }
        if (gameState === 'running' || gameState === 'feedback') {
            return (
                <div className="flex flex-col items-center gap-8">
                     <div className="text-center">
                        <p className="text-muted-foreground">You will hear the word "High" or "Low".</p>
                        <p className="font-bold text-2xl">Identify the PITCH, ignore the word.</p>
                     </div>
                     <div className="h-10 text-xl font-bold">
                         {gameState === 'feedback' && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-red-400')}>{feedback}</p>}
                     </div>
                     <div className="flex gap-4">
                        <Button onClick={() => handleResponse('Low')} size="lg" className="w-32 h-16" disabled={gameState === 'feedback'}>Low</Button>
                        <Button onClick={() => handleResponse('High')} size="lg" className="w-32 h-16" disabled={gameState === 'feedback'}>High</Button>
                    </div>
                </div>
            )
        }
    }

    return (
        <Card className="w-full max-w-md text-center bg-rose-950 border-rose-500/20 text-rose-100">
            <CardHeader>
                <CardTitle className="text-rose-300 flex items-center justify-center gap-2">
                    <span className="p-2 bg-rose-500/10 rounded-md"><Ear className="w-6 h-6 text-rose-400" /></span>
                    Auditory Stroop
                </CardTitle>
                <CardDescription className="text-rose-300/70">Ignore the word, classify the pitch. A test of auditory inhibition. Wired headphones recommended.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    )
}
