
'use client';

import { useState, useCallback, useEffect, useRef } from "react";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus, BaseRendererProps } from "@/types";
import { clozeSentences, morphologyWordPairs, spatialConcepts } from "@/data/verbal-content";
import { GameStub } from "../game-stub";
import { GcSpatialLexicon } from "./gc-spatial-lexicon";
import { RegulationArchitect } from "./regulation-architect";
import { LogicLibrary } from '../logic/logic-library';
import { GcNovelConceptLearner } from "./gc-novel-concept-learner";
import GcMathConcepts from "./gc-math-concepts";
import { GcMusicKnowledge } from "./gc-music-knowledge";
import { Loader2 } from "lucide-react";
import { GcVerbalRenderer } from "./GcVerbalRenderer";

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

export type GcVerbalGameState = {
  gameState: 'loading' | 'start' | 'playing' | 'feedback' | 'finished';
  puzzle: GcVerbalPuzzle | null;
  selectedAnswer: string | null;
}

export type GcVerbalGameEvent = 
  | { type: 'START_SESSION' }
  | { type: 'SUBMIT_ANSWER', answer: string | null };


// --- Puzzle Generation ---
const generatePuzzleForLevel = (level: number, focus: TrainingFocus): GcVerbalPuzzle => {
    const levelDef = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).pop() as any];
    const contentConfig = levelDef.content_config[focus];
    if (!contentConfig || !contentConfig.params) { // Fallback to verbal if focus not implemented for Gc
      return generatePuzzleForLevel(level, 'verbal');
    }
    const { sub_variant, params } = contentConfig;
    
    if (sub_variant === 'spatial_lexicon') {
        const concept = spatialConcepts[Math.floor(Math.random() * spatialConcepts.length)];
        const options = [...concept.distractors, concept.answer].sort(() => Math.random() - 0.5);
        return {
            type: 'spatial_lexicon',
            question: concept.question,
            options,
            answer: concept.answer,
            explanation: concept.explanation
        }
    }
    
    let puzzleTemplate;
    if (sub_variant === 'cloze_deletion') {
        const filteredSentences = clozeSentences.filter(p => p.difficulty === params.word_rarity);
        puzzleTemplate = filteredSentences[Math.floor(Math.random() * filteredSentences.length)] || clozeSentences[0];
         return {
            type: sub_variant,
            question: puzzleTemplate.question,
            options: [...puzzleTemplate.options, puzzleTemplate.answer].sort(() => Math.random() - 0.5),
            answer: puzzleTemplate.answer,
            explanation: puzzleTemplate.explanation,
        };
    }
    
    // Fallback for verbal mode
    puzzleTemplate = {
        question: "Which word is an antonym for 'happy'?",
        options: ["Joyful", "Ecstatic", "Sad"],
        answer: "Sad",
        explanation: "An antonym has the opposite meaning."
    };
     return {
        type: sub_variant,
        question: puzzleTemplate.question,
        options: [...puzzleTemplate.options, puzzleTemplate.answer].sort(() => Math.random() - 0.5),
        answer: puzzleTemplate.answer,
        explanation: puzzleTemplate.explanation,
    };
};

export function VerbalInferenceBuilder() {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
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
  
  const handleEvent = useCallback((event: GcVerbalGameEvent) => {
    if (event.type === 'START_SESSION') {
      const sessionState = startSession(getAdaptiveState(GAME_ID, currentMode));
      updateAdaptiveState(GAME_ID, currentMode, sessionState);
      currentTrialIndex.current = 0;
      startNewTrial(sessionState);
    }
    else if (event.type === 'SUBMIT_ANSWER') {
      if (componentState.gameState !== 'playing' || !componentState.puzzle) return;
      
      if (timerRef.current) clearTimeout(timerRef.current);
      
      const reactionTimeMs = Date.now() - trialStartTime.current;
      const isCorrect = event.answer === componentState.puzzle.answer;

      const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs, telemetry: { timedOut: event.answer === null } };
      logTrial({
        module_id: GAME_ID,
        mode: currentMode,
        levelPlayed: adaptiveState.currentLevel,
        isCorrect,
        responseTime_ms: reactionTimeMs,
        meta: { puzzleType: componentState.puzzle.type, }
      } as any);
      
      const newState = adjustDifficulty(trialResult, adaptiveState, policy);
      updateAdaptiveState(GAME_ID, currentMode, newState);

      setComponentState(prev => ({...prev, gameState: 'feedback', selectedAnswer: event.answer}));
      setFeedback({ message: isCorrect ? getSuccessFeedback('Gc') : getFailureFeedback('Gc'), type: isCorrect ? 'success' : 'failure' });
      
      setTimeout(() => {
          currentTrialIndex.current++;
          if (currentTrialIndex.current >= policy.sessionLength) {
              setComponentState(prev => ({...prev, gameState: 'finished'}));
          } else {
              startNewTrial(newState);
          }
      }, 2500);
    }
  }, [componentState.gameState, componentState.puzzle, getAdaptiveState, currentMode, logTrial, adaptiveState, updateAdaptiveState]);

  
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
      setComponentState(prev => ({...prev, gameState: 'start'}));
    }
  }, [isComponentLoaded, currentMode]);
  
  if (!isComponentLoaded) {
      return <div className="w-full max-w-2xl min-h-[400px] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  const renderMap: Record<TrainingFocus, React.ComponentType<any>> = {
    neutral: GcNovelConceptLearner,
    math: GcMathConcepts,
    music: GcMusicKnowledge,
    verbal: GcVerbalRenderer,
    spatial: GcSpatialLexicon,
    eq: RegulationArchitect,
    logic: LogicLibrary,
  };

  const Renderer = renderMap[currentMode] || GameStub;

  return <Renderer 
    gameState={componentState}
    onEvent={handleEvent}
    feedback={feedback}
    adaptiveState={adaptiveState}
    sessionLength={policy.sessionLength}
    currentTrialIndex={currentTrialIndex.current}
    focus={currentMode}
  />;
}
