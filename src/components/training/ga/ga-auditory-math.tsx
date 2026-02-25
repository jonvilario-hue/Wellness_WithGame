
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
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { Input } from "@/components/ui/input";

const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

const generateProblem = (level: number): { num1: number, num2: number, operation: '+' | '-', answer: number } => {
    const params = policy.levelMap[level]?.content_config['math']?.params || policy.levelMap[1].content_config['math']!.params;
    const { digits } = params;
    
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;

    const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
    const num2 = Math.floor(Math.random() * (max - min + 1)) + min;
    
    const operation = Math.random() > 0.5 ? '+' : '-';
    const answer = operation === '+' ? num1 + num2 : num1 - num2;

    return { num1, num2, operation, answer };
};

export function GaAuditoryMath({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
  const { speak, isSupported } = useAudioEngine();

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  
  const [puzzle, setPuzzle] = useState<{ num1: number, num2: number, operation: string, answer: number } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [userInput, setUserInput] = useState('');

  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);

  useEffect(() => {
    if (isSupported) {
      const initialState = getAdaptiveState(GAME_ID, focus);
      setAdaptiveState(initialState);
      setGameState('start');
    }
  }, [focus, getAdaptiveState, isSupported]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    const newPuzzle = generateProblem(state.currentLevel);
    setPuzzle(newPuzzle);
    setFeedback('');
    setUserInput('');
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, []);
  
  useEffect(() => {
    if (gameState === 'playing' && puzzle && adaptiveState) {
        const levelDef = policy.levelMap[adaptiveState.currentLevel] || policy.levelMap[1];
        const params = levelDef.content_config[focus]?.params;
        if (!params) return;

        const operationText = puzzle.operation === '+' ? "plus" : "minus";
        const problemString = `What is ${puzzle.num1} ${operationText} ${puzzle.num2}?`;
        
        speak(problemString, () => {
            trialStartTime.current = Date.now();
        });
    }
  }, [gameState, puzzle, adaptiveState, focus, speak]);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    updateAdaptiveState(GAME_ID, focus, sessionState);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial, updateAdaptiveState, focus]);

  const handleAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;
    
    const userAnswer = parseInt(userInput, 10);
    const isCorrect = userAnswer === puzzle.answer;
    
    const levelDef = policy.levelMap[adaptiveState.currentLevel] || policy.levelMap[1];
    const params = levelDef.content_config[focus]?.params;
    const trialResult: TrialResult = {
        correct: isCorrect,
        reactionTimeMs,
        telemetry: { stimulusType: 'speech', digits: params?.digits }
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
    } as any);

    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);
    updateAdaptiveState(GAME_ID, focus, newState);

    setFeedback(isCorrect ? getSuccessFeedback('Ga') : `${getFailureFeedback('Ga')} The answer was ${puzzle.answer}.`);
    
    setTimeout(() => {
      currentTrialIndex.current++;
      if (currentTrialIndex.current >= policy.sessionLength) {
        setGameState('finished');
      } else {
        startNewTrial(newState);
      }
    }, 2500);
  };
  
  const renderContent = () => {
    if (!isSupported) {
       return (
            <Alert variant="destructive">
              <AlertTitle>Speech Synthesis Not Supported</AlertTitle>
              <AlertDescription>Your browser doesn't support the required Web Speech API for this game.</AlertDescription>
            </Alert>
        );
    }
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <Button onClick={startNewSession} size="lg">Begin Listening</Button>
        </div>
      );
    }
    
    if (gameState === 'finished') {
      const score = 0; // Replace with actual session scoring logic
      const accuracy = 0;
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
          <h3 className="text-lg font-semibold text-violet-200">Listen to the math problem.</h3>
          <div className="flex justify-center items-center gap-8 mt-4">
            <Volume2 className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>
        <div className="h-10 text-lg font-semibold text-violet-200">
          {feedback && <p className={cn(feedback.includes('Incorrect') ? 'text-rose-400' : 'text-green-400')}>{feedback}</p>}
        </div>
        <form onSubmit={handleAnswer} className="flex w-full max-w-sm items-center space-x-2">
            <Input 
                type="number" 
                placeholder="Your answer" 
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                disabled={gameState === 'feedback'}
                className="text-center text-2xl h-16"
            />
            <Button type="submit" size="lg" className="h-16" disabled={gameState === 'feedback'}>Submit</Button>
        </form>
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
                    Listen to the verbal math problem and type the correct answer.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[500px]">
                {renderContent()}
            </CardContent>
        </Card>
    );
}
