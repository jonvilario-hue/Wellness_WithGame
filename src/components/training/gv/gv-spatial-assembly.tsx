
'use client';

import React, { useState, useCallback, useEffect, useRef } from "react";
import type { TrainingFocus, TrialResult, GameId, AdaptiveState, BaseRendererProps } from "@/types";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { GvSpatialAssemblyRenderer } from "./GvSpatialAssemblyRenderer";
import { GvSpatialAssemblySpatialRenderer } from "./GvSpatialAssemblySpatialRenderer";
import { GameStub } from "../game-stub";

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

// --- STIMULUS GENERATION (LOGIC) ---

const PUZZLE_BANK = [
  // This would be populated with puzzle data as before
  { tier: 1, fragments: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z", t: "translate(0, 0)" }, { d: "M 100 0 L 200 0 L 200 100 L 100 100 Z", t: "translate(10, 0)" }], solution: { d: "M 0 0 L 200 0 L 200 100 L 0 100 Z" }, distractors: [{ d: "M 0 0 L 150 0 L 150 100 L 0 100 Z" }, { d: "M 0 0 L 200 0 L 200 80 L 0 80 Z" }] },
  { tier: 2, fragments: [{ d: "M 0 0 L 100 0 L 100 50 Z", t: "translate(0,0) rotate(0)" }, { d: "M 0 0 L 100 50 L 0 50 Z", t: "translate(10, 10) rotate(180 50 25)"}], solution: { d: "M 0 0 L 100 0 L 0 50 Z" }, distractors: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z"}, {d: "M 0 0 L 100 50 L 0 50 Z"}]},
  { tier: 3, fragments: [{d: "M 25 0 L 75 0 L 75 100 L 25 100 Z", t: "translate(0,0)"}, {d: "M 0 25 L 100 25 L 100 75 L 0 75 Z", t: "translate(0, 10) rotate(90 50 50)"}], solution: { d: "M 25 0 L 75 0 L 75 25 L 100 25 L 100 75 L 75 75 L 75 100 L 25 100 L 25 75 L 0 75 L 0 25 L 25 25 Z"}, distractors: [{ d: "M 0 0 L 100 0 L 100 100 L 0 100 Z" }, {d: "M 25 25 L 75 25 L 75 75 L 25 75 Z" }]},
];

const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- LOGIC COMPONENT ---

export type GvSpatialAssemblyState = {
  gameState: 'loading' | 'start' | 'playing' | 'feedback' | 'finished';
  puzzle: any;
  answerOptions: any[];
  selectedAnswer: any | null;
  feedbackMessage: string;
};

export type GvSpatialAssemblyEvent = 
  | { type: 'START_SESSION' }
  | { type: 'SELECT_ANSWER', option: any };

export function GvSpatialAssembly() {
  const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  
  const [componentState, setComponentState] = useState<GvSpatialAssemblyState>({
    gameState: 'loading',
    puzzle: null,
    answerOptions: [],
    selectedAnswer: null,
    feedbackMessage: '',
  });

  const currentTrialIndex = useRef(0);
  const trialStartTime = useRef(0);

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

  const adaptiveState = getAdaptiveState(GAME_ID, currentMode);
  
  const startNewTrial = useCallback(() => {
    const state = getAdaptiveState(GAME_ID, currentMode);
    const policyForLevel = policy.levelMap[state.currentLevel] || policy.levelMap[1];
    const policyTier = policyForLevel?.content_config?.[currentMode]?.params?.puzzle_tier || 1;

    const puzzlesInTier = PUZZLE_BANK.filter(p => p.tier === policyTier);
    const newPuzzle = puzzlesInTier.length > 0 ? puzzlesInTier[currentTrialIndex.current % puzzlesInTier.length] : PUZZLE_BANK[0];
    
    setComponentState({
      gameState: 'playing',
      puzzle: newPuzzle,
      answerOptions: newPuzzle ? shuffle([newPuzzle.solution, ...newPuzzle.distractors]) : [],
      selectedAnswer: null,
      feedbackMessage: ''
    });
    trialStartTime.current = Date.now();
  }, [currentMode, getAdaptiveState]);
  
  const handleEvent = useCallback((event: GvSpatialAssemblyEvent) => {
    switch(event.type) {
      case 'START_SESSION':
        const sessionState = startSession(getAdaptiveState(GAME_ID, currentMode));
        updateAdaptiveState(GAME_ID, currentMode, sessionState);
        currentTrialIndex.current = 0;
        startNewTrial();
        break;
      case 'SELECT_ANSWER':
        if (componentState.gameState !== 'playing' || !componentState.puzzle) return;
        
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const isCorrect = event.option.d === componentState.puzzle.solution.d;

        const trialResult: TrialResult = {
            correct: isCorrect,
            reactionTimeMs,
            telemetry: { puzzleTier: componentState.puzzle.tier }
        };

        if(activeSession) {
          logEvent({
            type: 'trial_complete',
            sessionId: activeSession.sessionId,
            seq: (activeSession.trialCount || 0) + 1,
            payload: { /* ... full payload ... */ } as any,
          });
        }
        
        const newState = adjustDifficulty(trialResult, adaptiveState, policy);
        updateAdaptiveState(GAME_ID, currentMode, newState);
        
        setComponentState(prev => ({
          ...prev,
          gameState: 'feedback',
          selectedAnswer: event.option,
          feedbackMessage: isCorrect ? 'Correct!' : 'Incorrect.'
        }));

        setTimeout(() => {
          const nextTrialIndex = currentTrialIndex.current + 1;
          if (nextTrialIndex >= policy.sessionLength) {
            setComponentState(prev => ({ ...prev, gameState: 'finished' }));
          } else {
            currentTrialIndex.current = nextTrialIndex;
            startNewTrial();
          }
        }, 2000);
        break;
    }
  }, [componentState.gameState, componentState.puzzle, startNewTrial, getAdaptiveState, updateAdaptiveState, currentMode, adaptiveState, activeSession, logEvent]);
  
  useEffect(() => {
    if (isComponentLoaded) {
      setComponentState(prev => ({ ...prev, gameState: 'start' }));
    }
  }, [isComponentLoaded]);

  // --- RENDERER SELECTION ---
  let Renderer;
  if (currentMode === 'spatial') {
    Renderer = GvSpatialAssemblySpatialRenderer;
  } else if (currentMode === 'neutral') {
    Renderer = GvSpatialAssemblyRenderer;
  } else {
    return <GameStub name="Spatial Assembly" description="This game is only available in Neutral and Spatial modes." chcFactor="Visual Processing (Gv)" techStack={['SVG', 'Three.js']} complexity="High" fallbackPlan="N/A"/>
  }

  return (
    <Renderer 
      gameState={componentState}
      onEvent={handleEvent}
      adaptiveState={adaptiveState}
      currentTrialIndex={currentTrialIndex.current}
      sessionLength={policy.sessionLength}
    />
  );
}
