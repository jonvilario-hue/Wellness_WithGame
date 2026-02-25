
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Library, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { PRNG } from '@/lib/rng';
import { useGlrStore } from "@/hooks/use-glr-store";
import { gcLogicTrials } from '@/data/logic-gc-content';

const GAME_ID: GameId = 'gc_verbal_inference';
const policy = difficultyPolicies[GAME_ID];

const CodeSnippet = ({ code }: { code: string }) => {
    const highlight = (line: string) => {
        return line.split(/(\s+|[(){};=,])/).map((token, i) => {
            if (['let', 'const', 'if', 'for', 'while', 'return', 'function'].includes(token)) {
                return <span key={i} className="text-purple-400">{token}</span>;
            }
            if (['true', 'false', 'null'].includes(token) || !isNaN(Number(token))) {
                return <span key={i} className="text-orange-400">{token}</span>;
            }
            if (['>', '<', '==', '!=', '>=', '<=', '&&', '||', '!', '+', '-', '*'].includes(token)) {
                 return <span key={i} className="text-cyan-400">{token}</span>;
            }
            if(token.startsWith('"')) {
                return <span key={i} className="text-green-400">{token}</span>;
            }
            return <span key={i} className="text-slate-300">{token}</span>;
        });
    };
    
    return (
        <pre className="text-left text-sm bg-gray-900 p-4 rounded-md overflow-x-auto">
            <code className="whitespace-pre-wrap">
                {code.split('\n').map((line, i) => (
                    <div key={i}><span className="text-gray-600 mr-4 select-none">{i+1}</span>{highlight(line)}</div>
                ))}
            </code>
        </pre>
    );
};

export function LogicLibrary({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const { prioritizePairForReview } = useGlrStore.getState();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  
  const [puzzle, setPuzzle] = useState<(typeof gcLogicTrials)[0] | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const prngRef = useRef<PRNG | null>(null);

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [focus, getAdaptiveState]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    if (!prngRef.current) return;
    const tier = policy.levelMap[state.currentLevel]?.content_config['logic']?.params.tier || 1;
    const availableQuestions = gcLogicTrials.filter(q => q.tier <= tier);
    const newPuzzle = prngRef.current.shuffle(availableQuestions)[0];

    setPuzzle({...newPuzzle, options: prngRef.current.shuffle([...newPuzzle.options])});
    setSelectedAnswer(null);
    setInlineFeedback({ message: '', type: '' });
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, []);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    prngRef.current = new PRNG(crypto.randomUUID());
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
    const isCorrect = option === puzzle.options[puzzle.correctIndex];

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    setInlineFeedback({ message: isCorrect ? getSuccessFeedback('Gc') : getFailureFeedback('Gc'), type: isCorrect ? 'success' : 'failure' });
    
    // Cross-game hook call
    if (puzzle.conceptTag) {
        prioritizePairForReview(puzzle.conceptTag);
    }
    
    setTimeout(() => {
        currentTrialIndex.current++;
        if (currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
            const finalState = endSession(newState, [...sessionTrials, trialResult]);
            updateAdaptiveState(finalState);
        } else {
            startNewTrial(newState);
        }
    }, 3500);
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
      <div className="w-full flex flex-col items-center gap-4">
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Level: {adaptiveState?.currentLevel}</span>
        </div>
        <CodeSnippet code={puzzle.snippet} />
        <p className="text-lg md:text-xl font-medium text-center">{puzzle.question}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {puzzle.options.map((option, index) => (
            <Button 
              key={index} 
              onClick={() => handleAnswer(option)}
              disabled={gameState === 'feedback'}
              size="lg"
              variant="outline"
              className={cn(
                "h-auto py-3 whitespace-normal text-left justify-center text-center transition-all duration-300",
                gameState === 'feedback' && index === puzzle.correctIndex && "bg-green-100 dark:bg-green-900/30 border-green-500",
                gameState === 'feedback' && selectedAnswer === option && index !== puzzle.correctIndex && "bg-destructive/10 border-destructive",
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
                <p className="text-sm text-muted-foreground">{selectedAnswer === puzzle.options[puzzle.correctIndex] ? puzzle.explanationOnCorrect : puzzle.explanationOnWrong}</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
            <Library />
            (Gc) Code Literacy
        </CardTitle>
        <CardDescription className="text-center">
          Read the code snippet and answer the comprehension question.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
