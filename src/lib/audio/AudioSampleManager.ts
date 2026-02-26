
'use client';
import type { AssetId } from '@/types';
import * as idbStore from '@/lib/idb-store';
import type { AssetUrlResolver } from './types';

interface AssetDefinition {
    id: AssetId;
    path: string;
    isSprite?: boolean;
    spriteId?: AssetId;
    offset?: number;
    duration?: number;
}
interface AssetManifest {
    manifestVersion: string;
    assets: AssetDefinition[];
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
        if (typeof window === 'undefined') {
            return;
        }
        try {
            // Ensure manifest is fetched without browser caching to get the latest version
            const response = await fetch('/audio-assets/manifest.json', { cache: 'no-store' });
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

    public getAssetInfo(assetId: AssetId): AssetDefinition | null {
        return this.manifest?.assets.find(a => a.id === assetId) || null;
    }

    public async getAsset(assetId: AssetId): Promise<AudioBuffer | null> {
        if (this.inMemoryCache.has(assetId)) {
            return this.inMemoryCache.get(assetId)!;
        }

        const assetInfo = this.getAssetInfo(assetId);
        if (!assetInfo) {
             console.warn(`[AudioSampleManager] Asset ID "${assetId}" not found in manifest.`);
             return this.generatePlaceholder(assetId);
        }
        
        // If it's part of a sprite, get the sprite's buffer instead
        const assetToFetch = assetInfo.spriteId ? this.getAssetInfo(assetInfo.spriteId) : assetInfo;
        const cacheKey = assetToFetch?.id || assetId;

        if (this.inMemoryCache.has(cacheKey)) {
             if (assetId !== cacheKey) { // Cache the sub-asset reference for faster future lookups
                this.inMemoryCache.set(assetId, this.inMemoryCache.get(cacheKey)!);
             }
             return this.inMemoryCache.get(cacheKey)!;
        }

        const path = assetToFetch?.path;
        if (!path) {
            console.warn(`[AudioSampleManager] Asset path for "${cacheKey}" not found.`);
            return this.generatePlaceholder(assetId);
        }
        
        const url = this.assetUrlResolver(cacheKey, path);

        try {
            const cachedArrayBuffer = await idbStore.getCachedAsset(url) as ArrayBuffer;
            if (cachedArrayBuffer) {
                const audioBuffer = await this.audioContext.decodeAudioData(cachedArrayBuffer.slice(0));
                this.inMemoryCache.set(cacheKey, audioBuffer);
                if (assetId !== cacheKey) this.inMemoryCache.set(assetId, audioBuffer);
                return audioBuffer;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch asset: ${url}`);
            
            const arrayBuffer = await response.arrayBuffer();
            await idbStore.putCachedAsset(url, arrayBuffer.slice(0));
            
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.inMemoryCache.set(cacheKey, audioBuffer);
            if (assetId !== cacheKey) this.inMemoryCache.set(assetId, audioBuffer);
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
