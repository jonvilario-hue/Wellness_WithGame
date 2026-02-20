
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemoryStick, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { cn } from "@/lib/utils";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";

const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

const generateSequence = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const tasks = [
  { id: 'reverse', label: "Repeat the sequence backward." },
  { id: 'alpha_only', label: "Repeat only the letters, in order." },
  { id: 'numeric_only', label: "Repeat only the numbers, in order." },
  { id: 'remove_first', label: "Repeat the sequence, removing the first character." },
  { id: 'alpha_shift', label: "Repeat the letters, shifting each forward by one (A->B, Z->A)." },
  { id: 'every_other', label: "Repeat every other character, starting with the first." },
];

export function DynamicSequenceTransformer() {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  
  const [gameState, setGameState] = useState<'loading' | 'start' | 'memorizing' | 'answering' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  
  const [sequence, setSequence] = useState('');
  const [task, setTask] = useState(tasks[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [getAdaptiveState]);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    setGameState('memorizing');
    startNewTrial(sessionState);
  }, [adaptiveState]);

  const startNewTrial = (state: AdaptiveState) => {
    const level = state.currentLevel;
    const levelParams = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const newSequence = generateSequence(levelParams.sequenceLength);
    const newTask = tasks[Math.floor(Math.random() * tasks.length)];
    
    setSequence(newSequence);
    setTask(newTask);
    setUserAnswer('');
    setFeedback('');
    setGameState('memorizing');
    
    setTimeout(() => {
      setGameState('answering');
      trialStartTime.current = Date.now();
    }, levelParams.displayTimeMs || 1500);
  };
  
  const correctAnswer = useMemo(() => {
    if (!sequence || !task) return '';
    switch(task.id) {
        case 'reverse': return sequence.split('').reverse().join('');
        case 'alpha_only': return sequence.replace(/[^A-Z]/g, '');
        case 'numeric_only': return sequence.replace(/[^0-9]/g, '');
        case 'remove_first': return sequence.substring(1);
        case 'alpha_shift':
            return sequence.replace(/[^A-Z]/g, '').split('').map(char => 
                char === 'Z' ? 'A' : String.fromCharCode(char.charCodeAt(0) + 1)
            ).join('');
        case 'every_other':
            return sequence.split('').filter((_, i) => i % 2 === 0).join('');
        default: return '';
    }
  }, [sequence, task]);


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (gameState !== 'answering' || !adaptiveState) return;
    
    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = userAnswer.toUpperCase().trim() === correctAnswer;

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    setFeedback(isCorrect ? getSuccessFeedback('Gwm') : `Incorrect. The answer was: ${correctAnswer}. ${getFailureFeedback('Gwm')}`);

    setTimeout(() => {
        currentTrialIndex.current++;
        if(currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
            const finalState = endSession(newState, [...sessionTrials, trialResult]);
            updateAdaptiveState(GAME_ID, finalState);
        } else {
            startNewTrial(newState);
        }
    }, 2500);

  }, [gameState, userAnswer, correctAnswer, adaptiveState, sessionTrials, updateAdaptiveState]);

  const renderContent = () => {
    switch (gameState) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
      case 'start':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
            <Button onClick={startNewSession} size="lg">Start Session</Button>
          </div>
        );
      case 'memorizing':
        return (
          <div className="text-center space-y-4 animate-in fade-in">
            <p className="font-semibold text-muted-foreground">Memorize this sequence:</p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-4xl font-mono tracking-widest">{sequence}</p>
            </div>
            <p className="text-sm text-primary animate-pulse">Prepare to answer...</p>
          </div>
        );
      case 'answering':
      case 'feedback':
        return (
          <div className="w-full space-y-4 text-center animate-in fade-in">
            <div className="font-mono text-lg">Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xl font-semibold">{task.label}</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your transformed answer"
                className="text-center text-lg"
                disabled={gameState === 'feedback'}
                autoFocus
              />
              <Button type="submit" disabled={gameState === 'feedback'}>Submit Answer</Button>
            </form>
            {gameState === 'feedback' && (
              <div className="mt-4 text-center text-xl font-bold animate-in fade-in">
                <p className={cn(feedback.includes('Incorrect') ? 'text-amber-600' : 'text-green-600')}>{feedback}</p>
              </div>
            )}
          </div>
        );
      case 'finished':
          const finalAccuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
        return (
            <div className="flex flex-col items-center gap-4">
                <CardTitle>Session Complete!</CardTitle>
                <p>Accuracy: {(finalAccuracy * 100).toFixed(0)}%</p>
                <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
            </div>
        )
    }
  };

  return (
    <Card className="w-full max-w-2xl text-center">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
            <MemoryStick />
            (Gwm) Dynamic Sequence
        </CardTitle>
        <CardDescription>Memorize the sequence, then transform it as instructed.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
