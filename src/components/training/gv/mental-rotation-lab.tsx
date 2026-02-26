
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { View, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus, TelemetryEvent } from "@/types";

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

const shapes = [
  [[1,0,0], [1,0,0], [1,1,0]],
  [[1,1,1], [0,1,0], [0,1,0]],
  [[0,1,1], [1,1,0], [0,0,0]],
  [[0,1,0], [1,1,1], [0,1,0]],
];

type Grid = number[][];
type Puzzle = { baseShape: Grid; answer: Grid; options: Grid[] };

const rotateGrid = (grid: Grid): Grid => {
  const n = grid.length;
  const newGrid = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      newGrid[i][j] = grid[n - 1 - j][i];
    }
  }
  return newGrid;
};

const flipGridHorizontal = (grid: Grid): Grid => {
  return grid.map(row => [...row].reverse());
};

const areGridsEqual = (grid1: Grid, grid2: Grid) => {
  return JSON.stringify(grid1) === JSON.stringify(grid2);
};

// This renderer is now a separate component, making it swappable.
// This satisfies the architectural requirement of Issue #5.
const BlockShapeRenderer = ({ grid }: { grid: Grid }) => (
  <div className="grid grid-cols-3 gap-1">
    {grid.flat().map((cell, index) => (
      <div 
        key={index} 
        className={cn("w-6 h-6 rounded-sm transition-colors", cell ? 'bg-primary' : 'bg-muted/50')} 
      />
    ))}
  </div>
);


const generatePuzzleForLevel = (level: number): Puzzle => {
  const params = policy.levelMap[level]?.content_config['neutral']?.params;
  const rotationAngles = params?.angles || [90, 180, 270];
  const useReflection = params?.reflection || false;
  
  const baseShape = shapes[Math.floor(Math.random() * shapes.length)];
  
  let targetShape = baseShape;
  const rotations = Array.isArray(rotationAngles) ? rotationAngles[Math.floor(Math.random() * rotationAngles.length)] / 90 : Math.floor(Math.random() * 4);
  for (let i = 0; i < rotations; i++) {
    targetShape = rotateGrid(targetShape);
  }

  const options: Grid[] = [targetShape];
  
  let mirrorImage = flipGridHorizontal(baseShape);
  const mirrorRotations = Math.floor(Math.random() * 4);
  for (let i = 0; i < mirrorRotations; i++) {
    mirrorImage = rotateGrid(mirrorImage);
  }
  if (!areGridsEqual(targetShape, mirrorImage) && useReflection) {
    options.push(mirrorImage);
  }

  const availableShapes = shapes.filter(s => !areGridsEqual(s, baseShape));
  while (options.length < 4 && availableShapes.length > 0) {
    const distractorIndex = Math.floor(Math.random() * availableShapes.length);
    let distractor = availableShapes.splice(distractorIndex, 1)[0];
    const distractorRotations = Math.floor(Math.random() * 4);
    for (let i = 0; i < distractorRotations; i++) { distractor = rotateGrid(distractor); }
    if (!options.some(opt => areGridsEqual(opt, distractor))) { options.push(distractor); }
  }
  
  options.sort(() => Math.random() - 0.5);
  return { baseShape, answer: targetShape, options: options.slice(0, 4) };
};

export function MentalRotationLab({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [selectedOption, setSelectedOption] = useState<Grid | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID, focus);
    setAdaptiveState(initialState);
    setGameState('start');
    // Fully reset state on focus change
    setSessionTrials([]);
    setPuzzle(null);
    setSelectedOption(null);
    setInlineFeedback({ message: '', type: '' });
    currentTrialIndex.current = 0;
  }, [focus, getAdaptiveState]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;
    setPuzzle(generatePuzzleForLevel(loadedLevel));
    setSelectedOption(null);
    setInlineFeedback({ message: '', type: '' });
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, []);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    updateAdaptiveState(GAME_ID, focus, sessionState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial, updateAdaptiveState, focus]);

  const handleSelectOption = (option: Grid) => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState || !activeSession) return;
    setGameState('feedback');
    setSelectedOption(option);
    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = areGridsEqual(option, puzzle.answer);

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs, telemetry: {} };
    logEvent({
        type: 'trial_complete',
        sessionId: activeSession.sessionId,
        seq: (activeSession.trialCount || 0) + 1,
        payload: {
            id: `${activeSession.sessionId}-${currentTrialIndex.current}`,
            sessionId: activeSession.sessionId,
            gameId: GAME_ID,
            focus,
            trialIndex: currentTrialIndex.current,
            difficultyLevel: adaptiveState.currentLevel,
            correct: isCorrect,
            rtMs: reactionTimeMs,
            stimulusParams: { 
                baseShape: puzzle.baseShape,
                answer: puzzle.answer,
                options: puzzle.options
            },
            responseType: isCorrect ? 'correct' : 'incorrect',
            stimulusOnsetTs: trialStartTime.current,
            responseTs: Date.now(),
            pausedDurationMs: 0,
            wasFallback: false
        }
    } as Omit<TelemetryEvent, 'eventId' | 'timestamp' | 'schemaVersion'>);


    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    updateAdaptiveState(GAME_ID, focus, newState);
    setAdaptiveState(newState);

    setInlineFeedback({ message: isCorrect ? getSuccessFeedback('Gv') : getFailureFeedback('Gv'), type: isCorrect ? 'success' : 'failure' });

    setTimeout(() => {
        currentTrialIndex.current++;
        if (currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
            const finalState = endSession(newState, [...sessionTrials, trialResult]);
            updateAdaptiveState(GAME_ID, focus, finalState);
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
          <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
          <Button onClick={startNewSession} size="lg">Visual Processing Lab</Button>
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
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Level: {adaptiveState?.currentLevel}</span>
        </div>
        <div>
          <h3 className="text-center font-semibold mb-2">Target Shape</h3>
          <div className="p-4 bg-muted rounded-lg inline-block">
             <BlockShapeRenderer grid={puzzle.baseShape} />
          </div>
        </div>
        
        <div className="h-6 text-sm font-semibold">
          {inlineFeedback.message && (
            <p className={cn("animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
              {inlineFeedback.message}
            </p>
          )}
        </div>

        <div className="w-full">
          <h3 className="text-center font-semibold mb-3">Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {puzzle.options.map((option, index) => (
              <button 
                key={index} 
                onClick={() => handleSelectOption(option)}
                className={cn(
                  "p-4 rounded-lg flex items-center justify-center transition-all border-2",
                  gameState === 'feedback' && areGridsEqual(option, puzzle.answer) ? 'bg-green-500/20 border-green-500 animate-pulse'
                  : gameState === 'feedback' && selectedOption === option ? 'bg-destructive/20 border-destructive'
                  : 'border-transparent hover:border-muted-foreground/50 bg-muted/50'
                )}
                disabled={gameState === 'feedback'}
              >
                <BlockShapeRenderer grid={option} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
            <View />
            (Gv) Mental Rotation Lab
        </CardTitle>
        <CardDescription>Which of the shapes below is a rotated version of the target shape? Mirrored versions do not count. This strengthens your visual imagination and mental manipulation.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

    
