
'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// --- TYPE DEFINITIONS ---

export type GamePhase = 'idle' | 'instructions' | 'playing' | 'feedback' | 'summary';

interface GameResponse<T> {
  itemId: T;
  response: any;
  correct: boolean;
  rt: number; // Reaction time in milliseconds
}

interface GameEngineConfig<T> {
  scoreFn: (item: T, response: any) => boolean;
  timeLimitSeconds?: number;
  showFeedbackAfterEachItem: boolean;
}

interface GameEngineState<T> {
  phase: GamePhase;
  currentItem: T | null;
  responses: GameResponse<T>[];
  score: number;
  accuracy: number;
  timeRemaining: number;
}

interface GameEngineActions<T> {
  startGame: (items: T[]) => void;
  beginPlay: () => void;
  submitResponse: (response: any) => void;
  nextItem: () => void;
  reset: () => void;
}

// --- THE HOOK ---

export function useGameEngine<T>(
  config: GameEngineConfig<T>
): GameEngineState<T> & GameEngineActions<T> {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [items, setItems] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<GameResponse<T>[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(config.timeLimitSeconds ?? 0);

  const trialStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- DERIVED STATE ---

  const currentItem = useMemo(() => items[currentIndex] ?? null, [items, currentIndex]);
  const score = useMemo(() => responses.filter(r => r.correct).length, [responses]);
  const accuracy = useMemo(() => {
    if (responses.length === 0) return 0;
    return score / responses.length;
  }, [score, responses]);

  // --- TIMER LOGIC ---

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === 'playing' && config.timeLimitSeconds) {
      trialStartTimeRef.current = Date.now(); // Start RT timer on item display
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearTimer();
            setPhase('summary');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return clearTimer; // Cleanup on unmount or phase change
  }, [phase, config.timeLimitSeconds, clearTimer]);

  // --- ACTIONS ---

  const startGame = useCallback((newItems: T[]) => {
    setItems(newItems);
    setCurrentIndex(0);
    setResponses([]);
    setTimeRemaining(config.timeLimitSeconds ?? 0);
    setPhase('instructions');
  }, [config.timeLimitSeconds]);

  const beginPlay = useCallback(() => {
    setPhase('playing');
    trialStartTimeRef.current = Date.now();
  }, []);

  const submitResponse = useCallback((response: any) => {
    if (!currentItem) return;

    const rt = Date.now() - trialStartTimeRef.current;
    const correct = config.scoreFn(currentItem, response);

    setResponses(prev => [...prev, { itemId: currentItem, response, correct, rt }]);

    const isLastItem = currentIndex >= items.length - 1;

    if (isLastItem) {
      clearTimer();
      setPhase('summary');
    } else {
      if (config.showFeedbackAfterEachItem) {
        setPhase('feedback');
      } else {
        setCurrentIndex(prev => prev + 1);
        trialStartTimeRef.current = Date.now(); // Start RT timer for next item
      }
    }
  }, [currentItem, config, currentIndex, items.length, clearTimer]);

  const nextItem = useCallback(() => {
    if (phase !== 'feedback') return;
    setCurrentIndex(prev => prev + 1);
    setPhase('playing');
    trialStartTimeRef.current = Date.now();
  }, [phase]);

  const reset = useCallback(() => {
    clearTimer();
    setPhase('idle');
    setItems([]);
    setCurrentIndex(0);
    setResponses([]);
    setTimeRemaining(config.timeLimitSeconds ?? 0);
  }, [config.timeLimitSeconds, clearTimer]);

  return {
    phase,
    currentItem,
    responses,
    score,
    accuracy,
    timeRemaining,
    startGame,
    beginPlay,
    submitResponse,
    nextItem,
    reset,
  };
}
