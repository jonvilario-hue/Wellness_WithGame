
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Volume2, Loader2 } from 'lucide-react';
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

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
  
  const playTone = useCallback((freq: number, duration: number, onEnd?: () => void) => {
    const context = getAudioContext();
    if (!context) { onEnd?.(); return; }
    context.resume();
    const time = context.currentTime;
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.connect(context.destination);
    osc.start(time);
    osc.stop(time + duration);
    if (onEnd) setTimeout(onEnd, duration * 1000);
  }, [getAudioContext]);

  return { playTone, getAudioContext };
};

const generateNumber = (digits: number) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function GaAuditoryMath({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
  const { playTone, getAudioContext } = useAudioEngine();

  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  
  const [puzzle, setPuzzle] = useState<{ num1: number, num2: number } | null>(null);
  const [feedback, setFeedback] = useState('');

  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const useToneFallback = !isSpeechSupported;

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setIsSpeechSupported(supported);
    const initialState = getAdaptiveState(GAME_ID, focus);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [focus, getAdaptiveState]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    const levelDef = policy.levelMap[state.currentLevel] || policy.levelMap[1];
    const params = levelDef.content_config[focus]?.params;
    if (!params) return;

    let num1 = generateNumber(params.digits);
    let num2;
    do {
      num2 = generateNumber(params.digits);
    } while (num1 === num2);

    setPuzzle({ num1, num2 });
    setFeedback('');
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, [focus]);
  
  // Audio playback effect
  useEffect(() => {
    if (gameState === 'playing' && puzzle && adaptiveState) {
        const levelDef = policy.levelMap[adaptiveState.currentLevel] || policy.levelMap[1];
        const params = levelDef.content_config[focus]?.params;
        if (!params) return;

        if (useToneFallback) {
            const basePitch = 250;
            const maxNum = Math.pow(10, params.digits) - 1;
            const freq1 = basePitch + (puzzle.num1 / maxNum) * params.pitchDelta;
            const freq2 = basePitch + (puzzle.num2 / maxNum) * params.pitchDelta;
            playTone(freq1, 0.5, () => setTimeout(() => playTone(freq2, 0.5), 500));
        } else {
            const utterance1 = new SpeechSynthesisUtterance(String(puzzle.num1));
            utterance1.rate = params.speechRate;
            utterance1.onend = () => setTimeout(() => {
                const utterance2 = new SpeechSynthesisUtterance(String(puzzle.num2));
                utterance2.rate = params.speechRate;
                speechSynthesis.speak(utterance2);
            }, 500);
            speechSynthesis.speak(utterance1);
        }
    }
  }, [gameState, puzzle, adaptiveState, focus, useToneFallback, playTone]);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    getAudioContext()?.resume();
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    updateAdaptiveState(GAME_ID, focus, sessionState);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial, getAudioContext, updateAdaptiveState, focus]);

  const handleAnswer = (userChoice: 'num1' | 'num2' | 'equal') => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;
    
    let isCorrect = false;
    if (userChoice === 'equal') isCorrect = puzzle.num1 === puzzle.num2;
    else if (userChoice === 'num1') isCorrect = puzzle.num1 > puzzle.num2;
    else isCorrect = puzzle.num2 > puzzle.num1;
    
    const levelDef = policy.levelMap[adaptiveState.currentLevel] || policy.levelMap[1];
    const params = levelDef.content_config[focus]?.params;
    const trialResult: TrialResult = {
        correct: isCorrect,
        reactionTimeMs,
        telemetry: {
            stimulusType: useToneFallback ? 'pitch' : 'speech',
            digits: params?.digits,
            speechRate: params?.speechRate,
            pitchDelta: params?.pitchDelta,
        }
    };
    
    logTrial({
      id: crypto.randomUUID(),
      userId: 'local_user',
      timestamp: Date.now(),
      module_id: GAME_ID,
      currentLevel: adaptiveState.currentLevel,
      isCorrect: isCorrect,
      responseTime_ms: reactionTimeMs,
      meta: trialResult.telemetry
    });

    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);
    updateAdaptiveState(GAME_ID, focus, newState);

    setFeedback(isCorrect ? getSuccessFeedback('Ga') : getFailureFeedback('Ga'));
    
    setTimeout(() => {
      currentTrialIndex.current++;
      if (currentTrialIndex.current >= policy.sessionLength) {
        setGameState('finished');
      } else {
        startNewTrial(newState);
      }
    }, 2000);
  };
  
  const getInstruction = () => {
    if (!adaptiveState) return "";
    return useToneFallback
        ? "Which TONE was higher in pitch?"
        : "Listen to the two numbers. Which is larger?";
  }

  const renderContent = () => {
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          {useToneFallback && (
            <Alert>
              <AlertTitle>Speech Synthesis Not Supported</AlertTitle>
              <AlertDescription>Your browser doesn't support speech. The game will use tones as a fallback to test auditory discrimination.</AlertDescription>
            </Alert>
          )}
          <Button onClick={startNewSession} size="lg">Begin Listening</Button>
        </div>
      );
    }
    
    if (gameState === 'finished') {
      const score = currentTrialIndex.current > 0 ? getAdaptiveState(GAME_ID, focus).recentTrials.slice(-currentTrialIndex.current).filter(r => r.correct).length : 0;
      const accuracy = score / currentTrialIndex.current;
      return (
        <div className="text-center space-y-4">
          <CardTitle>Session Complete!</CardTitle>
          <p>Accuracy: {(accuracy * 100).toFixed(0)}%</p>
          <Button onClick={startNewSession} size="lg">Play Again</Button>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col items-center gap-6">
        <div className="w-full flex justify-between font-mono text-sm text-violet-200">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
        </div>
        <div className="w-full p-8 bg-violet-900/50 rounded-lg text-center min-h-[120px]">
          <h3 className="text-lg font-semibold text-violet-200">{getInstruction()}</h3>
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
