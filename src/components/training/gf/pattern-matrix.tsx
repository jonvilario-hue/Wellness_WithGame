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
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { TrialResult, GameId } from "@/types";
import { GameStub } from "../game-stub";
import { RuleInductionEngine } from '../logic/rule-induction-engine';
import { domainIcons } from "@/components/icons";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { generateAnalogyProblem } from "@/lib/verbal-stimulus-factory";


const GAME_ID: GameId = 'gf_pattern_matrix';
const policy = difficultyPolicies[GAME_ID];

type GameVariant = 'neutral' | 'math' | 'probability' | 'verbal' | 'music';

// --- Display Components ---
const ElementComponent = ({ element }: { element: any }) => {
    if (!element) return null;
    if (element.type === 'verbal') {
        return <div className="text-2xl font-semibold text-blue-300">{element.value}</div>;
    }
    if(element.type === 'probability_sample') {
        return <div className="text-3xl font-bold text-blue-300">{element.value}%</div>
    }
    if (element.type === 'math') {
      return <div className={cn("text-4xl font-bold text-blue-300")}>{element.value}</div>;
    }
     if (element.type === 'music') {
        return <div className="text-3xl font-bold text-blue-300">♪</div>
    }

    // Default Neutral Element
    const { shape, color, rotation, fill } = element;
    const baseClasses = "w-10 h-10 transition-all";
    const style = { transform: `rotate(${rotation}deg)` };
    
    const colorMap: Record<string, string> = {
        'bg-primary': 'bg-blue-400',
        'bg-accent': 'bg-cyan-400',
        'bg-chart-3': 'bg-slate-400',
        'bg-chart-4': 'bg-blue-300',
    };
    const mappedColor = colorMap[color] || 'bg-blue-400';
    const outlineClasses = `bg-transparent border-4 ${mappedColor.replace('bg-','border-')}`;

    if (shape === 'circle') return <div className={cn(baseClasses, "rounded-full", fill === 'fill' ? mappedColor : outlineClasses)} style={style} />;
    if (shape === 'square') return <div className={cn(baseClasses, "rounded-md", fill === 'fill' ? mappedColor : outlineClasses)} style={style} />;
    if (shape === 'triangle') {
        if (fill === 'fill') {
            const triangleColorClass = mappedColor.replace('bg-', 'border-b-');
            const triangleStyle = { ...style, width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottomWidth: '40px', borderBottomStyle: 'solid' };
            return <div style={triangleStyle} className={cn("!bg-transparent", triangleColorClass, 'h-auto w-auto')} />;
        }
        return <div className="w-10 h-10" style={style}> <svg viewBox="0 0 100 100" className={`fill-transparent ${mappedColor.replace('bg-', 'stroke-')}`} strokeWidth="10"><polygon points="50,10 90,90 10,90" /></svg></div>
    }
    if (shape === 'diamond') return <div className={cn(baseClasses, "transform rotate-45 rounded-sm", fill === 'fill' ? mappedColor : outlineClasses)} style={{ transform: `rotate(${rotation + 45}deg)` }}/>;
    return <div className={cn(baseClasses, mappedColor)} />;
};

const neutralShapes = ['circle', 'square', 'triangle', 'diamond'];
const neutralColors = ['bg-primary', 'bg-accent', 'bg-chart-3', 'bg-chart-4'];
const neutralRotations = [0, 90, 180, 270];
const neutralFills = ['fill', 'outline'];

const getNextInSequence = <T,>(val: T, collection: T[]) => {
  const currentIndex = collection.indexOf(val);
  return collection[(currentIndex + 1) % collection.length];
};

const generatePuzzleForLevel = (level: number, focus: GameVariant) => {
    const levelDef = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const { mechanic_config, content_config } = levelDef;
    const size = mechanic_config.gridSize === "3x3" ? 3 : 2;
    
    if (focus === 'verbal') {
        return generateAnalogyProblem(level);
    }

    const focusConfig = content_config[focus];
    if (!focusConfig || !focusConfig.params) return generatePuzzleForLevel(level, 'neutral');

    const { sub_variant, params } = focusConfig;
    
     if (sub_variant === 'melodic_pattern') {
        const baseNote = 60; // C4
        const interval = params.complexity === 1 ? 2 : 4; // Major 2nd or Major 3rd
        const grid: any[] = Array(size * size).fill(null).map((_, i) => ({ type: 'music', notes: [baseNote + i * interval] }));
        const missingIndex = Math.floor(Math.random() * (size*size));
        const answer = grid[missingIndex];
        grid[missingIndex] = null;
        
        const options = [answer];
        while (options.length < 4) {
            const decoyNote = answer.notes[0] + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random()*3)+1);
            const decoy = { type: 'music', notes: [decoyNote] };
            if (!options.some(o => JSON.stringify(o) === JSON.stringify(decoy))) {
                options.push(decoy);
            }
        }
        
        return { type: focus, grid, missingIndex, answer, options: options.sort(() => Math.random() - 0.5), size, params };
    }

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
            params,
        };
    }
    
    const grid: any[] = Array(size * size).fill(null);
    const missingIndex = Math.floor(Math.random() * (size * size));
    
    if (focus === 'math') {
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
    return { type: focus, grid, missingIndex, answer, options, size, params };
};

export function PatternMatrix() {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
    const { playSequence, resumeContext, isAudioReady, audioContext } = useAudioEngine();

    const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
    
    const [puzzle, setPuzzle] = useState<any | null>(null);
    const [selectedOption, setSelectedOption] = useState<any | null>(null);
    const [feedback, setFeedback] = useState('');

    const trialStartTime = useRef(0);
    const currentTrialIndex = useRef(0);

    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

    useEffect(() => {
        if (isComponentLoaded) {
            setGameState('start');
        }
    }, [isComponentLoaded]);

    const startNewTrial = useCallback(() => {
        const state = getAdaptiveState(GAME_ID, currentMode);
        const onRamp = state.uncertainty > 0.7;
        const loadedLevel = onRamp
          ? Math.max(state.levelFloor, state.currentLevel - 2)
          : state.currentLevel;
        
        const newPuzzle = generatePuzzleForLevel(loadedLevel, currentMode as GameVariant);
        setPuzzle(newPuzzle);
        setSelectedOption(null);
        setFeedback('');
        setGameState('playing');
        if (audioContext) trialStartTime.current = audioContext.currentTime;
    }, [currentMode, getAdaptiveState, audioContext]);
    
     useEffect(() => {
        if (gameState === 'playing' && puzzle && puzzle.type === 'music') {
            const allNotes = puzzle.grid.filter(Boolean).map((p: any) => p.notes[0]);
            playSequence(allNotes, 0.3);
        }
    }, [gameState, puzzle, playSequence]);

    const startNewSession = useCallback(() => {
        if(currentMode === 'music') resumeContext();
        const sessionState = startSession(getAdaptiveState(GAME_ID, currentMode));
        updateAdaptiveState(GAME_ID, currentMode, sessionState);
        currentTrialIndex.current = 0;
        startNewTrial();
    }, [startNewTrial, resumeContext, updateAdaptiveState, currentMode, getAdaptiveState]);

    const handleSelectOption = (option: any) => {
        if (gameState !== 'playing' || !puzzle || !audioContext) return;

        setGameState('feedback');
        const currentState = getAdaptiveState(GAME_ID, currentMode);
        const levelPlayed = currentState.currentLevel;
        const reactionTimeMs = (audioContext.currentTime - trialStartTime.current) * 1000;
        const isCorrect = JSON.stringify(option) === JSON.stringify(puzzle.answer);
        
        setSelectedOption(option);
        
        const trialResult: TrialResult = { 
            correct: isCorrect, 
            reactionTimeMs,
            telemetry: {
                patternLength: puzzle.grid.length,
                ruleType: puzzle.params?.rule,
                ruleShifts: puzzle.params?.ruleShifts || 0,
                selectedAnswer: option,
                correctAnswer: puzzle.answer,
                dimsUsed: puzzle.type,
                stimulusNotes: puzzle.type === 'music' ? puzzle.grid.map((c: any) => c?.notes?.[0]) : [],
            }
        };

        logTrial({
            module_id: GAME_ID,
            mode: currentMode,
            levelPlayed,
            isCorrect,
            responseTime_ms: reactionTimeMs,
            meta: trialResult.telemetry
        });
        
        const newState = adjustDifficulty(trialResult, currentState, policy);
        updateAdaptiveState(GAME_ID, currentMode, newState);

        setFeedback(isCorrect ? getSuccessFeedback('Gf') : getFailureFeedback('Gf'));

        setTimeout(() => {
            currentTrialIndex.current++;
            if (currentTrialIndex.current >= policy.sessionLength) {
                setGameState('finished');
            } else {
                startNewTrial();
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

    if (currentMode === 'logic') {
        return <RuleInductionEngine />;
    }

    if (currentMode === 'eq') {
         return <GameStub 
            name="Social Rule Induction" 
            description="A 2x2 grid showing social interactions. Example: [Happy Face + Gift -> Thank You] ; [Sad Face + Spilled Drink -> Apology]. User must infer the 'emotional grammar' rule."
            chcFactor="Fluid Reasoning (Gf) / Social Cognition"
            techStack={['SVG Icons']}
            complexity="Medium"
            fallbackPlan="N/A"
        />;
    }

    const renderContent = () => {
         if (!isComponentLoaded) {
            return <Loader2 className="h-12 w-12 animate-spin text-blue-400" />;
        }
         switch (gameState) {
            case 'loading':
                return <Loader2 className="h-12 w-12 animate-spin text-blue-400" />;
            case 'start':
                const state = getAdaptiveState(GAME_ID, currentMode);
                if (currentMode === 'music' && !isAudioReady) {
                    return (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <p className="text-muted-foreground">Audio required for this mode.</p>
                            <Button onClick={startNewSession} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Tap to Enable Audio & Start</Button>
                        </div>
                    )
                }
                return (
                    <div className="flex flex-col items-center gap-4">
                        <div className="font-mono text-lg text-blue-300">Level: {state?.currentLevel}</div>
                        <Button onClick={startNewSession} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Pattern Matrix</Button>
                    </div>
                );
            case 'finished':
                return (
                    <div className="flex flex-col items-center gap-4">
                        <CardTitle>Session Complete!</CardTitle>
                        <p>Your performance has been logged.</p>
                        <Button onClick={() => setGameState('start')} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Play Again</Button>
                    </div>
                );
            case 'playing':
            case 'feedback':
                if (!puzzle) return <Loader2 className="animate-spin text-blue-400"/>;
                const gridClass = puzzle.size === 3 ? "grid-cols-3" : (puzzle.size === 2 ? "grid-cols-2" : "grid-cols-1");

                if (puzzle.type === 'probability') {
                    return (
                        <div className="flex flex-col items-center gap-6 w-full">
                            <div className="flex justify-between w-full font-mono text-sm text-blue-200">
                                <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                                <span>Level: {getAdaptiveState(GAME_ID, currentMode)?.currentLevel}</span>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-300 mb-2">A sample was drawn from a hidden population.</p>
                                <div className="flex items-center justify-center gap-4 p-4 bg-slate-700 rounded-lg">
                                    <PieChart className="w-10 h-10 text-blue-400" />
                                    <p className="text-3xl font-bold">Sample has {puzzle.grid[0].value}% blue items.</p>
                                </div>
                                <p className="text-slate-300 mt-4">Which population was it most likely drawn from?</p>
                            </div>
                            <div className="h-6 text-sm font-semibold mb-2 text-center">
                                {feedback && (
                                    <p className={cn("animate-in fade-in", feedback.includes('Incorrect') ? 'text-red-400' : 'text-green-400')}>{feedback}</p>
                                )}
                            </div>
                             <div className="grid grid-cols-4 gap-3">
                                {puzzle.options.map((option: any, index: number) => (
                                <button 
                                    key={index} 
                                    onClick={() => handleSelectOption(option)}
                                    className={cn(
                                    "h-24 bg-slate-700/50 rounded-lg flex items-center justify-center transition-all border-2",
                                    selectedOption === option && gameState !== 'feedback' ? 'border-blue-400 scale-105' : 'border-transparent hover:border-slate-500/50',
                                    gameState === 'feedback' && JSON.stringify(option) === JSON.stringify(puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                                    gameState === 'feedback' && selectedOption === option && JSON.stringify(option) !== JSON.stringify(puzzle.answer) && 'bg-red-500/20 border-red-500',
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
                         <div className="flex justify-between w-full font-mono text-sm text-blue-200">
                            <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                            <span>Level: {getAdaptiveState(GAME_ID, currentMode)?.currentLevel}</span>
                        </div>
                        <div className={cn("grid gap-2 p-3 bg-slate-700/50 rounded-lg", gridClass)}>
                        {puzzle.grid.map((cell: any, index: number) => (
                            <div key={index} className="w-20 h-20 bg-slate-800 rounded-md flex items-center justify-center">
                            {index === puzzle.missingIndex ? (
                                selectedOption ? <ElementComponent element={selectedOption} /> : <span className="text-4xl font-bold text-blue-400">?</span>
                            ) : (
                                cell && <ElementComponent element={cell} />
                            )}
                            </div>
                        ))}
                        </div>
                        <div className="w-full">
                            <h3 className="text-center text-sm text-slate-300 font-semibold mb-2">Choose the correct piece:</h3>
                            <div className="h-6 text-sm font-semibold mb-2 text-center">
                                {feedback && (
                                    <p className={cn("animate-in fade-in", feedback.includes('Incorrect') ? 'text-red-400' : 'text-green-400')}>{feedback}</p>
                                )}
                            </div>
                            <div className={cn("grid gap-3", puzzle.type === 'verbal' || puzzle.type === 'music' ? 'grid-cols-2' : 'grid-cols-3')}>
                                {puzzle.options.map((option: any, index: number) => (
                                <button 
                                    key={index} 
                                    onClick={() => handleSelectOption(option)}
                                    className={cn(
                                    "h-24 bg-slate-700/50 rounded-lg flex items-center justify-center transition-all border-2",
                                    selectedOption === option && gameState !== 'feedback' ? 'border-blue-400 scale-105' : 'border-transparent hover:border-slate-500/50',
                                    gameState === 'feedback' && JSON.stringify(option) === JSON.stringify(puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                                    gameState === 'feedback' && selectedOption === option && JSON.stringify(option) !== JSON.stringify(puzzle.answer) && 'bg-red-500/20 border-red-500',
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
    <Card className="w-full max-w-md bg-slate-800 border-blue-500/30 text-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-blue-300">
            <span className="p-2 bg-blue-500/10 rounded-md"><domainIcons.Gf className="w-6 h-6 text-blue-400" /></span>
            Pattern Matrix
        </CardTitle>
        <CardDescription className="text-center text-blue-300/70">Identify the logical rule and find the missing piece. Wired headphones recommended for best results.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
