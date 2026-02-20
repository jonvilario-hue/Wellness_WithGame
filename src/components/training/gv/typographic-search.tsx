
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { realWords, pseudowords } from "@/data/verbal-content";

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

type SearchTask = {
    prompt: string;
    // A function that returns true if a word matches the visual criteria
    validator: (word: string) => boolean;
};

// --- Visual-Orthographic Tasks ---
const searchTasks: SearchTask[] = [
    { prompt: "Find all words with an ascender ('b', 'd', 'f', 'h', 'k', 'l', 't')", validator: (word) => /[bdfhklt]/.test(word) },
    { prompt: "Find all words with a descender ('g', 'j', 'p', 'q', 'y')", validator: (word) => /[gjpqy]/.test(word) },
    { prompt: "Find all words with at least one 'tall' letter", validator: (word) => /[bdfhkltgjpqy]/.test(word) },
    { prompt: "Find all words with a 'double letter' (e.g., 'look')", validator: (word) => /(\w)\1/.test(word) },
    { prompt: "Find all words that are symmetrical (e.g., 'level', 'madam')", validator: (word) => word.length > 2 && word === word.split('').reverse().join('') },
];

const generateGrid = (level: number): { grid: string[], task: SearchTask, solution: string[] } => {
    const { mechanic_config, content_config } = policy.levelMap[level] || policy.levelMap[1];
    const gridSize = mechanic_config.grid_size || 9;
    const targetCount = mechanic_config.target_count || 2;
    
    const task = searchTasks[Math.floor(Math.random() * searchTasks.length)];
    const validWords = realWords.filter(task.validator);
    const invalidWords = realWords.filter(w => !task.validator(w));

    let grid: string[] = [];
    let solution: string[] = [];

    // Add targets
    for (let i = 0; i < targetCount; i++) {
        const word = validWords[Math.floor(Math.random() * validWords.length)];
        if (!grid.includes(word)) {
            grid.push(word);
            solution.push(word);
        }
    }

    // Fill with distractors
    while(grid.length < gridSize) {
        const word = invalidWords[Math.floor(Math.random() * invalidWords.length)];
         if (!grid.includes(word)) {
            grid.push(word);
        }
    }
    
    return { grid: grid.sort(() => Math.random() - 0.5), task, solution };
};


export function TypographicSearch({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  const [puzzle, setPuzzle] = useState<{ grid: string[], task: SearchTask, solution: string[] } | null>(null);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID, focus);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [focus, getAdaptiveState]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;
    setPuzzle(generateGrid(loadedLevel));
    setSelectedWords(new Set());
    setInlineFeedback({ message: '', type: '' });
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, [focus]);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial]);

  const handleWordClick = (word: string) => {
    if(gameState !== 'playing') return;
    setSelectedWords(prev => {
        const newSet = new Set(prev);
        if(newSet.has(word)) {
            newSet.delete(word);
        } else {
            newSet.add(word);
        }
        return newSet;
    })
  }

  const handleSubmit = () => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;
    
    // Check if selected words exactly match the solution
    const isCorrect = puzzle.solution.length === selectedWords.size && puzzle.solution.every(word => selectedWords.has(word));

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    setInlineFeedback({ message: isCorrect ? getSuccessFeedback('Gv') : getFailureFeedback('Gv'), type: isCorrect ? 'success' : 'failure' });

    setTimeout(() => {
      currentTrialIndex.current++;
      if (currentTrialIndex.current >= policy.sessionLength) {
        setGameState('finished');
        const finalState = endSession(newState, [...sessionTrials, trialResult]);
        updateAdaptiveState(GAME_ID, finalState);
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
        <div className="flex flex-col items-center gap-4 text-center">
          <CardTitle>Session Complete!</CardTitle>
          <p>Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0)}%</p>
          <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
        </div>
      );
    }
    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;

    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Level: {adaptiveState.currentLevel}</span>
        </div>
        
        <p className="text-center text-lg font-semibold">{puzzle.task.prompt}</p>

        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
            {puzzle.grid.map((word, index) => (
                <Button 
                    key={index} 
                    variant={selectedWords.has(word) ? 'default' : 'outline'}
                    className="h-16 text-xl font-mono"
                    onClick={() => handleWordClick(word)}
                    disabled={gameState === 'feedback'}
                >
                    {word}
                </Button>
            ))}
        </div>
        
        <div className="h-6 text-sm font-semibold">
          {inlineFeedback.message && (
            <p className={cn("animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
              {inlineFeedback.message}
            </p>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={gameState === 'feedback'} size="lg">
            Submit
        </Button>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
            <Search />
            (Gv) Typographic Search
        </CardTitle>
        <CardDescription>Rapidly scan the grid and select all words that match the visual rule.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
