'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Puzzle, Loader2, ScanSearch } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { validationWordList } from '@/data/verbal-content';

// AUDIT NOTE: This component is being replaced by `typographic-search.tsx` for the verbal focus
// as its core mechanic was deemed to be a Gc/Glr task, not a Gv task.
// This file is kept to avoid breaking imports but should be considered deprecated for verbal mode.

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

// --- Puzzle Generation ---
type WordSearchPuzzle = {
  grid: string[][];
  targetWord: string;
  answerCoords: {x: number, y: number}[];
};

const generatePuzzleForLevel = (level: number, focus: TrainingFocus): WordSearchPuzzle => {
    const { mechanic_config, content_config } = policy.levelMap[level] || policy.levelMap[1];
    const params = content_config[focus]?.params || content_config['neutral']!.params;
    const gridSize = mechanic_config.gridSize;
    const realWords = Array.from(validationWordList);

    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Select a target word based on length constraints
    let targetWord = realWords[Math.floor(Math.random() * realWords.length)].toUpperCase();
    while (targetWord.length < params.wordLengthMin || targetWord.length > params.wordLengthMax) {
        targetWord = realWords[Math.floor(Math.random() * realWords.length)].toUpperCase();
    }
    
    // Place the target word
    const directions = [[0, 1], [1, 0], [1, 1]]; // Horizontal, Vertical, Diagonal
    if(params.allowReverse) directions.push(...[[0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]]);
    
    const dir = directions[Math.floor(Math.random() * directions.length)];
    let finalCoords: {x: number, y: number}[] = [];
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 50) {
      const startX = Math.floor(Math.random() * gridSize);
      const startY = Math.floor(Math.random() * gridSize);
      const endX = startX + (targetWord.length - 1) * dir[0];
      const endY = startY + (targetWord.length - 1) * dir[1];
      
      if (endX >= 0 && endX < gridSize && endY >= 0 && endY < gridSize) {
        finalCoords = [];
        for (let i = 0; i < targetWord.length; i++) {
            const x = startX + i * dir[0];
            const y = startY + i * dir[1];
            grid[y][x] = targetWord[i];
            finalCoords.push({ x, y });
        }
        placed = true;
      }
      attempts++;
    }

    if (!placed) { // Fallback if random placement fails
        const y = Math.floor(Math.random() * gridSize);
        const x = Math.floor(Math.random() * (gridSize - targetWord.length + 1));
        finalCoords = [];
        for (let i = 0; i < targetWord.length; i++) {
           grid[y][x + i] = targetWord[i];
           finalCoords.push({ x: x + i, y: y });
       }
    }


    // Fill the rest of the grid with random letters
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }

    return { grid, targetWord, answerCoords: finalCoords };
};


export function OrthographicConstruction({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null);
  const [selectedCells, setSelectedCells] = useState<{x: number, y: number}[]>([]);
  const [feedback, setFeedback] = useState('');
  
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
    setPuzzle(generatePuzzleForLevel(loadedLevel, focus));
    setSelectedCells([]);
    setFeedback('');
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

  const handleCellClick = (x: number, y: number) => {
      if (gameState !== 'playing') return;
      setSelectedCells(prev => {
          const isSelected = prev.some(cell => cell.x === x && cell.y === y);
          if(isSelected) {
              return prev.filter(cell => !(cell.x === x && cell.y === y));
          }
          return [...prev, {x, y}];
      });
  }

  const checkAnswer = () => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
    
    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;
    
    const selectedWord = selectedCells.map(c => puzzle.grid[c.y][c.x]).join('');
    const isCorrect = (selectedWord === puzzle.targetWord);

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    setFeedback(isCorrect ? getSuccessFeedback('Gv') : getFailureFeedback('Gv'));

    setTimeout(() => {
      currentTrialIndex.current++;
      if (currentTrialIndex.current >= policy.sessionLength) {
        setGameState('finished');
        const finalState = endSession(newState, [...sessionTrials, trialResult]);
        updateAdaptiveState(finalState);
      } else {
        startNewTrial(newState);
      }
    }, 2000);
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

    const gridSize = puzzle.grid.length;

    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Level: {adaptiveState.currentLevel}</span>
        </div>
        
        <p className="text-center text-muted-foreground font-semibold">Find the word: <span className="text-primary">{puzzle.targetWord}</span></p>

        <div className={cn("grid gap-1 bg-muted/50 p-2 rounded-md", 
            gridSize === 8 ? "grid-cols-8" : 
            gridSize === 10 ? "grid-cols-10" : 
            gridSize === 12 ? "grid-cols-12" : "grid-cols-10"
        )}>
          {puzzle.grid.flat().map((char, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const isSelected = selectedCells.some(c => c.x === x && c.y === y);
            const isAnswer = gameState === 'feedback' && puzzle.answerCoords.some(c => c.x === x && c.y === y);
            return (
                <button 
                    key={index}
                    onClick={() => handleCellClick(x, y)}
                    disabled={gameState === 'feedback'}
                    className={cn("w-8 h-8 flex items-center justify-center font-mono font-bold rounded-sm transition-all",
                        isSelected && "bg-primary text-primary-foreground scale-110",
                        isAnswer && "bg-green-500 text-white",
                        !isSelected && !isAnswer && "hover:bg-primary/20"
                    )}
                >
                    {char}
                </button>
            )
          })}
        </div>
        
        <div className="h-10">
            {gameState === 'playing' ? (
                <Button onClick={checkAnswer}>Submit Word</Button>
            ) : (
                <div className="h-6 text-lg font-semibold">
                    {feedback && (
                        <p className={cn("animate-in fade-in", feedback.includes('Incorrect') ? 'text-amber-600' : 'text-green-600')}>
                        {feedback}
                        </p>
                    )}
                </div>
            )}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
            <ScanSearch />
            (Gv) Orthographic Search
        </CardTitle>
        <CardDescription>Find the hidden word in the grid. This task trains rapid visual scanning and pattern detection on linguistic material.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}