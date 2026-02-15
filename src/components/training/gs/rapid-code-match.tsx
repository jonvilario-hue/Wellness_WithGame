
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getFailureFeedback } from "@/lib/feedback-system";

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
  const [gameState, setGameState] = useState('idle'); // idle, running, finished
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [startTime, setStartTime] = useState(0);
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const { logGameResult } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  
  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isLoaded ? (override || globalFocus) : 'neutral';
  
  const symbols = useMemo(() => {
    switch (currentMode) {
        case 'music': return musicSymbols;
        case 'math': return mathSymbols;
        default: return neutralSymbols;
    }
  }, [currentMode]);

  const generateKeyMap = useCallback(() => {
    const shuffledSymbols = [...symbols].sort(() => Math.random() - 0.5);
    const map: { [key: string]: number } = {};
    // Use a smaller key map that changes, increasing cognitive load
    shuffledSymbols.slice(0, 5).forEach((symbol, index) => {
      map[symbol] = digits[index];
    });
    return map;
  }, [symbols]);

  const [keyMap, setKeyMap] = useState<{ [key: string]: number }>(() => generateKeyMap());
  const keyEntries = useMemo(() => Object.entries(keyMap), [keyMap]);

  const finishGame = useCallback(() => {
    setGameState('finished');
    const time = (Date.now() - startTime) / 1000;
    logGameResult('Gs', currentMode, { score, time });
  }, [logGameResult, currentMode, score, startTime]);
  
  const handleStart = useCallback(() => {
    setScore(0);
    setTimeLeft(60);
    const newKeyMap = generateKeyMap();
    setKeyMap(newKeyMap);
    const symbolsInKey = Object.keys(newKeyMap);
    setCurrentSymbol(symbolsInKey[Math.floor(Math.random() * symbolsInKey.length)]);
    setStartTime(Date.now());
    setGameState('running');
    setInlineFeedback({ message: '', type: '' });
  }, [generateKeyMap]);
  
  useEffect(() => {
    if (isLoaded) {
      handleStart();
    }
  }, [isLoaded, currentMode, handleStart]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'running' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft <= 0 && gameState === 'running') {
      finishGame();
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft, finishGame]);

  const handleAnswer = useCallback((digit: number) => {
    if (gameState !== 'running') return;
    
    let newScore = score;
    let isCorrect = keyMap[currentSymbol] === digit;

    if (isCorrect) {
      newScore++;
      setScore(newScore);
      // Change the keymap every 5 correct answers to force re-learning
      if (newScore > 0 && newScore % 5 === 0) {
        setKeyMap(generateKeyMap());
        setInlineFeedback({ message: "Key changed!", type: 'success' });
        setTimeout(() => setInlineFeedback({ message: '', type: '' }), 1500);
      }
    } else {
      newScore = Math.max(0, score - 1);
      setScore(newScore);
      setInlineFeedback({ message: getFailureFeedback('Gs'), type: 'failure' });
      setTimeout(() => setInlineFeedback({ message: '', type: '' }), 1500);
    }

    const symbolsInKey = Object.keys(keyMap);
    setCurrentSymbol(symbolsInKey[Math.floor(Math.random() * symbolsInKey.length)]);
  }, [gameState, score, keyMap, currentSymbol, generateKeyMap]);

  return (
    <Card className="w-full max-w-2xl text-center">
      <CardHeader>
        <CardTitle>(Gs) Rapid Code Match</CardTitle>
        <CardDescription>Match the symbol to the correct digit using the key as fast as you can. The key changes periodically!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {gameState === 'idle' && (
          <Button onClick={handleStart} size="lg" disabled={!isLoaded}>
            {isLoaded ? 'Start Game' : 'Loading...'}
          </Button>
        )}
        
        {gameState === 'running' && (
          <div className="w-full">
            <div className="flex justify-between w-full text-lg font-mono mb-4">
              <span>Score: {score}</span>
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
                <p className={cn(
                  "animate-in fade-in",
                  inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600'
                )}>
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
                <Button key={digit} onClick={() => handleAnswer(digit)} variant="secondary" size="lg" className="text-2xl h-16">
                  {digit}
                </Button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="flex flex-col items-center gap-4">
            <CardTitle>Game Over!</CardTitle>
            <p className="text-xl">Your final score is: <span className="text-primary font-bold">{score}</span></p>
            <Button onClick={handleStart} size="lg">Play Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
