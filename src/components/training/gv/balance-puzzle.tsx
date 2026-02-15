
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { Scale } from 'lucide-react';
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";

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
    // Assign random weights to each shape
    const weights: Record<string, number> = {};
    const shuffledWeights = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    shapes.forEach((shape, index) => {
        weights[shape.id] = shuffledWeights[index];
    });

    const puzzleShapes = [...shapes].sort(() => Math.random() - 0.5).slice(0, 3);
    const [s1, s2, s3] = puzzleShapes;

    // Rule 1: s1 = s2 + s3
    const leftSide = [s1];
    const rightSide = [s2, s3];
    const leftWeight = weights[s1.id];
    const rightWeight = weights[s2.id] + weights[s3.id];
    // Adjust to make it an equation
    if(leftWeight > rightWeight) {
        const diff = leftWeight - rightWeight;
        const fillerShape = shapes.find(s => weights[s.id] === diff);
        if(fillerShape) rightSide.push(fillerShape);
    } else if (rightWeight > leftWeight) {
        const diff = rightWeight - leftWeight;
        const fillerShape = shapes.find(s => weights[s.id] === diff);
        if(fillerShape) leftSide.push(fillerShape);
    }
    
    // Question
    const questionShape = puzzleShapes[Math.floor(Math.random() * puzzleShapes.length)];
    const answer = weights[questionShape.id];

    // Options
    const options = new Set<number>([answer]);
    while (options.size < 4) {
        const decoy = Math.max(1, answer + Math.floor(Math.random() * 5) - 2);
        if (decoy !== answer) {
            options.add(decoy);
        }
    }

    return {
        leftSide,
        rightSide,
        questionShape,
        answer,
        options: Array.from(options).sort(() => Math.random() - 0.5),
    };
};

const ShapeDisplay = ({ shape, size = 'text-5xl' }: { shape: Shape, size?: string }) => (
    <span className={cn(shape.color, size, 'font-bold')}>{shape.symbol}</span>
);

export function BalancePuzzle() {
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [startTime, setStartTime] = useState(0);
    const { logGameResult } = usePerformanceStore();

    const generateNewPuzzle = useCallback(() => {
        setPuzzle(generatePuzzle());
        setInlineFeedback({ message: '', type: '' });
        setSelectedAnswer(null);
        setStartTime(Date.now());
    }, []);

    useEffect(() => {
        generateNewPuzzle();
    }, [generateNewPuzzle]);

    const handleAnswer = (option: number) => {
        if (inlineFeedback.message || !puzzle) return;

        setSelectedAnswer(option);
        const time = (Date.now() - startTime) / 1000;
        let score = 0;

        if (option === puzzle.answer) {
            setInlineFeedback({ message: getSuccessFeedback('Gv'), type: 'success' });
            score = 100;
        } else {
            setInlineFeedback({ message: getFailureFeedback('Gv'), type: 'failure' });
            score = 0;
        }
        logGameResult('Gv', 'math', { score, time });

        setTimeout(() => {
            generateNewPuzzle();
        }, 2000);
    };

    if (!puzzle) {
        return <div className="text-center">Loading Puzzle...</div>;
    }

    return (
        <Card className="w-full max-w-xl">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Scale />
                    (Gv) Balance Puzzle
                </CardTitle>
                <CardDescription>Deduce the value of the shape using the balanced scales. This puzzle helps you reason about quantity using spatial logic.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                {/* Visual Rule Display */}
                <div className="w-full p-4 bg-muted rounded-lg">
                    <h3 className="text-center text-sm font-semibold mb-2">Rule</h3>
                    <div className="flex items-center justify-center">
                        <div className="flex-1 flex justify-end items-center gap-2 p-2 pr-4">{puzzle.leftSide.map((s, i) => <ShapeDisplay key={i} shape={s} />)}</div>
                        <div className="text-4xl font-bold text-primary">=</div>
                        <div className="flex-1 flex justify-start items-center gap-2 p-2 pl-4">{puzzle.rightSide.map((s, i) => <ShapeDisplay key={i} shape={s} />)}</div>
                    </div>
                </div>

                {/* Question */}
                <div className="flex items-center gap-4 text-3xl font-bold">
                    <ShapeDisplay shape={puzzle.questionShape} size="text-6xl" />
                    <span>=</span>
                    <span>?</span>
                </div>

                {/* Options */}
                <div className="grid grid-cols-4 gap-4 w-full">
                    {puzzle.options.map((option, index) => (
                        <Button
                            key={index}
                            onClick={() => handleAnswer(option)}
                            disabled={!!inlineFeedback.message}
                            size="lg"
                            className={cn(
                                "h-16 text-2xl transition-all duration-300",
                                inlineFeedback.message && option === puzzle.answer && "bg-green-600 hover:bg-green-700",
                                inlineFeedback.type === 'failure' && selectedAnswer === option && "bg-destructive hover:bg-destructive/90"
                            )}
                        >
                            {option}
                        </Button>
                    ))}
                </div>

                {/* Feedback */}
                <div className="h-10 mt-2 text-center">
                    {inlineFeedback.message && (
                        <div className={cn("animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
                            <p className="text-lg font-bold">
                                {inlineFeedback.message}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
