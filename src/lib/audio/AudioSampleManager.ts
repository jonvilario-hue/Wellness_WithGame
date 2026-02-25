
'use client';
import type { AssetId } from '@/types';
import * as idbStore from '@/lib/idb-store';
import type { AssetUrlResolver } from './types';

interface AssetManifest {
    manifestVersion: string;
    assets: {
        id: AssetId;
        path: string;
    }[];
}

export class AudioSampleManager {
    private audioContext: AudioContext;
    private manifest: AssetManifest | null = null;
    private inMemoryCache: Map<AssetId, AudioBuffer> = new Map();
    private assetUrlResolver: AssetUrlResolver;

    constructor(audioContext: AudioContext, resolver: AssetUrlResolver) {
        this.audioContext = audioContext;
        this.assetUrlResolver = resolver;
        this.loadManifest();
    }

    private async loadManifest() {
        try {
            const response = await fetch('/audio-assets/manifest.json');
            if (!response.ok) throw new Error('Manifest not found');
            this.manifest = await response.json();
            this.checkCacheVersion();
        } catch (e) {
            console.error('[AudioSampleManager] Failed to load manifest', e);
        }
    }
    
    private async checkCacheVersion() {
        if (!this.manifest || typeof window === 'undefined') return;
        const storedVersion = window.localStorage.getItem('audioManifestVersion');
        if (storedVersion !== this.manifest.manifestVersion) {
            console.log(`[AudioSampleManager] New manifest version detected (${this.manifest.manifestVersion}). Clearing audio cache.`);
            await idbStore.clearAssetCache();
            window.localStorage.setItem('audioManifestVersion', this.manifest.manifestVersion);
        }
    }

    private getAssetPath(assetId: AssetId): string | null {
        const assetInfo = this.manifest?.assets.find(a => a.id === assetId);
        return assetInfo ? assetInfo.path : null;
    }

    public async getAsset(assetId: AssetId): Promise<AudioBuffer | null> {
        if (this.inMemoryCache.has(assetId)) {
            return this.inMemoryCache.get(assetId)!;
        }

        const path = this.getAssetPath(assetId);
        if (!path) {
            console.warn(`[AudioSampleManager] Asset ID "${assetId}" not found in manifest.`);
            return this.generatePlaceholder(assetId);
        }

        const url = this.assetUrlResolver(assetId, path);

        try {
            const cachedBuffer = await idbStore.getCachedAsset(url) as AudioBuffer;
            if (cachedBuffer) {
                this.inMemoryCache.set(assetId, cachedBuffer);
                return cachedBuffer;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch asset: ${url}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            await idbStore.putCachedAsset(url, audioBuffer);
            this.inMemoryCache.set(assetId, audioBuffer);
            return audioBuffer;

        } catch (error) {
            console.error(`[AudioSampleManager] Error loading asset ${assetId}:`, error);
            return this.generatePlaceholder(assetId);
        }
    }
    
    public async preloadAssets(assetIds: AssetId[], onProgress?: (progress: number) => void): Promise<void> {
        let loadedCount = 0;
        const totalCount = assetIds.length;

        await Promise.all(assetIds.map(async (id) => {
            await this.getAsset(id);
            loadedCount++;
            onProgress?.(loadedCount / totalCount);
        }));
    }

    private async generatePlaceholder(assetId: AssetId): Promise<AudioBuffer> {
        console.warn(`[AudioSampleManager] PLACEHOLDER: Generating fallback for ${assetId}`);
        const frameCount = this.audioContext.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.audioContext.createBuffer(1, frameCount, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        // Add a short click at the beginning to indicate playback
        for(let i=0; i < 100; i++) {
            data[i] = Math.random() * 0.2 - 0.1;
        }
        return buffer;
    }
}
