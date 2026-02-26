'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { Loader2, Share2, Check, X } from "lucide-react";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TelemetryEvent } from "@/types";
import { PRNG } from '@/lib/rng';
import { cn } from "@/lib/utils";
import { generateGsLogicBooleanTrial, type BooleanBlitzTrial } from '@/lib/logic-stimulus-factory';

const GAME_ID: GameId = 'gs_rapid_code';
const policy = difficultyPolicies[GAME_ID];

const CodeSnippet = ({ html }: { html: string }) => {
    return (
        <pre className="text-center text-3xl font-mono p-4 rounded-md overflow-x-auto">
            <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
    );
};

export function BooleanBlitz() {
    const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
    const [gameState, setGameState] = useState<'start' | 'running' | 'feedback' | 'finished'>('start');
    const [puzzle, setPuzzle] = useState<BooleanBlitzTrial | null>(null);
    const [timeLeft, setTimeLeft] = useState(5);
    const [score, setScore] = useState(0);
    const [lastAnswerWasCorrect, setLastAnswerWasCorrect] = useState<boolean | null>(null);

    const trialStartTime = useRef(0);
    const trialCount = useRef(0);
    const timerRef = useRef<NodeJS.Timeout>();
    const prngRef = useRef<PRNG | null>(null);
    const adaptiveState = getAdaptiveState(GAME_ID, 'logic');
    
    const timeLimit = policy.levelMap[adaptiveState.currentLevel]?.content_config['logic']?.params.timeLimit || 5000;

    const startNewTrial = useCallback(() => {
        if (!prngRef.current) return;
        const newPuzzle = generateGsLogicBooleanTrial(adaptiveState.currentLevel, prngRef.current);
        setPuzzle(newPuzzle);
        setGameState('running');
        trialStartTime.current = Date.now();
        setTimeLeft(timeLimit / 1000);
        setLastAnswerWasCorrect(null);
    }, [adaptiveState.currentLevel, timeLimit]);

    const startNewSession = useCallback(() => {
        prngRef.current = new PRNG(crypto.randomUUID());
        const sessionState = startSession(adaptiveState);
        updateAdaptiveState(GAME_ID, 'logic', sessionState);
        trialCount.current = 0;
        setScore(0);
        startNewTrial();
    }, [adaptiveState, startNewTrial, updateAdaptiveState]);

    const handleResponse = (answer: boolean | null) => {
        if (gameState !== 'running' || !puzzle || !activeSession) return;
        if (timerRef.current) clearInterval(timerRef.current);
        
        setGameState('feedback');
        const rtMs = Date.now() - trialStartTime.current;
        const isCorrect = answer === puzzle.correctValue;
        setLastAnswerWasCorrect(isCorrect);
        
        if (isCorrect) setScore(s => s + 1);

        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs: rtMs, telemetry: { timedOut: answer === null, taskVariant: 'binary' } };
        logEvent({ type: 'trial_complete', sessionId: activeSession.sessionId, payload: { ...trialResult, gameId: GAME_ID, focus: 'logic' } as any });
        
        const newState = adjustDifficulty(trialResult, adaptiveState, policy);
        updateAdaptiveState(GAME_ID, 'logic', newState);

        trialCount.current++;
        setTimeout(() => {
            if (trialCount.current >= policy.sessionLength) {
                setGameState('finished');
            } else {
                startNewTrial();
            }
        }, 1500);
    };

    const handleTimeout = useCallback(() => {
        handleResponse(null);
    }, [handleResponse]);

    useEffect(() => {
        if (gameState === 'running') {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 0.1) {
                        if(timerRef.current) clearInterval(timerRef.current);
                        handleTimeout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, handleTimeout]);
    
    if (!adaptiveState) return <Loader2 className="animate-spin" />;

    return (
        <Card className="w-full max-w-xl text-center bg-zinc-900 border-orange-500/20 text-orange-100">
            <CardHeader>
                <CardTitle className="text-orange-300 flex items-center justify-center gap-2">
                    <Share2 /> Boolean Blitz
                </CardTitle>
                <CardDescription className="text-orange-300/70">Evaluate the boolean expression as quickly as you can.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 min-h-[400px] justify-center">
                {gameState === 'start' && <Button onClick={startNewSession} size="lg">Start</Button>}
                {gameState === 'finished' && <div className="text-center space-y-4"><h3 className="text-2xl font-bold">Session Finished!</h3><p className="text-lg">Score: {score}/{trialCount.current}</p><Button onClick={startNewSession} className="mt-4">Play Again</Button></div>}
                {(gameState === 'running' || gameState === 'feedback') && puzzle && (
                    <div className="w-full flex flex-col items-center gap-4">
                        <div className="w-full flex justify-between font-mono text-orange-200 px-2">
                            <span>Score: {score}</span>
                            <span>Time Left: {timeLeft.toFixed(0)}s</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-800"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${(timeLeft / (timeLimit / 1000)) * 100}%`, transition: `width 1s linear` }}/></div>
                        
                        <div className="w-full h-32 bg-gray-900/50 rounded-lg flex items-center justify-center">
                            <CodeSnippet html={puzzle.displayExpression} />
                        </div>
                        
                         <div className="h-8 mt-2">
                            {gameState === 'feedback' && lastAnswerWasCorrect !== null && (
                                lastAnswerWasCorrect ? <Check className="w-8 h-8 text-green-400" /> : <X className="w-8 h-8 text-red-400" />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
                            <Button onClick={() => handleResponse(true)} className="h-20 text-2xl bg-green-700 hover:bg-green-600 text-white" disabled={gameState==='feedback'}>TRUE</Button>
                            <Button onClick={() => handleResponse(false)} className="h-20 text-2xl bg-red-700 hover:bg-red-600 text-white" disabled={gameState==='feedback'}>FALSE</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
