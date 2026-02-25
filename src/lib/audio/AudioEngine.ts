'use client';
import type { AssetId, PlaybackConfig } from '@/types';
import { AudioSampleManager } from './AudioSampleManager';

// Define a handle to control playback
export interface PlaybackHandle {
  stop: () => void;
  sourceNode: AudioBufferSourceNode;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sampleManager: AudioSampleManager | null = null;
  private masterGain: GainNode | null = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();

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
      this.sampleManager = new AudioSampleManager(this.audioContext);
      console.log('[AudioEngine] Initialized successfully.');
    } catch (e) {
      console.error('[AudioEngine] Web Audio API is not supported in this browser.', e);
    }
  }

  public get isReady(): boolean {
    return !!this.audioContext && !!this.sampleManager;
  }

  public async resumeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('[AudioEngine] AudioContext resumed.');
    }
  }

  public async playSample(assetId: AssetId, config: PlaybackConfig = {}): Promise<PlaybackHandle | null> {
    if (!this.isReady || !this.sampleManager) return null;
    await this.resumeContext();

    const buffer = await this.sampleManager.getAsset(assetId);
    if (!buffer) {
        console.error(`[AudioEngine] Could not load or generate asset for ${assetId}`);
        return null;
    }

    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;

    // Apply configurations (e.g., gain, pan)
    const gainNode = this.audioContext!.createGain();
    gainNode.gain.value = config.volume ?? 1;
    
    source.connect(gainNode);
    gainNode.connect(this.masterGain!);

    source.start(0, config.startOffset ?? 0);
    this.activeSources.add(source);

    const handle: PlaybackHandle = {
        stop: () => {
            source.stop();
        },
        sourceNode: source,
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

      let time = this.audioContext!.currentTime;
      for (const assetId of assetIds) {
          const buffer = await this.sampleManager!.getAsset(assetId);
          if (buffer) {
              const source = this.audioContext!.createBufferSource();
              source.buffer = buffer;
              source.connect(this.masterGain!);
              source.start(time);
              time += buffer.duration + (intervalMs / 1000);
          }
      }
      // Simple onEnd timeout
      if(onEnd) {
          const duration = (time - this.audioContext!.currentTime) * 1000;
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

  // --- Fallback Synthesis Methods (from original plan) ---

  public playTone(config: { frequency: number, duration: number, type?: OscillatorType, onended?: () => void }) {
    if (!this.audioContext || !this.masterGain) return null;
    this.resumeContext();
    const { frequency, duration, type = 'sine', onended } = config;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // ADSR Envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + 0.02); // Attack
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1); // Decay
    gainNode.gain.setValueAtTime(0.5, now + duration / 1000 - 0.1); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000); // Release

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration / 1000);
    
    this.activeSources.add(oscillator as any); // Track for cleanup

    oscillator.onended = () => {
        gainNode.disconnect();
        this.activeSources.delete(oscillator as any);
        onended?.();
    };

    return { stop: () => oscillator.stop() };
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
