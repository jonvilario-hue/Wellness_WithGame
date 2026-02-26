
'use client';

import { Button } from "@/components/ui/button";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";
import type { AssetId } from "@/types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const LocalizationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const assetsToLoad: AssetId[] = useMemo(() => ['perc-click'] as AssetId[], []);
    const { isLoading } = usePreloadAssets(assetsToLoad);
    const [feedback, setFeedback] = useState('');
    const answerRef = useRef<'left' | 'center' | 'right'>('center');

    const playSpatialSound = useCallback(() => {
        if (!engine || isLoading) return;
        const pans = [-0.8, 0, 0.8];
        const panLabels: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
        const randomIndex = Math.floor(Math.random() * pans.length);
        
        answerRef.current = panLabels[randomIndex];
        engine.playSample('perc-click' as AssetId, { pan: pans[randomIndex] });
        setFeedback('');
    }, [engine, isLoading]);
    
    useEffect(() => {
        if (!isLoading) playSpatialSound();
    }, [isLoading, playSpatialSound]);

    const handleAnswer = (choice: 'left' | 'center' | 'right') => {
        const isCorrect = choice === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
         <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">Where did the sound come from?</p>
            <Button onClick={playSpatialSound}>Play Sound</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <Button onClick={() => handleAnswer('left')} size="lg" className="h-20">Left</Button>
                <Button onClick={() => handleAnswer('center')} size="lg" className="h-20">Center</Button>
                <Button onClick={() => handleAnswer('right')} size="lg" className="h-20">Right</Button>
            </div>
        </div>
    )
};
