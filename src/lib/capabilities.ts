

'use client';

/**
 * This module performs one-time capability detection for browser features
 * and exposes the results as simple boolean flags.
 */

interface BrowserCapabilities {
  speechSynthesisAvailable: boolean;
  indexedDBAvailable: boolean;
  audioContextAvailable: boolean;
  decodeAudioDataAvailable: boolean; // For advanced audio processing
  sampleRate: number | null; // To detect potential mismatches
}

const detectCapabilities = (): BrowserCapabilities => {
  if (typeof window === 'undefined') {
    return {
      speechSynthesisAvailable: false,
      indexedDBAvailable: false,
      audioContextAvailable: false,
      decodeAudioDataAvailable: false,
      sampleRate: null,
    };
  }

  const speechSynthesisAvailable = 'speechSynthesis' in window && typeof window.speechSynthesis.getVoices === 'function';
  const indexedDBAvailable = 'indexedDB' in window;
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const audioContextAvailable = !!AudioContext;
  
  let decodeAudioDataAvailable = false;
  let sampleRate = null;

  if (audioContextAvailable) {
    try {
      const tempCtx = new AudioContext();
      decodeAudioDataAvailable = typeof tempCtx.decodeAudioData === 'function';
      sampleRate = tempCtx.sampleRate;
      tempCtx.close();
    } catch (e) {
      // Could fail in some strict security contexts
    }
  }

  return {
    speechSynthesisAvailable,
    indexedDBAvailable,
    audioContextAvailable,
    decodeAudioDataAvailable,
    sampleRate,
  };
};

export const capabilities = detectCapabilities();
