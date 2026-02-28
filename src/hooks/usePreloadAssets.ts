'use client';

import { useState, useEffect, useMemo } from 'react';
import type { AssetId } from '@/types';
import { preloadSessionAssets } from '@/lib/asset-preloader';

// Since we cannot fetch from /public, we import the manifest directly.
// This is not ideal for a real app but works for this environment.
import manifest from '@/data/AUDIO_ASSET_MANIFEST_TEMPLATE.json';

type ManifestAsset = {
  id: AssetId;
  path: string;
};

type AssetManifest = {
  assets: ManifestAsset[];
};

const assetManifest: AssetManifest = manifest as any;

/**
 * Preloads a list of asset IDs by looking them up in the manifest,
 * constructing their URLs, and fetching them into an IndexedDB cache.
 * @param assetIds - An array of asset IDs to preload.
 * @returns An object with the loading state, progress, and any errors.
 */
export const usePreloadAssets = (assetIds: AssetId[]) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const preload = async () => {
      if (!assetIds || assetIds.length === 0) {
        setIsLoading(false);
        setProgress(1);
        return;
      }
      
      setIsLoading(true);
      setProgress(0);
      setError(null);

      try {
        const urlsToPreload: string[] = [];
        
        for (const id of assetIds) {
            const assetInfo = assetManifest.assets.find(a => a.id === id);
            if (assetInfo) {
                // Assets are served from /public/, so construct the path accordingly.
                urlsToPreload.push(`/audio-assets/${assetInfo.path}`);
            } else {
                throw new Error(`[usePreloadAssets] Asset with ID "${id}" not found in manifest.`);
            }
        }
        
        if (isCancelled) return;
        
        await preloadSessionAssets(urlsToPreload, (p) => {
          if (!isCancelled) {
            setProgress(p);
          }
        });

        if (!isCancelled) {
           setIsLoading(false);
           setProgress(1);
        }

      } catch (err: any) {
        if (!isCancelled) {
          console.error(err);
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    preload();

    return () => {
      isCancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(assetIds)]); // Rerun if the stringified array of assetIds changes

  return { isLoading, progress, error };
};
