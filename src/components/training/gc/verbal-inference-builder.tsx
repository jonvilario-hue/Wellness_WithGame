'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus, BaseRendererProps, TelemetryEvent } from "@/types";
import { clozeSentences, morphologyWordPairs, spatialConcepts } from "@/data/verbal-content";
import { GameStub } from "../game-stub";
import { RegulationArchitect } from "./regulation-architect";
import { LogicLibrary } from '../logic/logic-library';
import { GcNovelConceptLearner } from "./gc-novel-concept-learner";
import GcMathConcepts from "./gc-math-concepts";
import { GcMusicKnowledge } from "./gc-music-knowledge";
import { Loader2 } from "lucide-react";
import { GcVerbalRenderer } from "./GcVerbalRenderer";
import { generateSpatialConceptMapPuzzle, type GcSpatialPuzzle } from "@/lib/gc-spatial-stimulus-factory";

const GcSpatialRenderer = lazy(() => import('./GcSpatialRenderer'));


const GAME_ID: GameId = 'gc_verbal_inference';
const policy = difficultyPolicies[GAME_ID];

// --- Puzzle Types ---
export type GcVerbalPuzzle = {
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type GcCombinedPuzzle = GcVerbalPuzzle | GcSpatialPuzzle;

export type GcVerbalGameState = {
  gameState: 'loading' | 'start' | 'playing' | 'feedback' | 'finished';
  puzzle: GcCombinedPuzzle | null;
  selectedAnswer: any | null;
}

export type GcVerbalGameEvent = 
  | { type: 'START_SESSION' }
  | { type: 'SUBMIT_ANSWER', answer: any | null };


// --- Puzzle Generation ---
export const generatePuzzleForLevel = (level: number, focus: TrainingFocus): GcCombinedPuzzle => {
    if (focus === 'spatial') {
        return generateSpatialConceptMapPuzzle(level);
    }

    const levelDef = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    let contentConfig = levelDef.content_config[focus];
    
    // If the specific focus isn't defined for this level, fall back to the verbal config for this level
    if (!contentConfig || !contentConfig.params) {
        const puzzleTemplate = {
            question: "Which word is an antonym for 'happy'?",
            options: ["Joyful", "Ecstatic", "Sad"],
            answer: "Sad",
            explanation: "An antonym has the opposite meaning."
        };
         return {
            type: 'cloze_deletion', // give it a default type
            question: puzzleTemplate.question,
            options: [...puzzleTemplate.options, puzzleTemplate.answer].sort(() => Math.random() - 0.5),
            answer: puzzleTemplate.answer,
            explanation: puzzleTemplate.explanation,
        };
    }
    
    const { sub_variant, params } = contentConfig;
    
    let puzzleTemplate;
    if (sub_variant === 'cloze_deletion') {
        const filteredSentences = clozeSentences.filter(p => p.difficulty === params.word_rarity);
        if (filteredSentences.length === 0) {
            puzzleTemplate = clozeSentences[0]; // Safeguard
        } else {
            puzzleTemplate = filteredSentences[Math.floor(Math.random() * filteredSentences.length)];
        }
         return {
            type: sub_variant,
            question: puzzleTemplate.question,
            options: [...puzzleTemplate.options, puzzleTemplate.answer].sort(() => Math.random() - 0.5),
            answer: puzzleTemplate.answer,
            explanation: puzzleTemplate.explanation,
        };
    }
    
    // Fallback for other unhandled sub-variants
    puzzleTemplate = {
        question: "Which word is an antonym for 'happy'?",
        options: ["Joyful", "Ecstatic", "Sad"],
        answer: "Sad",
        explanation: "An antonym has the opposite meaning."
    };
     return {
        type: sub_variant || 'cloze_deletion',
        question: puzzleTemplate.question,
        options: [...puzzleTemplate.options, puzzleTemplate.answer].sort(() => Math.random() - 0.5),
        answer: puzzleTemplate.answer,
        explanation: puzzleTemplate.explanation,
    };
};

export function VerbalInferenceBuilder() {
  const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession, startNewGameSession, completeCurrentGameSession } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  
  const [componentState, setComponentState] = useState<GcVerbalGameState>({
      gameState: 'loading',
      puzzle: null,
      selectedAnswer: null,
  });
  const [feedback, setFeedback] = useState<{ message: string; type: string; } | null>(null);

  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
  
  const adaptiveState = getAdaptiveState(GAME_ID, currentMode);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;
    
    const newPuzzle = generatePuzzleForLevel(loadedLevel, currentMode);
    setComponentState({ gameState: 'playing', puzzle: newPuzzle, selectedAnswer: null });
    setFeedback(null);
    trialStartTime.current = Date.now();
  }, [currentMode]);
  
  const handleEvent = useCallback((event: GcVerbalGameEvent) => {
    if (event.type === 'START_SESSION') {
        const seed = crypto.randomUUID(); // This game does not use a PRNG, but sessions require a seed.
        startNewGameSession({
            gameId: GAME_ID,
            focus: currentMode,
            prngSeed: seed,
            buildVersion: 'dev',
            difficultyConfig: policy,
        });
      const sessionState = startSession(getAdaptiveState(GAME_ID, currentMode));
      updateAdaptiveState(GAME_ID, currentMode, sessionState);
      currentTrialIndex.current = 0;
      startNewTrial(sessionState);
    }
    else if (event.type === 'SUBMIT_ANSWER') {
      const { puzzle } = componentState;
      const state = getAdaptiveState(GAME_ID, currentMode);
      if (componentState.gameState !== 'playing' || !state || !puzzle) return;
      
      if (timerRef.current) clearTimeout(timerRef.current);
      
      const responseTs = Date.now();
      const reactionTimeMs = responseTs - trialStartTime.current;
      const levelPlayed = adaptiveState.currentLevel;
      
      let isCorrect = false;
      if (puzzle.type === 'spatial_concept_map') {
        isCorrect = event.answer?.isCorrect || false;
      } else {
        isCorrect = event.answer === (puzzle as GcVerbalPuzzle).answer;
      }

      const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs, telemetry: { timedOut: event.answer === null } };
      
      if (activeSession) {
          logEvent({
            type: 'trial_complete',
            sessionId: activeSession.sessionId,
            seq: (activeSession.trialCount || 0) + 1,
            payload: {
                id: `${activeSession.sessionId}-${currentTrialIndex.current}`,
                sessionId: activeSession.sessionId,
                gameId: GAME_ID,
                focus: currentMode,
                trialIndex: currentTrialIndex.current,
                difficultyLevel: levelPlayed,
                correct: isCorrect,
                rtMs: reactionTimeMs,
                stimulusParams: { puzzleType: puzzle.type },
                responseType: isCorrect ? 'correct' : 'incorrect',
                stimulusOnsetTs: trialStartTime.current,
                responseTs,
                pausedDurationMs: 0,
                wasFallback: false
            }
          } as Omit<TelemetryEvent, 'eventId' | 'timestamp' | 'schemaVersion'>);
      }
      
      const newState = adjustDifficulty(trialResult, adaptiveState, policy);
      updateAdaptiveState(GAME_ID, currentMode, newState);

      setComponentState(prev => ({...prev, gameState: 'feedback', selectedAnswer: event.answer}));
      setFeedback({ message: isCorrect ? getSuccessFeedback('Gc') : getFailureFeedback('Gc'), type: isCorrect ? 'success' : 'failure' });
      
      setTimeout(() => {
          currentTrialIndex.current++;
          if (currentTrialIndex.current >= policy.sessionLength) {
              setComponentState(prev => ({...prev, gameState: 'finished'}));
              completeCurrentGameSession();
          } else {
              startNewTrial(newState);
          }
      }, 2500);
    }
  }, [componentState.gameState, componentState.puzzle, getAdaptiveState, currentMode, adaptiveState, updateAdaptiveState, startNewTrial, startNewGameSession, completeCurrentGameSession, activeSession, logEvent]);
  
  useEffect(() => {
    if (componentState.gameState === 'playing') {
      const timeLimit = policy.levelMap[adaptiveState.currentLevel]?.mechanic_config.timeLimit || 20000;
      timerRef.current = setTimeout(() => {
        handleEvent({ type: 'SUBMIT_ANSWER', answer: null });
      }, timeLimit);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [componentState.gameState, adaptiveState.currentLevel, handleEvent]);

  useEffect(() => {
    if (isComponentLoaded) {
      // When mode changes, reset the entire game state to avoid rendering with stale data.
      setComponentState({ 
        gameState: 'start',
        puzzle: null,
        selectedAnswer: null,
      });
    }
  }, [isComponentLoaded, currentMode]);
  
  if (!isComponentLoaded) {
      return <div className="w-full max-w-2xl min-h-[400px] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  const rendererMap: Partial<Record<TrainingFocus, React.ComponentType<any>>> = {
    neutral: GcNovelConceptLearner,
    math: GcMathConcepts,
    music: GcMusicKnowledge,
    verbal: GcVerbalRenderer,
    spatial: GcSpatialRenderer,
    eq: GcNovelConceptLearner, // Use the learner for EQ mode
    logic: LogicLibrary,
  };

  const Renderer = rendererMap[currentMode] || GameStub;
  const rendererProps = {
    gameState: componentState,
    onEvent: handleEvent,
    feedback: feedback,
    adaptiveState: adaptiveState,
    sessionLength: policy.sessionLength,
    currentTrialIndex: currentTrialIndex.current,
    focus: currentMode,
  };
  
  if (currentMode === 'eq' && Renderer === GameStub) {
      rendererProps.name = "Affective Span";
      rendererProps.description = "Memorize a sequence of faces showing different emotions, then recall the emotions in the correct order.";
      rendererProps.chcFactor = "Working Memory (Gwm) / Emotion Recognition";
  }

  return (
      <Suspense fallback={<div className="w-full max-w-2xl min-h-[500px] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <Renderer {...rendererProps} />
      </Suspense>
  )
}

    