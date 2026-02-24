
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Volume2, Loader2, Equal } from 'lucide-react';
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import type { TrainingFocus } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TOTAL_TRIALS = 12;

const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const getAudioContext = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) { console.error("Web Audio API not supported.", e); }
    }
    return audioContextRef.current;
  }, []);

  const playBeeps = useCallback((count: number, onEnd?: () => void) => {
    const context = getAudioContext();
    if (!context) { onEnd?.(); return; }
    let time = context.currentTime;
    for (let i = 0; i < count; i++) {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, time);
      osc.connect(context.destination);
      osc.start(time);
      osc.stop(time + 0.1);
      time += 0.2;
    }
    if (onEnd) setTimeout(onEnd, count * 200);
  }, [getAudioContext]);
  
  const playTone = useCallback((freq: number, duration: number, onEnd?: () => void) => {
    const context = getAudioContext();
    if (!context) { onEnd?.(); return; }
    const time = context.currentTime;
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.connect(context.destination);
    osc.start(time);
    osc.stop(time + duration);
    if (onEnd) setTimeout(onEnd, duration * 1000);
  }, [getAudioContext]);

  return { playBeeps, playTone, getAudioContext };
};

const pitchMap: Record<number, number> = { 1: 300, 2: 450, 3: 600, 4: 750, 5: 900 };

export function GaAuditoryMath({ onGameComplete = () => {} }: { focus: TrainingFocus; onGameComplete?: (result: any) => void }) {
  const { playBeeps, playTone, getAudioContext } = useAudioEngine();
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [useVisualFallback, setUseVisualFallback] = useState(false);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [puzzle, setPuzzle] = useState<{ num1: number, num2: number } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [responses, setResponses] = useState<any[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const trialStartTime = useRef(0);
  const [instruction, setInstruction] = useState("Listen and compare the numbers.");

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setIsSpeechSupported(supported);
    if (!supported) setUseVisualFallback(true);
    setGameState('start');
  }, []);

  const startNewTrial = useCallback(() => {
    let num1, num2;
    const isPitchMode = currentTrialIndex >= 5;

    if (isPitchMode) {
      setInstruction("Which TONE is higher in pitch?");
      const numbers = Object.keys(pitchMap).map(Number);
      num1 = numbers[Math.floor(Math.random() * numbers.length)];
      do {
        num2 = numbers[Math.floor(Math.random() * numbers.length)];
      } while (num1 === num2);
    } else {
      setInstruction("Count the beeps. Which number is larger?");
      num1 = Math.floor(Math.random() * 5) + 2; // 2-6
      do {
        num2 = Math.floor(Math.random() * 5) + 2;
      } while (num1 === num2);
    }
    
    setPuzzle({ num1, num2 });
    setFeedback('');
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, [currentTrialIndex]);

  useEffect(() => {
    if (gameState === 'playing' && puzzle) {
      if (useVisualFallback) {
        // Visual Fallback Logic
      } else if (currentTrialIndex < 5) {
        playBeeps(puzzle.num1, () => setTimeout(() => playBeeps(puzzle.num2), 500));
      } else {
        playTone(pitchMap[puzzle.num1], 0.5, () => setTimeout(() => playTone(pitchMap[puzzle.num2], 0.5), 500));
      }
    }
  }, [gameState, puzzle, useVisualFallback, playBeeps, playTone, currentTrialIndex]);

  const startNewSession = () => {
    getAudioContext()?.resume();
    setCurrentTrialIndex(0);
    setResponses([]);
    startNewTrial();
  };

  const handleAnswer = (userChoice: 'num1' | 'num2' | 'equal') => {
    if (gameState !== 'playing' || !puzzle) return;
    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;
    
    let isCorrect = false;
    if (userChoice === 'equal') isCorrect = puzzle.num1 === puzzle.num2;
    else if (userChoice === 'num1') isCorrect = puzzle.num1 > puzzle.num2;
    else isCorrect = puzzle.num2 > puzzle.num1;
    
    setResponses(prev => [...prev, { correct: isCorrect, rt: reactionTimeMs }]);
    setFeedback(isCorrect ? getSuccessFeedback('Ga') : getFailureFeedback('Ga'));
    
    setTimeout(() => {
      const nextTrialIndex = currentTrialIndex + 1;
      if (nextTrialIndex >= TOTAL_TRIALS) {
        setGameState('finished');
        const finalResponses = [...responses, { correct: isCorrect, rt: reactionTimeMs }];
        const score = finalResponses.filter(r => r.correct).length;
        const accuracy = score / finalResponses.length;
        const avgResponseTimeMs = finalResponses.reduce((acc, r) => acc + r.rt, 0) / finalResponses.length;
        onGameComplete({ gameId: 'ga_auditory_lab', mode: 'math', score, accuracy, trials: finalResponses, avgResponseTimeMs });
      } else {
        setCurrentTrialIndex(nextTrialIndex);
        startNewTrial();
      }
    }, 2000);
  };
  
  const renderContent = () => {
    if (gameState === 'loading') return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          {!isSpeechSupported && (
            <Alert variant="destructive">
              <AlertTitle>Speech Synthesis Not Supported</AlertTitle>
              <AlertDescription>Your browser doesn't support speech. The game will use tones as a fallback.</AlertDescription>
            </Alert>
          )}
          <Button onClick={startNewSession} size="lg">Start Session</Button>
        </div>
      );
    }
    if (gameState === 'finished') {
      const score = responses.filter(r => r.correct).length;
      return (
        <div className="text-center space-y-4">
          <CardTitle>Session Complete!</CardTitle>
          <p>Accuracy: {(score / TOTAL_TRIALS * 100).toFixed(0)}%</p>
          <Button onClick={startNewSession} size="lg">Play Again</Button>
        </div>
      );
    }
    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;

    return (
      <div className="w-full flex flex-col items-center gap-6">
        <div className="w-full flex justify-between font-mono text-sm text-violet-200">
          <span>Trial: {currentTrialIndex + 1} / {TOTAL_TRIALS}</span>
        </div>
        <div className="w-full p-8 bg-violet-900/50 rounded-lg text-center min-h-[120px]">
          <h3 className="text-lg font-semibold text-violet-200">{instruction}</h3>
          <div className="flex justify-center items-center gap-8 mt-4">
            <Volume2 className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>
        <div className="h-6 text-lg font-semibold text-violet-200">
          {feedback && <p className={cn(feedback.includes('Incorrect') ? 'text-rose-400' : 'text-green-400')}>{feedback}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
          <Button onClick={() => handleAnswer('num1')} disabled={gameState==='feedback'} size="lg" className="h-24 text-xl bg-violet-600 hover:bg-violet-500">First</Button>
          <Button onClick={() => handleAnswer('equal')} disabled={gameState==='feedback'} size="lg" className="h-24 text-xl bg-fuchsia-600 hover:bg-fuchsia-500">Equal</Button>
          <Button onClick={() => handleAnswer('num2')} disabled={gameState==='feedback'} size="lg" className="h-24 text-xl bg-violet-600 hover:bg-violet-500">Second</Button>
        </div>
      </div>
    );
  };
    
    return (
        <Card className="w-full max-w-2xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
                    <Volume2 />
                    (Ga) Auditory Math
                </CardTitle>
                <CardDescription className="text-violet-300/70">
                    Listen and determine which number is larger.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[500px]">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
