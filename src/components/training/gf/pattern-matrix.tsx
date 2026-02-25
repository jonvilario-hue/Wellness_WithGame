
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { TrialResult, GameId, AdaptiveState } from "@/types";
import { GameStub } from "../game-stub";
import { RuleInductionEngine } from '../logic/rule-induction-engine';
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { generateAnalogyProblem } from "@/lib/verbal-stimulus-factory";
import { PatternMatrixRenderer } from "./pattern-matrix-renderer";
import { PRNG } from '@/lib/rng';

const GAME_ID: GameId = 'gf_pattern_matrix';
const policy = difficultyPolicies[GAME_ID];

type GameVariant = 'neutral' | 'math' | 'probability' | 'verbal' | 'music';

// --- STIMULUS GENERATION LOGIC ---
const neutralShapes = ['circle', 'square', 'triangle', 'diamond'];
const neutralColors = ['bg-primary', 'bg-accent', 'bg-chart-3', 'bg-chart-4'];
const neutralRotations = [0, 90, 180, 270];
const neutralFills = ['fill', 'outline'];

const getNextInSequence = <T,>(val: T, collection: T[], prng: PRNG): T => {
  const currentIndex = collection.indexOf(val);
  return collection[(currentIndex + 1) % collection.length];
};

const generatePuzzleForLevel = (level: number, focus: GameVariant, prng: PRNG) => {
    const levelDef = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const { mechanic_config, content_config } = levelDef;
    const size = mechanic_config.gridSize === "3x3" ? 3 : 2;
    
    if (focus === 'verbal') {
        return generateAnalogyProblem(level, prng);
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
            setComponentState(prev => ({ ...prev, gameState: 'start' }));
        }
    }, [isComponentLoaded]);

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
            
            const trialResult: TrialResult = { 
                correct: isCorrect, 
                reactionTimeMs,
                telemetry: {
                    patternLength: puzzle.grid.length,
                    ruleType: puzzle.params?.rule,
                    ruleShifts: puzzle.params?.ruleShifts || 0,
                    selectedAnswer: event.option,
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


    if (currentMode === 'spatial') {
        return <GameStub name="Assembly Logic" description="Deduce the assembly rule from a 3x3 grid showing a sequence of 3D parts being assembled. Then, select the correct final object for the empty slot." chcFactor="Fluid Reasoning (Gf) / Assembly" techStack={['CSS 3D Transforms', 'Three.js']} complexity="High" fallbackPlan="Use animated SVGs." />;
    }

    if (currentMode === 'logic') {
        return <RuleInductionEngine />;
    }

    if (currentMode === 'eq') {
         return <GameStub name="Social Rule Induction" description="A 2x2 grid showing social interactions. Example: [Happy Face + Gift -> Thank You] ; [Sad Face + Spilled Drink -> Apology]. User must infer the 'emotional grammar' rule." chcFactor="Fluid Reasoning (Gf) / Social Cognition" techStack={['SVG Icons']} complexity="Medium" fallbackPlan="N/A" />;
    }

    return <PatternMatrixRenderer 
        gameState={componentState}
        feedback={feedback}
        onEvent={handleEvent}
        adaptiveState={adaptiveState}
        currentTrialIndex={currentTrialIndex.current}
        sessionLength={policy.sessionLength}
    />;
}
