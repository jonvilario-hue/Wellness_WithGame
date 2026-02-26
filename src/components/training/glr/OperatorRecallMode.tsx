
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TrainingFocus, AdaptiveState, TrialResult, GameId } from "@/types";
import { useGlrStore, type SpacedPair } from "@/hooks/use-glr-store";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { Loader2, Brain, Check, X, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { PRNG } from '@/lib/rng';

const GLR_GAME_ID: GameId = 'glr_fluency_storm';
const glrPolicy = difficultyPolicies[GLR_GAME_ID];

const generateDistractors = (correctMeaning: string, allPairs: SpacedPair[], prng: PRNG): string[] => {
    const potentialDistractors = allPairs.filter(p => p && p.word2 && p.word2 !== correctMeaning);

    if (potentialDistractors.length === 0) {
        return [];
    }

    const shuffled = prng.shuffle(potentialDistractors);
    const distractors = new Set<string>();
    
    for (const pair of shuffled) {
        if (distractors.size < 3) {
            distractors.add(pair.word2);
        } else {
            break;
        }
    }
    
    return Array.from(distractors);
};

export function OperatorRecallMode({ onComplete, focus }: { onComplete: (result: { score: number, trials: TrialResult[] }) => void, focus: TrainingFocus }) {
    const { introduceNewPairs, getDueReviewPairs, updatePairOnResult, spacedPairs } = useGlrStore();
    const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
    
    const [phase, setPhase] = useState<'loading' | 'study' | 'recall' | 'finished'>('loading');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    const [queue, setQueue] = useState<SpacedPair[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [feedback, setFeedback] = useState<{ pairId: string, correct: boolean } | null>(null);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const trialStartTime = useRef(0);
    const prngRef = useRef<PRNG | null>(null);
    const adaptiveState = getAdaptiveState(GLR_GAME_ID, focus);
    
    useEffect(() => {
        prngRef.current = new PRNG(activeSession?.sessionId || Date.now().toString());
        const due = getDueReviewPairs(focus);
        if (due.length > 0) {
            setQueue(due);
            setPhase('recall');
        } else {
            const newPairs = introduceNewPairs(focus, 3);
            setQueue(newPairs);
            setPhase('study');
        }
        setCurrentIndex(0);
        setSessionTrials([]);
        trialStartTime.current = Date.now();
    }, [activeSession, focus, getDueReviewPairs, introduceNewPairs]);

    const handleNextInStudy = () => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(i => i + 1);
        } else {
            setPhase('recall');
            setCurrentIndex(0);
            trialStartTime.current = Date.now();
        }
    };

    const handleAnswer = (pair: SpacedPair, answer: string) => {
        if (feedback) return;

        const isCorrect = answer === pair.word2;
        const reactionTimeMs = Date.now() - trialStartTime.current;
        trialStartTime.current = Date.now();

        setSelectedAnswer(answer);
        updatePairOnResult(pair.id, isCorrect);
        if(isCorrect) setScore(s => s + 1);
        setFeedback({ pairId: pair.id, correct: isCorrect });

        const trialResult: TrialResult = {
            correct: isCorrect,
            reactionTimeMs,
            telemetry: { 
                stimulus: pair.word1, 
                strengthBefore: pair.strength, 
                intervalStage: pair.intervalStage 
            }
        };
        setSessionTrials(prev => [...prev, trialResult]);
        
        if (activeSession) {
            logEvent({ type: 'trial_complete', sessionId: activeSession.sessionId, payload: { ...trialResult, gameId: GLR_GAME_ID, focus } as any });
        }
        
        const newState = adjustDifficulty(trialResult, getAdaptiveState(GLR_GAME_ID, focus), glrPolicy);
        updateAdaptiveState(GLR_GAME_ID, focus, newState);

        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < queue.length - 1) {
                setCurrentIndex(i => i + 1);
            } else {
                onComplete({ score, trials: sessionTrials });
                setPhase('finished');
            }
        }, 2000);
    };

    const renderStudyPhase = () => {
        const pair = queue[currentIndex];
        if (!pair) return <Loader2 className="animate-spin" />;

        return (
            <div className="flex flex-col items-center gap-4 animate-in fade-in w-full max-w-md">
                 <p className="font-semibold text-primary uppercase">New Concept</p>
                 <Card className="w-full text-center bg-emerald-900/50 border-emerald-500/30">
                    <CardHeader>
                        <CardTitle className="font-mono text-5xl text-emerald-300">{pair.word1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-semibold text-emerald-100">{pair.word2}</p>
                        <p className="text-sm italic text-emerald-300/70 mt-2">{pair.hint}</p>
                    </CardContent>
                 </Card>
                 <Button onClick={handleNextInStudy} className="mt-4 bg-emerald-600 hover:bg-emerald-500">Got it</Button>
            </div>
        );
    };

    const renderRecallPhase = () => {
        const pair = queue[currentIndex];
        if (!pair || !prngRef.current) return <Loader2 className="animate-spin" />;

        const options = prngRef.current.shuffle([
            pair.word2,
            ...generateDistractors(pair.word2, Object.values(spacedPairs), prngRef.current)
        ]);

        return (
             <div className="flex flex-col items-center gap-4 animate-in fade-in w-full max-w-lg">
                 <div className="w-full flex justify-between font-mono text-sm">
                    <span>Item: {currentIndex + 1} / {queue.length}</span>
                    <span>Score: {score}</span>
                </div>
                <p className="text-lg text-muted-foreground">What does this operator mean?</p>
                <div className="h-24 flex items-center justify-center">
                    <span className="font-mono text-7xl text-emerald-300">{pair.word1}</span>
                </div>

                <div className="h-8 mt-2">
                    {feedback && feedback.pairId === pair.id && (
                        feedback.correct 
                        ? <p className="text-green-400 font-bold text-xl flex items-center gap-2"><Check /> Correct!</p>
                        : <p className="text-rose-400 font-bold text-xl flex items-center gap-2"><X /> Incorrect.</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    {options.map((opt, i) => (
                        <Button 
                            key={i} 
                            onClick={() => handleAnswer(pair, opt)}
                            disabled={!!feedback}
                            variant="outline"
                            className={cn("h-auto min-h-[4rem] py-2 text-base whitespace-normal",
                                feedback && opt === pair.word2 && "bg-green-500/20 border-green-500",
                                feedback && selectedAnswer === opt && opt !== pair.word2 && "bg-destructive/20 border-destructive"
                            )}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>
             </div>
        )
    };

    if (phase === 'loading') return <Loader2 className="animate-spin h-10 w-10 text-emerald-400" />;
    if (phase === 'study') return renderStudyPhase();
    if (phase === 'recall') return renderRecallPhase();
    return null; // Finished state is handled by parent
}
