

'use client';

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { TrialResult, GameId, AdaptiveState, BaseRendererProps } from "@/types";
import { GameStub } from "../game-stub";
import { RuleInductionEngine } from '../logic/rule-induction-engine';
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { generateAnalogyProblem } from "@/lib/verbal-stimulus-factory";
import { PatternMatrixRenderer } from "./pattern-matrix-renderer";
import { PRNG } from '@/lib/rng';
import { Loader2 } from 'lucide-react';
import type { Color } from '@react-three/fiber';
import { generateEQMatrixPuzzle } from '@/lib/gf-stimulus-factory';
import { generateGfLogicTrial } from '@/lib/gf-logic-stimulus-factory';

const GfSpatialRenderer = lazy(() => import('./GfSpatialRenderer'));
const GfEQRenderer = lazy(() => import('./GfEQRenderer'));
const GfLogicRenderer = lazy(() => import('./GfLogicRenderer'));


const GAME_ID: GameId = 'gf_pattern_matrix';
const policy = difficultyPolicies[GAME_ID];

type GameVariant = 'neutral' | 'math' | 'probability' | 'verbal' | 'music' | 'spatial' | 'eq' | 'logic';

// --- STIMULUS GENERATION LOGIC ---
const neutralShapes = ['circle', 'square', 'triangle', 'diamond'];
const neutralColors = ['bg-primary', 'bg-accent', 'bg-chart-3', 'bg-chart-4'];
const neutralRotations = [0, 90, 180, 270];
const neutralFills = ['fill', 'outline'];

// --- SPATIAL STIMULUS GENERATION ---
export type SpatialObject = {
    shape: 'box' | 'sphere' | 'cone' | 'cylinder';
    color: Color;
    scale: [number, number, number];
    rotation: [number, number, number];
};
const spatialShapes: SpatialObject['shape'][] = ['box', 'sphere', 'cone', 'cylinder'];
const spatialColors: Color[] = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58']; // Google colors

const generateSpatialPuzzleForLevel = (level: number, prng: PRNG) => {
    const levelDef = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const params = levelDef.content_config['spatial']?.params || { attributes: 2, rules: ['additive'] };
    
    const size = 3;
    const grid: (SpatialObject | null)[] = Array(size * size).fill(null);
    const missingIndex = prng.nextIntRange(0, size*size-1);

    const rowRuleAttr = prng.shuffle(['rotation', 'scale'])[0];
    const colRuleAttr = prng.shuffle(['color', 'shape'])[0];

    const baseObject: SpatialObject = {
        shape: prng.shuffle(spatialShapes)[0],
        color: prng.shuffle(spatialColors)[0],
        scale: [1, 1, 1],
        rotation: [0, 0, 0],
    };

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            let newObj = JSON.parse(JSON.stringify(baseObject));
            // Apply column rule (shape or color)
            if (colRuleAttr === 'shape') {
                newObj.shape = spatialShapes[(spatialShapes.indexOf(baseObject.shape) + c) % spatialShapes.length];
            } else { // color
                newObj.color = spatialColors[(spatialColors.indexOf(baseObject.color as string) + c) % spatialColors.length];
            }

            // Apply row rule (rotation or scale)
            if (rowRuleAttr === 'rotation') {
                newObj.rotation = [0, baseObject.rotation[1] + (r * Math.PI / 4), 0];
            } else { // scale
                 newObj.scale = [1, baseObject.scale[1] + r * 0.2, 1];
            }
            grid[r * size + c] = newObj;
        }
    }
    
    const answer = grid[missingIndex]!;
    grid[missingIndex] = null;

    const options: SpatialObject[] = [answer];
     while (options.length < 4) {
        let decoy = JSON.parse(JSON.stringify(answer));
        const changeAttr = prng.shuffle(['shape', 'color', 'rotation', 'scale'])[0];
        if (changeAttr === 'shape') {
            decoy.shape = prng.shuffle(spatialShapes.filter(s => s !== answer.shape))[0];
        } else if (changeAttr === 'color') {
             decoy.color = prng.shuffle(spatialColors.filter(c => c !== answer.color))[0];
        } else if (changeAttr === 'rotation') {
            decoy.rotation = [decoy.rotation[0], decoy.rotation[1] + Math.PI / 2, decoy.rotation[2]];
        } else { // scale
            decoy.scale = [decoy.scale[0], decoy.scale[1] * 1.5, decoy.scale[2]];
        }
        if (!options.some(o => JSON.stringify(o) === JSON.stringify(decoy))) {
            options.push(decoy);
        }
    }

    return {
        type: 'spatial',
        grid,
        missingIndex,
        answer,
        options: prng.shuffle(options),
        size,
        params,
    };
}


const getNextInSequence = <T,>(val: T, collection: T[], prng: PRNG): T => {
  const currentIndex = collection.indexOf(val);
  return collection[(currentIndex + 1) % collection.length];
};

const generatePuzzleForLevel = (level: number, focus: GameVariant, prng: PRNG) => {
    const levelDef = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const { mechanic_config, content_config } = levelDef;
    const size = mechanic_config.gridSize === "3x3" ? 3 : 2;
    
    if (focus === 'spatial') {
        return generateSpatialPuzzleForLevel(level, prng);
    }
    if (focus === 'verbal') {
        return generateAnalogyProblem(level, prng);
    }
     if (focus === 'eq') {
        return generateEQMatrixPuzzle(level, prng);
    }
    if (focus === 'logic') {
        return generateGfLogicTrial(level, prng);
    }

    const focusConfig = content_config[focus];
    if (!focusConfig || !focusConfig.params) return generatePuzzleForLevel(level, 'neutral', prng);

    const { sub_variant, params } = focusConfig;
    
     if (sub_variant === 'melodic_pattern') {
        const baseNote = 60; // C4
        const interval = params.complexity === 1 ? 2 : 4; // Major 2nd or Major 3rd
        const grid: any[] = Array(size * size).fill(null).map((_, i) => ({ type: 'music', notes: [baseNote + i * interval] }));
        const missingIndex = prng.nextIntRange(0, size * size);
        const answer = grid[missingIndex];
        grid[missingIndex] = null;
        
        const options = [answer];
        while (options.length < 4) {
            const decoyNote = answer.notes[0] + (prng.nextFloat() > 0.5 ? 1 : -1) * (prng.nextIntRange(1, 4));
            const decoy = { type: 'music', notes: [decoyNote] };
            if (!options.some(o => JSON.stringify(o) === JSON.stringify(decoy))) {
                options.push(decoy);
            }
        }
        
        return { type: focus, grid, missingIndex, answer, options: prng.shuffle(options), size, params };
    }

    if (sub_variant === 'probabilistic') {
        const populationRatio = prng.nextFloat() * 0.4 + 0.3; // 30-70%
        const population = Array(params.populationSize).fill(0).map((_, i) => i < params.populationSize * populationRatio);
        
        const samples = Array(params.samples).fill(0).map(() => {
            const sampleIndex = prng.nextIntRange(0, population.length);
            return population[sampleIndex];
        });
        const sampleRatio = samples.filter(Boolean).length / samples.length;

        const options = new Set<number>([Math.round(populationRatio * 100)]);
        while (options.size < 4) {
            const noise = (prng.nextFloat() - 0.5) * (params.noise * 2 || 0.4);
            options.add(Math.round(Math.max(0, Math.min(100, (populationRatio + noise) * 100))));
        }
        
        return {
            type: 'probability',
            grid: [{ type: 'probability_sample', value: Math.round(sampleRatio * 100) }],
            options: prng.shuffle(Array.from(options)).map(o => ({type: 'probability_sample', value: o})),
            answer: { type: 'probability_sample', value: Math.round(populationRatio*100) },
            size: 1,
            params,
        };
    }
    
    const grid: any[] = Array(size * size).fill(null);
    const missingIndex = prng.nextIntRange(0, size * size);
    
    if (focus === 'math') {
        const start = prng.nextIntRange(1, 6);
        const step = prng.nextIntRange(1, 4);
        for(let i = 0; i < size * size; i++) grid[i] = { type: 'math', value: start + i * step };
    } else { // neutral
        const ruleTypes = (params.rule as string).split('+');
        const baseElement = { type: 'neutral', shape: neutralShapes[0], color: neutralColors[0], rotation: 0, fill: 'fill' };
        const elementSet = { shape: neutralShapes, color: neutralColors, rotation: neutralRotations, fill: neutralFills };

        for (let i = 0; i < size * size; i++) {
            const col = i % size;
            let newElement: any = { ...baseElement };
            for (const rule of ruleTypes) {
                if (rule in newElement) {
                    newElement[rule] = Array(col).fill(0).reduce(p => getNextInSequence(p, elementSet[rule as keyof typeof elementSet], prng), newElement[rule]);
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
            tempDecoy.value += (prng.nextFloat() > 0.5 ? 1 : -1) * (prng.nextIntRange(1, 4));
        } else {
             const changeProp = Object.keys(tempDecoy)[prng.nextIntRange(0, Object.keys(tempDecoy).length)];
             if(typeof tempDecoy[changeProp] !== 'string' || changeProp === 'type') continue;
             const propOptions = {shape: neutralShapes, color: neutralColors, rotation: neutralRotations, fill: neutralFills}[changeProp as 'shape' | 'color' | 'rotation' | 'fill'];
             if(propOptions) tempDecoy[changeProp] = getNextInSequence(tempDecoy[changeProp], propOptions as any, prng);
        }
        if (!options.some(o => JSON.stringify(o) === JSON.stringify(tempDecoy))) {
            options.push(tempDecoy);
        }
    }
    
    options.sort(() => prng.nextFloat() - 0.5);
    grid[missingIndex] = null;
    return { type: focus, grid, missingIndex, answer, options, size, params };
};

export type PatternMatrixState = {
    gameState: 'loading' | 'start' | 'playing' | 'feedback' | 'finished';
    puzzle: any | null;
    selectedOption: any | null;
}

export type PatternMatrixEvent = 
    | { type: 'START_SESSION' }
    | { type: 'SELECT_OPTION', option: any };

export function PatternMatrix() {
    const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession, startNewGameSession, completeCurrentGameSession } = usePerformanceStore();
    const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
    const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
    const { playSequence, resumeContext, isAudioReady } = useAudioEngine();

    const [componentState, setComponentState] = useState<PatternMatrixState>({
        gameState: 'loading',
        puzzle: null,
        selectedOption: null,
    });
    const [feedback, setFeedback] = useState<{ message: string, type: string } | null>(null);

    const trialStartTime = useRef(0);
    const currentTrialIndex = useRef(0);
    const prngRef = useRef<PRNG>(new PRNG('initial-seed'));

    const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
    const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
    
    const adaptiveState = getAdaptiveState(GAME_ID, currentMode);
    
    useEffect(() => {
        if (isComponentLoaded) {
            // When mode changes, reset the entire game state to avoid rendering with stale data.
            setComponentState({ 
                gameState: 'start',
                puzzle: null,
                selectedOption: null,
            });
        }
    }, [isComponentLoaded, currentMode]);

    const startNewTrial = useCallback(() => {
        const state = getAdaptiveState(GAME_ID, currentMode);
        const onRamp = state.uncertainty > 0.7;
        const loadedLevel = onRamp
          ? Math.max(state.levelFloor, state.currentLevel - 2)
          : state.currentLevel;
        
        const newPuzzle = generatePuzzleForLevel(loadedLevel, currentMode as GameVariant, prngRef.current);
        setComponentState({ gameState: 'playing', puzzle: newPuzzle, selectedOption: null });
        setFeedback(null);
        trialStartTime.current = Date.now();
    }, [currentMode, getAdaptiveState]);
    
     useEffect(() => {
        if (componentState.gameState === 'playing' && componentState.puzzle && componentState.puzzle.type === 'music') {
            const allNotes = componentState.puzzle.grid.filter(Boolean).map((p: any) => p.notes[0]);
            playSequence(allNotes, 0.3);
        }
    }, [componentState.gameState, componentState.puzzle, playSequence]);
    
    const handleEvent = useCallback((event: PatternMatrixEvent) => {
        if (event.type === 'START_SESSION') {
            if (currentMode === 'music') resumeContext();
            
            const seed = crypto.randomUUID();
            prngRef.current = new PRNG(seed);
            
            startNewGameSession({ gameId: GAME_ID, focus: currentMode, prngSeed: seed, buildVersion: 'dev', difficultyConfig: policy });

            currentTrialIndex.current = 0;
            startNewTrial();
        }
        else if (event.type === 'SELECT_OPTION') {
            const { puzzle } = componentState;
            if (componentState.gameState !== 'playing' || !puzzle) return;

            const currentState = getAdaptiveState(GAME_ID, currentMode);
            const levelPlayed = currentState.currentLevel;
            const reactionTimeMs = Date.now() - trialStartTime.current;
            const isCorrect = JSON.stringify(event.option) === JSON.stringify(puzzle.answer);
            
            const telemetry: Record<string, any> = {
                patternLength: puzzle.grid?.length || puzzle.sequence?.length || 0,
                ruleType: puzzle.params?.rule,
                ruleShifts: puzzle.params?.ruleShifts || 0,
                selectedAnswer: event.option,
                correctAnswer: puzzle.answer,
                dimsUsed: puzzle.type,
            };

            if (puzzle.type === 'eq') {
                telemetry.rule_family = puzzle.ruleFamily;
            }

            const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs, telemetry };
            
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

            setComponentState(prev => ({...prev, gameState: 'feedback', selectedOption: event.option}));
            setFeedback({ message: isCorrect ? getSuccessFeedback('Gf') : getFailureFeedback('Gf'), type: isCorrect ? 'success' : 'failure'});

            setTimeout(() => {
                currentTrialIndex.current++;
                if (currentTrialIndex.current >= policy.sessionLength) {
                    setComponentState(prev => ({...prev, gameState: 'finished'}));
                    completeCurrentGameSession();
                } else {
                    startNewTrial();
                }
            }, 2000);
        }
    }, [componentState, getAdaptiveState, activeSession, logEvent, startNewTrial, updateAdaptiveState, currentMode, playSequence, resumeContext, startNewGameSession, completeCurrentGameSession]);

    const renderLoading = () => (
        <div className="w-full max-w-md h-[500px] flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
    
    if (currentMode === 'spatial') {
        return (
            <Suspense fallback={renderLoading()}>
                <GfSpatialRenderer 
                    gameState={componentState}
                    feedback={feedback}
                    onEvent={handleEvent}
                    adaptiveState={adaptiveState}
                    currentTrialIndex={currentTrialIndex.current}
                    sessionLength={policy.sessionLength}
                    focus={currentMode}
                />
            </Suspense>
        );
    }
    
    if (currentMode === 'logic') {
        return (
            <Suspense fallback={renderLoading()}>
                <GfLogicRenderer
                    gameState={componentState}
                    feedback={feedback}
                    onEvent={handleEvent}
                    adaptiveState={adaptiveState}
                    currentTrialIndex={currentTrialIndex.current}
                    sessionLength={policy.sessionLength}
                    focus={currentMode}
                />
            </Suspense>
        );
    }

    if (currentMode === 'eq') {
        return (
             <Suspense fallback={renderLoading()}>
                <GfEQRenderer 
                    gameState={componentState}
                    feedback={feedback}
                    onEvent={handleEvent}
                    adaptiveState={adaptiveState}
                    currentTrialIndex={currentTrialIndex.current}
                    sessionLength={policy.sessionLength}
                    focus={currentMode}
                />
            </Suspense>
        )
    }

    return <PatternMatrixRenderer 
        gameState={componentState}
        feedback={feedback}
        onEvent={handleEvent}
        adaptiveState={adaptiveState}
        currentTrialIndex={currentTrialIndex.current}
        sessionLength={policy.sessionLength}
        focus={currentMode}
    />;
}
