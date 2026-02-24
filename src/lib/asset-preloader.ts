
'use client';

import * as idbStore from './idb-store';

/**
 * Preloads a list of asset URLs, fetching and caching them if they are not already in IndexedDB.
 * @param assetUrls - An array of URLs to preload.
 * @param onProgress - Optional callback to report progress (0 to 1).
 */
export async function preloadSessionAssets(assetUrls: string[], onProgress?: (progress: number) => void): Promise<void> {
    if (typeof window === 'undefined') return;

    let loadedCount = 0;
    const totalCount = assetUrls.length;

    await Promise.all(assetUrls.map(async (url) => {
        try {
            const cached = await idbStore.getCachedAsset(url);
            if (!cached) {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch ${url}`);
                const blob = await response.blob();
                await idbStore.putCachedAsset(url, blob);
            }
        } catch (error) {
            console.error(`Failed to preload asset: ${url}`, error);
        } finally {
            loadedCount++;
            onProgress?.(loadedCount / totalCount);
        }
    }));
}

/**
 * Retrieves an asset from the local cache first, falling back to a network fetch.
 * @param url - The URL of the asset to retrieve.
 * @returns A promise that resolves to the asset Blob, or null if it fails.
 */
export async function getAsset(url: string): Promise<Blob | null> {
    try {
        const cached = await idbStore.getCachedAsset(url);
        if (cached) {
            return cached;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network request failed for ${url}`);
        
        const blob = await response.blob();
        await idbStore.putCachedAsset(url, blob); // Cache on the fly
        return blob;
    } catch (error) {
        console.error(`Failed to get asset: ${url}`, error);
        return null;
    }
}
