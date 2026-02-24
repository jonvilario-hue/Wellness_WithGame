'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Calculator, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { mathConceptQuestions } from "@/data/math-content";

const GAME_ID: GameId = 'gc_verbal_inference';
const policy = difficultyPolicies[GAME_ID];

export function GcMathConcepts({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  
  const [puzzle, setPuzzle] = useState<(typeof mathConceptQuestions)[0] | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID, focus);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [focus, getAdaptiveState]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    const availableQuestions = mathConceptQuestions.filter(q => q.level <= state.currentLevel);
    const newPuzzle = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    setPuzzle({...newPuzzle, options: [...newPuzzle.options].sort(() => Math.random() - 0.5)});
    setSelectedAnswer(null);
    setInlineFeedback({ message: '', type: '' });
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, []);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial]);

  const handleAnswer = (option: string) => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;

    setGameState('feedback');
    setSelectedAnswer(option);
    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = option === puzzle.answer;

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    setInlineFeedback({ message: isCorrect ? getSuccessFeedback('Gc') : getFailureFeedback('Gc'), type: isCorrect ? 'success' : 'failure' });
    
    setTimeout(() => {
        currentTrialIndex.current++;
        if (currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
            const finalState = endSession(newState, [...sessionTrials, trialResult]);
            updateAdaptiveState(GAME_ID, focus, finalState);
        } else {
            startNewTrial(newState);
        }
    }, 2500);
  };
  
  const renderContent = () => {
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="font-mono text-lg">Level: {adaptiveState.currentLevel}</div>
          <Button onClick={startNewSession} size="lg">Start Session</Button>
        </div>
      );
    }

    if (gameState === 'finished') {
       const finalAccuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
       return (
        <div className="text-center space-y-4 animate-in fade-in">
          <CardTitle>Session Complete!</CardTitle>
          <p className="text-xl">Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0) + '%'}</p>
          <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
        </div>
      );
    }

    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;

    return (
      <>
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Level: {adaptiveState?.currentLevel}</span>
        </div>
        <div className="p-6 bg-muted rounded-lg w-full text-center min-h-[100px] flex items-center justify-center">
          <p className="text-lg md:text-xl font-medium">{puzzle.question}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {puzzle.options.map((option, index) => (
            <Button 
              key={index} 
              onClick={() => handleAnswer(option)}
              disabled={gameState === 'feedback'}
              size="lg"
              variant="outline"
              className={cn(
                "h-auto py-3 whitespace-normal text-left justify-start transition-all duration-300",
                gameState === 'feedback' && option === puzzle.answer && "bg-green-100 dark:bg-green-900/30 border-green-500",
                gameState === 'feedback' && selectedAnswer === option && option !== puzzle.answer && "bg-destructive/10 border-destructive",
            )}
            >
              {option}
            </Button>
          ))}
        </div>
        <div className="h-20 mt-2 text-center">
          {gameState === 'feedback' && (
            <div className="animate-in fade-in space-y-2">
                <p className={cn("font-semibold", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
                    {inlineFeedback.message}
                </p>
                <p className="text-sm text-muted-foreground">{puzzle.explanation}</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-2xl bg-amber-900/10 border-amber-500/20 text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-amber-500">
            <Calculator />
            (Gc) Math Concepts
        </CardTitle>
        <CardDescription className="text-center text-amber-500/80">
          Test your knowledge of mathematical definitions, concepts, and relationships.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
