
'use client';

import { Button } from "@/components/ui/button";
import { useState, useCallback, useMemo, useRef } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";
import type { AssetId } from "@/types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const PitchDiscriminationModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const assetsToLoad: AssetId[] = useMemo(() => ['piano-c4', 'piano-f4', 'piano-g4'] as AssetId[], []);
    const { isLoading } = usePreloadAssets(assetsToLoad);

    const [feedback, setFeedback] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const answerRef = useRef<'higher' | 'lower'>('higher');

    const handlePlay = useCallback(() => {
        if (!engine || isPlaying) return;
        setIsPlaying(true);
        setFeedback('');

        const isHigher = Math.random() > 0.5;
        answerRef.current = isHigher ? 'higher' : 'lower';
        const comparisonAssetId = (isHigher ? 'piano-g4' : 'piano-f4') as AssetId;

        engine.playSample('piano-c4' as AssetId);
        setTimeout(() => engine.playSample(comparisonAssetId, { onEnd: () => setIsPlaying(false) }), 800);
    }, [engine, isPlaying]);

    const handleAnswer = (userChoice: 'higher' | 'lower') => {
        if (isPlaying) return;
        const isCorrect = userChoice === answerRef.current;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="flex flex-col items-center gap-4 w-full text-violet-200">
            <p className="font-semibold text-lg">Was the second tone higher or lower?</p>
            <Button onClick={handlePlay} disabled={isPlaying}>Play Tones</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <Button onClick={() => handleAnswer('lower')} disabled={isPlaying} size="lg" className="h-24 text-xl">Lower</Button>
                <Button onClick={() => handleAnswer('higher')} disabled={isPlaying} size="lg" className="h-24 text-xl">Higher</Button>
            </div>
        </div>
    );
};
