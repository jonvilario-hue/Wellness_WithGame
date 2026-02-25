
'use client';

import { useState, useEffect } from 'react';
import type { AssetId } from '@/types';
import { useAudioEngine } from './useAudioEngine';

export const usePreloadAssets = (assetIds: AssetId[]) => {
    const { engine } = useAudioEngine();
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!engine || !engine.sampleManager) {
            return;
        }

        let isCancelled = false;

        const preload = async () => {
            setIsLoading(true);
            setProgress(0);

            await engine.sampleManager!.preloadAssets(assetIds, (p) => {
                if (!isCancelled) {
                    setProgress(p);
                }
            });

            if (!isCancelled) {
                setIsLoading(false);
            }
        };

        preload();

        return () => {
            isCancelled = true;
        };
    }, [engine, assetIds]);

    return { isLoading, progress };
};
