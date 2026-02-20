
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getFailureFeedback } from "@/lib/feedback-system";
import { Loader2 } from "lucide-react";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";

const GAME_ID: GameId = 'gs_rapid_code';
const policy = difficultyPolicies[GAME_ID];

const neutralSymbols = ['★', '●', '▲', '■', '◆', '✚', '❤', '⚡', '☺'];
const musicSymbols = ['♩', '♪', '♫', '♭', '♯', '♮', '𝄞', '𝄢', '𝄡'];
const mathSymbols = ['+', '−', '×', '÷', '%', '∑', '√', '∞', '='];
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const NoiseOverlay = () => (
  <div 
    className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")` }}
  />
);

export function RapidCodeMatch() {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);

  const [timeLeft, setTimeLeft] = useState(policy.sessionLength);
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const keyChangeCounter = useRef(0);

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
  
  const symbols = useMemo(() => {
    switch (currentMode) {
        case 'music': return musicSymbols;
        case 'math': return mathSymbols;
        default: return neutralSymbols;
    }
  }, [currentMode]);

  const generateKeyMap = useCallback((level: number) => {
    const params = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const numSymbols = params.distractorCount + 1; // Simplified mapping from policy
    const shuffledSymbols = [...symbols].sort(() => Math.random() - 0.5);
    const map: { [key: string]: number } = {};
    shuffledSymbols.slice(0, numSymbols).forEach((symbol, index) => {
      map[symbol] = digits[index];
    });
    return map;
  }, [symbols]);

  const [keyMap, setKeyMap] = useState<{ [key: string]: number }>(() => generateKeyMap(1));
  const keyEntries = useMemo(() => Object.entries(keyMap), [keyMap]);

  useEffect(() => {
    if (isComponentLoaded) {
      const initialState = getAdaptiveState(GAME_ID, currentMode);
      setAdaptiveState(initialState);
      setGameState('start');
    }
  }, [isComponentLoaded, currentMode, getAdaptiveState]);
  
  const startNewTrial = (state: AdaptiveState) => {
      const onRamp = state.uncertainty > 0.7;
      const loadedLevel = onRamp
          ? Math.max(state.levelFloor, state.currentLevel - 2)
          : state.currentLevel;

      let newKeyMap = keyMap;
      if (keyChangeCounter.current >= 5) {
          newKeyMap = generateKeyMap(loadedLevel);
          setKeyMap(newKeyMap);
          keyChangeCounter.current = 0;
          setInlineFeedback({ message: "Key changed!", type: 'success' });
          setTimeout(() => setInlineFeedback({ message: '', type: '' }), 1500);
      }
      const symbolsInKey = Object.keys(newKeyMap);
      setCurrentSymbol(symbolsInKey[Math.floor(Math.random() * symbolsInKey.length)]);
      setGameState('running');
      trialStartTime.current = Date.now();
  };

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    setTimeLeft(policy.sessionLength);
    keyChangeCounter.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'running' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft <= 0 && gameState === 'running' && adaptiveState) {
        setGameState('finished');
        const finalState = endSession(adaptiveState, sessionTrials);
        updateAdaptiveState(GAME_ID, currentMode, finalState);
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft, adaptiveState, currentMode, sessionTrials, updateAdaptiveState]);

  const handleAnswer = useCallback((digit: number) => {
    if (gameState !== 'running' || !adaptiveState) return;
    
    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;

    const onRamp = adaptiveState.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(adaptiveState.levelFloor, adaptiveState.currentLevel - 2)
      : adaptiveState.currentLevel;
    const params = policy.levelMap[loadedLevel] || policy.levelMap[20];
    
    const isCorrect = keyMap[currentSymbol] === digit && reactionTimeMs < params.responseWindowMs;

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    if (isCorrect) {
        keyChangeCounter.current++;
    } else {
        setInlineFeedback({ message: getFailureFeedback('Gs'), type: 'failure' });
    }

    setTimeout(() => {
        if(timeLeft > 0) {
            startNewTrial(newState);
        }
    }, 500);
  }, [gameState, keyMap, currentSymbol, adaptiveState, timeLeft]);

  const renderContent = () => {
    if (gameState === 'loading' || !isComponentLoaded) {
      return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
    if (gameState === 'start') {
        return (
            <div className="flex flex-col items-center gap-4">
              <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
              <Button onClick={startNewSession} size="lg">Start Session</Button>
            </div>
          );
    }
    if (gameState === 'finished') {
      const finalScore = sessionTrials.filter(t => t.correct).length;
      return (
        <div className="flex flex-col items-center gap-4">
          <CardTitle>Game Over!</CardTitle>
          <p className="text-xl">Your final score is: <span className="text-primary font-bold">{finalScore}</span></p>
          <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
        </div>
      );
    }
    return (
      <div className="w-full">
        <div className="flex justify-between w-full text-lg font-mono mb-4">
          <span>Score: {sessionTrials.filter(t => t.correct).length}</span>
          <span>Time: {timeLeft}s</span>
        </div>
        <div className="flex justify-center gap-4 p-3 bg-muted rounded-lg mb-6 flex-wrap">
          {keyEntries.map(([symbol, digit]) => (
            <div key={symbol} className="flex flex-col items-center p-2">
              <span className="text-3xl font-bold text-primary">{symbol}</span>
              <span className="text-xl font-mono">{digit}</span>
            </div>
          ))}
        </div>
        
        <div className="h-6 text-sm font-semibold mb-2">
          {inlineFeedback.message && (
            <p className={cn("animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
              {inlineFeedback.message}
            </p>
          )}
        </div>

        <div className="relative inline-block mb-6">
          <div className="text-8xl font-extrabold text-primary">
            {currentSymbol}
          </div>
          <NoiseOverlay />
        </div>
        
        <div className="grid grid-cols-5 md:grid-cols-5 gap-2 justify-center max-w-md mx-auto">
          {keyEntries.map(([_, digit]) => (
            <Button key={digit} onClick={() => handleAnswer(digit)} variant="secondary" size="lg" className="text-2xl h-16" disabled={gameState === 'feedback'}>
              {digit}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-2xl text-center">
      <CardHeader>
        <CardTitle>(Gs) Rapid Code Match</CardTitle>
        <CardDescription>Match the symbol to the correct digit using the key as fast as you can. The key changes periodically!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

    