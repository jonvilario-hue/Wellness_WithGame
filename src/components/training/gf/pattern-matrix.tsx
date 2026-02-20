
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { BrainCircuit, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";

const GAME_ID: GameId = 'gf_pattern_matrix';
const policy = difficultyPolicies[GAME_ID];

// --- Stimulus Generation ---
const neutralShapes = ['circle', 'square', 'triangle', 'diamond'];
const neutralColors = ['bg-primary', 'bg-accent', 'bg-chart-3', 'bg-chart-4'];
const neutralRotations = [0, 90, 180, 270];
const neutralFills = ['fill', 'outline'];
type NeutralElement = { type: 'neutral', shape: string; color: string; rotation: number; fill: 'fill' | 'outline' };

const mathSymbols = ['∑', 'π', '∞', '≠', '∫', '∂'];
const mathColors = ['text-chart-1', 'text-chart-2', 'text-chart-3', 'text-chart-4'];
type MathElement = { type: 'math', symbol: string; color: string; size: number };

const musicSymbols = ['♩', '♪', '♫', '♭', '♯', '♮'];
const musicPositions = ['-translate-y-2', 'translate-y-0', 'translate-y-2', 'translate-y-4'];
type MusicElement = { type: 'music', symbol: string; position: string; duration: number }; // duration as 1,2,4

type PuzzleElement = NeutralElement | MathElement | MusicElement;
type Puzzle = { grid: (PuzzleElement | null)[]; missingIndex: number; answer: PuzzleElement; options: PuzzleElement[]; size: number };

const getNextInSequence = <T,>(val: T, collection: T[]) => {
  const currentIndex = collection.indexOf(val);
  return collection[(currentIndex + 1) % collection.length];
};

const generatePuzzleForLevel = (level: number, focus: TrainingFocus): Puzzle => {
    const params = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const size = params.gridSize === "3x3" ? 3 : 2;
    const grid: (PuzzleElement | null)[] = Array(size * size).fill(null);
    const missingIndex = Math.floor(Math.random() * (size * size));
    const ruleTypes = (params.ruleType as string).split('+');
    let baseElement: PuzzleElement;
    let elementSet: any;

    if (focus === 'math') {
        baseElement = { type: 'math', symbol: mathSymbols[0], color: mathColors[0], size: 1 };
        elementSet = { symbol: mathSymbols, color: mathColors, size: [1, 1.2, 1.4, 1.6] };
    } else if (focus === 'music') {
        baseElement = { type: 'music', symbol: musicSymbols[0], position: musicPositions[0], duration: 1 };
        elementSet = { symbol: musicSymbols, position: musicPositions, duration: [1, 2, 4] };
    } else { // Neutral
        baseElement = { type: 'neutral', shape: neutralShapes[0], color: neutralColors[0], rotation: 0, fill: 'fill' };
        elementSet = { shape: neutralShapes, color: neutralColors, rotation: neutralRotations, fill: neutralFills };
    }

    for (let i = 0; i < size * size; i++) {
        const row = Math.floor(i / size);
        const col = i % size;
        let newElement: any = { ...baseElement };

        for (const rule of ruleTypes) {
            if (rule in newElement) {
                newElement[rule] = Array(col).fill(0).reduce(p => getNextInSequence(p, elementSet[rule]), newElement[rule]);
            }
        }
        grid[i] = newElement;
    }

    const answer = grid[missingIndex]!;
    const options: PuzzleElement[] = [answer];

    while (options.length < 6) {
        let tempDecoy: any = { ...answer };
        const changeProp = Object.keys(elementSet)[Math.floor(Math.random() * Object.keys(elementSet).length)];
        tempDecoy[changeProp] = getNextInSequence(tempDecoy[changeProp], elementSet[changeProp]);
        if (!options.some(o => JSON.stringify(o) === JSON.stringify(tempDecoy))) {
            options.push(tempDecoy);
        }
    }
    
    options.sort(() => Math.random() - 0.5);
    grid[missingIndex] = null;
    return { grid, missingIndex, answer, options, size };
};

// --- Display Components ---
const ElementComponent = ({ element }: { element: PuzzleElement }) => {
  switch (element.type) {
    case 'neutral':
        const { shape, color, rotation, fill } = element;
        const baseClasses = "w-10 h-10 transition-all";
        const style = { transform: `rotate(${rotation}deg)` };
        const outlineClasses = `bg-transparent border-4 ${color.replace('bg-','border-')}`;
        if (shape === 'circle') return <div className={cn(baseClasses, "rounded-full", fill === 'fill' ? color : outlineClasses)} style={style} />;
        if (shape === 'square') return <div className={cn(baseClasses, "rounded-md", fill === 'fill' ? color : outlineClasses)} style={style} />;
        if (shape === 'triangle') {
            if (fill === 'fill') {
                const triangleColorClass = color.replace('bg-', 'border-b-');
                const triangleStyle = { ...style, width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottomWidth: '40px', borderBottomStyle: 'solid' };
                return <div style={triangleStyle} className={cn("!bg-transparent", triangleColorClass, 'h-auto w-auto')} />;
            }
            return <div className="w-10 h-10" style={style}> <svg viewBox="0 0 100 100" className={`fill-transparent ${color.replace('bg-', 'stroke-')}`} strokeWidth="10"><polygon points="50,10 90,90 10,90" /></svg></div>
        }
        if (shape === 'diamond') return <div className={cn(baseClasses, "transform rotate-45 rounded-sm", fill === 'fill' ? color : outlineClasses)} style={{ transform: `rotate(${rotation + 45}deg)` }}/>;
        return <div className={cn(baseClasses, color)} />;
    case 'math':
      return <div className={cn("text-4xl font-bold", element.color)} style={{ transform: `scale(${element.size})` }}>{element.symbol}</div>;
    case 'music':
      return <div className={cn("text-4xl font-bold text-primary", element.position)}>{element.symbol}</div>;
    default:
      return null;
  }
};

export function PatternMatrix() {
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [selectedOption, setSelectedOption] = useState<PuzzleElement | null>(null);
    const [feedback, setFeedback] = useState('');

    const trialStartTime = useRef(0);
    const currentTrialIndex = useRef(0);

    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

    useEffect(() => {
        if (isComponentLoaded) {
            const initialState = getAdaptiveState(GAME_ID, currentMode);
            setAdaptiveState(initialState);
            setGameState('start');
        }
    }, [isComponentLoaded, currentMode, getAdaptiveState]);

    const startNewSession = useCallback(() => {
        if (!adaptiveState) return;
        const sessionState = startSession(adaptiveState);
        setAdaptiveState(sessionState);
        setSessionTrials([]);
        currentTrialIndex.current = 0;
        startNewTrial(sessionState);
    }, [adaptiveState, startNewTrial]);

    const startNewTrial = useCallback((state: AdaptiveState) => {
        setPuzzle(generatePuzzleForLevel(state.currentLevel, currentMode));
        setSelectedOption(null);
        setFeedback('');
        setGameState('playing');
        trialStartTime.current = Date.now();
    }, [currentMode]);

    const handleSelectOption = (option: PuzzleElement) => {
        if (gameState !== 'playing' || !puzzle || !adaptiveState) return;

        setGameState('feedback');
        setSelectedOption(option);
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const isCorrect = JSON.stringify(option) === JSON.stringify(puzzle.answer);
        
        const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
        setSessionTrials(prev => [...prev, trialResult]);
        
        const newState = adjustDifficulty(trialResult, adaptiveState, policy);
        setAdaptiveState(newState);

        setFeedback(isCorrect ? getSuccessFeedback('Gf') : getFailureFeedback('Gf'));

        setTimeout(() => {
            currentTrialIndex.current++;
            if (currentTrialIndex.current >= policy.sessionLength) {
                setGameState('finished');
                const finalState = endSession(newState, [...sessionTrials, trialResult]);
                updateAdaptiveState(GAME_ID, currentMode, finalState);
            } else {
                startNewTrial(newState);
            }
        }, 2000);
    };

    const renderContent = () => {
         switch (gameState) {
            case 'loading':
                return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
            case 'start':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
                        <Button onClick={startNewSession} size="lg" disabled={!adaptiveState}>Start Session</Button>
                    </div>
                );
            case 'finished':
                const finalAccuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
                return (
                    <div className="flex flex-col items-center gap-4">
                        <CardTitle>Session Complete!</CardTitle>
                        <p>Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0) + '%'}</p>
                        <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
                    </div>
                );
            case 'playing':
            case 'feedback':
                if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
                const gridClass = puzzle.size === 3 ? "grid-cols-3" : "grid-cols-2";
                return (
                    <div className="flex flex-col items-center gap-6 w-full">
                         <div className="flex justify-between w-full font-mono text-sm">
                            <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                            <span>Level: {adaptiveState?.currentLevel}</span>
                        </div>
                        <div className={cn("grid gap-2 p-3 bg-muted rounded-lg", gridClass)}>
                        {puzzle.grid.map((cell, index) => (
                            <div key={index} className="w-20 h-20 bg-background/50 rounded-md flex items-center justify-center">
                            {index === puzzle.missingIndex ? (
                                selectedOption ? <ElementComponent element={selectedOption} /> : <span className="text-4xl font-bold text-primary">?</span>
                            ) : (
                                cell && <ElementComponent element={cell} />
                            )}
                            </div>
                        ))}
                        </div>
                        <div className="w-full">
                            <h3 className="text-center text-sm text-muted-foreground font-semibold mb-2">Choose the correct piece:</h3>
                            <div className="h-6 text-sm font-semibold mb-2 text-center">
                                {feedback && (
                                    <p className={cn("animate-in fade-in", feedback.includes('Incorrect') ? 'text-amber-600' : 'text-green-600')}>{feedback}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {puzzle.options.map((option, index) => (
                                <button 
                                    key={index} 
                                    onClick={() => handleSelectOption(option)}
                                    className={cn(
                                    "h-24 bg-muted/50 rounded-lg flex items-center justify-center transition-all border-2",
                                    selectedOption === option && gameState !== 'feedback' ? 'border-primary scale-105' : 'border-transparent hover:border-muted-foreground/50',
                                    gameState === 'feedback' && JSON.stringify(option) === JSON.stringify(puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                                    gameState === 'feedback' && selectedOption === option && JSON.stringify(option) !== JSON.stringify(puzzle.answer) && 'bg-destructive/20 border-destructive',
                                    )}
                                    disabled={gameState === 'feedback'}
                                >
                                    <ElementComponent element={option} />
                                </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
        }
    }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
            <BrainCircuit />
            (Gf) Pattern Matrix
        </CardTitle>
        <CardDescription className="text-center">Identify the logical rule and find the missing piece.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
