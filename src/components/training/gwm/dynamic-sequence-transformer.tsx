

'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus, BaseRendererProps } from "@/types";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { GameStub } from "../game-stub";
import { StateMachineTracer } from "../logic/state-machine-tracer";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { ComplexSpanTask } from "./ComplexSpanTask";
import { generateVerbalSequence, applyVerbalTransformation } from "@/lib/verbal-stimulus-factory";
import { generateCorsiBlockTrial, type CorsiBlockPuzzle } from "@/lib/gwm-spatial-stimulus-factory";
import { generateEQFaceSequence, type EQFacePuzzle } from "@/lib/gwm-stimulus-factory";
import { PRNG } from "@/lib/rng";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { Loader2 } from "lucide-react";
import { DynamicSequenceRenderer } from './DynamicSequenceRenderer';
import { TokenNBack } from '../logic/TokenNBack';

const GwmSpatialRenderer = lazy(() => import('./GwmSpatialRenderer'));
const GwmEQRenderer = lazy(() => import('./GwmEQRenderer'));


const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

// --- Puzzle Types ---
export type DynamicSequencePuzzle = {
  type: 'sequence';
  sequence: (string|number)[] | string;
  task: { id: string; label: string };
  correctAnswer: string;
};

export type GwmPuzzle = DynamicSequencePuzzle | CorsiBlockPuzzle | EQFacePuzzle;

export type GwmGameState = {
  gameState: 'loading' | 'start' | 'memorizing' | 'answering' | 'feedback' | 'finished';
  puzzle: GwmPuzzle | null;
  userAnswer: string | string[]; // string for sequence, string[] for spatial/eq
};

export type GwmGameEvent = 
  | { type: 'START_SESSION' }
  | { type: 'SUBMIT_ANSWER', answer: string | string[] };

// --- Logic Component ---
export function DynamicSequenceTransformer() {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  const { resumeContext } = useAudioEngine();

  const [componentState, setComponentState] = useState<GwmGameState>({
      gameState: 'loading',
      puzzle: null,
      userAnswer: ''
  });
  const [feedback, setFeedback] = useState<string>('');

  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const correctSentenceRef = useRef('');
  const sessionId = useRef(crypto.randomUUID());
  const prngRef = useRef<PRNG>(new PRNG(sessionId.current));

  const isVisible = usePageVisibility();
  const pauseTimeRef = useRef<number | null>(null);
  const pausedDurationRef = useRef(0);

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
  
  const adaptiveState = getAdaptiveState(GAME_ID, currentMode);

  useEffect(() => {
    if (componentState.gameState === 'answering' || componentState.gameState === 'memorizing') {
      if (!isVisible) {
        pauseTimeRef.current = Date.now();
      } else if (pauseTimeRef.current) {
        pausedDurationRef.current += Date.now() - pauseTimeRef.current;
        pauseTimeRef.current = null;
      }
    }
  }, [isVisible, componentState.gameState]);

  useEffect(() => {
    if (isComponentLoaded) {
      setComponentState(prev => ({ ...prev, gameState: 'start' }));
    }
  }, [isComponentLoaded, currentMode]);

  const startNewTrial = useCallback((state: AdaptiveState) => {
    const prng = prngRef.current;
    
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;

    let newPuzzle: GwmPuzzle;
    const levelDef = difficultyPolicies[GAME_ID]?.levelMap[loadedLevel];
    let displayTime = 1500;

    if (currentMode === 'spatial') {
        newPuzzle = generateCorsiBlockTrial(loadedLevel, prng);
        if (levelDef) displayTime = (levelDef.mechanic_config.sequenceLength || 3) * 1000;
    } else if (currentMode === 'eq') {
        newPuzzle = generateEQFaceSequence(loadedLevel, prng);
        if (levelDef) displayTime = (levelDef.content_config.eq?.params?.presentation_rate_ms ?? 1000) * (levelDef.content_config.eq?.params?.sequence_length ?? 3);
    }
    else {
        let newSequence: string | (string|number)[] = '';
        let newTask = tasks[0];
        
        if (!levelDef || !levelDef.content_config[currentMode]?.params) {
            const fallbackDef = difficultyPolicies[GAME_ID].levelMap[1];
            newSequence = generateNeutralSequence(fallbackDef.mechanic_config.sequenceLength, fallbackDef.content_config['neutral']!.params.charSet, prng);
            newTask = prng.shuffle([...tasks].filter(t => t.id !== 'sentence_unscramble'))[0];
            displayTime = fallbackDef.mechanic_config.displayTimeMs ?? 1500;
        } else {
            const { mechanic_config, content_config } = levelDef;
            const currentContentConfig = content_config[currentMode]!;
            displayTime = mechanic_config.displayTimeMs ?? 1500;
            
            if (currentMode === 'verbal') {
                const verbalStim = generateVerbalSequence(loadedLevel, prng);
                newSequence = verbalStim.sequence;
                const possibleTasks = tasks.filter(t => t.id === verbalStim.transformationRule);
                newTask = prng.shuffle(possibleTasks)[0] || tasks[0];
                if (verbalStim.correctAnswer) correctSentenceRef.current = verbalStim.correctAnswer;
                displayTime = mechanic_config.visualDisplayTimeMs ?? 800;
            } else {
                newSequence = generateNeutralSequence(mechanic_config.sequenceLength, currentContentConfig.params.charSet, prng);
                const availableTasks = tasks.filter(t => t.id !== 'sentence_unscramble');
                newTask = prng.shuffle(availableTasks)[0];
            }
        }
        
        const correctAnswer = applyVerbalTransformation(Array.isArray(newSequence) ? newSequence.join('') : newSequence, newTask.id, correctSentenceRef.current);
        
        newPuzzle = { type: 'sequence', sequence: newSequence, task: newTask, correctAnswer };
    }
    
    setComponentState({ gameState: 'memorizing', puzzle: newPuzzle, userAnswer: (currentMode === 'spatial' || currentMode === 'eq') ? [] : '' });
    setFeedback('');
    pausedDurationRef.current = 0;
    
    const recallDelay = levelDef?.content_config[currentMode]?.params?.recall_delay_ms ?? 0;

    setTimeout(() => {
      setComponentState(prev => ({...prev, gameState: 'answering'}));
      trialStartTime.current = Date.now();
    }, displayTime + recallDelay);
    
  }, [currentMode]);
  
  const handleEvent = useCallback((event: GwmGameEvent) => {
    if(event.type === 'START_SESSION') {
      resumeContext();
      const state = getAdaptiveState(GAME_ID, currentMode);
      const newSessionId = crypto.randomUUID();
      sessionId.current = newSessionId;
      prngRef.current = new PRNG(newSessionId);

      const sessionState = startSession(state);
      updateAdaptiveState(GAME_ID, currentMode, sessionState);
      currentTrialIndex.current = 0;
      startNewTrial(sessionState);
    } else if (event.type === 'SUBMIT_ANSWER') {
      const { puzzle } = componentState;
      const state = getAdaptiveState(GAME_ID, currentMode);
      if (componentState.gameState !== 'answering' || !state || !puzzle) return;
      
      setComponentState(prev => ({...prev, gameState: 'feedback', userAnswer: event.answer}));
      const responseTs = Date.now();
      const reactionTimeMs = responseTs - trialStartTime.current - pausedDurationRef.current;
      
      let isCorrect = false;
      let telemetry: Record<string, any> = {};

      if (puzzle.type === 'sequence') {
        const normalize = (str: string) => str.toUpperCase().replace(/[.,!?\s]/g, '').trim();
        isCorrect = normalize(event.answer as string) === normalize(puzzle.correctAnswer);
        telemetry = { sequence: puzzle.sequence, task: puzzle.task.id };
      } else if (puzzle.type === 'spatial_corsi') {
        isCorrect = JSON.stringify(event.answer) === JSON.stringify(puzzle.sequence);
        telemetry = { sequence: puzzle.sequence, task: 'corsi_span', blocks: puzzle.blocks };
      } else if (puzzle.type === 'eq_face_sequence') {
        isCorrect = JSON.stringify(event.answer) === JSON.stringify(puzzle.sequence.map(s => s.emotionCategory));
        telemetry = {
            task: 'affective_span',
            sequence: puzzle.sequence.map(s => ({
                emotion_category: s.emotionCategory,
                intensity_level: s.intensity,
                face_identity_id: s.faceId,
                exposure_duration_ms: puzzle.presentationRate,
                label_shown: puzzle.labelShown,
            }))
        };
      }
      
      const levelPlayed = state.currentLevel;
      const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs, telemetry };
      
      logTrial({
        id: `${sessionId.current}-${currentTrialIndex.current}`,
        sessionId: sessionId.current!,
        gameId: GAME_ID,
        trialIndex: currentTrialIndex.current,
        seq: currentTrialIndex.current,
        difficultyLevel: levelPlayed,
        stimulusOnsetTs: trialStartTime.current,
        responseTs,
        rtMs: reactionTimeMs,
        correct: isCorrect,
        responseType: isCorrect ? 'correct' : 'incorrect',
        stimulusParams: telemetry,
        timestamp: Date.now(),
        pausedDurationMs: pausedDurationRef.current,
        wasFallback: false,
        schemaVersion: 2,
      } as any);
      
      const newState = adjustDifficulty(trialResult, state, policy);
      updateAdaptiveState(GAME_ID, currentMode, newState);

      setFeedback(isCorrect ? getSuccessFeedback('Gwm') : `Incorrect. ${getFailureFeedback('Gwm')}`);

      setTimeout(() => {
          currentTrialIndex.current++;
          if(currentTrialIndex.current >= policy.sessionLength) {
              setComponentState(prev => ({...prev, gameState: 'finished'}));
          } else {
              startNewTrial(newState);
          }
      }, 2500);
    }
  }, [componentState, getAdaptiveState, updateAdaptiveState, startNewTrial, currentMode, logTrial, resumeContext]);

  if (!isComponentLoaded) {
      return <div className="w-full max-w-2xl min-h-[400px] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  const rendererMap: Partial<Record<TrainingFocus, React.ComponentType<any>>> = {
    neutral: DynamicSequenceRenderer,
    math: DynamicSequenceRenderer,
    verbal: DynamicSequenceRenderer,
    spatial: GwmSpatialRenderer,
    music: ComplexSpanTask,
    logic: TokenNBack,
    eq: GwmEQRenderer,
  };

  const Renderer = rendererMap[currentMode] || GameStub;

  const rendererProps: BaseRendererProps<GwmGameState, GwmGameEvent> = {
    gameState: componentState,
    onEvent: handleEvent,
    feedback: feedback,
    adaptiveState: adaptiveState,
    sessionLength: policy.sessionLength,
    currentTrialIndex: currentTrialIndex.current,
    focus: currentMode,
    prng: prngRef.current,
  };
  
  if (currentMode === 'eq' && Renderer === GameStub) {
      rendererProps.name = "Affective Span";
      rendererProps.description = "Memorize a sequence of faces showing different emotions, then recall the emotions in the correct order.";
      rendererProps.chcFactor = "Working Memory (Gwm) / Emotion Recognition";
  }

  return (
    <Suspense fallback={<div className="w-full max-w-2xl min-h-[400px] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
        <Renderer {...rendererProps} />
    </Suspense>
  )
}


const generateNeutralSequence = (length: number, charSet: string, prng: PRNG) => {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (charSet === 'alphanumeric') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  if (charSet === 'numeric') chars = '0123456789';
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(prng.nextIntRange(0, chars.length));
  }
  return result;
};

const tasks = [
  { id: 'reverse', label: "Repeat the sequence backward." },
  { id: 'alpha_only', label: "Repeat only the letters, in order." },
  { id: 'numeric_only', label: "Repeat only the numbers, in order." },
  { id: 'remove_first', label: "Repeat the sequence, removing the first character." },
  { id: 'alpha_shift', label: "Repeat the letters, shifting each forward by one (A->B, Z->A)." },
  { id: 'every_other', label: "Repeat every other character, starting with the first." },
  { id: 'sentence_unscramble', label: "Unscramble the words to form a grammatical sentence." },
];
