'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { cn } from "@/lib/utils";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { GameStub } from "../game-stub";
import { StateMachineTracer } from "../logic/state-machine-tracer";
import { domainIcons } from "@/components/icons";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { ComplexSpanTask } from "./ComplexSpanTask";
import { generateVerbalSequence, applyVerbalTransformation } from "@/lib/verbal-stimulus-factory";
import { PRNG } from "@/lib/rng";
import { usePageVisibility } from "@/hooks/use-page-visibility";

const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

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

export function DynamicSequenceTransformer() {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  const { resumeContext } = useAudioEngine();

  const [gameState, setGameState] = useState<'loading' | 'start' | 'memorizing' | 'answering' | 'feedback' | 'finished'>('loading');
  
  const [sequence, setSequence] = useState<(string|number)[] | string>('');
  const [task, setTask] = useState(tasks[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const correctSentenceRef = useRef('');
  const sessionId = useRef(crypto.randomUUID());
  const prngRef = useRef<PRNG>(new PRNG(sessionId.current));
  const answerInputRef = useRef<HTMLInputElement>(null);

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';

  const isVisible = usePageVisibility();
  const pauseTimeRef = useRef<number | null>(null);
  const pausedDurationRef = useRef(0);

  useEffect(() => {
    if (gameState === 'answering' || gameState === 'memorizing') {
      if (!isVisible) {
        pauseTimeRef.current = Date.now();
      } else if (pauseTimeRef.current) {
        pausedDurationRef.current += Date.now() - pauseTimeRef.current;
        pauseTimeRef.current = null;
      }
    }
  }, [isVisible, gameState]);

  useEffect(() => {
    if (gameState === 'answering') {
      // Defer focus to allow for render and animations
      setTimeout(() => answerInputRef.current?.focus(), 50);
    }
  }, [gameState]);


  useEffect(() => {
    if (isComponentLoaded) {
      setGameState('start');
    }
  }, [isComponentLoaded, currentMode]);

  const startNewTrial = useCallback((state: AdaptiveState) => {
    /**
     * Fix 1: PRNG Fallback State Isolation
     * The logic here ensures that if a stimulus for the target difficulty level
     * cannot be generated (due to missing config, etc.), the system falls back
     * to a Tier 1 stimulus without desynchronizing the main PRNG state.
     */
    const prng = prngRef.current;
    
    // Checkpoint the PRNG state before this trial's generation logic begins.
    const prngStateAtTrialStart = prng.getState();

    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;

    let levelDef = difficultyPolicies[GAME_ID]?.levelMap[loadedLevel];
    let newSequence: string | (string|number)[] = '';
    let newTask = tasks[0];
    
    // --- Stimulus Validation Gate & Fallback Logic ---
    if (!levelDef || !levelDef.content_config[currentMode]?.params) {
      console.warn(`[Stimulus Gate] No valid content config for ${currentMode} at level ${loadedLevel}. Falling back to Tier 1 Neutral.`);

      // Create a temporary, disposable PRNG for the fallback stimulus.
      const tempPrng = new PRNG(prngStateAtTrialStart);
      
      const fallbackLevelDef = difficultyPolicies[GAME_ID].levelMap[1];
      const fallbackContentConfig = fallbackLevelDef.content_config['neutral']!;
      newSequence = generateNeutralSequence(fallbackLevelDef.mechanic_config.sequenceLength, fallbackContentConfig.params.charSet, tempPrng);
      newTask = tempPrng.shuffle([...tasks].filter(t => t.id !== 'sentence_unscramble'))[0];
      
      // Now, advance the MAIN PRNG as if the ORIGINAL generation had occurred to maintain determinism.
      // This is a 'dry run' of the intended generation path.
      if (currentMode === 'verbal') {
        generateVerbalSequence(loadedLevel, prng);
      } else {
        generateNeutralSequence(levelDef?.mechanic_config.sequenceLength || 5, 'alphanumeric', prng);
      }

    } else {
        // --- Normal Generation Path ---
        const { mechanic_config, content_config } = levelDef;
        const currentContentConfig = content_config[currentMode]!;
        
        if (currentMode === 'verbal') {
            const verbalStim = generateVerbalSequence(loadedLevel, prng);
            newSequence = verbalStim.sequence;
            const possibleTasks = tasks.filter(t => t.id === verbalStim.transformationRule);
            newTask = prng.shuffle(possibleTasks)[0] || tasks[0];
            if (verbalStim.correctAnswer) {
                correctSentenceRef.current = verbalStim.correctAnswer;
            }
        } else { // Neutral or Math
            newSequence = generateNeutralSequence(mechanic_config.sequenceLength, currentContentConfig.params.charSet, prng);
            const availableTasks = tasks.filter(t => t.id !== 'sentence_unscramble');
            newTask = prng.shuffle(availableTasks)[0];
        }
    }
    
    setSequence(newSequence);
    setTask(newTask);
    
    setUserAnswer('');
    setFeedback('');
    pausedDurationRef.current = 0;
    setGameState('memorizing');
    
    const displayTime = currentMode === 'verbal' ? (levelDef?.mechanic_config.visualDisplayTimeMs ?? 800) : (levelDef?.mechanic_config.displayTimeMs ?? 1500);

    setTimeout(() => {
      setGameState('answering');
      trialStartTime.current = Date.now();
    }, displayTime);
    
  }, [currentMode]);

  const startNewSession = useCallback(() => {
    resumeContext();
    const state = getAdaptiveState(GAME_ID, currentMode);
    // Create a new PRNG for the session, seeded by a new UUID
    const newSessionId = crypto.randomUUID();
    sessionId.current = newSessionId;
    prngRef.current = new PRNG(newSessionId);

    const sessionState = startSession(state);
    
    // Include all replay inputs when starting a new session
    const replayInputs = {
        seed: newSessionId,
        buildVersion: process.env.NEXT_PUBLIC_BUILD_ID || 'dev',
        gameId: GAME_ID,
        focus: currentMode,
        difficultyConfig: policy,
        samplerConfig: null,
    };
    updateAdaptiveState(GAME_ID, currentMode, sessionState, replayInputs);

    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [startNewTrial, resumeContext, updateAdaptiveState, currentMode, getAdaptiveState]);
  
  const correctAnswer = useMemo(() => {
    if (!sequence || !task) return '';
    if (currentMode === 'verbal') {
        return applyVerbalTransformation(sequence as string, task.id, correctSentenceRef.current);
    }
    const seqStr = Array.isArray(sequence) ? sequence.join('') : sequence;
    switch(task.id) {
        case 'reverse': return seqStr.split('').reverse().join('');
        case 'alpha_only': return seqStr.replace(/[^A-Z]/gi, '');
        case 'numeric_only': return seqStr.replace(/[^0-9+\-*/=]/g, '');
        case 'remove_first': return seqStr.substring(1);
        case 'alpha_shift':
            return seqStr.replace(/[^A-Z]/gi, '').split('').map(char => 
                char.toUpperCase() === 'Z' ? 'A' : String.fromCharCode(char.charCodeAt(0) + 1)
            ).join('');
        case 'every_other':
            return seqStr.split('').filter((_, i) => i % 2 === 0).join('');
        default: return seqStr;
    }
  }, [sequence, task, currentMode]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const state = getAdaptiveState(GAME_ID, currentMode);
    if (gameState !== 'answering' || !state) return;
    
    setGameState('feedback');
    const responseTs = Date.now();
    const reactionTimeMs = responseTs - trialStartTime.current - pausedDurationRef.current;
    
    const normalize = (str: string) => str.toUpperCase().replace(/[.,!?\s]/g, '').trim();
    const isCorrect = normalize(userAnswer) === normalize(correctAnswer);
    
    const levelPlayed = state.currentLevel;
    const levelDef = policy.levelMap[levelPlayed] || policy.levelMap[1];
    const content_config = levelDef.content_config[currentMode];
    const seqStr = Array.isArray(sequence) ? sequence.join(',') : sequence;

    const trialResult: TrialResult = { 
        correct: isCorrect, 
        reactionTimeMs,
        telemetry: {
            sequenceLength: seqStr.length,
            transformationType: task.id,
            userSequence: userAnswer.trim().toUpperCase(),
            correctSequence: correctAnswer.toUpperCase(),
            sequenceType: content_config?.params.charSet,
            pausedDurationMs: pausedDurationRef.current
        }
    };
    logTrial({
      id: `${sessionId.current}-${currentTrialIndex.current}`,
      sessionId: sessionId.current!,
      gameId: GAME_ID,
      trialIndex: currentTrialIndex.current,
      seq: currentTrialIndex.current, // Add monotonic sequence number
      difficultyLevel: levelPlayed,
      stimulusOnsetTs: trialStartTime.current,
      responseTs,
      rtMs: reactionTimeMs,
      correct: isCorrect,
      responseType: isCorrect ? 'correct' : 'incorrect',
      stimulusParams: { sequence: seqStr, task: task.id },
      timestamp: Date.now(),
      pausedDurationMs: pausedDurationRef.current,
      wasFallback: false, // This needs to be set properly if fallback occurs
      schemaVersion: 2,
    } as any);
    
    const newState = adjustDifficulty(trialResult, state, policy);
    updateAdaptiveState(GAME_ID, currentMode, newState);

    setFeedback(isCorrect ? getSuccessFeedback('Gwm') : `Incorrect. The answer was: ${correctAnswer}. ${getFailureFeedback('Gwm')}`);

    setTimeout(() => {
        currentTrialIndex.current++;
        if(currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
        } else {
            startNewTrial(newState);
        }
    }, 2500);

  }, [gameState, userAnswer, correctAnswer, getAdaptiveState, updateAdaptiveState, startNewTrial, task.id, currentMode, sequence, logTrial]);
  
  if (currentMode === 'spatial') {
    return <GameStub 
        name="Spatial Span"
        description="A set of 3D cubes in space flash in a specific sequence. User must repeat the sequence by clicking the cubes in the correct order. This tests your ability to hold and recall a series of spatial locations in working memory."
        chcFactor="Working Memory (Gwm) / Dynamic Tracking"
        techStack={['CSS 3D Transforms']}
        complexity="High"
        fallbackPlan="Use a 2D grid. The core mechanic of recalling a sequence of locations is preserved, but without the 3D rendering overhead."
    />;
  }

  if (currentMode === 'logic') {
    return <StateMachineTracer />;
  }

  if (currentMode === 'music') {
    return <ComplexSpanTask />;
  }

  const renderContent = () => {
    if (!isComponentLoaded || gameState === 'loading') {
       return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
    const state = getAdaptiveState(GAME_ID, currentMode);
    switch (gameState) {
      case 'start':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="font-mono text-lg text-cyan-300">Level: {state?.currentLevel}</div>
            <Button onClick={startNewSession} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Dynamic Sequence</Button>
          </div>
        );
      case 'memorizing':
        return (
          <div className="text-center space-y-4 animate-in fade-in">
            <p className="font-semibold text-muted-foreground">Memorize this sequence:</p>
            <div className="p-4 bg-teal-900/40 rounded-lg">
              <p className="text-4xl font-mono tracking-widest text-teal-100">{sequence}</p>
            </div>
            <p className="text-sm text-cyan-400 animate-pulse">Prepare to answer...</p>
          </div>
        );
      case 'answering':
      case 'feedback':
        return (
          <div className="w-full space-y-4 text-center animate-in fade-in">
            <div className="font-mono text-lg text-teal-200">Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</div>
            <div className="p-4 bg-teal-900/40 rounded-lg">
              <p className="text-xl font-semibold text-teal-100">{task.label}</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
              <Input
                ref={answerInputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your transformed answer"
                className="text-center text-lg bg-gray-800 text-white border-teal-500/50"
                disabled={gameState === 'feedback'}
              />
              <Button type="submit" disabled={gameState === 'feedback'} className="bg-cyan-500 hover:bg-cyan-400 text-black">Submit Answer</Button>
            </form>
            {gameState === 'feedback' && (
              <div className="mt-4 text-center text-xl font-bold animate-in fade-in">
                <p className={cn(feedback.includes('Incorrect') ? 'text-red-400' : 'text-green-400')}>{feedback}</p>
              </div>
            )}
          </div>
        );
      case 'finished':
          const finalAccuracy = state.recentTrials.length > 0 ? state.recentTrials.filter(t => t.correct).length / state.recentTrials.length : 0;
        return (
            <div className="flex flex-col items-center gap-4">
                <CardTitle>Session Complete!</CardTitle>
                <p>Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0) + '%'}</p>
                <Button onClick={() => setGameState('start')} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Play Again</Button>
            </div>
        )
    }
  };

  return (
    <Card className="w-full max-w-2xl text-center bg-gray-900 border-teal-500/20 text-teal-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-cyan-400">
            <span className="p-2 bg-cyan-500/10 rounded-md"><domainIcons.Gwm className="w-6 h-6 text-cyan-400" /></span>
            Dynamic Sequence
        </CardTitle>
        <CardDescription className="text-cyan-400/70">Memorize the sequence, then transform it as instructed.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
