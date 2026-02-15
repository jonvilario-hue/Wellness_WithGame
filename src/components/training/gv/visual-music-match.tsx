
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Music2 } from 'lucide-react';
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";

const measures = [
    // Simple rhythms
    { id: 'q_q_h', path: 'M70 100 L70 50 M60 50 L80 50 M140 100 L140 50 M130 50 L150 50 M220 100 L220 50', desc: 'Two quarter notes, one half note' },
    { id: 'h_q_q', path: 'M70 100 L70 50 M150 100 L150 50 M140 50 L160 50 M220 100 L220 50 M210 50 L230 50', desc: 'One half note, two quarter notes' },
    // Introducing eighth notes
    { id: 'e_e_q_q', path: 'M70 100 L70 40 M110 100 L110 40 M70 40 L110 40 M160 100 L160 50 M150 50 L170 50 M230 100 L230 50 M220 50 L240 50', desc: 'Two eighth notes, two quarter notes' },
    // Different pitches
    { id: 'q_up_q_down', path: 'M70 90 L70 40 M60 40 L80 40 M140 60 L140 10 M130 10 L150 10 M220 110 L220 60 M210 60 L230 60', desc: 'Pitches: low, high, middle' },
];

type Measure = typeof measures[0];
type Puzzle = {
    target: Measure;
    options: Measure[];
    answer: Measure;
}

const generatePuzzle = (): Puzzle => {
    const shuffled = [...measures].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const decoys = shuffled.slice(1, 4);
    const options = [target, ...decoys].sort(() => Math.random() - 0.5);

    return {
        target,
        options,
        answer: target,
    };
};

const MusicNotation = ({ path, className }: { path: string; className?: string }) => (
    <div className={cn("relative w-full h-full", className)}>
        {/* Staff lines */}
        {[40, 60, 80, 100, 120].map(y => (
             <div key={y} className="absolute bg-muted-foreground h-[1px] w-full" style={{ top: `${y}px` }} />
        ))}
        <svg viewBox="0 0 300 150" className="w-full h-full">
            <path d={path} stroke="hsl(var(--primary))" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
    </div>
);


export function VisualMusicMatch() {
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [feedback, setFeedback] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [startTime, setStartTime] = useState(0);
    const { logGameResult } = usePerformanceStore();
    const [score, setScore] = useState(0);

    const startNewPuzzle = useCallback(() => {
        setPuzzle(generatePuzzle());
        setFeedback('');
        setSelectedId(null);
        setStartTime(Date.now());
    }, []);

    useEffect(() => {
        startNewPuzzle();
    }, [startNewPuzzle]);

    const handleSelect = (option: Measure) => {
        if (feedback) return;

        const isCorrect = option.id === puzzle?.answer.id;
        setSelectedId(option.id);
        const time = (Date.now() - startTime) / 1000;
        
        if (isCorrect) {
            setScore(prev => prev + 1);
            setFeedback(getSuccessFeedback('Gv'));
            logGameResult('Gv', 'music', { score: 100, time });
        } else {
            setFeedback(getFailureFeedback('Gv'));
            logGameResult('Gv', 'music', { score: 0, time });
        }

        setTimeout(() => startNewPuzzle(), 2000);
    };
    
    if (!puzzle) {
        return <div className="text-center">Loading Music Puzzle...</div>
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
            <CardContent className="flex flex-col items-center gap-6">
                <div className="w-full flex justify-end font-mono">Score: {score}</div>
                <div>
                    <h3 className="text-center font-semibold mb-2">Target</h3>
                    <div className="p-4 bg-muted rounded-lg w-72 h-40">
                        <MusicNotation path={puzzle.target.path} />
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
                            disabled={!!feedback}
                            variant="outline"
                            className={cn(
                                "h-40 p-4 transition-all duration-300",
                                feedback && option.id === puzzle.answer.id && 'bg-green-500/20 border-green-500',
                                feedback && selectedId === option.id && option.id !== puzzle.answer.id && 'bg-destructive/20 border-destructive'
                            )}
                        >
                            <MusicNotation path={option.path} />
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
