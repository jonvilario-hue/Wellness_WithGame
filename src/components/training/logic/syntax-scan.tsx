
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
import { generateGsSyntaxScanTrial } from '@/lib/logic-stimulus-factory';

const GAME_ID: GameId = 'gs_rapid_code';
const policy = difficultyPolicies[GAME_ID];

const CodeSnippet = ({ code }: { code: string }) => {
    // A real implementation would use a syntax highlighter like Prism or Highlight.js
    // For this implementation, we simulate it with basic parsing.
    const highlight = (line: string) => {
        return line.split(/(\s+|[(){};=,])/).map((token, i) => {
            if (['let', 'const', 'if', 'for', 'while', 'return', 'function'].includes(token)) {
                return <span key={i} className="text-purple-400">{token}</span>;
            }
            if (['true', 'false', 'null'].includes(token) || !isNaN(Number(token))) {
                return <span key={i} className="text-orange-400">{token}</span>;
            }
            if (['>', '<', '==', '!=', '>=', '<=', '&&', '||', '!', '+', '-', '*'].includes(token)) {
                 return <span key={i} className="text-cyan-400">{token}</span>;
            }
            return <span key={i} className="text-slate-300">{token}</span>;
        });
    };
    
    return (
        <pre className="text-left text-sm bg-gray-900 p-4 rounded-md overflow-x-auto h-64">
            <code className="whitespace-pre-wrap">
                {code.split('\n').map((line, i) => (
                    <div key={i}><span className="text-gray-600 mr-4 select-none">{i+1}</span>{highlight(line)}</div>
                ))}
            </code>
        </pre>
    );
};

export function SyntaxScan() {
    const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
    const [gameState, setGameState] = useState<'start' | 'running' | 'feedback' | 'finished'>('start');
    const [puzzle, setPuzzle] = useState<{ snippetA: string; snippetB: string; isSame: boolean; } | null>(null);
    const [timeLeft, setTimeLeft] = useState(5);
    const [score, setScore] = useState(0);

    const trialStartTime = useRef(0);
    const trialCount = useRef(0);
    const timerRef = useRef<NodeJS.Timeout>();
    const prngRef = useRef<PRNG | null>(null);
    const adaptiveState = getAdaptiveState(GAME_ID, 'logic');
    
    const timeLimit = policy.levelMap[adaptiveState.currentLevel]?.content_config['logic']?.params.timeLimit || 5000;

    const startNewTrial = useCallback(() => {
        if (!prngRef.current) return;
        const newPuzzle = generateGsSyntaxScanTrial(adaptiveState.currentLevel, prngRef.current);
        setPuzzle(newPuzzle);
        setGameState('running');
        trialStartTime.current = Date.now();
        setTimeLeft(timeLimit / 1000);
    }, [adaptiveState.currentLevel, timeLimit]);

    const startNewSession = useCallback(() => {
        prngRef.current = new PRNG(crypto.randomUUID());
        const sessionState = startSession(adaptiveState);
        updateAdaptiveState(GAME_ID, 'logic', sessionState);
        trialCount.current = 0;
        setScore(0);
        startNewTrial();
    }, [adaptiveState, startNewTrial, updateAdaptiveState]);

    const handleTimeout = useCallback(() => {
        handleResponse(null);
    }, []);

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

    const handleResponse = (answer: boolean | null) => {
        if (gameState !== 'running' || !puzzle || !activeSession) return;
        if (timerRef.current) clearInterval(timerRef.current);
        
        setGameState('feedback');
        const rtMs = Date.now() - trialStartTime.current;
        const isCorrect = answer === puzzle.isSame;
        
        if (isCorrect) setScore(s => s + 1);

        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs: rtMs, telemetry: { timedOut: answer === null } };
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

    if (!adaptiveState) return <Loader2 className="animate-spin" />;

    return (
        <Card className="w-full max-w-3xl text-center bg-zinc-900 border-orange-500/20 text-orange-100">
            <CardHeader>
                <CardTitle className="text-orange-300 flex items-center justify-center gap-2">
                    <Share2 /> Syntax Scan
                </CardTitle>
                <CardDescription className="text-orange-300/70">Are the two code snippets identical? Spot the difference before time runs out!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 min-h-[500px] justify-center">
                {gameState === 'start' && <Button onClick={startNewSession} size="lg">Start</Button>}
                {gameState === 'finished' && <div className="text-center space-y-4"><h3 className="text-2xl font-bold">Session Finished!</h3><p className="text-lg">Score: {score}/{trialCount.current}</p><Button onClick={startNewSession} className="mt-4">Play Again</Button></div>}
                {(gameState === 'running' || gameState === 'feedback') && puzzle && (
                    <div className="w-full flex flex-col items-center gap-4">
                        <div className="w-full flex justify-between font-mono text-orange-200 px-2">
                            <span>Score: {score}</span>
                            <span>Time Left: {timeLeft.toFixed(0)}s</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-800"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${(timeLeft / (timeLimit / 1000)) * 100}%`, transition: `width 1s linear` }}/></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <CodeSnippet code={puzzle.snippetA} />
                            <CodeSnippet code={puzzle.snippetB} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
                            <Button onClick={() => handleResponse(true)} className="h-20 text-2xl bg-orange-600 hover:bg-orange-500 text-white" disabled={gameState==='feedback'}>SAME</Button>
                            <Button onClick={() => handleResponse(false)} className="h-20 text-2xl bg-orange-800 hover:bg-orange-700 text-white" disabled={gameState==='feedback'}>DIFFERENT</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    