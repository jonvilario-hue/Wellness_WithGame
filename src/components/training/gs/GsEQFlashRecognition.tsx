

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Loader2, Smile, Zap, X, Check } from "lucide-react";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import type { AdaptiveState, TrialResult, GameId } from "@/types";
import { PRNG } from "@/lib/rng";
import { cn } from "@/lib/utils";

const GAME_ID: GameId = 'gs_rapid_code';
const policy = difficultyPolicies[GAME_ID];

type Emotion = 'happy' | 'sad' | 'angry' | 'surprised';
const EMOTIONS: Emotion[] = ['happy', 'sad', 'angry', 'surprised'];

type Puzzle = {
  target: Emotion | 'neutral';
  options: Emotion[];
};

const DURATION_LEVELS = [500, 350, 250, 150, 100, 80];

const generatePuzzle = (level: number, prng: PRNG): Puzzle => {
  const params = policy.levelMap[level]?.content_config['eq']?.params || policy.levelMap[1].content_config['eq']!.params;
  const isCatchTrial = prng.nextFloat() < params.catch_trial_probability;
  const target = isCatchTrial ? 'neutral' : prng.shuffle(EMOTIONS)[0];
  
  const optionsSet = new Set<Emotion>();
  if (target !== 'neutral') {
    optionsSet.add(target);
  }
  while (optionsSet.size < params.response_options) {
    optionsSet.add(prng.shuffle(EMOTIONS)[0]);
  }
  
  return {
    target,
    options: prng.shuffle(Array.from(optionsSet)),
  };
};

export function GsEQFlashRecognition() {
  const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
  const { engine } = useAudioEngine();
  
  const [phase, setPhase] = useState<'start' | 'fixation' | 'stimulus' | 'mask' | 'response' | 'feedback' | 'finished'>('start');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [score, setScore] = useState(0);
  const [flashDuration, setFlashDuration] = useState(500);
  const [accuracyWindow, setAccuracyWindow] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean, message: string } | null>(null);

  const trialStartTime = useRef(0);
  const prngRef = useRef(new PRNG('gs-eq-seed'));
  const adaptiveState = getAdaptiveState(GAME_ID, 'eq');

  const startNewTrial = useCallback(() => {
    setPhase('fixation');
    setFeedback(null);
    const newPuzzle = generatePuzzle(adaptiveState.currentLevel, prngRef.current);
    setPuzzle(newPuzzle);
    
    setTimeout(() => {
        setPhase('stimulus');
        trialStartTime.current = performance.now();
    }, 500); // 500ms fixation
  }, [adaptiveState.currentLevel]);

  useEffect(() => {
    if (phase === 'stimulus') {
      const timer = setTimeout(() => setPhase('mask'), flashDuration);
      return () => clearTimeout(timer);
    }
    if (phase === 'mask') {
      const timer = setTimeout(() => setPhase('response'), 200);
      return () => clearTimeout(timer);
    }
  }, [phase, flashDuration]);

  const handleResponse = useCallback((response: Emotion | 'no-go') => {
    if (phase !== 'response' || !puzzle) return;

    const rt = performance.now() - trialStartTime.current;
    let isCorrect = false;

    if (puzzle.target === 'neutral') {
      isCorrect = response === 'no-go';
    } else {
      isCorrect = response === puzzle.target;
    }

    // Update adaptive flash duration
    const newAccuracyWindow = [...accuracyWindow, isCorrect].slice(-10);
    setAccuracyWindow(newAccuracyWindow);
    if (newAccuracyWindow.length === 10) {
      const acc = newAccuracyWindow.filter(Boolean).length / 10;
      const currentDurationIndex = DURATION_LEVELS.indexOf(flashDuration);
      if (acc > 0.85 && currentDurationIndex < DURATION_LEVELS.length - 1) {
        setFlashDuration(DURATION_LEVELS[currentDurationIndex + 1]);
      } else if (acc < 0.6 && currentDurationIndex > 0) {
        setFlashDuration(DURATION_LEVELS[currentDurationIndex - 1]);
      }
    }

    setScore(s => s + (isCorrect ? 1 : 0));
    setFeedback({ correct: isCorrect, message: isCorrect ? "Correct!" : "Incorrect." });
    
    // Log trial
    const ies = isCorrect ? rt / 1 : rt / (1 - 0.001); // Avoid division by zero
    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs: rt, telemetry: {
        ies,
        flashDuration,
        wasCatchTrial: puzzle.target === 'neutral',
        response,
    }};
    
    if (activeSession) {
        logEvent({ type: 'trial_complete', sessionId: activeSession.sessionId, seq: activeSession.trialCount || 0, payload: { ...trialResult, gameId: GAME_ID, focus: 'eq' } as any });
    }
    const newState = adjustDifficulty(trialResult, getAdaptiveState(GAME_ID, 'eq'), policy);
    updateAdaptiveState(GAME_ID, 'eq', newState);

    setPhase('feedback');
    setTimeout(startNewTrial, 1500);
  }, [accuracyWindow, activeSession, flashDuration, getAdaptiveState, logEvent, phase, puzzle, startNewTrial, updateAdaptiveState]);
  
  useEffect(() => {
    // No-Go response timeout
    if (phase === 'response' && puzzle?.target === 'neutral') {
      const timer = setTimeout(() => handleResponse('no-go'), 2000); // 2s response window
      return () => clearTimeout(timer);
    }
  }, [phase, puzzle, handleResponse]);


  const renderDisplay = () => {
    switch (phase) {
      case 'fixation': return <div className="text-6xl text-primary">+</div>;
      case 'stimulus': return <div className="text-6xl font-bold capitalize text-primary">{puzzle?.target}</div>;
      case 'mask': return <div className="text-8xl bg-muted w-32 h-32 rounded-lg"></div>;
      case 'response':
      case 'feedback':
        return (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="h-8 text-xl font-bold">
              {feedback && <p className={cn(feedback.correct ? 'text-green-400' : 'text-red-400')}>{feedback.message}</p>}
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {puzzle?.options.map((opt, index) => (
                <Button key={`${opt}-${index}`} onClick={() => handleResponse(opt)} disabled={phase === 'feedback'} variant="secondary" className="h-20 w-32 text-lg font-bold capitalize">{opt}</Button>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
            <span className="p-2 bg-primary/10 rounded-md"><Zap className="w-6 h-6 text-primary" /></span>
            Affective Go/No-Go
        </CardTitle>
        <CardDescription>Classify the emotion as fast as possible. Do not respond to neutral faces.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {phase === 'start' ? (
          <Button onClick={startNewTrial} size="lg">Start</Button>
        ) : phase === 'finished' ? (
           <div className="text-center">
                <CardTitle>Session Complete</CardTitle>
                <p>Score: {score}</p>
                <Button onClick={startNewTrial} className="mt-4">Play Again</Button>
            </div>
        ) : (
          <>
            <div className="w-full h-48 flex items-center justify-center bg-muted/50 rounded-lg">
              {renderDisplay()}
            </div>
            <div className="font-mono text-muted-foreground">Flash Duration: {flashDuration}ms</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
