
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Music2, Loader2 } from 'lucide-react';
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

// Use a function to generate paths to make them more dynamic later
const getMeasurePath = (id: string): string => {
    const measures: Record<string, string> = {
        'q_q_h': 'M70 100 L70 50 M60 50 L80 50 M140 100 L140 50 M130 50 L150 50 M220 100 L220 50',
        'h_q_q': 'M70 100 L70 50 M150 100 L150 50 M140 50 L160 50 M220 100 L220 50 M210 50 L230 50',
        'e_e_q_q': 'M70 100 L70 40 M110 100 L110 40 M70 40 L110 40 M160 100 L160 50 M150 50 L170 50 M230 100 L230 50 M220 50 L240 50',
        'q_up_q_down': 'M70 90 L70 40 M60 40 L80 40 M140 60 L140 10 M130 10 L150 10 M220 110 L220 60 M210 60 L230 60',
        'dotted_q_e': 'M70 100 L70 50 M85 75 a 5 5 0 1 1 0 -0.01 M140 100 L140 40 M140 40 L110 40', // Approximated
    };
    return measures[id] || measures['q_q_h'];
}

type Measure = { id: string, desc: string };
type Puzzle = {
    target: Measure;
    options: Measure[];
    answer: Measure;
}

const generatePuzzleForLevel = (level: number): Puzzle => {
    const params = policy.levelMap[level]?.music || policy.levelMap[1].music;
    const measurePool = params.measures as Measure[];
    const numOptions = params.distractorCount + 1;

    const shuffled = [...measurePool].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const decoys = shuffled.slice(1, numOptions);
    const options = [target, ...decoys].sort(() => Math.random() - 0.5);
    return { target, options, answer: target };
};

const MusicNotation = ({ path, className }: { path: string; className?: string }) => (
    <div className={cn("relative w-full h-full", className)}>
        {[40, 60, 80, 100, 120].map(y => (
             <div key={y} className="absolute bg-muted-foreground h-[1px] w-full" style={{ top: `${y}px` }} />
        ))}
        <svg viewBox="0 0 300 150" className="w-full h-full">
            <path d={getMeasurePath(path)} stroke="hsl(var(--primary))" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
    </div>
);


export function VisualMusicMatch({ focus }: { focus: TrainingFocus }) {
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();

    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState('');
    
    const trialStartTime = useRef(0);
    const currentTrialIndex = useRef(0);

    useEffect(() => {
        const initialState = getAdaptiveState(GAME_ID, focus);
        setAdaptiveState(initialState);
        setGameState('start');
    }, [focus, getAdaptiveState]);
    
    const startNewTrial = useCallback((state: AdaptiveState) => {
        setPuzzle(generatePuzzleForLevel(state.currentLevel));
        setSelectedId(null);
        setFeedback('');
        setGameState('playing');
        trialStartTime.current = Date.now();
    }, []);

    const startNewSession = useCallback(() => {
        if (!adaptiveState) return;
        const sessionState = startSession(adaptiveState);
        setAdaptiveState(sessionState);
        setSessionTrials([]);
        currentTrialIndex.current = 0;
        startNewTrial(sessionState);
    }, [adaptiveState, startNewTrial]);

    const handleSelect = (option: Measure) => {
        if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
        setGameState('feedback');
        setSelectedId(option.id);
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const isCorrect = option.id === puzzle.answer.id;
        
        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
        setSessionTrials(prev => [...prev, trialResult]);
        
        const newState = adjustDifficulty(trialResult, adaptiveState, policy);
        setAdaptiveState(newState);

        setFeedback(isCorrect ? getSuccessFeedback('Gv') : getFailureFeedback('Gv'));
        
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
            <div className="flex flex-col items-center gap-6 w-full">
                <div className="w-full flex justify-between font-mono text-sm">
                    <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                    <span>Level: {adaptiveState.currentLevel}</span>
                </div>
                <div>
                    <h3 className="text-center font-semibold mb-2">Target</h3>
                    <div className="p-4 bg-muted rounded-lg w-72 h-40">
                        <MusicNotation path={puzzle.target.id} />
                    </div>
                </div>

                <div className="h-6 text-sm font-bold">
                    {feedback && <p className={cn(feedback.includes('Incorrect') ? 'text-amber-600' : 'text-green-600')}>{feedback}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    {puzzle.options.map((option, index) => (
                        <Button
                            key={index}
                            onClick={() => handleSelect(option)}
                            disabled={gameState === 'feedback'}
                            variant="outline"
                            className={cn(
                                "h-40 p-4 transition-all duration-300",
                                gameState === 'feedback' && option.id === puzzle.answer.id && 'bg-green-500/20 border-green-500',
                                gameState === 'feedback' && selectedId === option.id && option.id !== puzzle.answer.id && 'bg-destructive/20 border-destructive'
                            )}
                        >
                            <MusicNotation path={option.id} />
                        </Button>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Music2 />
                    (Gv) Visual Music Match
                </CardTitle>
                <CardDescription>Find the musical measure below that exactly matches the target.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    )
}
