
'use client';

import { Button } from "@/components/ui/button";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePreloadAssets } from "@/hooks/usePreloadAssets";
import type { AssetId } from "@/types";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const TimbreModule = ({ onComplete }: { onComplete: () => void }) => {
    const { engine } = useAudioEngine();
    const assetsToLoad: AssetId[] = useMemo(() => ['instr-piano', 'instr-guitar', 'instr-bell'] as AssetId[], []);
    const { isLoading } = usePreloadAssets(assetsToLoad);
    const [currentInstrument, setCurrentInstrument] = useState<AssetId | null>(null);
    const [feedback, setFeedback] = useState('');

    const playRandomInstrument = useCallback(() => {
        if (!engine || isLoading) return;
        const instrument = assetsToLoad[Math.floor(Math.random() * assetsToLoad.length)];
        setCurrentInstrument(instrument);
        engine.playSample(instrument);
        setFeedback('');
    }, [engine, isLoading, assetsToLoad]);

    useEffect(() => {
        if (!isLoading) playRandomInstrument();
    }, [isLoading, playRandomInstrument]);

    const handleAnswer = (choice: AssetId) => {
        if (!currentInstrument) return;
        const isCorrect = choice === currentInstrument;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');
        setTimeout(() => onComplete(), 1500);
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <p className="font-semibold text-lg">Which instrument did you hear?</p>
            <Button onClick={playRandomInstrument}>Play Sound</Button>
            <div className="h-8 text-xl font-bold">{feedback && <p className={cn(feedback === 'Correct!' ? 'text-green-400' : 'text-rose-400')}>{feedback}</p>}</div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                {assetsToLoad.map(assetId => (
                    <Button key={assetId} onClick={() => handleAnswer(assetId)} size="lg" className="h-20 capitalize">{assetId.replace('instr-', '')}</Button>
                ))}
            </div>
        </div>
    );
};
