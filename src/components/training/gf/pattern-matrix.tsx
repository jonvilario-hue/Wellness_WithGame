
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from "@/lib/utils";
import { BrainCircuit, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";

const GAME_ID: GameId = 'gf_pattern_matrix';
const policy = difficultyPolicies[GAME_ID];

// --- Generation logic remains largely the same but will be driven by level parameters ---
const shapes = ['circle', 'square', 'triangle', 'diamond'];
const colors = ['bg-primary', 'bg-accent', 'bg-chart-3', 'bg-chart-4'];
const rotations = [0, 90, 180, 270];
const fills = ['fill', 'outline'];

type NeutralElement = { shape: string; color: string; rotation: number; fill: 'fill' | 'outline' };
type Puzzle = { grid: (NeutralElement | null)[]; missingIndex: number; answer: NeutralElement; options: NeutralElement[]; size: number };

const getNextInSequence = <T,>(val: T, collection: T[]) => {
  const currentIndex = collection.indexOf(val);
  return collection[(currentIndex + 1) % collection.length];
};

const generatePuzzleForLevel = (level: number): Puzzle => {
    const params = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const size = params.gridSize === "3x3" ? 3 : 2;
    const grid: (NeutralElement | null)[] = Array(size * size).fill(null);
    const missingIndex = Math.floor(Math.random() * (size * size));

    const ruleTypes = (params.ruleType as string).split('+');
    const baseElement: NeutralElement = {
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: rotations[Math.floor(Math.random() * rotations.length)],
        fill: fills[Math.floor(Math.random() * fills.length)] as 'fill' | 'outline',
    };

    for (let i = 0; i < size * size; i++) {
        const row = Math.floor(i / size);
        const col = i % size;
        let newElement = { ...baseElement };

        if (ruleTypes.includes('shape')) newElement.shape = getNextInSequence(baseElement.shape, Array(col).fill(0).reduce(p => getNextInSequence(p, shapes), baseElement.shape));
        if (ruleTypes.includes('color')) newElement.color = getNextInSequence(baseElement.color, Array(row).fill(0).reduce(p => getNextInSequence(p, colors), baseElement.color));
        if (ruleTypes.includes('rotation')) newElement.rotation = getNextInSequence(baseElement.rotation, Array(col).fill(0).reduce(p => getNextInSequence(p, rotations), baseElement.rotation));
        if (ruleTypes.includes('fill')) newElement.fill = getNextInSequence(baseElement.fill, Array(row % 2).fill(0).reduce(p => getNextInSequence(p, fills as any), baseElement.fill));
        
        grid[i] = newElement;
    }

    const answer = grid[missingIndex]!;
    const options: NeutralElement[] = [answer];

    while (options.length < 6) {
        const tempDecoy = { ...answer };
        const changeProp = ['shape', 'color', 'rotation', 'fill'][Math.floor(Math.random() * 4)] as keyof NeutralElement;
        const collection = { shape: shapes, color: colors, rotation: rotations, fill: fills as any[] }[changeProp as keyof typeof collection] as any[];
        (tempDecoy[changeProp] as any) = getNextInSequence(tempDecoy[changeProp], collection);
        if (!options.some(o => JSON.stringify(o) === JSON.stringify(tempDecoy))) {
            options.push(tempDecoy);
        }
    }
    
    options.sort(() => Math.random() - 0.5);
    grid[missingIndex] = null;
    return { grid, missingIndex, answer, options, size };
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

export function PatternMatrix() {
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
    const [selectedOption, setSelectedOption] = useState<NeutralElement | null>(null);
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
        startNewTrial(sessionState);
    }, [adaptiveState]);

    const startNewTrial = (state: AdaptiveState) => {
        setPuzzle(generatePuzzleForLevel(state.currentLevel));
        setSelectedOption(null);
        setFeedback('');
        setGameState('playing');
        trialStartTime.current = Date.now();
    };

    const handleSelectOption = (option: NeutralElement) => {
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
                updateAdaptiveState(GAME_ID, finalState);
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
                return <Button onClick={startNewSession} size="lg">Start Session</Button>;
            case 'finished':
                const finalAccuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
                return (
                    <div className="flex flex-col items-center gap-4">
                        <CardTitle>Session Complete!</CardTitle>
                        <p>Accuracy: {(finalAccuracy * 100).toFixed(0)}%</p>
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
                                selectedOption ? <ShapeComponent {...selectedOption} /> : <span className="text-4xl font-bold text-primary">?</span>
                            ) : (
                                cell && <ShapeComponent {...cell} />
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
                                    <ShapeComponent {...option} />
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
