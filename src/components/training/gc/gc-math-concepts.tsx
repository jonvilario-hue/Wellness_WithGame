
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Calculator, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus, TelemetryEvent } from "@/types";
import { mathConceptQuestions } from '@/data/math-content';
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { PRNG } from "@/lib/rng";

const GAME_ID: GameId = 'gc_verbal_inference';
const policy = difficultyPolicies[GAME_ID];

const getQuestionsForLevel = (level: number, prng: PRNG) => {
    const policyForLevel = policy.levelMap[level] || policy.levelMap[1];
    const params = policyForLevel.content_config['math']?.params;
    if (!params) return [];
    
    let questionPool: any[] = [];
    if (params.question_level === 1) {
        questionPool = mathConceptQuestions.filter(q => q.level === 1);
    } else if (params.question_level === 2) {
        questionPool = mathConceptQuestions.filter(q => q.level === 2);
    } else {
        questionPool = mathConceptQuestions.filter(q => q.level === 3);
    }
    return prng.shuffle(questionPool);
}

export default function GcMathConcepts({ focus = 'math' }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);

  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prngRef = useRef<PRNG>(new PRNG(Date.now()));
  const isVisible = usePageVisibility();
  const pausedDurationRef = useRef(0);
  const pauseTimeRef = useRef<number | null>(null);


  const currentQuestion = useMemo(() => shuffledQuestions[currentTrialIndex.current], [shuffledQuestions, currentTrialIndex.current]);
  const timeLimit = useMemo(() => {
    if (!adaptiveState) return 20000;
    const policyForLevel = policy.levelMap[adaptiveState.currentLevel] || policy.levelMap[1];
    return policyForLevel.mechanic_config.timeLimit || 20000;
  }, [adaptiveState]);

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID, focus);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [focus, getAdaptiveState]);
  
  const handleAnswer = useCallback((option: string | null) => {
    if (gameState !== 'playing' || !currentQuestion || !adaptiveState || !activeSession) return;

    if (timerRef.current) clearInterval(timerRef.current);
    const levelPlayed = adaptiveState.currentLevel;
    setGameState('feedback');

    const reactionTimeMs = Date.now() - trialStartTime.current - pausedDurationRef.current;
    const isCorrect = option === currentQuestion.answer;
    
    if(option) setSelectedAnswer(option);

    const trialResult: TrialResult = {
        correct: isCorrect,
        reactionTimeMs,
        telemetry: {
            questionId: currentQuestion.id,
            question_level: currentQuestion.level,
            timedOut: option === null,
            timeLimit: timeLimit,
            pausedDurationMs: pausedDurationRef.current,
        }
    };

    logEvent({
        type: 'trial_complete',
        sessionId: activeSession.sessionId,
        payload: {
            id: `${activeSession.sessionId}-${currentTrialIndex.current}`,
            sessionId: activeSession.sessionId,
            gameId: GAME_ID,
            focus,
            trialIndex: currentTrialIndex.current,
            difficultyLevel: levelPlayed,
            correct: isCorrect,
            rtMs: reactionTimeMs,
            stimulusParams: trialResult.telemetry,
            responseType: isCorrect ? 'correct' : 'incorrect',
            stimulusOnsetTs: trialStartTime.current,
            responseTs: Date.now(),
            pausedDurationMs: pausedDurationRef.current,
            wasFallback: false
        }
    } as Omit<TelemetryEvent, 'eventId' | 'timestamp' | 'schemaVersion' | 'seq'>);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    updateAdaptiveState(GAME_ID, focus, newState);
    setAdaptiveState(newState);

    setTimeout(() => {
      currentTrialIndex.current++;
      if (currentTrialIndex.current >= policy.sessionLength) {
        setGameState('finished');
      } else {
        startNewTrial(newState);
      }
    }, 2500);
  }, [gameState, currentQuestion, adaptiveState, logEvent, focus, updateAdaptiveState, timeLimit, activeSession]);

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing' && isVisible) {
        if(pauseTimeRef.current) {
            pausedDurationRef.current += Date.now() - pauseTimeRef.current;
            pauseTimeRef.current = null;
        }
        setTimeLeft(timeLimit / 1000);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAnswer(null); // Timeout is an incorrect answer
            return timeLimit / 1000;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if(gameState === 'playing' && !isVisible) {
          pauseTimeRef.current = Date.now();
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, handleAnswer, timeLimit, isVisible]);


  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    const newPrng = new PRNG(Date.now());
    prngRef.current = newPrng;

    setAdaptiveState(sessionState);
    updateAdaptiveState(GAME_ID, focus, sessionState);

    const questions = getQuestionsForLevel(sessionState.currentLevel, newPrng);
    setShuffledQuestions(questions);
    
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, updateAdaptiveState, focus]);

  const startNewTrial = useCallback((state: AdaptiveState) => {
    setSelectedAnswer(null);
    setGameState('playing');
    trialStartTime.current = Date.now();
    pausedDurationRef.current = 0;
    pauseTimeRef.current = null;
  }, []);

  const renderContent = () => {
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-blue-400" />;
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <CardDescription>Test your knowledge of mathematical concepts.</CardDescription>
          <Button onClick={startNewSession} size="lg" className="bg-blue-600 hover:bg-blue-500">Start Quiz</Button>
        </div>
      );
    }

    if (gameState === 'finished') {
       const sessionTrials = getAdaptiveState(GAME_ID, focus).recentTrials.slice(-policy.sessionLength);
       const score = sessionTrials.filter(r => r.correct).length;
       const accuracy = sessionTrials.length > 0 ? score / sessionTrials.length : 0;
       return (
        <div className="text-center space-y-4 animate-in fade-in">
          <CardTitle>Session Complete!</CardTitle>
          <p className="text-xl">Accuracy: {isNaN(accuracy) ? 'N/A' : (accuracy * 100).toFixed(0)}%</p>
          <p className="text-lg">Score: {score} / {policy.sessionLength}</p>
          <Button onClick={startNewSession} size="lg" className="bg-blue-600 hover:bg-blue-500">Play Again</Button>
        </div>
      );
    }

    if (!currentQuestion) return <Loader2 className="h-12 w-12 animate-spin text-blue-400" />;

    return (
      <>
        <div className="w-full flex justify-between font-mono text-sm text-blue-200">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Time: {timeLeft}s</span>
        </div>
        <div className="p-6 bg-slate-700/50 rounded-lg w-full text-center min-h-[100px] flex items-center justify-center">
          <p className="text-lg md:text-xl font-medium text-slate-100">{currentQuestion.question}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full">
          {currentQuestion.options.map((option: string, index: number) => (
            <Button 
              key={index} 
              onClick={() => handleAnswer(option)}
              disabled={gameState === 'feedback'}
              size="lg"
              variant="outline"
              className={cn(
                "h-auto py-3 whitespace-normal text-left justify-start transition-all duration-300 text-slate-100 bg-slate-800 border-slate-600 hover:bg-slate-700",
                gameState === 'feedback' && option === currentQuestion.answer && "bg-green-500/20 border-green-500 text-white",
                gameState === 'feedback' && selectedAnswer === option && option !== currentQuestion.answer && "bg-rose-500/20 border-rose-500 text-white",
            )}
            >
              {option}
            </Button>
          ))}
        </div>
        <div className="h-20 mt-2 text-center">
          {gameState === 'feedback' && (
            <div className="animate-in fade-in space-y-2">
                <p className={cn("font-semibold", selectedAnswer === currentQuestion.answer ? 'text-green-400' : 'text-rose-400')}>
                    {selectedAnswer === null ? "Time's up!" : selectedAnswer === currentQuestion.answer ? "Correct!" : "Incorrect."}
                </p>
                <p className="text-sm text-slate-400">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-2xl bg-slate-800 border-blue-500/30 text-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-blue-300">
            <Calculator />
            (Gc) Math Concepts
        </CardTitle>
        <CardDescription className="text-center text-blue-300/70">
          Test your knowledge of mathematical definitions, concepts, and relationships.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

    