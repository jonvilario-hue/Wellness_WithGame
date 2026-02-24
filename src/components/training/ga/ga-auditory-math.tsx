'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Volume2, Loader2, Equal, GitCommitHorizontal } from 'lucide-react';
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";

const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

// --- Speech Synthesis Hook ---
const useSpeechSynthesis = () => {
    const [isSupported, setIsSupported] = useState(false);
    useEffect(() => {
        setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    }, []);

    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (!isSupported) {
            console.warn("Speech Synthesis not supported.");
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        if(onEnd) {
            utterance.onend = onEnd;
        }
        window.speechSynthesis.speak(utterance);
    }, [isSupported]);
    
    return { speak, isSupported };
};


// --- Game Component ---
export function GaAuditoryMath({ focus }: { focus: TrainingFocus }) {
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
    const { speak, isSupported } = useSpeechSynthesis();

    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    
    const [puzzle, setPuzzle] = useState<{ num1: number, num2: number } | null>(null);
    const [feedback, setFeedback] = useState('');
    
    const trialStartTime = useRef(0);
    const currentTrialIndex = useRef(0);
    const hasSpokenRef = useRef(false);

    useEffect(() => {
        const initialState = getAdaptiveState(GAME_ID, focus);
        setAdaptiveState(initialState);
        setGameState('start');
    }, [focus, getAdaptiveState]);
    
    const startNewTrial = useCallback((state: AdaptiveState) => {
        const { content_config } = policy.levelMap[state.currentLevel] || policy.levelMap[1];
        const params = content_config[focus]?.params || { max_val: 10, distinction: 5 };
        
        let num1 = Math.floor(Math.random() * params.max_val) + 1;
        let num2;
        do {
            num2 = Math.floor(Math.random() * params.max_val) + 1;
        } while (Math.abs(num1 - num2) < params.distinction);

        setPuzzle({ num1, num2 });
        setFeedback('');
        setGameState('playing');
        hasSpokenRef.current = false;
        trialStartTime.current = Date.now();
    }, [focus]);

    useEffect(() => {
        if (gameState === 'playing' && puzzle && !hasSpokenRef.current) {
            hasSpokenRef.current = true;
            const handleSpeechEnd = () => {
                setTimeout(() => speak(puzzle.num2.toString()), 500);
            };
            speak(puzzle.num1.toString(), handleSpeechEnd);
        }
    }, [gameState, puzzle, speak]);

    const startNewSession = useCallback(() => {
        if (!adaptiveState) return;
        const sessionState = startSession(adaptiveState);
        setAdaptiveState(sessionState);
        setSessionTrials([]);
        currentTrialIndex.current = 0;
        startNewTrial(sessionState);
    }, [adaptiveState, startNewTrial]);

    const handleAnswer = (userChoice: 'num1' | 'num2' | 'equal') => {
        if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
        setGameState('feedback');
        const reactionTimeMs = Date.now() - trialStartTime.current;
        
        let isCorrect = false;
        if (userChoice === 'equal') {
            isCorrect = puzzle.num1 === puzzle.num2;
        } else if (userChoice === 'num1') {
            isCorrect = puzzle.num1 > puzzle.num2;
        } else {
            isCorrect = puzzle.num2 > puzzle.num1;
        }
        
        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
        setSessionTrials(prev => [...prev, trialResult]);
        
        const newState = adjustDifficulty(trialResult, adaptiveState, policy);
        setAdaptiveState(newState);

        setFeedback(isCorrect ? getSuccessFeedback('Ga') : getFailureFeedback('Ga'));
        
        setTimeout(() => {
            currentTrialIndex.current++;
            if (currentTrialIndex.current >= policy.sessionLength) {
                setGameState('finished');
                const finalState = endSession(newState, [...sessionTrials, trialResult]);
                updateAdaptiveState(GAME_ID, focus, finalState);
            } else {
                startNewTrial(newState);
            }
        }, 2000);
    };

    const renderContent = () => {
        if (!isSupported) {
            return <div className="text-center text-destructive">This browser does not support the Web Speech API required for this game.</div>;
        }
        if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
        if (gameState === 'start') {
             return (
                <div className="flex flex-col items-center gap-4">
                  <div className="font-mono text-lg">Level: {adaptiveState.currentLevel}</div>
                  <Button onClick={startNewSession} size="lg">Start Session</Button>
                </div>
            );
        }
        if (gameState === 'finished') {
            const finalAccuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
            return (
                <div className="text-center space-y-4">
                    <CardTitle>Session Complete!</CardTitle>
                    <p>Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0)}%</p>
                    <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
                </div>
            );
        }
        if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;

        return (
             <div className="w-full flex flex-col items-center gap-6">
                <div className="w-full flex justify-between font-mono text-sm">
                    <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                    <span>Level: {adaptiveState.currentLevel}</span>
                </div>
                <div className="w-full p-8 bg-muted rounded-lg text-center min-h-[120px]">
                    <h3 className="text-lg font-semibold">Which number is larger?</h3>
                    <div className="flex justify-center items-center gap-8 mt-4">
                        <Volume2 className="w-12 h-12 text-primary animate-pulse" />
                    </div>
                </div>

                <div className="h-6 text-lg font-semibold">
                    {feedback && <p className={cn(feedback.includes('Incorrect') ? 'text-amber-600' : 'text-green-600')}>{feedback}</p>}
                </div>
                
                <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                    <Button onClick={() => handleAnswer('num1')} disabled={gameState==='feedback'} size="lg" className="h-24 text-xl">First</Button>
                    <Button onClick={() => handleAnswer('equal')} disabled={gameState==='feedback'} size="lg" className="h-24 text-xl">Equal</Button>
                    <Button onClick={() => handleAnswer('num2')} disabled={gameState==='feedback'} size="lg" className="h-24 text-xl">Second</Button>
                </div>
            </div>
        )
    };
    
    return (
        <Card className="w-full max-w-2xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
                    <Volume2 />
                    (Ga) Auditory Math
                </CardTitle>
                <CardDescription className="text-violet-300/70">
                    Listen to two spoken numbers and determine which is larger.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[500px]">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
