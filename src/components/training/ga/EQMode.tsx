'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useReducer, useCallback, useRef } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";
import type { AssetId } from "@/types";
import { Loader2, Check, X, AlertTriangle, Smile, Frown, Angry, Meh, AlertCircle, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types and Constants ---
const TRIALS_PER_ROUND = 10;

type Emotion = 'happy' | 'sad' | 'angry' | 'calm' | 'surprised' | 'sarcastic';
const emotionsLevel1: Emotion[] = ['happy', 'sad', 'angry', 'calm'];

const EMOTION_CONFIG: Record<Emotion, { icon: React.ElementType }> = {
    happy: { icon: Smile },
    sad: { icon: Frown },
    angry: { icon: Angry },
    calm: { icon: Meh },
    surprised: { icon: AlertCircle },
    sarcastic: { icon: ThumbsDown },
};

// Only one asset is available in the manifest, so we'll use that.
const ALL_ASSETS: AssetId[] = ['sentence-01-happy-f1' as AssetId];

type ClassificationPuzzle = {
    type: 'classification';
    assetId: AssetId;
    correctEmotion: Emotion;
    options: Emotion[];
};

type Puzzle = ClassificationPuzzle;

type GameState = {
    phase: 'loading' | 'error' | 'idle' | 'playing' | 'feedback' | 'summary';
    level: number;
    trialCount: number;
    score: number;
    puzzle: Puzzle | null;
    feedback: { correct: boolean, message: string } | null;
    loadingError: string | null;
};

type GameAction = 
    | { type: 'START_ROUND' }
    | { type: 'ASSETS_LOADED' }
    | { type: 'ASSET_LOAD_ERROR', error: string }
    | { type: 'SET_PUZZLE', puzzle: Puzzle }
    | { type: 'SUBMIT_ANSWER', correct: boolean, message: string }
    | { type: 'NEXT_TRIAL' };

const initialState: GameState = {
    phase: 'loading',
    level: 1,
    trialCount: 0,
    score: 0,
    puzzle: null,
    feedback: null,
    loadingError: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
     switch (action.type) {
        case 'START_ROUND':
            return { ...initialState, phase: 'loading', loadingError: null };
        case 'ASSETS_LOADED':
            return { ...state, phase: 'idle' };
        case 'ASSET_LOAD_ERROR':
            return { ...state, phase: 'error', loadingError: action.error };
        case 'SET_PUZZLE':
            return { ...state, phase: 'playing', puzzle: action.puzzle, feedback: null };
        case 'SUBMIT_ANSWER':
            return { ...state, phase: 'feedback', feedback: { correct: action.correct, message: action.message }, score: state.score + (action.correct ? 1 : 0) };
        case 'NEXT_TRIAL':
            const nextTrialCount = state.trialCount + 1;
            if (nextTrialCount >= TRIALS_PER_ROUND) {
                return { ...state, phase: 'summary' };
            }
            return { ...state, trialCount: nextTrialCount };
        default:
            return state;
    }
}

const generatePuzzle = (level: number): Puzzle => {
    // This game is now very simple due to asset limitations.
    // It will always ask to identify the 'happy' tone.
    const emotionPool: Emotion[] = ['happy', 'sad', 'angry', 'calm'];
    const correctEmotion = 'happy';
    const assetId = 'sentence-01-happy-f1' as AssetId;
    
    const options = new Set<Emotion>([correctEmotion]);
    const distractors = emotionPool.filter(e => e !== correctEmotion);
    while (options.size < 4 && distractors.length > 0) {
        distractors.sort(() => Math.random() - 0.5); // shuffle distractors
        options.add(distractors.pop()!);
    }

    return { 
        type: 'classification', 
        assetId, 
        correctEmotion, 
        options: Array.from(options).sort(() => 0.5 - Math.random()) 
    };
};

export default function EQMode({ onComplete }: { onComplete: () => void }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const { engine } = useAudioEngine();
    const { isLoading, progress, error: preloadError } = usePreloadAssets(ALL_ASSETS);
    const correctStreak = useRef(0);

    useEffect(() => {
        if(state.phase === 'loading') {
            if (preloadError) {
                dispatch({ type: 'ASSET_LOAD_ERROR', error: preloadError });
            } else if (!isLoading && progress === 1) {
                dispatch({ type: 'ASSETS_LOADED' });
            }
        }
    }, [isLoading, progress, preloadError, state.phase]);
    
    useEffect(() => {
        return () => {
            engine?.stopAll();
        }
    }, [engine]);

    const startNextTrial = useCallback(() => {
        dispatch({ type: 'NEXT_TRIAL' });
        if (state.trialCount + 1 >= TRIALS_PER_ROUND) {
             if (engine) engine.stopAll();
             onComplete(); // Signal completion to parent router
             return;
        }

        const puzzle = generatePuzzle(state.level);
        dispatch({ type: 'SET_PUZZLE', puzzle });

        if (!engine) return;
        engine.stopAll();

        engine.playSample(puzzle.assetId);
    }, [state.level, engine, state.trialCount, onComplete]);

    const handleAnswer = (answer: Emotion) => {
        if (state.phase !== 'playing' || !state.puzzle) return;
        let isCorrect = false;
        let message = "Incorrect.";

        isCorrect = answer === state.puzzle.correctEmotion;
        if (!isCorrect) message = `Incorrect. The emotion was ${state.puzzle.correctEmotion}.`
        
        dispatch({ type: 'SUBMIT_ANSWER', correct: isCorrect, message: isCorrect ? 'Correct!' : message });
        
        // This is a simplified version, a real staircase would be in the adaptive engine
        if (isCorrect) {
            correctStreak.current++;
        } else {
            correctStreak.current = 0;
        }

        setTimeout(() => startNextTrial(), 2500);
    };
    
    const handleStart = () => {
        engine?.resumeContext();
        startNextTrial();
    }
    
    if (state.phase === 'loading') {
        return <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin w-8 h-8" /><p>Loading audio assets... {Math.round(progress*100)}%</p></div>
    }
     if (state.phase === 'error') {
         return <div className="text-center text-red-400 flex flex-col items-center gap-2"><AlertTriangle/> <p>Audio sample missing. EQ mode cannot start.</p><p className="text-xs">{state.loadingError}</p></div>
    }

    return (
        <Card className="w-full max-w-2xl text-center bg-rose-900 border-rose-500/30 text-rose-100">
            <CardHeader><CardTitle className="text-rose-300">Intonation Detective</CardTitle><CardDescription className="text-rose-300/70">Listen to the tone of voice, not the words.</CardDescription></CardHeader>
            <CardContent className="min-h-[400px] flex flex-col items-center justify-center">
                {state.phase === 'idle' && <Button onClick={handleStart}>Start Round</Button>}
                {state.phase === 'summary' && <div>Round Complete! Score: {state.score}/{TRIALS_PER_ROUND} <Button onClick={handleStart} className="ml-4">Play Again</Button></div>}
                {(state.phase === 'playing' || state.phase === 'feedback') && state.puzzle && (
                     <div className="w-full flex flex-col items-center gap-4">
                        <div className="w-full flex justify-between font-mono text-sm"><p>Trial: {state.trialCount + 1}/{TRIALS_PER_ROUND}</p><p>Level: {state.level}</p></div>
                        <p className="font-semibold text-lg h-12">What emotion did you hear?</p>
                        
                        <div className="h-10 text-xl font-bold">{state.feedback && <p className={cn(state.feedback.correct ? 'text-green-400' : 'text-rose-400')}>{state.feedback.message}</p>}</div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {state.puzzle.options.map(emotion => {
                                const Icon = EMOTION_CONFIG[emotion]?.icon || Smile;
                                return <Button key={emotion} onClick={() => handleAnswer(emotion)} disabled={state.phase === 'feedback'} className="h-20 text-lg flex items-center gap-2 capitalize"><Icon /> {emotion}</Button>
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
