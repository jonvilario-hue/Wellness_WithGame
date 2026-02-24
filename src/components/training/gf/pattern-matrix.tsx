
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { TrialResult, GameId } from "@/types";
import { GameStub } from "../game-stub";
import { RuleInductionEngine } from '../logic/rule-induction-engine';
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { generateAnalogyProblem } from "@/lib/verbal-stimulus-factory";
import { PatternMatrixRenderer } from "./pattern-matrix-renderer";

const GAME_ID: GameId = 'gf_pattern_matrix';
const policy = difficultyPolicies[GAME_ID];

type GameVariant = 'neutral' | 'math' | 'probability' | 'verbal' | 'music';

// --- STIMULUS GENERATION LOGIC ---
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
        return generateAnalogyProblem(level, new (require('@/lib/rng').PRNG)(Date.now()));
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
    const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
    const { playSequence, resumeContext, isAudioReady, getAudioContextTime } = useAudioEngine();

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
        trialStartTime.current = Date.now(); // Consistent RT measurement
    }, [currentMode, getAdaptiveState]);
    
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
        if (gameState !== 'playing' || !puzzle) return;

        setGameState('feedback');
        const currentState = getAdaptiveState(GAME_ID, currentMode);
        const levelPlayed = currentState.currentLevel;
        const reactionTimeMs = Date.now() - trialStartTime.current;
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
            }
        };

        if (activeSession) {
             logEvent({
                type: 'trial_complete',
                sessionId: activeSession.sessionId,
                seq: (activeSession.trialCount || 0) + 1,
                payload: {
                    id: `${activeSession.sessionId}-${currentTrialIndex.current}`,
                    sessionId: activeSession.sessionId,
                    gameId: GAME_ID,
                    trialIndex: currentTrialIndex.current,
                    difficultyLevel: levelPlayed,
                    stimulusParams: trialResult.telemetry,
                    stimulusOnsetTs: trialStartTime.current,
                    responseTs: Date.now(),
                    rtMs: reactionTimeMs,
                    correct: isCorrect,
                    responseType: isCorrect ? 'correct' : 'incorrect',
                    pausedDurationMs: 0,
                    wasFallback: false,
                }
            } as any);
        }
        
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

    return <PatternMatrixRenderer 
        gameState={gameState}
        puzzle={puzzle}
        selectedOption={selectedOption}
        feedback={feedback}
        isAudioReady={isAudioReady}
        isComponentLoaded={isComponentLoaded}
        currentMode={currentMode}
        adaptiveState={getAdaptiveState(GAME_ID, currentMode)}
        currentTrialIndex={currentTrialIndex.current}
        sessionLength={policy.sessionLength}
        onStartSession={startNewSession}
        onSelectOption={handleSelectOption}
    />;
}
