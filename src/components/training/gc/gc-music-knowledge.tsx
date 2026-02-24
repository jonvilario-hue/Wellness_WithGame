
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { Music, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { musicTheoryQuestions } from '@/data/music-content';

const GAME_ID: GameId = 'gc_verbal_inference';
const policy = difficultyPolicies[GAME_ID];

// --- Fisher-Yates Shuffle ---
const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export function GcMusicKnowledge({ focus = 'music' }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);

  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (gameState !== 'playing' || !currentQuestion || !adaptiveState) return;

    if (timerRef.current) clearInterval(timerRef.current);
    const levelPlayed = adaptiveState.currentLevel;
    setGameState('feedback');

    const reactionTimeMs = Date.now() - trialStartTime.current;
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
        }
    };

    logTrial({
      module_id: GAME_ID,
      mode: focus,
      levelPlayed: levelPlayed,
      isCorrect,
      responseTime_ms: reactionTimeMs,
      meta: trialResult.telemetry
    });
    
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
  }, [gameState, currentQuestion, adaptiveState, logTrial, focus, updateAdaptiveState, timeLimit]);

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing') {
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
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, handleAnswer, timeLimit]);


  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    updateAdaptiveState(GAME_ID, focus, sessionState);

    const questions = shuffle([...musicTheoryQuestions]);
    setShuffledQuestions(questions);
    
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, updateAdaptiveState, focus]);

  const startNewTrial = useCallback((state: AdaptiveState) => {
    setSelectedAnswer(null);
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, []);

  const renderContent = () => {
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-purple-400" />;
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <CardDescription>Test your knowledge of music theory concepts.</CardDescription>
          <Button onClick={startNewSession} size="lg" className="bg-purple-600 hover:bg-purple-500">Start Quiz</Button>
        </div>
      );
    }

    if (gameState === 'finished') {
       return (
        <div className="text-center space-y-4 animate-in fade-in">
          <CardTitle>Session Complete!</CardTitle>
          <Button onClick={startNewSession} size="lg" className="bg-purple-600 hover:bg-purple-500">Play Again</Button>
        </div>
      );
    }

    if (!currentQuestion) return <Loader2 className="h-12 w-12 animate-spin text-purple-400" />;

    return (
      <>
        <div className="w-full flex justify-between font-mono text-sm text-purple-200">
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
    <Card className="w-full max-w-2xl bg-slate-800 border-purple-500/30 text-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-purple-300">
            <Music />
            (Gc) Music Knowledge
        </CardTitle>
        <CardDescription className="text-center text-purple-300/70">
          Test your knowledge of music theory definitions, concepts, and relationships.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

    