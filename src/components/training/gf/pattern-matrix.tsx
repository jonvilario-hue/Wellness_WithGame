
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { BrainCircuit } from "lucide-react";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";

// --- Neutral Mode Components ---
const shapes = ['circle', 'square', 'triangle', 'diamond'];
const colors = ['bg-primary', 'bg-accent', 'bg-chart-3', 'bg-chart-4'];
const rotations = [0, 90, 180, 270];
const fills = ['fill', 'outline'];

// --- Math Mode Components ---
const mathOperators = [
    { name: 'add', op: (a: number, b: number) => a + b, decoyOp: (a: number, b: number) => Math.abs(a - b) },
    { name: 'subtract', op: (a: number, b: number) => Math.abs(a - b), decoyOp: (a: number, b: number) => a + b },
    { name: 'multiply', op: (a: number, b: number) => a * b, decoyOp: (a: number, b: number) => a + b + 1},
    { name: 'max', op: (a: number, b: number) => Math.max(a, b), decoyOp: (a: number, b: number) => Math.min(a,b)},
];

// --- Music Mode Components ---
const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const clefs = ['𝄞', '𝄢']; // Treble, Bass
const rhythmicValues = ['♩', '♪', '𝅗𝅥']; // Quarter, Eighth, Half

// --- Unified Types ---
type NeutralElement = { shape: string; color: string; rotation: number; fill: 'fill' | 'outline' };
type MathElement = { value: number };
type MusicElement = { note: string; clef: string; rhythm: string };
type PuzzleElement = NeutralElement | MathElement | MusicElement;

type Grid = (PuzzleElement | null)[];
type Puzzle = { grid: Grid; missingIndex: number; answer: PuzzleElement; options: PuzzleElement[]; size: number, mode: 'neutral' | 'math' | 'music' };

// --- Helper Functions ---
const getNextInSequence = <T,>(val: T, collection: T[]) => {
  const currentIndex = collection.indexOf(val);
  return collection[(currentIndex + 1) % collection.length];
};

const generateNeutralElement = (): NeutralElement => ({
  shape: shapes[Math.floor(Math.random() * shapes.length)],
  color: colors[Math.floor(Math.random() * colors.length)],
  rotation: rotations[Math.floor(Math.random() * rotations.length)],
  fill: fills[Math.floor(Math.random() * fills.length)] as 'fill' | 'outline',
});
const generateMathElement = (): MathElement => ({ value: Math.floor(Math.random() * 10) + 1 });
const generateMusicElement = (): MusicElement => ({
    note: notes[Math.floor(Math.random() * notes.length)],
    clef: clefs[Math.floor(Math.random() * clefs.length)],
    rhythm: rhythmicValues[Math.floor(Math.random() * rhythmicValues.length)],
});


const generatePuzzle = (mode: 'neutral' | 'math' | 'music'): Puzzle => {
  const size = 3;
  const grid: Grid = Array(size * size).fill(null);
  let missingIndex = Math.floor(Math.random() * (size * size));

  if (mode === 'neutral') {
    const rules: ('row_progression' | 'column_progression')[] = ['row_progression', 'column_progression'];
    const rule = rules[Math.floor(Math.random() * rules.length)];
    const progressionProp: keyof Omit<NeutralElement, 'toString'> = ['shape', 'color', 'rotation', 'fill'][Math.floor(Math.random() * 4)] as any;
    const baseElement = generateNeutralElement();
    
    for (let i = 0; i < size * size; i++) {
      const row = Math.floor(i / size);
      const col = i % size;
      let newElement = { ...baseElement };
      const progressionIndex = rule === 'row_progression' ? col : row;
      
      let currentVal: any = newElement[progressionProp];
      const collection = { shape: shapes, color: colors, rotation: rotations, fill: fills }[progressionProp as keyof typeof collection] as any[];

      for (let j = 0; j < progressionIndex; j++) {
        currentVal = getNextInSequence(currentVal, collection);
      }
      (newElement[progressionProp] as any) = currentVal;
      grid[i] = newElement;
    }
  } else if (mode === 'math') {
    const rules = ['row_op', 'col_op'];
    const rule = rules[Math.floor(Math.random() * rules.length)];
    const { op } = mathOperators[Math.floor(Math.random() * mathOperators.length)];
    
    for (let i = 0; i < size; i++) {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * (a > 1 ? a : 10)) + 1; // ensure subtraction is often positive
      
      const values = [a, b, op(a, b)];
      
      if (rule === 'row_op') {
        grid[i*size] = { value: values[0] };
        grid[i*size + 1] = { value: values[1] };
        grid[i*size + 2] = { value: values[2] };
      } else { // col_op
        grid[i] = { value: values[0] };
        grid[i + size] = { value: values[1] };
        grid[i + 2*size] = { value: values[2] };
      }
    }
    const lastIndices = rule === 'row_op' ? [2, 5, 8] : [6, 7, 8];
    missingIndex = lastIndices[Math.floor(Math.random() * 3)];
  } else { // Music mode
    const rules: ('row_progression' | 'column_progression')[] = ['row_progression', 'column_progression'];
    const rule = rules[Math.floor(Math.random() * rules.length)];
    const progressionProp: keyof MusicElement = ['note', 'clef', 'rhythm'][Math.floor(Math.random() * 3)] as any;
    const baseElement = generateMusicElement();

    for (let i = 0; i < size * size; i++) {
        const row = Math.floor(i / size);
        const col = i % size;
        let newElement = { ...baseElement };
        const progressionIndex = rule === 'row_progression' ? col : row;
        
        let currentVal: any = newElement[progressionProp];
        const collection = { note: notes, clef: clefs, rhythm: rhythmicValues }[progressionProp] as any[];
        
        for (let j = 0; j < progressionIndex; j++) {
            currentVal = getNextInSequence(currentVal, collection);
        }
        (newElement[progressionProp] as any) = currentVal;
        grid[i] = newElement;
    }
  }

  const answer = grid[missingIndex]!;
  const options: PuzzleElement[] = [answer];

  while(options.length < 6) {
    let decoy: PuzzleElement;
    if(mode === 'neutral') {
      const tempDecoy = { ...(answer as NeutralElement) };
      const changeProp = ['shape', 'color', 'rotation', 'fill'][Math.floor(Math.random() * 4)] as keyof NeutralElement;
      const collection = { shape: shapes, color: colors, rotation: rotations, fill: fills }[changeProp as keyof typeof collection] as any[];
      (tempDecoy[changeProp] as any) = getNextInSequence(tempDecoy[changeProp], collection);
      decoy = tempDecoy;
    } else if (mode === 'math') {
        const { decoyOp } = mathOperators[Math.floor(Math.random() * mathOperators.length)];
        const row = Math.floor(missingIndex / size);
        const col = missingIndex % size;
        const isRowRule = col === 2;
        const firstVal = (grid[isRowRule ? row * size : col] as MathElement).value;
        const secondVal = (grid[isRowRule ? row * size + 1 : col + size] as MathElement).value;
        decoy = { value: decoyOp(firstVal, secondVal) };
    } else { // Music mode decoy
        const tempDecoy = { ...(answer as MusicElement) };
        const changeProp = ['note', 'clef', 'rhythm'][Math.floor(Math.random() * 3)] as keyof MusicElement;
        const collection = { note: notes, clef: clefs, rhythm: rhythmicValues }[changeProp] as any[];
        (tempDecoy[changeProp] as any) = getNextInSequence(tempDecoy[changeProp], collection);
        decoy = tempDecoy;
    }
    
    if (!options.some(o => JSON.stringify(o) === JSON.stringify(decoy))) {
      options.push(decoy);
    }
  }
  
  options.sort(() => Math.random() - 0.5);
  grid[missingIndex] = null;
  return { grid, missingIndex, answer, options, size, mode };
};

// --- Display Components ---

const ShapeComponent = ({ shape, color, rotation, fill }: NeutralElement) => {
  const baseClasses = "w-10 h-10 transition-all";
  const style = { transform: `rotate(${rotation}deg)` };
  const outlineClasses = `bg-transparent border-4 ${color.replace('bg-','border-')}`;

  switch (shape) {
    case 'circle': return <div className={cn(baseClasses, "rounded-full", fill === 'fill' ? color : outlineClasses)} style={style} />;
    case 'square': return <div className={cn(baseClasses, "rounded-md", fill === 'fill' ? color : outlineClasses)} style={style} />;
    case 'triangle':
        if (fill === 'fill') {
            const triangleColorClass = color.replace('bg-', 'border-b-');
            const triangleStyle = { ...style, width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottomWidth: '40px', borderBottomStyle: 'solid' };
            return <div style={triangleStyle} className={cn("!bg-transparent", triangleColorClass, 'h-auto w-auto')} />;
        }
        return <div className="w-10 h-10" style={style}> <svg viewBox="0 0 100 100" className={`fill-transparent ${color.replace('bg-', 'stroke-')}`} strokeWidth="10"><polygon points="50,10 90,90 10,90" /></svg></div>
    case 'diamond': return <div className={cn(baseClasses, "transform rotate-45 rounded-sm", fill === 'fill' ? color : outlineClasses)} style={{ transform: `rotate(${rotation + 45}deg)` }}/>;
    default: return <div className={cn(baseClasses, color)} />;
  }
};

const MathComponent = ({ value }: MathElement) => (
    <span className="text-4xl font-bold text-primary font-mono">{value}</span>
);

const MusicComponent = ({ note, clef, rhythm }: MusicElement) => (
    <div className="flex flex-col items-center justify-center h-full">
        <span className="text-2xl font-bold text-primary">{clef}</span>
        <span className="text-3xl font-bold text-primary font-serif">{note}{rhythm}</span>
    </div>
);

const ElementDisplay = ({ element }: { element: PuzzleElement | null }) => {
    if (!element) return null;
    if ('shape' in element) return <ShapeComponent {...element} />;
    if ('value' in element) return <MathComponent {...element} />;
    if ('note' in element) return <MusicComponent {...element} />;
    return null;
};


export function PatternMatrix() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [selectedOption, setSelectedOption] = useState<PuzzleElement | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | ''>('');
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  const { logGameResult } = usePerformanceStore();

  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isLoaded ? (override || globalFocus) : 'neutral';

  const restartGame = useCallback(() => {
    setPuzzle(generatePuzzle(currentMode));
    setPuzzleKey(0);
    setScore(0);
    setSelectedOption(null);
    setFeedback('');
    setInlineFeedback({ message: '', type: '' });
    setStartTime(Date.now());
  }, [currentMode]);

  const handleNextPuzzle = useCallback(() => {
    const puzzleScore = feedback === 'correct' ? 10 : 0;
    const time = (Date.now() - startTime) / 1000;
    logGameResult('Gf', currentMode, { score: puzzleScore, time });
    
    setPuzzle(generatePuzzle(currentMode));
    setPuzzleKey(prevKey => prevKey + 1);
    setSelectedOption(null);
    setFeedback('');
    setInlineFeedback({ message: '', type: '' });
    setStartTime(Date.now());
  }, [feedback, startTime, logGameResult, currentMode]);

  useEffect(() => {
    if (isLoaded) {
      restartGame();
    }
  }, [isLoaded, restartGame]);

  const handleSelectOption = (option: PuzzleElement) => {
    if (feedback || !puzzle) return;
    setSelectedOption(option);
    if (JSON.stringify(option) === JSON.stringify(puzzle.answer)) {
      setFeedback('correct');
      setScore(score + 1);
      setInlineFeedback({ message: getSuccessFeedback('Gf'), type: 'success' });
    } else {
      setFeedback('incorrect');
      setInlineFeedback({ message: getFailureFeedback('Gf'), type: 'failure' });
    }
  };

  if (!puzzle || !isLoaded) {
    return (
      <Card className="w-full max-w-md text-center">
         <CardContent className="flex items-center justify-center h-48">
          <p>Loading puzzle...</p>
        </CardContent>
      </Card>
    );
  }

  const gridClass = "grid-cols-3";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
            <BrainCircuit />
            (Gf) Pattern Matrix
        </CardTitle>
        <CardDescription className="text-center">Identify the logical rule and find the missing piece.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="flex justify-between w-full font-mono text-sm">
            <span>Puzzle: {puzzleKey + 1}</span>
            <span>Score: {score}</span>
        </div>
        <div className={cn("grid gap-2 p-3 bg-muted rounded-lg", gridClass)}>
          {puzzle.grid.map((cell, index) => (
            <div key={index} className="w-20 h-20 bg-background/50 rounded-md flex items-center justify-center">
              {index === puzzle.missingIndex ? (
                 selectedOption ? <ElementDisplay element={selectedOption} /> : <span className="text-4xl font-bold text-primary">?</span>
              ) : (
                <ElementDisplay element={cell} />
              )}
            </div>
          ))}
        </div>

        <div className="w-full">
          <h3 className="text-center text-sm text-muted-foreground font-semibold mb-2">Choose the correct piece:</h3>
          <div className="h-6 text-sm font-semibold mb-2">
            {inlineFeedback.message && (
              <p className={cn(
                "animate-in fade-in text-center",
                inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600'
              )}>
                {inlineFeedback.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {puzzle.options.map((option, index) => (
              <button 
                key={index} 
                onClick={() => handleSelectOption(option)}
                className={cn(
                  "h-24 bg-muted/50 rounded-lg flex items-center justify-center transition-all border-2",
                  selectedOption === option && !feedback ? 'border-primary scale-105' : 'border-transparent hover:border-muted-foreground/50',
                  feedback && JSON.stringify(option) === JSON.stringify(puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                  feedback === 'incorrect' && selectedOption === option && 'bg-destructive/20 border-destructive',
                )}
                disabled={!!feedback}
              >
                <ElementDisplay element={option} />
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
