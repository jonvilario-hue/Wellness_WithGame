'use client';
import type { AssetId } from '@/types';
import * as idbStore from '@/lib/idb-store';

interface AssetManifest {
    assets: {
        id: AssetId;
        path: string;
    }[];
}

export class AudioSampleManager {
    private audioContext: AudioContext;
    private manifest: AssetManifest | null = null;
    private inMemoryCache: Map<AssetId, AudioBuffer> = new Map();
    private assetUrlResolver = (path: string) => `/audio-assets/${path}`;

    constructor(audioContext: AudioContext) {
        this.audioContext = audioContext;
        this.loadManifest();
    }

    private async loadManifest() {
        try {
            const response = await fetch('/audio-assets/manifest.json');
            if (!response.ok) throw new Error('Manifest not found');
            this.manifest = await response.json();
        } catch (e) {
            console.error('[AudioSampleManager] Failed to load manifest', e);
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

        const url = this.assetUrlResolver(path);

        try {
            const cachedBlob = await idbStore.getCachedAsset(url);
            let blobToDecode = cachedBlob;

            if (!blobToDecode) {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch asset: ${url}`);
                blobToDecode = await response.blob();
                await idbStore.putCachedAsset(url, blobToDecode);
            }

            const arrayBuffer = await blobToDecode.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.inMemoryCache.set(assetId, audioBuffer);
            return audioBuffer;

        } catch (error) {
            console.error(`[AudioSampleManager] Error loading asset ${assetId}:`, error);
            return this.generatePlaceholder(assetId);
        }
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
