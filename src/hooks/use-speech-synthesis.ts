
'use client';

import { useState, useEffect } from 'react';

type SpeechSynthesisState = {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string, onEnd?: () => void) => void;
  cancel: () => void;
};

let synthesis: SpeechSynthesis | null = null;
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synthesis = window.speechSynthesis;
}

export const useSpeechSynthesis = (): SpeechSynthesisState => {
  const [isSupported] = useState(!!synthesis);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string, onEnd?: () => void) => {
    if (!isSupported || !synthesis) return;
    
    // Cancel any ongoing speech
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = (event) => {
        console.error("SpeechSynthesis Error:", event.error);
        setIsSpeaking(false);
    };
    synthesis.speak(utterance);
  };

  const cancel = () => {
    if (!isSupported || !synthesis) return;
    synthesis.cancel();
    setIsSpeaking(false);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (synthesis) {
        synthesis.cancel();
      }
    };
  }, []);

  return { isSupported, isSpeaking, speak, cancel };
};
