'use client';

import { Button } from "@/components/ui/button";
import { useState, useCallback, useMemo, useRef } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";
import type { AssetId } from "@/types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TRIALS_PER_ROUND = 10;

type RhythmTrial = {
  baseRhythm: number[]; // durations in ms
  targetRhythm: number[];
  isSame: boolean;
};

const generateTrial = (): RhythmTrial => {
    const isSame = Math.random() > 0.5;
    // quarter, quarter, half note at 120bpm
    const baseRhythm = [500, 500, 1000]; 

    if (isSame) {
        return { baseRhythm, targetRhythm: [...baseRhythm], isSame };
    } else {
        const alteredRhythm = [...baseRhythm];
        const alterIndex = Math.floor(Math.random() * alteredRhythm.length);
        alteredRhythm[alterIndex] *= (Math.random() > 0.5 ? 1.5 : 0.66);
        return { baseRhythm, targetRhythm: alteredRhythm, isSame: false };
    }
};

export const RhythmJudgmentModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const assetsToLoad: AssetId[] = useMemo(() => ['perc-click'], []);
    const { isLoading } = usePreloadAssets(assetsToLoad);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'feedback' | 'summary'>('idle');
    const [trial, setTrial] = useState<RhythmTrial | null>(null);
    const [trialCount, setTrialCount] = useState(0);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    
    const playRhythm = useCallback((durations: number[]) => {
        if (!engine) return [];
        let scheduledTime = engine.getAudioContextTime();
        const handles = [];
        for (const duration of durations) {
            const handle = engine.playSample('perc-click', { delay: scheduledTime - engine.getAudioContextTime() });
            if (handle) handles.push(handle);
            scheduledTime += duration / 1000;
        }
        return handles;
    }, [engine]);

    const playFullTrial = useCallback(() => {
        if (!trial) return;
        setIsPlaying(true);
        setFeedback('');
        playRhythm(trial.baseRhythm);
        // Calculate total duration of first rhythm + gap
        const firstRhythmDuration = trial.baseRhythm.reduce((a, b) => a + b, 0);
        setTimeout(() => {
            const handles = playRhythm(trial.targetRhythm);
            const lastHandle = handles[handles.length - 1];
            if (lastHandle && lastHandle.sourceNode) {
                lastHandle.sourceNode.onended = () => setIsPlaying(false);
            } else {
                // Fallback if audio fails
                setTimeout(() => setIsPlaying(false), 2000);
            }
        }, firstRhythmDuration + 1000); // 1s gap
    }, [trial, playRhythm]);
    
    const startNextTrial = useCallback(() => {
        if (trialCount >= TRIALS_PER_ROUND) {
            setGameState('summary');
            return;
        }
        const newTrial = generateTrial();
        setTrial(newTrial);
        setTrialCount(c => c + 1);
        setFeedback('');
        setGameState('playing');
    }, [trialCount]);
    
    useEffect(() => {
        if(gameState === 'playing' && trial) {
            playFullTrial();
        }
    }, [gameState, trial, playFullTrial]);

    const handleAnswer = (userChoice: 'same' | 'different') => {
        if (isPlaying || !trial) return;
        const correctChoice = trial.isSame ? 'same' : 'different';
        const isCorrect = userChoice === correctChoice;
        
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        if (isCorrect) setScore(s => s + 1);
        setGameState('feedback');

        setTimeout(() => {
            startNextTrial();
        }, 1500);
    };
    
    const handleStart = () => {
        engine?.resumeContext();
        setTrialCount(0);
        setScore(0);
        startNextTrial();
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    if (gameState === 'summary') {
        return <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Round Complete!</h3>
            <p className="text-lg">Your score: {score} / {TRIALS_PER_ROUND}</p>
            <Button onClick={onComplete}>Back to Lab</Button>
        </div>
    }
    
    if (gameState === 'idle') {
        return <Button onClick={handleStart} size="lg">Start Rhythm Judgment</Button>;
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full text-violet-200">
            <p className="font-semibold text-lg">Are the two rhythms the same or different?</p>
            <Button onClick={playFullTrial} disabled={isPlaying}>
                {isPlaying ? <Loader2 className="animate-spin mr-2"/> : null}
                Play Rhythms
            </Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <Button onClick={() => handleAnswer('same')} disabled={isPlaying || gameState === 'feedback'} className="h-24 text-xl">Same</Button>
                <Button onClick={() => handleAnswer('different')} disabled={isPlaying || gameState === 'feedback'} className="h-24 text-xl">Different</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Trial {trialCount}/{TRIALS_PER_ROUND}</p>
        </div>
    );
};
