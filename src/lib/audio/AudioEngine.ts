
'use client';
import type { AssetId, PlaybackConfig } from '@/types';
import { AudioSampleManager } from './AudioSampleManager';
import type { AssetUrlResolver } from './types';

// Define a handle to control playback
export interface PlaybackHandle {
  stop: () => void;
  sourceNode: AudioScheduledSourceNode; // Can be BufferSource or Oscillator
  scheduledOnset: number;
}

// Default resolver for local assets.
const defaultLocalAssetResolver: AssetUrlResolver = (assetId, assetPath) => {
  return `/audio-assets/${assetPath}`;
};

export class AudioEngine {
  public audioContext: AudioContext | null = null;
  public sampleManager: AudioSampleManager | null = null;
  private masterGain: GainNode | null = null;
  private activeSources: Set<AudioScheduledSourceNode> = new Set();
  public isReady: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.sampleManager = new AudioSampleManager(this.audioContext, defaultLocalAssetResolver);
      this.isReady = true;
      console.log('[AudioEngine] Initialized successfully.');
    } catch (e) {
      console.error('[AudioEngine] Web Audio API is not supported in this browser.', e);
    }
  }

  public async resumeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('[AudioEngine] AudioContext resumed.');
    }
  }

  public async playSample(assetId: AssetId, config: PlaybackConfig = {}): Promise<PlaybackHandle | null> {
    if (!this.isReady || !this.sampleManager || !this.audioContext) return null;
    await this.resumeContext();

    const buffer = await this.sampleManager.getAsset(assetId);
    if (!buffer) {
        console.error(`[AudioEngine] Could not load or generate asset for ${assetId}`);
        return null;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = config.playbackRate ?? 1.0;
    source.loop = config.loop ?? false;

    const gainNode = this.audioContext!.createGain();
    gainNode.gain.value = config.volume ?? 1;

    let finalNode: AudioNode = gainNode;

    if (config.pan !== undefined) {
        const panner = this.audioContext.createStereoPanner();
        panner.pan.setValueAtTime(config.pan, this.audioContext.currentTime);
        gainNode.connect(panner);
        finalNode = panner;
    }
    
    source.connect(finalNode);
    finalNode.connect(this.masterGain!);

    const scheduledOnset = this.audioContext.currentTime + (config.delay ?? 0);
    source.start(scheduledOnset, config.startOffset ?? 0);
    
    if (config.duration) {
        source.stop(scheduledOnset + config.duration);
    }
    
    this.activeSources.add(source);

    const handle: PlaybackHandle = {
        stop: () => {
            try { source.stop(); } catch(e) {}
        },
        sourceNode: source,
        scheduledOnset: scheduledOnset
    };

    source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
        this.activeSources.delete(source);
        config.onEnd?.();
    };
    
    return handle;
  }
  
  public async playSequence(assetIds: AssetId[], intervalMs: number, onEnd?: () => void) {
      if (!this.isReady || !this.audioContext || !this.sampleManager) return;
      await this.resumeContext();

      let time = this.audioContext.currentTime;
      for (const assetId of assetIds) {
          const buffer = await this.sampleManager.getAsset(assetId);
          if (buffer) {
              const source = this.audioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(this.masterGain!);
              source.start(time);
              time += (intervalMs / 1000);
          }
      }
      
      if(onEnd) {
          const duration = (time - this.audioContext.currentTime) * 1000;
          if (duration > 0) {
            setTimeout(onEnd, duration);
          } else {
            onEnd();
          }
      }
  }
  
  public stopAll() {
    this.activeSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source may have already stopped
      }
    });
    this.activeSources.clear();
  }

  public cleanup() {
      if (this.audioContext) {
          this.stopAll();
          this.audioContext.close().then(() => console.log('[AudioEngine] Context closed.'));
      }
  }
}
