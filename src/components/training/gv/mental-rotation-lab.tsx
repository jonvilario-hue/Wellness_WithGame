
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { View } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";


const shapes = [
  // L-shape
  [[1,0,0], [1,0,0], [1,1,0]],
  // T-shape
  [[1,1,1], [0,1,0], [0,1,0]],
  // S-shape
  [[0,1,1], [1,1,0], [0,0,0]],
  // Plus-shape
  [[0,1,0], [1,1,1], [0,1,0]],
  // Asymmetric U
  [[1,0,1], [1,1,1], [0,0,0]],
  // Skew shape
  [[1,1,0], [0,1,1], [0,0,0]],
  // Z-shape
  [[1,1,0], [0,1,0], [0,1,1]],
  // Complex Asymmetric
  [[1,1,1], [1,0,1], [1,0,0]],
  // Another L-variant
  [[1,1,0], [0,1,0], [0,1,0]],
  // Asymmetric fork
  [[1,0,1], [1,1,1], [0,1,0]],
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

const generatePuzzle = (): Puzzle => {
  const baseShape = shapes[Math.floor(Math.random() * shapes.length)];
  
  // 1. Create the correct answer (a rotated version of the base shape)
  let targetShape = baseShape;
  const rotations = Math.floor(Math.random() * 4); // 0, 1, 2, or 3 rotations
  for (let i = 0; i < rotations; i++) {
    targetShape = rotateGrid(targetShape);
  }

  const options: Grid[] = [targetShape];
  
  // 2. Create a mirror image distractor
  let mirrorImage = flipGridHorizontal(baseShape);
  const mirrorRotations = Math.floor(Math.random() * 4);
  for (let i = 0; i < mirrorRotations; i++) {
    mirrorImage = rotateGrid(mirrorImage);
  }
  // Ensure the mirror image is not identical to the target shape (can happen with symmetrical shapes)
  if (!areGridsEqual(targetShape, mirrorImage)) {
    options.push(mirrorImage);
  }

  // 3. Add other shapes as distractors until we have 4 options
  const availableShapes = shapes.filter(s => !areGridsEqual(s, baseShape));
  while (options.length < 4 && availableShapes.length > 0) {
    const distractorIndex = Math.floor(Math.random() * availableShapes.length);
    let distractor = availableShapes.splice(distractorIndex, 1)[0];
    
    const distractorRotations = Math.floor(Math.random() * 4);
     for (let i = 0; i < distractorRotations; i++) {
        distractor = rotateGrid(distractor);
    }
    
    // Final check for duplicates before adding
    const isDuplicate = options.some(opt => areGridsEqual(opt, distractor));
    if (!isDuplicate) {
        options.push(distractor);
    }
  }
  
  // 4. Shuffle the final options
  options.sort(() => Math.random() - 0.5);
  
  return { baseShape, answer: targetShape, options: options.slice(0, 4) };
};

const ShapeGrid = ({ grid }: { grid: Grid }) => (
  <div className="grid grid-cols-3 gap-1">
    {grid.flat().map((cell, index) => (
      <div 
        key={index} 
        className={cn(
          "w-6 h-6 rounded-sm transition-colors", 
          cell ? 'bg-primary' : 'bg-muted/50'
        )} 
      />
    ))}
  </div>
);

export function MentalRotationLab() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [selectedOption, setSelectedOption] = useState<Grid | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | ''>('');
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const { logGameResult } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  
  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  // This game is explicitly for Gv Core Mode, so it always uses 'neutral'.
  const currentMode = 'neutral';

  const generateNewPuzzle = useCallback(() => {
    setPuzzle(generatePuzzle());
    setPuzzleKey(prev => prev + 1);
    setSelectedOption(null);
    setFeedback('');
    setInlineFeedback({ message: '', type: '' });
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    generateNewPuzzle();
  }, []);

  const handleSelectOption = (option: Grid) => {
    if (feedback || !puzzle) return;
    setSelectedOption(option);
    if (areGridsEqual(option, puzzle.answer)) {
      setFeedback('correct');
      setScore(prev => prev + 1);
      setInlineFeedback({ message: getSuccessFeedback('Gv'), type: 'success' });
    } else {
      setFeedback('incorrect');
      setInlineFeedback({ message: getFailureFeedback('Gv'), type: 'failure' });
    }
  };

  const handleNextPuzzle = () => {
    const time = (Date.now() - startTime) / 1000;
    const puzzleScore = feedback === 'correct' ? 100 : 0;
    logGameResult('Gv', currentMode, { score: puzzleScore, time });
    generateNewPuzzle();
  };
  
  if (!puzzle || !isLoaded) {
    return (
      <Card className="w-full max-w-2xl text-center">
        <CardContent className="flex items-center justify-center h-48">
          <p>Loading puzzle...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
            <View />
            (Gv) Mental Rotation Lab
        </CardTitle>
        <CardDescription>Which of the shapes below is a rotated version of the target shape? Mirrored versions do not count. This strengthens your visual imagination and mental manipulation.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="w-full flex justify-between font-mono">
          <span>Puzzle: {puzzleKey}</span>
          <span>Score: {score}</span>
        </div>
        <div>
          <h3 className="text-center font-semibold mb-2">Target Shape</h3>
          <div className="p-4 bg-muted rounded-lg inline-block">
             <ShapeGrid grid={puzzle.baseShape} />
          </div>
        </div>
        
        <div className="h-6 text-sm font-semibold">
          {inlineFeedback.message && (
            <p className={cn(
              "animate-in fade-in",
              inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600'
            )}>
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
                  selectedOption === option && !feedback ? 'border-primary scale-105 bg-muted' : 'border-transparent hover:border-muted-foreground/50 bg-muted/50',
                  feedback && areGridsEqual(option, puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                  feedback === 'incorrect' && selectedOption === option && 'bg-destructive/20 border-destructive',
                )}
                disabled={!!feedback}
              >
                <ShapeGrid grid={option} />
              </button>
            ))}
          </div>
        </div>

        {feedback && (
          <div className="flex flex-col items-center gap-4 mt-4 text-center animate-in fade-in">
            <Button onClick={handleNextPuzzle}>Next Puzzle</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
