
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
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Music2, Brain } from "lucide-react";

const GLR_GAME_ID: GameId = 'glr_fluency_storm';
const glrPolicy = difficultyPolicies[GLR_GAME_ID];

const icons: Record<string, React.ElementType> = {
    "harmony": Music2,
    "rhythm": Brain,
    "melody": Music2,
    "tempo": Brain,
};

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
                className="absolute transition-all duration-300 bg-emerald-600 hover:bg-emerald-500 text-white"
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
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { playSequence } = useAudioEngine();
    
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
        const state = getAdaptiveState(GLR_GAME_ID, focus);
        return glrPolicy.levelMap[state.currentLevel]?.content_config[focus]?.params || glrPolicy.levelMap[1].content_config.neutral!.params;
    }, [focus, getAdaptiveState]);

    useEffect(() => {
        const state = getAdaptiveState(GLR_GAME_ID, focus);
        if (!state) return;

        const pairsToReview = getDueReviewPairs();
        if (pairsToReview.length > 0 && focus !== 'music') {
            setDuePairs(pairsToReview);
            setPhase('recall');
        } else {
            const wordList1 = (focus === 'math') ? mathWordList : (focus === 'music') ? musicWordList : (focus === 'verbal') ? verbalWordList : generalWordList;
            let wordList2 = generalWordList;
            if(focus === 'music') wordList2 = Object.keys(icons);

            const generated = Array.from({ length: policyParams.pairs }).map(() => {
                const word1 = wordList1[Math.floor(Math.random() * wordList1.length)];
                let word2 = wordList2[Math.floor(Math.random() * wordList2.length)];
                while(word1 === word2) word2 = wordList2[Math.floor(Math.random() * wordList2.length)];
                return { word1, word2 };
            });
            setNewPairs(generated);
            addSpacedPairs(generated);
            setPhase('learn');
        }
        setCurrentIndex(0);
        setSessionTrials([]);
        trialStartTime.current = Date.now();
    }, [focus, getDueReviewPairs, addSpacedPairs, policyParams.pairs, getAdaptiveState]);

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
        const currentState = getAdaptiveState(GLR_GAME_ID, focus);
        if (!currentState) return;
        const levelPlayed = currentState.currentLevel;
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const pair = (duePairs.length > 0 ? duePairs : newPairs)[currentIndex];
        const isCorrect = userInput.trim().toLowerCase() === pair.word2.toLowerCase();
        
        const trial: TrialResult = {
            correct: isCorrect,
            reactionTimeMs,
            telemetry: {
                mode: 'spaced_retrieval',
                pairId: pair.id,
                intervalStage: pair.intervalStage,
                pairCount: (duePairs.length > 0 ? duePairs : newPairs).length,
                distractorDuration_s: policyParams.distractorDuration,
                encodingTime_s: 0, // Not tracked
                pairIndex: currentIndex,
                cue: pair.word1,
                expectedResponse: pair.word2,
                userResponse: userInput.trim(),
            }
        };

        logTrial({
            module_id: GLR_GAME_ID,
            mode: focus,
            levelPlayed: levelPlayed,
            isCorrect,
            responseTime_ms: reactionTimeMs,
            meta: trial.telemetry,
        });

        const newState = adjustDifficulty(trial, currentState, glrPolicy);
        updateAdaptiveState(GLR_GAME_ID, focus, newState);
        setSessionTrials(prev => [...prev, trial]);
        
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
    
    const Icon = focus === 'music' && pairToShow ? icons[pairToShow.word2] : null;

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <p className="font-semibold text-primary uppercase">{phase} Phase</p>
            {phase === 'learn' && pairToShow && (
                 <div className="text-center p-8 bg-muted rounded-lg animate-in fade-in">
                    <p className="text-muted-foreground">Memorize this pair:</p>
                    <div className="text-4xl font-bold flex items-center gap-4">
                        <span>{pairToShow.word1}</span>
                        <span>-</span>
                        {Icon ? <Icon className="w-10 h-10" /> : <span>{pairToShow.word2}</span>}
                    </div>
                    <p className="text-sm font-mono mt-4">Pair {currentIndex + 1} of {newPairs.length}</p>
                    <Button onClick={handleNext} className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white">Next</Button>
                </div>
            )}
            {(phase === 'recall') && pairToShow && (
                <div className="w-full text-center space-y-4">
                    <p className="text-muted-foreground">What was paired with:</p>
                    <p className="text-5xl font-bold">{pairToShow.word1}</p>
                    {feedback[pairToShow.word1] ? (
                        <div className="text-2xl font-bold flex items-center justify-center gap-2">
                            {feedback[pairToShow.word1] === 'correct' ? <span className="text-green-500">Correct!</span> : <span className="text-destructive">Incorrect. It was {Icon ? <Icon className="w-8 h-8 inline-block"/> : pairToShow.word2}</span>}
                        </div>
                    ) : (
                        <form onSubmit={handleRecallSubmit} className="flex gap-2 justify-center">
                            <Input value={userInput} onChange={e => setUserInput(e.target.value)} autoFocus placeholder="Type the word/icon name" className="text-center"/>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Submit</Button>
                        </form>
                    )}
                </div>
            )}
            {phase === 'finished' && <p>Recall session complete!</p>}
        </div>
    );
}
