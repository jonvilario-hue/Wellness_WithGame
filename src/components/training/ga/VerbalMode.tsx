
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useReducer, useCallback, useRef } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";
import type { AssetId } from "@/types";
import { Loader2, Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types and Constants ---
const TRIALS_PER_ROUND = 20;
const MAX_LEVEL = 5;

type Phoneme = 'ba' | 'da' | 'ga' | 'pa' | 'ta' | 'ka' | 'sa' | 'sha' | 'fa' | 'tha';
const ALL_PHONEMES: Phoneme[] = ['ba', 'da', 'ga', 'pa', 'ta', 'ka', 'sa', 'sha', 'fa', 'tha'];
const PHONEME_ASSETS: AssetId[] = ALL_PHONEMES.map(p => `phoneme-${p}` as AssetId);

const MINIMAL_PAIRS: Record<string, [Phoneme, Phoneme][]> = {
    easy: [['ba', 'sa'], ['da', 'fa'], ['ga', 'tha']],
    medium: [['ba', 'pa'], ['da', 'ta'], ['ga', 'ka']],
    hard: [['ba', 'da'], ['sa', 'sha'], ['fa', 'tha']],
};

type TaskType = 'discrimination' | 'recall';

type DiscriminationPuzzle = {
    type: 'discrimination';
    pair: [AssetId, AssetId];
    isSame: boolean;
};

type RecallPuzzle = {
    type: 'recall';
    sequence: AssetId[];
    options: AssetId[];
};

type Puzzle = DiscriminationPuzzle | RecallPuzzle;

type GameState = {
    phase: 'loading' | 'error' | 'idle' | 'playing' | 'feedback' | 'summary';
    level: number;
    trialCount: number;
    score: number;
    puzzle: Puzzle | null;
    userAnswer: string[] | 'same' | 'different' | null;
    feedback: { correct: boolean, message: string } | null;
    loadingProgress: number;
    loadingError: string | null;
};

type GameAction = 
    | { type: 'START_ROUND' }
    | { type: 'ASSETS_LOADED' }
    | { type: 'ASSET_LOAD_ERROR', error: string }
    | { type: 'SET_PUZZLE', puzzle: Puzzle }
    | { type: 'SUBMIT_ANSWER', answer: string[] | 'same' | 'different' }
    | { type: 'SHOW_FEEDBACK', correct: boolean, message: string }
    | { type: 'NEXT_TRIAL' };


const initialState: GameState = {
    phase: 'loading',
    level: 1,
    trialCount: 0,
    score: 0,
    puzzle: null,
    userAnswer: null,
    feedback: null,
    loadingProgress: 0,
    loadingError: null,
};

// --- Reducer ---
function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'START_ROUND':
            return { ...initialState, phase: 'loading', loadingProgress: 0, loadingError: null };
        case 'ASSETS_LOADED':
            return { ...state, phase: 'idle' };
        case 'ASSET_LOAD_ERROR':
            return { ...state, phase: 'error', loadingError: action.error };
        case 'SET_PUZZLE':
            return { ...state, phase: 'playing', puzzle: action.puzzle, userAnswer: null, feedback: null };
        case 'SUBMIT_ANSWER':
            return { ...state, phase: 'feedback', userAnswer: action.answer };
        case 'SHOW_FEEDBACK':
            return { ...state, feedback: { correct: action.correct, message: action.message } };
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

// --- Puzzle Generation ---
const generatePuzzle = (level: number, lastTask: TaskType): Puzzle => {
    const taskType: TaskType = lastTask === 'discrimination' ? 'recall' : 'discrimination';
    
    if (taskType === 'discrimination') {
        const difficultyTier = level < 3 ? 'easy' : level < 5 ? 'medium' : 'hard';
        const pairSet = MINIMAL_PAIRS[difficultyTier];
        const [p1, p2] = pairSet[Math.floor(Math.random() * pairSet.length)];
        const isSame = Math.random() > 0.5;
        return {
            type: 'discrimination',
            pair: [`phoneme-${p1}` as AssetId, `phoneme-${isSame ? p1 : p2}` as AssetId],
            isSame,
        };
    } else { // 'recall'
        const sequenceLength = 3 + Math.floor((level - 1) / 2);
        const shuffled = [...ALL_PHONEMES].sort(() => 0.5 - Math.random());
        const sequence = shuffled.slice(0, sequenceLength).map(p => `phoneme-${p}` as AssetId);
        return {
            type: 'recall',
            sequence,
            options: ALL_PHONEMES.map(p => `phoneme-${p}` as AssetId),
        };
    }
};

// --- Main Component ---
export default function VerbalMode({ onComplete }: { onComplete: () => void }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const { engine } = useAudioEngine();
    const { isLoading, progress } = usePreloadAssets(PHONEME_ASSETS);
    const correctStreak = useRef(0);
    const wrongStreak = useRef(0);

    useEffect(() => {
        if(state.phase === 'loading') {
            if (!isLoading && progress === 1) {
                dispatch({ type: 'ASSETS_LOADED' });
            }
        }
    }, [isLoading, progress, state.phase]);
    
    const startNextTrial = useCallback(() => {
        dispatch({ type: 'NEXT_TRIAL' });
        const puzzle = generatePuzzle(state.level, state.puzzle?.type ?? 'recall');
        dispatch({ type: 'SET_PUZZLE', puzzle });

        if (!engine) return;
        engine.stopAll();

        const isi = 400 - (state.level * 30);
        const noiseGain = state.level > 2 ? 0.05 + ((state.level - 3) * 0.03) : 0;
        
        if (noiseGain > 0 && engine.playSpeechShapedNoise) {
            engine.playSpeechShapedNoise(3, noiseGain);
        }

        if (puzzle.type === 'discrimination') {
            engine.playSample(puzzle.pair[0]);
            setTimeout(() => engine.playSample(puzzle.pair[1]), isi);
        } else { // recall
            engine.playSequence(puzzle.sequence, isi);
        }
    }, [state.level, state.puzzle?.type, engine]);

    const handleAnswer = (answer: 'same' | 'different' | string[]) => {
        if (state.phase !== 'playing' || !state.puzzle) return;
        
        dispatch({ type: 'SUBMIT_ANSWER', answer });
        
        let isCorrect = false;
        let message = "Incorrect";

        if(state.puzzle.type === 'discrimination' && (answer === 'same' || answer === 'different')) {
            isCorrect = state.puzzle.isSame === (answer === 'same');
        } else if (state.puzzle.type === 'recall' && Array.isArray(answer)) {
            const correctSequence = state.puzzle.sequence.join(',');
            const userAnswer = answer.join(',');
            isCorrect = correctSequence === userAnswer;
            if(!isCorrect) message = `Correct was: ${state.puzzle.sequence.map(s => s.replace('phoneme-', '')).join(', ')}`;
        }
        
        if (isCorrect) {
            message = "Correct!";
            correctStreak.current++;
            wrongStreak.current = 0;
            if (correctStreak.current >= 2) {
                // state.level = Math.min(MAX_LEVEL, state.level + 1);
                correctStreak.current = 0;
            }
        } else {
            wrongStreak.current++;
            correctStreak.current = 0;
             if (wrongStreak.current >= 1) {
                // state.level = Math.max(1, state.level - 1);
                wrongStreak.current = 0;
            }
        }

        dispatch({ type: 'SHOW_FEEDBACK', correct: isCorrect, message });
        
        setTimeout(() => {
            startNextTrial();
        }, 2000);
    };

    if (state.phase === 'loading') {
        return <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin w-8 h-8" /><p>Loading audio assets... {Math.round(progress*100)}%</p></div>
    }
    if (state.phase === 'error') {
         return <div className="text-center text-red-400 flex flex-col items-center gap-2"><AlertTriangle/> <p>Audio sample missing. Verbal mode cannot start.</p><p className="text-xs">{state.loadingError}</p></div>
    }

    return (
        <Card className="w-full max-w-2xl text-center bg-violet-900/80 border-violet-500/30 text-violet-100">
            <CardHeader>
                <CardTitle className="text-violet-300">Phoneme Discrimination Lab</CardTitle>
                 <CardDescription className="text-violet-300/70">Distinguish subtle differences in speech sounds. Headphones required.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px] flex flex-col items-center justify-center">
                {state.phase === 'idle' && <Button onClick={startNextTrial}>Start Round</Button>}
                {state.phase === 'summary' && <div>Round Complete! Score: {state.score}/{TRIALS_PER_ROUND} <Button onClick={startNextTrial} className="ml-4">Play Again</Button></div>}
                {(state.phase === 'playing' || state.phase === 'feedback') && state.puzzle && (
                     <div className="w-full flex flex-col items-center gap-4">
                        <div className="w-full flex justify-between font-mono text-sm"><p>Trial: {state.trialCount + 1}/{TRIALS_PER_ROUND}</p><p>Level: {state.level}</p></div>
                        <p className="font-semibold text-lg h-12">{state.puzzle.type === 'discrimination' ? 'Same or Different?' : 'Recall the sequence:'}</p>
                        
                        <div className="h-10 text-xl font-bold">{state.feedback && <p className={cn(state.feedback.correct ? 'text-green-400' : 'text-rose-400')}>{state.feedback.message}</p>}</div>
                        
                        {state.puzzle.type === 'discrimination' ? (
                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                                <Button onClick={() => handleAnswer('same')} disabled={state.phase==='feedback'} className="h-24 text-2xl">Same</Button>
                                <Button onClick={() => handleAnswer('different')} disabled={state.phase==='feedback'} className="h-24 text-2xl">Different</Button>
                            </div>
                        ) : (
                            <RecallInterface puzzle={state.puzzle as RecallPuzzle} onAnswer={handleAnswer} disabled={state.phase === 'feedback'} />
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

const RecallInterface = ({ puzzle, onAnswer, disabled }: { puzzle: RecallPuzzle, onAnswer: (answer: string[]) => void, disabled: boolean }) => {
    const [recall, setRecall] = useState<string[]>([]);
    
    const handleClick = (phoneme: AssetId) => {
        setRecall(prev => [...prev, phoneme]);
    };

    const handleClear = () => setRecall([]);
    const handleSubmit = () => onAnswer(recall);

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="h-12 p-2 border-2 border-violet-800 bg-violet-900/50 rounded-md min-w-[200px] text-lg font-mono flex items-center justify-center flex-wrap gap-2">
                {recall.map(p => p.replace('phoneme-', '')).join(', ')}
            </div>
            <div className="grid grid-cols-5 gap-2">
                {puzzle.options.map(opt => (
                    <Button key={opt} onClick={() => handleClick(opt)} disabled={disabled} variant="outline" className="w-16 h-16">{opt.replace('phoneme-', '')}</Button>
                ))}
            </div>
             <div className="flex gap-4">
                <Button onClick={handleClear} disabled={disabled} variant="secondary">Clear</Button>
                <Button onClick={handleSubmit} disabled={disabled || recall.length === 0}>Submit</Button>
            </div>
        </div>
    )
}
