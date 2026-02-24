
'use client';

/**
 * This module performs one-time capability detection for browser features
 * and exposes the results as simple boolean flags.
 */

interface BrowserCapabilities {
  speechSynthesisAvailable: boolean;
  indexedDBAvailable: boolean;
  audioContextAvailable: boolean;
}

const detectCapabilities = (): BrowserCapabilities => {
  if (typeof window === 'undefined') {
    return {
      speechSynthesisAvailable: false,
      indexedDBAvailable: false,
      audioContextAvailable: false,
    };
  }

  const speechSynthesisAvailable = 'speechSynthesis' in window && typeof window.speechSynthesis.getVoices === 'function';
  const indexedDBAvailable = 'indexedDB' in window;
  const audioContextAvailable = 'AudioContext' in window || 'webkitAudioContext' in window;

  return {
    speechSynthesisAvailable,
    indexedDBAvailable,
    audioContextAvailable,
  };
};

export const capabilities = detectCapabilities();
