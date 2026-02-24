
'use client';

/**
 * This module performs one-time capability detection for browser features
 * and exposes the results as simple boolean flags.
 */

interface BrowserCapabilities {
  speechSynthesisAvailable: boolean;
  indexedDBAvailable: boolean;
}

const detectCapabilities = (): BrowserCapabilities => {
  if (typeof window === 'undefined') {
    return {
      speechSynthesisAvailable: false,
      indexedDBAvailable: false,
    };
  }

  const speechSynthesisAvailable = 'speechSynthesis' in window && typeof window.speechSynthesis.getVoices === 'function';
  const indexedDBAvailable = 'indexedDB' in window;

  return {
    speechSynthesisAvailable,
    indexedDBAvailable,
  };
};

export const capabilities = detectCapabilities();
