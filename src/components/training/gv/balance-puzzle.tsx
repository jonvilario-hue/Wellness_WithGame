
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Scale, Loader2 } from 'lucide-react';
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";

const GAME_ID: GameId = 'gv_visual_lab'; // This game maps to the Gv lab
const policy = difficultyPolicies[GAME_ID];

const shapes = [
    { id: 'circle', symbol: '●', color: 'text-chart-1' },
    { id: 'square', symbol: '■', color: 'text-chart-2' },
    { id: 'triangle', symbol: '▲', color: 'text-chart-3' },
    { id: 'diamond', symbol: '◆', color: 'text-chart-4' },
    { id: 'plus', symbol: '✚', color: 'text-chart-5' },
];

type Shape = (typeof shapes)[0];
type Puzzle = {
    leftSide: Shape[];
    rightSide: Shape[];
    questionShape: Shape;
    answer: number;
    options: number[];
};

const generatePuzzle = (): Puzzle => {
    const weights: Record<string, number> = {};
    const shuffledWeights = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    shapes.forEach((shape, index) => {
        weights[shape.id] = shuffledWeights[index];
    });

    const puzzleShapes = [...shapes].sort(() => Math.random() - 0.5).slice(0, 3);
    const [s1, s2, s3] = puzzleShapes;

    let leftSide = [s1];
    let rightSide = [s2, s3];
    let leftWeight = weights[s1.id];
    let rightWeight = weights[s2.id] + weights[s3.id];
    if(leftWeight > rightWeight) {
        const diff = leftWeight - rightWeight;
        const fillerShape = shapes.find(s => weights[s.id] === diff);
        if(fillerShape) rightSide.push(fillerShape);
    } else if (rightWeight > leftWeight) {
        const diff = rightWeight - leftWeight;
        const fillerShape = shapes.find(s => weights[s.id] === diff);
        if(fillerShape) leftSide.push(fillerShape);
    }
    
    const questionShape = puzzleShapes[Math.floor(Math.random() * puzzleShapes.length)];
    const answer = weights[questionShape.id];

    const options = new Set<number>([answer]);
    while (options.size < 4) {
        const decoy = Math.max(1, answer + Math.floor(Math.random() * 5) - 2);
        if (decoy !== answer) options.add(decoy);
    }

    return { leftSide, rightSide, questionShape, answer, options: Array.from(options).sort(() => Math.random() - 0.5) };
};

const ShapeDisplay = ({ shape, size = 'text-5xl' }: { shape: Shape, size?: string }) => (
    <span className={cn(shape.color, size, 'font-bold')}>{shape.symbol}</span>
);

export function BalancePuzzle({ focus }: { focus: TrainingFocus }) {
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();

    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
    
    const trialStartTime = useRef(0);
    const currentTrialIndex = useRef(0);

    useEffect(() => {
        const initialState = getAdaptiveState(GAME_ID, focus);
        setAdaptiveState(initialState);
        setGameState('start');
    }, [focus, getAdaptiveState]);
    
    const startNewTrial = useCallback((state: AdaptiveState) => {
        setPuzzle(generatePuzzle());
        setSelectedAnswer(null);
        setInlineFeedback({ message: '', type: '' });
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

    const handleAnswer = (option: number) => {
        if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
        setGameState('feedback');
        setSelectedAnswer(option);
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const isCorrect = option === puzzle.answer;
        
        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
        setSessionTrials(prev => [...prev, trialResult]);
        
        const newState = adjustDifficulty(trialResult, adaptiveState, policy);
        setAdaptiveState(newState);

        setInlineFeedback({ message: isCorrect ? getSuccessFeedback('Gv') : getFailureFeedback('Gv'), type: isCorrect ? 'success' : 'failure' });

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
        if (gameState === 'loading') return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
        if (gameState === 'start') {
            return (
                <div className="flex flex-col items-center gap-4">
                  <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
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
                    <span>Level: {adaptiveState?.currentLevel}</span>
                </div>
                <div className="w-full p-4 bg-muted rounded-lg">
                    <h3 className="text-center text-sm font-semibold mb-2">Rule</h3>
                    <div className="flex items-center justify-center">
                        <div className="flex-1 flex justify-end items-center gap-2 p-2 pr-4">{puzzle.leftSide.map((s, i) => <ShapeDisplay key={i} shape={s} />)}</div>
                        <div className="text-4xl font-bold text-primary">=</div>
                        <div className="flex-1 flex justify-start items-center gap-2 p-2 pl-4">{puzzle.rightSide.map((s, i) => <ShapeDisplay key={i} shape={s} />)}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-3xl font-bold">
                    <ShapeDisplay shape={puzzle.questionShape} size="text-6xl" />
                    <span>=</span>
                    <span>?</span>
                </div>

                <div className="grid grid-cols-4 gap-4 w-full">
                    {puzzle.options.map((option, index) => (
                        <Button
                            key={index}
                            onClick={() => handleAnswer(option)}
                            disabled={gameState === 'feedback'}
                            size="lg"
                            className={cn(
                                "h-16 text-2xl transition-all duration-300",
                                gameState === 'feedback' && option === puzzle.answer && "bg-green-600 hover:bg-green-700",
                                gameState === 'feedback' && selectedAnswer === option && option !== puzzle.answer && "bg-destructive hover:bg-destructive/90"
                            )}
                        >
                            {option}
                        </Button>
                    ))}
                </div>

                <div className="h-10 mt-2 text-center">
                    {inlineFeedback.message && (
                        <div className={cn("animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
                            <p className="text-lg font-bold">{inlineFeedback.message}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Card className="w-full max-w-xl">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Scale />
                    (Gv) Balance Puzzle
                </CardTitle>
                <CardDescription>Deduce the value of the shape using the balanced scales. This puzzle helps you reason about quantity using spatial logic.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[450px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
