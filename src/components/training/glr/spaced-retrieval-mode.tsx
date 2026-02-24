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

const GLR_GAME_ID: GameId = 'glr_fluency_storm';
const glrPolicy = difficultyPolicies[GLR_GAME_ID];


function ActiveDistractor({ duration, onComplete }: { duration: number, onComplete: () => void }) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [position, setPosition] = useState({ top: '50%', left: '50%' });
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            onComplete();
        }
    }, [timeLeft, onComplete]);

    const handleButtonClick = () => {
        setScore(s => s + 1);
        setPosition({
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
        });
    };

    return (
        <div className="w-full h-64 bg-muted/50 rounded-lg relative flex flex-col items-center justify-center p-4">
             <div className="absolute top-2 right-2 font-mono text-lg">Time: {timeLeft}</div>
             <p className="text-lg font-semibold mb-2">Active Distractor</p>
             <p className="text-sm text-muted-foreground text-center">Click the moving button as many times as you can to clear your working memory.</p>
            <Button
                onClick={handleButtonClick}
                className="absolute transition-all duration-300"
                style={{ top: position.top, left: position.left, transform: 'translate(-50%, -50%)' }}
            >
                Click Me!
            </Button>
            <div className="absolute bottom-2 right-2 font-mono text-lg">Score: {score}</div>
        </div>
    );
};


export function SpacedRetrievalMode({ onComplete, focus }: { onComplete: (result: { score: number, trials: TrialResult[] }) => void, focus: TrainingFocus }) {
    const { addSpacedPairs, getDueReviewPairs, updatePairOnResult } = useGlrStore();
    const store = usePerformanceStore.getState();
    
    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
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
        if (!adaptiveState) return glrPolicy.levelMap[1].content_config.neutral!.params;
        return glrPolicy.levelMap[adaptiveState.currentLevel]?.content_config[focus]?.params || glrPolicy.levelMap[1].content_config.neutral!.params;
    }, [adaptiveState, focus]);

    useEffect(() => {
        setAdaptiveState(store.getAdaptiveState(GLR_GAME_ID, focus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focus, store]);

    useEffect(() => {
        if (!adaptiveState) return;

        const pairsToReview = getDueReviewPairs();
        if (pairsToReview.length > 0) {
            setDuePairs(pairsToReview);
            setPhase('recall');
        } else {
            const wordList1 = (focus === 'math') ? mathWordList : (focus === 'music') ? musicWordList : (focus === 'verbal') ? verbalWordList : generalWordList;
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
    }, [adaptiveState, focus, getDueReviewPairs, addSpacedPairs, policyParams.pairs]);

    const handleNext = () => {
        const currentList = phase === 'recall' ? (duePairs.length > 0 ? duePairs : newPairs) : newPairs;
        if (currentIndex < currentList.length - 1) {
            setCurrentIndex(i => i + 1);
            trialStartTime.current = Date.now();
        } else {
            if (phase === 'learn') setPhase('distract');
            else if (phase === 'recall') {
                onComplete({ score, trials: sessionTrials });
                setPhase('finished');
            }
            setCurrentIndex(0);
        }
    };
    
    const handleRecallSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!adaptiveState) return;
        const levelPlayed = adaptiveState.currentLevel;
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

        store.logTrial({
            userId: 'local_user',
            module_id: GLR_GAME_ID,
            currentLevel: levelPlayed,
            isCorrect,
            responseTime_ms: reactionTimeMs,
            meta: trial.telemetry,
        });

        const newState = adjustDifficulty(trial, adaptiveState, glrPolicy);
        store.updateAdaptiveState(GLR_GAME_ID, focus, newState);
        setAdaptiveState(newState);

        updatePairOnResult(pair.id || `${pair.word1}-${pair.word2}`, isCorrect);
        
        setFeedback(prev => ({...prev, [pair.word1]: isCorrect ? 'correct' : 'incorrect'}));
        if(isCorrect) setScore(s => s + 1);
        
        setUserInput('');
        setTimeout(handleNext, 2000);
    };

    if (phase === 'distract') {
        return <ActiveDistractor duration={policyParams.distractorDuration} onComplete={() => { setCurrentIndex(0); setPhase('recall'); trialStartTime.current = Date.now(); }} />;
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
