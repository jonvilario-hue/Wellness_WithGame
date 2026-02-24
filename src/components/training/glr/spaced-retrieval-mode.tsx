
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TrainingFocus, AdaptiveState, TrialResult, GameId } from "@/types";
import { useGlrStore, type SpacedPair } from "@/hooks/use-glr-store";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { mathWordList, musicWordList, generalWordList, verbalWordList } from "@/data/verbal-content";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { logTrialResult } from "@/lib/analytics";

const GLR_GAME_ID: GameId = 'glr_fluency_storm';
const glrPolicy = difficultyPolicies[GLR_GAME_ID];


function Distractor({ duration, onComplete }: { duration: number, onComplete: () => void }) {
    const [count, setCount] = useState(duration);
    useEffect(() => {
        if (count > 0) {
            const timer = setTimeout(() => setCount(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            onComplete();
        }
    }, [count, onComplete]);

    return <div className="text-center"><p className="text-muted-foreground">Mental Distraction</p><p className="text-6xl font-mono font-bold">{count}</p><p>Count down to zero...</p></div>;
};

export function SpacedRetrievalMode({ onComplete, focus }: { onComplete: (result: { score: number, trials: TrialResult[] }) => void, focus: TrainingFocus }) {
    const { addSpacedPairs, getDueReviewPairs, updatePairOnResult } = useGlrStore();
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
    const adaptiveState = getAdaptiveState(GLR_GAME_ID, focus);
    
    const wordList1 = useMemo(() => {
        if (focus === 'math') return mathWordList;
        if (focus === 'music') return musicWordList;
        if (focus === 'verbal') return verbalWordList;
        return generalWordList;
    }, [focus]);
    
    const [phase, setPhase] = useState<'review' | 'learn' | 'distract' | 'recall' | 'finished'>('review');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    const [duePairs, setDuePairs] = useState<SpacedPair[]>([]);
    const [newPairs, setNewPairs] = useState<{word1: string, word2: string}[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState<Record<string, 'correct' | 'incorrect'>>({});
    const [score, setScore] = useState(0);

    const trialStartTime = useRef(0);
    
    const policyParams = useMemo(() => {
        return glrPolicy.levelMap[adaptiveState.currentLevel]?.content_config[focus]?.params || glrPolicy.levelMap[1].content_config.neutral!.params;
    }, [adaptiveState.currentLevel, focus]);

    useEffect(() => {
        const pairsToReview = getDueReviewPairs();
        if (pairsToReview.length > 0) {
            setDuePairs(pairsToReview);
            setPhase('recall');
        } else {
            const generated = Array.from({ length: policyParams.pairs }).map(() => {
                const word1 = wordList1[Math.floor(Math.random() * wordList1.length)];
                let word2 = generalWordList[Math.floor(Math.random() * generalWordList.length)];
                while(word1 === word2) word2 = generalWordList[Math.floor(Math.random() * generalWordList.length)];
                return { word1, word2 };
            });
            setNewPairs(generated);
            addSpacedPairs(generated);
            setPhase('learn');
        }
        setCurrentIndex(0);
        setSessionTrials([]);
        trialStartTime.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleNext = () => {
        const currentList = phase === 'recall' ? (duePairs.length > 0 ? duePairs : newPairs) : newPairs;
        if (currentIndex < currentList.length - 1) {
            setCurrentIndex(i => i + 1);
            trialStartTime.current = Date.now();
        } else {
            if (phase === 'learn') setPhase('distract');
            else if (phase === 'recall') {
                const recallAccuracy = score / currentList.length;
                onComplete({ score, trials: sessionTrials });
                setPhase('finished');
            }
            setCurrentIndex(0);
        }
    };
    
    const handleRecallSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const pair = (duePairs.length > 0 ? duePairs : newPairs)[currentIndex];
        const isCorrect = userInput.trim().toLowerCase() === pair.word2.toLowerCase();
        
        const trial: TrialResult = {
            correct: isCorrect,
            reactionTimeMs,
            telemetry: {
                mode: 'spaced_retrieval',
                pairId: pair.id,
                intervalStage: pair.intervalStage
            }
        };

        logTrialResult(GLR_GAME_ID, adaptiveState.currentLevel, trial);
        setSessionTrials(prev => [...prev, trial]);

        updatePairOnResult(pair.id || `${pair.word1}-${pair.word2}`, isCorrect);
        
        setFeedback(prev => ({...prev, [pair.word1]: isCorrect ? 'correct' : 'incorrect'}));
        if(isCorrect) setScore(s => s + 1);
        
        setUserInput('');
        setTimeout(handleNext, 2000);
    };

    if (phase === 'distract') {
        return <Distractor duration={policyParams.distractorDuration} onComplete={() => { setCurrentIndex(0); setPhase('recall'); trialStartTime.current = Date.now(); }} />;
    }
    
    const pairToShow = (phase === 'recall' ? (duePairs.length > 0 ? duePairs : newPairs) : newPairs)[currentIndex];

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <p className="font-semibold text-primary uppercase">{phase} Phase</p>
            {phase === 'learn' && pairToShow && (
                 <div className="text-center p-8 bg-muted rounded-lg animate-in fade-in">
                    <p className="text-muted-foreground">Memorize this pair:</p>
                    <p className="text-4xl font-bold">{pairToShow.word1} - {pairToShow.word2}</p>
                    <p className="text-sm font-mono mt-4">Pair {currentIndex + 1} of {newPairs.length}</p>
                    <Button onClick={handleNext} className="mt-4">Next</Button>
                </div>
            )}
            {(phase === 'recall') && pairToShow && (
                <div className="w-full text-center space-y-4">
                    <p className="text-muted-foreground">What word was paired with:</p>
                    <p className="text-5xl font-bold">{pairToShow.word1}</p>
                    {feedback[pairToShow.word1] ? (
                        <div className={cn("text-2xl font-bold", feedback[pairToShow.word1] === 'correct' ? "text-green-500" : "text-destructive")}>
                            {feedback[pairToShow.word1] === 'correct' ? "Correct!" : `The answer was: ${pairToShow.word2}`}
                        </div>
                    ) : (
                        <form onSubmit={handleRecallSubmit} className="flex gap-2 justify-center">
                            <Input value={userInput} onChange={e => setUserInput(e.target.value)} autoFocus placeholder="Type the word" className="text-center"/>
                            <Button type="submit">Submit</Button>
                        </form>
                    )}
                </div>
            )}
            {phase === 'finished' && <p>Recall session complete!</p>}
        </div>
    );
}
