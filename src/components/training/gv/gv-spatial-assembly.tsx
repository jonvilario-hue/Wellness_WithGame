
'use client';

import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import type { TrialResult, GameId, AdaptiveState } from "@/types";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { generateSpatialGvRotationTrial, type PolycubePuzzle } from '@/lib/polycube-generator';
import { PRNG } from '@/lib/rng';
import { Loader2 } from "lucide-react";

const GvSpatialAssemblyRenderer = lazy(() => import('./GvSpatialAssemblyRenderer'));

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

export type GvSpatialAssemblyState = {
  gameState: 'loading' | 'start' | 'playing' | 'feedback' | 'finished';
  puzzle: PolycubePuzzle | null;
  selectedAnswer: any | null;
  feedbackMessage: string;
};

export type GvSpatialAssemblyEvent = 
  | { type: 'START_SESSION' }
  | { type: 'SELECT_ANSWER', option: any };

export function GvSpatialAssembly() {
  const { getAdaptiveState, updateAdaptiveState, logEvent, activeSession } = usePerformanceStore();
  const { isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { isLoaded: isOverrideLoaded } = useTrainingOverride();
  
  const [componentState, setComponentState] = useState<GvSpatialAssemblyState>({
    gameState: 'loading',
    puzzle: null,
    selectedAnswer: null,
    feedbackMessage: '',
  });

  const currentTrialIndex = useRef(0);
  const trialStartTime = useRef(0);
  const prngRef = useRef<PRNG>(new PRNG('initial-seed'));

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = 'spatial'; // This component is only for spatial mode

  const adaptiveState = getAdaptiveState(GAME_ID, currentMode);
  
  const startNewTrial = useCallback(() => {
    const state = getAdaptiveState(GAME_ID, currentMode);
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;
    
    const params = policy.levelMap[loadedLevel]?.content_config[currentMode]?.params || policy.levelMap[1].content_config[currentMode]!.params;
    const { pieceCount } = params;

    const newPuzzle = generateSpatialGvRotationTrial(loadedLevel, pieceCount, prngRef.current);
    
    setComponentState({
      gameState: 'playing',
      puzzle: newPuzzle,
      selectedAnswer: null,
      feedbackMessage: ''
    });
    trialStartTime.current = Date.now();
  }, [currentMode, getAdaptiveState]);
  
  const handleEvent = useCallback((event: GvSpatialAssemblyEvent) => {
    switch(event.type) {
      case 'START_SESSION':
        prngRef.current = new PRNG(crypto.randomUUID());
        const sessionState = startSession(getAdaptiveState(GAME_ID, currentMode));
        updateAdaptiveState(GAME_ID, currentMode, sessionState);
        currentTrialIndex.current = 0;
        startNewTrial();
        break;
      case 'SELECT_ANSWER':
        if (componentState.gameState !== 'playing' || !componentState.puzzle) return;
        
        const reactionTimeMs = Date.now() - trialStartTime.current;
        const isCorrect = componentState.puzzle.correctIndex === event.option.index;

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

  return (
    <Suspense fallback={<div className="w-full max-w-2xl min-h-[500px] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <GvSpatialAssemblyRenderer
            gameState={componentState}
            onEvent={handleEvent}
            adaptiveState={adaptiveState}
            currentTrialIndex={currentTrialIndex.current}
            sessionLength={policy.sessionLength}
            feedback={null}
            focus={currentMode}
        />
    </Suspense>
  );
}
