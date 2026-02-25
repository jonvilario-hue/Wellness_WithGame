
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

// Default resolver for local assets. This can be swapped out for a cloud resolver.
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

    const gainNode = this.audioContext!.createGain();
    gainNode.gain.value = config.volume ?? 1;
    
    source.connect(gainNode);
    gainNode.connect(this.masterGain!);

    const scheduledOnset = this.audioContext.currentTime + (config.delay ?? 0);
    source.start(scheduledOnset, config.startOffset ?? 0);
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
    };
    
    return handle;
  }
  
  public async playSequence(assetIds: AssetId[], intervalMs: number, onEnd?: () => void) {
      if (!this.isReady || !this.audioContext) return;
      await this.resumeContext();

      let time = this.audioContext.currentTime;
      for (const assetId of assetIds) {
          const buffer = await this.sampleManager!.getAsset(assetId);
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
  
    public async scheduleTone(frequency: number, startTime: number, duration: number, type: OscillatorType = 'sine', pan?: number, gain?: number): Promise<PlaybackHandle | null> {
        if (!this.isReady || !this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        const scheduledOnset = startTime;
        gainNode.gain.setValueAtTime(0, scheduledOnset);
        gainNode.gain.linearRampToValueAtTime(gain ?? 0.8, scheduledOnset + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, scheduledOnset + duration);

        oscillator.connect(gainNode);
        
        if (pan !== undefined) {
            const panner = this.audioContext.createStereoPanner();
            panner.pan.setValueAtTime(pan, this.audioContext.currentTime);
            gainNode.connect(panner);
            panner.connect(this.masterGain!);
        } else {
            gainNode.connect(this.masterGain!);
        }

        oscillator.start(scheduledOnset);
        oscillator.stop(scheduledOnset + duration + 0.1);
        this.activeSources.add(oscillator);

        const handle = {
            stop: () => { try { oscillator.stop(); } catch(e) {} },
            sourceNode: oscillator,
            scheduledOnset
        };
        
        oscillator.onended = () => {
            gainNode.disconnect();
            this.activeSources.delete(oscillator);
        };

        return handle;
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
  
  public getAudioContextTime(): number {
    return this.audioContext?.currentTime ?? 0;
  }
  
  public getLatencyInfo() {
      if(!this.audioContext) return { baseLatency: 0, outputLatency: 0, sampleRate: 44100 };
      return {
          baseLatency: (this.audioContext as any).baseLatency || 0,
          outputLatency: this.audioContext.outputLatency || 0,
          sampleRate: this.audioContext.sampleRate,
      }
  }

  public speak(text: string, onEnd?: () => void) {
      console.warn('[AudioEngine] Using synthetic speech fallback.');
      if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => onEnd?.();
          window.speechSynthesis.speak(utterance);
      } else {
          console.error('[AudioEngine] Speech Synthesis not supported.');
          onEnd?.();
      }
  }

  public get isSpeechSupported(): boolean {
      return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}
