
'use client';
import type { AssetId } from '@/types';
import { AudioSampleManager } from './AudioSampleManager';
import type { AssetUrlResolver } from './types';

// Define a handle to control playback
export interface PlaybackHandle {
  stop: () => void;
  sourceNode: AudioScheduledSourceNode; // Can be BufferSource or Oscillator
  scheduledOnset: number;
}

export type PlaybackConfig = {
    volume?: number;
    pan?: number;
    playbackRate?: number;
    loop?: boolean;
    startOffset?: number;
    duration?: number;
    onEnd?: () => void;
    delay?: number;
};


export type ToneConfig = {
    frequency: number;
    duration: number; // in seconds
    volume?: number;
    type?: OscillatorType;
    pan?: number;
    delay?: number;
    onEnd?: () => void;
};


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
  public isSpeechSupported: boolean = false;

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
      this.isSpeechSupported = 'speechSynthesis' in window;
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

  public async playSample(assetId: AssetId, config: PlaybackConfig = {}): Promise<PlaybackHandle | null> {
    if (!this.isReady || !this.sampleManager || !this.audioContext || !this.masterGain) return null;
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
    finalNode.connect(this.masterGain);

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
        finalNode.disconnect();
        this.activeSources.delete(source);
        config.onEnd?.();
    };
    
    return handle;
  }

  public playTone(config: ToneConfig): PlaybackHandle | null {
    if (!this.isReady || !this.audioContext || !this.masterGain) return null;
    this.resumeContext();
    
    const { frequency, duration, volume = 0.5, type = 'sine', pan = 0, delay = 0, onEnd } = config;

    const osc = this.audioContext.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01); // Quick fade in
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration - 0.01); // Quick fade out

    const panner = this.audioContext.createStereoPanner();
    panner.pan.setValueAtTime(pan, this.audioContext.currentTime);

    osc.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.masterGain);

    const scheduledOnset = this.audioContext.currentTime + delay;
    osc.start(scheduledOnset);
    osc.stop(scheduledOnset + duration);

    this.activeSources.add(osc);

    const handle: PlaybackHandle = {
        stop: () => { try { osc.stop(); } catch(e) {} },
        sourceNode: osc,
        scheduledOnset
    };

    osc.onended = () => {
        osc.disconnect();
        gainNode.disconnect();
        panner.disconnect();
        this.activeSources.delete(osc);
        onEnd?.();
    };

    return handle;
  }

  public playPinkNoise(duration: number, gain: number): PlaybackHandle | null {
    if (!this.audioContext || !this.masterGain) return null;
    this.resumeContext();

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    // Voss-McCartney algorithm for pink noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // roughly compensate for gain
        b6 = white * 0.115926;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = gain;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    const scheduledOnset = this.audioContext.currentTime;
    source.start(scheduledOnset);
    source.stop(scheduledOnset + duration);

    this.activeSources.add(source);

    const handle: PlaybackHandle = {
        stop: () => { try { source.stop(); } catch(e) {} },
        sourceNode: source,
        scheduledOnset
    };

    source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
        this.activeSources.delete(source);
    };
    
    return handle;
  }
  
    public playSpeechShapedNoise(duration: number, gain: number): PlaybackHandle | null {
        if (!this.audioContext || !this.masterGain) return null;
        this.resumeContext();

        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoiseSource = this.audioContext.createBufferSource();
        whiteNoiseSource.buffer = buffer;
        whiteNoiseSource.loop = true;

        // Create a bandpass filter to shape the noise into something more speech-like
        const bandpassFilter = this.audioContext.createBiquadFilter();
        bandpassFilter.type = 'bandpass';
        bandpassFilter.frequency.value = 1500; // Center frequency in the middle of human speech range
        bandpassFilter.Q.value = 0.5; // A moderate quality factor

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = gain;

        whiteNoiseSource.connect(bandpassFilter);
        bandpassFilter.connect(gainNode);
        gainNode.connect(this.masterGain);

        const scheduledOnset = this.audioContext.currentTime;
        whiteNoiseSource.start(scheduledOnset);
        whiteNoiseSource.stop(scheduledOnset + duration);

        this.activeSources.add(whiteNoiseSource);

        const handle: PlaybackHandle = {
            stop: () => { try { whiteNoiseSource.stop(); } catch (e) { } },
            sourceNode: whiteNoiseSource,
            scheduledOnset
        };

        whiteNoiseSource.onended = () => {
            whiteNoiseSource.disconnect();
            bandpassFilter.disconnect();
            gainNode.disconnect();
            this.activeSources.delete(whiteNoiseSource);
        };

        return handle;
    }

  public async playSequence(items: (AssetId | ToneConfig)[], intervalMs: number, onEnd?: () => void) {
      if (!this.isReady || !this.audioContext || !this.sampleManager) return;
      await this.resumeContext();

      let time = this.audioContext.currentTime;
      for (const item of items) {
          const delay = time > this.audioContext.currentTime ? time - this.audioContext.currentTime : 0;
          if(typeof item === 'string') {
              this.playSample(item, { delay });
          } else {
              this.playTone({ ...item, delay });
          }
          time += intervalMs / 1000;
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

  public speak(text: string, onEnd?: () => void) {
    if (!this.isSpeechSupported || typeof window === 'undefined') {
        console.warn("[AudioEngine] Speech synthesis not supported.");
        onEnd?.();
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }

  public cleanup() {
      if (this.audioContext) {
          this.stopAll();
          if (this.audioContext.state !== 'closed') {
              this.audioContext.close().then(() => console.log('[AudioEngine] Context closed.'));
          }
      }
  }
}
