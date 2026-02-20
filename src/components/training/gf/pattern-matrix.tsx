
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { BrainCircuit, Loader2, PieChart } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { morphologyWordPairs } from "@/data/verbal-content";
import { GameStub } from "../game-stub";

const GAME_ID: GameId = 'gf_pattern_matrix';
const policy = difficultyPolicies[GAME_ID];

type GameVariant = 'neutral' | 'math' | 'probability' | 'verbal';

// --- Display Components ---
const ElementComponent = ({ element }: { element: any }) => {
    if (!element) return null;
    if (element.type === 'verbal') {
        return <div className="text-2xl font-semibold text-primary">{element.value}</div>;
    }
    if(element.type === 'probability_sample') {
        return <div className="text-3xl font-bold text-primary">{element.value}%</div>
    }
    if (element.type === 'math') {
      return <div className={cn("text-4xl font-bold text-primary")}>{element.value}</div>;
    }

    // Default Neutral Element
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
};

const neutralShapes = ['circle', 'square', 'triangle', 'diamond'];
const neutralColors = ['bg-primary', 'bg-accent', 'bg-chart-3', 'bg-chart-4'];
const neutralRotations = [0, 90, 180, 270];
const neutralFills = ['fill', 'outline'];

const getNextInSequence = <T,>(val: T, collection: T[]) => {
  const currentIndex = collection.indexOf(val);
  return collection[(currentIndex + 1) % collection.length];
};

const generatePuzzleForLevel = (level: number, focus: TrainingFocus) => {
    const levelDef = policy.levelMap[level] || policy.levelMap[20];
    const { mechanic_config, content_config } = levelDef;
    const size = mechanic_config.gridSize === "3x3" ? 3 : 2;
    
    const focusConfig = content_config[focus];
    if (!focusConfig || !focusConfig.params) return generatePuzzleForLevel(level, 'neutral');

    const { sub_variant, params } = focusConfig;

    if (sub_variant === 'probabilistic') {
        const populationRatio = Math.random() * 0.4 + 0.3; // 30-70%
        const population = Array(params.populationSize).fill(0).map((_, i) => i < params.populationSize * populationRatio);
        
        const samples = Array(params.samples).fill(0).map(() => {
            const sampleIndex = Math.floor(Math.random() * population.length);
            return population[sampleIndex];
        });
        const sampleRatio = samples.filter(Boolean).length / samples.length;

        const options = new Set<number>([Math.round(populationRatio * 100)]);
        while (options.size < 4) {
            const noise = (Math.random() - 0.5) * (params.noise * 2 || 0.4);
            options.add(Math.round(Math.max(0, Math.min(100, (populationRatio + noise) * 100))));
        }
        
        return {
            type: 'probability',
            grid: [{ type: 'probability_sample', value: Math.round(sampleRatio * 100) }],
            options: Array.from(options).sort((a,b) => a-b).map(o => ({type: 'probability_sample', value: o})),
            answer: { type: 'probability_sample', value: Math.round(populationRatio*100) },
            size: 1,
        };
    }
    
    const grid: any[] = Array(size * size).fill(null);
    const missingIndex = Math.floor(Math.random() * (size * size));
    
    if (sub_variant === 'morphological_analogy') {
        const rule = params.rule_type as keyof typeof morphologyWordPairs;
        const pair = morphologyWordPairs[rule][0];
        const secondPair = morphologyWordPairs[rule][1];

        grid[0] = { type: 'verbal', value: pair.base };
        grid[1] = { type: 'verbal', value: pair.derived };
        grid[2] = { type: 'verbal', value: secondPair.base };
        grid[3] = { type: 'verbal', value: secondPair.derived };
    }
    else if (focus === 'math') {
        const start = Math.floor(Math.random()*5) + 1;
        const step = Math.floor(Math.random()*3) + 1;
        for(let i = 0; i < size * size; i++) grid[i] = { type: 'math', value: start + i * step };
    } else { // neutral
        const ruleTypes = (params.rule as string).split('+');
        const baseElement = { type: 'neutral', shape: neutralShapes[0], color: neutralColors[0], rotation: 0, fill: 'fill' };
        const elementSet = { shape: neutralShapes, color: neutralColors, rotation: neutralRotations, fill: neutralFills };

        for (let i = 0; i < size * size; i++) {
            const row = Math.floor(i / size);
            const col = i % size;
            let newElement: any = { ...baseElement };
            for (const rule of ruleTypes) {
                if (rule in newElement) {
                    newElement[rule] = Array(col).fill(0).reduce(p => getNextInSequence(p, elementSet[rule as keyof typeof elementSet]), newElement[rule]);
                }
            }
            grid[i] = newElement;
        }
    }

    const answer = grid[missingIndex]!;
    const options: any[] = [answer];
    while (options.length < 6) {
        let tempDecoy: any = { ...answer };
        if(focus === 'math') {
            tempDecoy.value += (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random()*3)+1);
        } else if (focus === 'verbal') {
            const otherWords = Object.values(morphologyWordPairs).flat().map(p => [p.base, p.derived]).flat();
            let randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
            while(randomWord === answer.value) {
                randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
            }
            tempDecoy.value = randomWord;
        } else {
             const changeProp = Object.keys(tempDecoy)[Math.floor(Math.random() * Object.keys(tempDecoy).length)];
             if(typeof tempDecoy[changeProp] !== 'string' || changeProp === 'type') continue;
             const propOptions = {shape: neutralShapes, color: neutralColors, rotation: neutralRotations, fill: neutralFills}[changeProp as 'shape' | 'color' | 'rotation' | 'fill'];
             if(propOptions) tempDecoy[changeProp] = getNextInSequence(tempDecoy[changeProp], propOptions as any);
        }
        if (!options.some(o => JSON.stringify(o) === JSON.stringify(tempDecoy))) {
            options.push(tempDecoy);
        }
    }
    
    options.sort(() => Math.random() - 0.5);
    grid[missingIndex] = null;
    return { type: focus, grid, missingIndex, answer, options, size };
};

export function PatternMatrix() {
    const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

    const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
    const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
    
    const [puzzle, setPuzzle] = useState<any | null>(null);
    const [selectedOption, setSelectedOption] = useState<any | null>(null);
    const [feedback, setFeedback] = useState('');

    const trialStartTime = useRef(0);
    const currentTrialIndex = useRef(0);

    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

    useEffect(() => {
        if (isComponentLoaded) {
            const initialState = getAdaptiveState(GAME_ID);
            setAdaptiveState(initialState);
            setGameState('start');
        }
    }, [isComponentLoaded, currentMode, getAdaptiveState]);

    const startNewTrial = useCallback((state: AdaptiveState) => {
        const onRamp = state.uncertainty > 0.7;
        const loadedLevel = onRamp
          ? Math.max(state.levelFloor, state.currentLevel - 2)
          : state.currentLevel;
        
        setPuzzle(generatePuzzleForLevel(loadedLevel, currentMode));
        setSelectedOption(null);
        setFeedback('');
        setGameState('playing');
        trialStartTime.current = Date.now();
    }, [currentMode]);

    const startNewSession = useCallback(() => {
        if (!adaptiveState) return;
        const sessionState = startSession(adaptiveState);
        setAdaptiveState(sessionState);
        setSessionTrials([]);
        currentTrialIndex.current = 0;
        startNewTrial(sessionState);
    }, [adaptiveState, startNewTrial]);

    const handleSelectOption = (option: any) => {
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
                updateAdaptiveState(finalState);
            } else {
                startNewTrial(newState);
            }
        }, 2000);
    };

    if (currentMode === 'spatial') {
        return <GameStub 
            name="Assembly Logic" 
            description="Deduce the assembly rule from a 3x3 grid showing a sequence of 3D parts being assembled. Then, select the correct final object for the empty slot."
            chcFactor="Fluid Reasoning (Gf) / Assembly"
            techStack={['CSS 3D Transforms', 'Three.js']}
            complexity="High"
            fallbackPlan="Use animated SVGs. The assembly sequence is shown as 2D shapes merging and transforming, preserving the rule-inference mechanic without real-time 3D."
        />;
    }

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
                const gridClass = puzzle.size === 3 ? "grid-cols-3" : (puzzle.size === 2 ? "grid-cols-2" : "grid-cols-1");

                if (puzzle.type === 'probability') {
                    return (
                        <div className="flex flex-col items-center gap-6 w-full">
                            <div className="flex justify-between w-full font-mono text-sm">
                                <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                                <span>Level: {adaptiveState?.currentLevel}</span>
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground mb-2">A sample was drawn from a hidden population.</p>
                                <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
                                    <PieChart className="w-10 h-10 text-primary" />
                                    <p className="text-3xl font-bold">Sample has {puzzle.grid[0].value}% blue items.</p>
                                </div>
                                <p className="text-muted-foreground mt-4">Which population was it most likely drawn from?</p>
                            </div>
                            <div className="h-6 text-sm font-semibold mb-2 text-center">
                                {feedback && (
                                    <p className={cn("animate-in fade-in", feedback.includes('Incorrect') ? 'text-amber-600' : 'text-green-600')}>{feedback}</p>
                                )}
                            </div>
                             <div className="grid grid-cols-4 gap-3">
                                {puzzle.options.map((option: any, index: number) => (
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
                    )
                }

                return (
                    <div className="flex flex-col items-center gap-6 w-full">
                         <div className="flex justify-between w-full font-mono text-sm">
                            <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                            <span>Level: {adaptiveState?.currentLevel}</span>
                        </div>
                        <div className={cn("grid gap-2 p-3 bg-muted rounded-lg", gridClass)}>
                        {puzzle.grid.map((cell: any, index: number) => (
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
                            <div className={cn("grid gap-3", puzzle.type === 'verbal' ? 'grid-cols-2' : 'grid-cols-3')}>
                                {puzzle.options.map((option: any, index: number) => (
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
