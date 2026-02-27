
'use client';

// Define a handle to control playback
export interface PlaybackHandle {
  stop: () => void;
  sourceNode: AudioScheduledSourceNode; // Can be BufferSource or Oscillator
  scheduledOnset: number;
}

export interface TonePlaybackHandle extends PlaybackHandle {
    oscillator: OscillatorNode;
    gainNode: GainNode;
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

export class AudioEngine {
  public audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private activeSources: Set<AudioScheduledSourceNode> = new Set();
  public isReady: boolean = false;
  public isSpeechSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.compressor = this.audioContext.createDynamicsCompressor();
        
        // Basic limiter settings
        this.compressor.threshold.setValueAtTime(-6.0, this.audioContext.currentTime);
        this.compressor.knee.setValueAtTime(3.0, this.audioContext.currentTime);
        this.compressor.ratio.setValueAtTime(12.0, this.audioContext.currentTime);
        this.compressor.attack.setValueAtTime(0.001, this.audioContext.currentTime);
        this.compressor.release.setValueAtTime(0.1, this.audioContext.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.audioContext.destination);

        this.isSpeechSupported = 'speechSynthesis' in window;
        // Do not set isReady here. Wait for resumeContext.
        console.log('[AudioEngine] Initialized but suspended.');
      } catch (e) {
        console.error('[AudioEngine] Web Audio API is not supported in this browser.', e);
      }
    }
  }

  public async resumeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('[AudioEngine] AudioContext resumed.');
    }
    if (this.audioContext?.state === 'running') {
        this.isReady = true;
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

  public playTone(config: ToneConfig): TonePlaybackHandle | null {
    if (!this.isReady || !this.audioContext || !this.masterGain) return null;
    
    const { frequency, duration, volume = 0.5, type = 'sine', pan = 0, delay = 0, onEnd } = config;

    const osc = this.audioContext.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + (delay ?? 0) + 0.01); // Quick fade in
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + (delay ?? 0) + duration - 0.01); // Quick fade out

    const panner = this.audioContext.createStereoPanner();
    panner.pan.setValueAtTime(pan, this.audioContext.currentTime);

    osc.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.masterGain);

    const scheduledOnset = this.audioContext.currentTime + delay;
    osc.start(scheduledOnset);
    osc.stop(scheduledOnset + duration);

    this.activeSources.add(osc);

    const handle: TonePlaybackHandle = {
        stop: () => { try { osc.stop(); } catch(e) {} },
        sourceNode: osc,
        scheduledOnset,
        oscillator: osc,
        gainNode: gainNode
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
  
  public playComplexTone(partials: { frequency: number, volume: number, type?: OscillatorType }[], duration: number, config: PlaybackConfig = {}): PlaybackHandle[] | null {
    if (!this.isReady || !this.audioContext || !this.masterGain) return null;
    const handles: TonePlaybackHandle[] = [];
    
    partials.forEach(partial => {
        const handle = this.playTone({
            frequency: partial.frequency,
            duration,
            volume: partial.volume * (config.volume ?? 1),
            type: partial.type || 'sine',
            pan: config.pan,
            delay: config.delay,
        });
        if(handle) handles.push(handle);
    });

    if (config.onEnd) {
        if(handles.length > 0) {
            handles[0].sourceNode.addEventListener('ended', config.onEnd, { once: true });
        } else {
            setTimeout(config.onEnd, duration * 1000);
        }
    }
    
    return handles;
  }

  public async playSequence(items: ToneConfig[], intervalMs: number, onEnd?: () => void) {
      if (!this.isReady || !this.audioContext) return;
      await this.resumeContext();

      let time = this.audioContext.currentTime;
      for (const item of items) {
          const delay = time > this.audioContext.currentTime ? time - this.audioContext.currentTime : 0;
          this.playTone({ ...item, delay });
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
