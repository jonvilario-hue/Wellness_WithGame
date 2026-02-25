import { Howl, Howler } from 'howler';
import type { AssetId } from '@/types';

// Wrapper around Howler.js to provide a consistent API and handle our specific needs
export class AudioEngine {
  private sounds: Map<string, Howl> = new Map();
  private manifest: any | null = null;
  public isReady = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const response = await fetch('/audio-assets/manifest.json');
      this.manifest = await response.json();
      Howler.autoUnlock = true; // Unlock on first user interaction
      this.isReady = true;
      console.log('[AudioEngine] Initialized and manifest loaded.');
    } catch (e) {
      console.error('[AudioEngine] Failed to load manifest.json. Engine will be limited.', e);
    }
  }

  private getAssetPath(assetId: AssetId): string | null {
    const asset = this.manifest?.assets.find((a: any) => a.id === assetId);
    return asset ? `/audio-assets/${asset.path}` : null;
  }

  public playSample(assetId: AssetId): number | null {
    const path = this.getAssetPath(assetId);
    if (!path) {
      console.warn(`[AudioEngine] WARN: Asset '${assetId}' not found in manifest. Using fallback.`);
      // Fallback logic (e.g., play a synthesized tone) could go here
      return null;
    }

    let sound = this.sounds.get(path);
    if (!sound) {
      sound = new Howl({
        src: [path]
      });
      this.sounds.set(path, sound);
    }
    
    console.log(`[AudioEngine] Playing sample: ${assetId}`);
    return sound.play();
  }

   public playSequence(assetIds: AssetId[], intervalMs: number, onEnd?: () => void) {
        let currentIndex = 0;
        const playNext = () => {
            if (currentIndex < assetIds.length) {
                const soundId = this.playSample(assetIds[currentIndex]);
                if (soundId !== null) {
                    const sound = this.sounds.get(this.getAssetPath(assetIds[currentIndex])!);
                    if (sound) {
                        sound.once('end', () => {
                            setTimeout(playNext, intervalMs);
                        }, soundId);
                    }
                }
                currentIndex++;
            } else {
                onEnd?.();
            }
        };
        playNext();
    }
  
  public getAudioContext(): AudioContext | null {
      return Howler.ctx;
  }

  public resumeContext(): Promise<void> {
      return Howler.ctx.resume();
  }
}
