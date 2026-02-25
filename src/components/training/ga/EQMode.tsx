
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
const TRIALS_PER_ROUND = 20;
const MAX_LEVEL = 5;

type Emotion = 'happy' | 'sad' | 'angry' | 'calm' | 'surprised' | 'sarcastic';
const emotionsLevel1: Emotion[] = ['happy', 'sad', 'angry', 'calm'];
const emotionsLevel4: Emotion[] = [...emotionsLevel1, 'surprised', 'sarcastic'];

const EMOTION_CONFIG: Record<Emotion, { icon: React.ElementType }> = {
    happy: { icon: Smile },
    sad: { icon: Frown },
    angry: { icon: Angry },
    calm: { icon: Meh },
    surprised: { icon: AlertCircle },
    sarcastic: { icon: ThumbsDown },
};

const ALL_ASSETS: AssetId[] = (Object.keys(EMOTION_CONFIG) as Emotion[]).flatMap(e => [1,2,3].map(i => `phrase-${e}-${i}` as AssetId)).filter(id => !id.includes('undefined'));


type TaskType = 'classification' | 'comparison';

type ClassificationPuzzle = {
    type: 'classification';
    assetId: AssetId;
    correctEmotion: Emotion;
    options: Emotion[];
};

type ComparisonPuzzle = {
    type: 'comparison';
    lowIntensityAsset: AssetId;
    highIntensityAsset: AssetId;
    isFirstStronger: boolean;
};

type Puzzle = ClassificationPuzzle | ComparisonPuzzle;

type GameState = {
    phase: 'loading' | 'error' | 'idle' | 'playing' | 'feedback' | 'summary';
    level: number;
    trialCount: number;
    score: number;
    puzzle: Puzzle | null;
    feedback: { correct: boolean, message: string } | null;
    loadingProgress: number;
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
    loadingProgress: 0,
    loadingError: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
     switch (action.type) {
        case 'START_ROUND':
            return { ...initialState, phase: 'loading', loadingProgress: 0, loadingError: null };
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

const generatePuzzle = (level: number, lastTask: TaskType): Puzzle => {
    const taskType: TaskType = level === 1 ? 'classification' : (lastTask === 'classification' ? 'comparison' : 'classification');
    const emotionPool = level < 4 ? emotionsLevel1 : emotionsLevel4;
    
    if (taskType === 'classification') {
        const correctEmotion = emotionPool[Math.floor(Math.random() * emotionPool.length)];
        const intensity = Math.floor(Math.random() * 3) + 1;
        const assetId = `phrase-${correctEmotion}-${intensity}` as AssetId;
        
        const options = new Set<Emotion>([correctEmotion]);
        while(options.size < 4) {
            options.add(emotionPool[Math.floor(Math.random() * emotionPool.length)]);
        }
        return { type: 'classification', assetId, correctEmotion, options: Array.from(options).sort(() => 0.5 - Math.random()) };
    } else { // comparison
        const emotion = emotionPool[Math.floor(Math.random() * emotionPool.length)];
        const intensities = [1,2,3].sort(() => 0.5 - Math.random());
        const lowIntensityAsset = `phrase-${emotion}-${intensities[0]}` as AssetId;
        const highIntensityAsset = `phrase-${emotion}-${intensities[1]}` as AssetId;
        const isFirstStronger = Math.random() > 0.5;
        return { type: 'comparison', lowIntensityAsset, highIntensityAsset, isFirstStronger };
    }
};


export default function EQMode({ onComplete }: { onComplete: () => void }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const { engine } = useAudioEngine();
    const { isLoading, progress } = usePreloadAssets(ALL_ASSETS);
    const correctStreak = useRef(0);

    useEffect(() => {
        if(state.phase === 'loading') {
            if (!isLoading && progress === 1) {
                dispatch({ type: 'ASSETS_LOADED' });
            }
        }
    }, [isLoading, progress, state.phase]);

    const startNextTrial = useCallback(() => {
        dispatch({ type: 'NEXT_TRIAL' });
        if (state.trialCount + 1 >= TRIALS_PER_ROUND) return;

        const puzzle = generatePuzzle(state.level, state.puzzle?.type ?? 'comparison');
        dispatch({ type: 'SET_PUZZLE', puzzle });

        if (!engine) return;
        engine.stopAll();
        
        const snr = state.level === 3 ? 10 : state.level === 4 ? 6 : state.level === 5 ? 3 : Infinity;
        if(isFinite(snr) && engine.playSpeechShapedNoise) {
            const gain = Math.pow(10, -snr / 20);
            engine.playSpeechShapedNoise(4, gain);
        }

        const duration = state.level === 5 ? 1.5 : undefined;
        if (puzzle.type === 'classification') {
            engine.playSample(puzzle.assetId, { duration });
        } else {
            const first = puzzle.isFirstStronger ? puzzle.highIntensityAsset : puzzle.lowIntensityAsset;
            const second = puzzle.isFirstStronger ? puzzle.lowIntensityAsset : puzzle.highIntensityAsset;
            engine.playSample(first, { duration });
            setTimeout(() => engine.playSample(second, { duration }), 2500);
        }
    }, [state.level, state.puzzle?.type, engine, state.trialCount]);

    const handleAnswer = (answer: Emotion | 'first' | 'second') => {
        if (state.phase !== 'playing' || !state.puzzle) return;
        let isCorrect = false;
        if (state.puzzle.type === 'classification') {
            isCorrect = answer === state.puzzle.correctEmotion;
        } else {
            const correctAns = state.puzzle.isFirstStronger ? 'first' : 'second';
            isCorrect = answer === correctAns;
        }
        
        dispatch({ type: 'SUBMIT_ANSWER', correct: isCorrect, message: isCorrect ? 'Correct!' : 'Incorrect.' });
        
        if (isCorrect) {
            correctStreak.current++;
            if (correctStreak.current >= 2) {
                //dispatch({ type: 'LEVEL_UP' });
                correctStreak.current = 0;
            }
        } else {
            correctStreak.current = 0;
            //dispatch({ type: 'LEVEL_DOWN' });
        }

        setTimeout(() => startNextTrial(), 2000);
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
                        <p className="font-semibold text-lg h-12">{state.puzzle.type === 'classification' ? 'What emotion did you hear?' : 'Which speaker was more intense?'}</p>
                        
                        <div className="h-10 text-xl font-bold">{state.feedback && <p className={cn(state.feedback.correct ? 'text-green-400' : 'text-rose-400')}>{state.feedback.message}</p>}</div>
                        
                        {state.puzzle.type === 'classification' ? (
                            <div className="grid grid-cols-2 gap-3">
                                {state.puzzle.options.map(emotion => {
                                    const Icon = EMOTION_CONFIG[emotion].icon;
                                    return <Button key={emotion} onClick={() => handleAnswer(emotion)} disabled={state.phase === 'feedback'} className="h-20 text-lg flex items-center gap-2"><Icon /> {emotion}</Button>
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                                <Button onClick={() => handleAnswer('first')} disabled={state.phase==='feedback'} className="h-24 text-2xl">First was stronger</Button>
                                <Button onClick={() => handleAnswer('second')} disabled={state.phase==='feedback'} className="h-24 text-2xl">Second was stronger</Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
