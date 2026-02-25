'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getFailureFeedback } from "@/lib/feedback-system";
import { Loader2 } from "lucide-react";
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { TrialResult, GameId } from "@/types";
import { GameStub } from "../game-stub";
import { GateSpeed } from '../logic/gate-speed';
import { domainIcons } from "@/components/icons";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { generateLexicalDecisionProblem } from '@/lib/verbal-stimulus-factory';
import { generateSpatialGvRotationTrial, type Polycube } from "@/lib/polycube-generator";
import { PRNG } from "@/lib/rng";
import { FOCUS_MODE_META } from "@/lib/mode-constants";

const GsSpatialRenderer = lazy(() => import('./GsSpatialRenderer'));

const GAME_ID: GameId = 'gs_rapid_code';
const policy = difficultyPolicies[GAME_ID];

type Problem = {
    type: 'lexical' | 'symbol' | 'rhythm' | 'spatial_compare';
    stimulus: any;
    isReal?: boolean;
    keyMap?: { [key: string]: number };
    classificationRule?: string;
    isSame?: boolean;
    objectA?: Polycube;
    objectB?: Polycube;
};

export function RapidCodeMatch() {
  const { getAdaptiveState, updateAdaptiveState, logEvent } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  const { playSequence, resumeContext, isAudioReady } = useAudioEngine();

  const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');

  const [problem, setProblem] = useState<Problem | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const keyChangeCounter = useRef(0);
  const mistakes = useRef(0);
  const spatialTrialBatch = useRef<Problem[]>([]);
  const prngRef = useRef<PRNG | null>(null);

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
  
  const symbolPool = useMemo(() => {
    switch (currentMode) {
        case 'music': return musicSymbolKeyPool;
        case 'math': return mathSymbolKeyPool;
        default: return symbolKeyPool;
    }
  }, [currentMode]);
  
  const generateProblem = useCallback((level: number, prng: PRNG): Problem => {
    const levelDef = policy.levelMap[level] || policy.levelMap[1];
    const { mechanic_config } = levelDef;
    
    if (currentMode === 'verbal') {
        return generateLexicalDecisionProblem(level, prng);
    }
    
    if (currentMode === 'music') {
        const isSame = prng.nextFloat() > 0.5;
        return { type: 'rhythm', stimulus: null, isSame };
    }

    // Default Symbol matching
    const numSymbols = mechanic_config.distractorCount + 1;
    const shuffledSymbols = prng.shuffle([...symbolPool]);
    const map: { [key: string]: number } = {};
    shuffledSymbols.slice(0, numSymbols).forEach((symbol, index) => {
      map[symbol] = digits[index];
    });
    
    let currentKeyMap = (problem?.type === 'symbol' && problem.keyMap) ? problem.keyMap : map;
    if (keyChangeCounter.current >= 5) {
        currentKeyMap = map;
        keyChangeCounter.current = 0;
        setInlineFeedback({ message: "Key changed!", type: 'success' });
        setTimeout(() => setInlineFeedback({ message: '', type: '' }), 1500);
    }
    const symbolsInKey = Object.keys(currentKeyMap);
    const stimulus = symbolsInKey[prng.nextIntRange(0, symbolsInKey.length)];
    
    return { type: 'symbol', keyMap: currentKeyMap, stimulus, classificationRule: 'symbol_digit' };
  }, [symbolPool, problem, currentMode]);


  useEffect(() => {
    if (isComponentLoaded) {
      // On initial load or mode change, reset the game to its start screen.
      // This prevents rendering with stale state (e.g., a 'spatial' problem
      // when the mode has switched to 'neutral').
      setGameState('start');
      setProblem(null);
      currentTrialIndex.current = 0;
      mistakes.current = 0;
      setInlineFeedback({ message: '', type: '' });
    }
  }, [isComponentLoaded, currentMode]);
  
  const startNewTrial = useCallback(() => {
      const state = getAdaptiveState(GAME_ID, currentMode);
      if (!state || !prngRef.current) return;
      
      const onRamp = state.uncertainty > 0.7;
      const loadedLevel = onRamp
          ? Math.max(state.levelFloor, state.currentLevel - 2)
          : state.currentLevel;
      
      let newProblem;
      if (currentMode === 'spatial') {
        newProblem = spatialTrialBatch.current[currentTrialIndex.current];
      } else {
        newProblem = generateProblem(loadedLevel, prngRef.current);
      }
      
      setProblem(newProblem);
      if(newProblem.type === 'rhythm') {
          const baseRhythm = [60, 0, 60, 0];
          const secondRhythm = newProblem.isSame ? baseRhythm : [60, 60, 0, 0];
          playSequence(baseRhythm, 0.25, () => {
              setTimeout(() => playSequence(secondRhythm, 0.25), 500);
          });
      }
      
      setGameState('running');
      trialStartTime.current = performance.now();
  }, [currentMode, generateProblem, getAdaptiveState, playSequence]);

  const startNewSession = useCallback(() => {
    prngRef.current = new PRNG(crypto.randomUUID());
    resumeContext();
    const sessionState = startSession(getAdaptiveState(GAME_ID, currentMode));
    updateAdaptiveState(GAME_ID, currentMode, sessionState);
    currentTrialIndex.current = 0;
    keyChangeCounter.current = 0;
    mistakes.current = 0;

    if (currentMode === 'spatial') {
        const level = sessionState.currentLevel;
        const levelDef = policy.levelMap[level] || policy.levelMap[1];
        const params = levelDef.content_config['spatial']?.params;
        const polycubeSize = params?.polycubeSize || 3;
        spatialTrialBatch.current = Array.from({ length: 60 }).map(() => {
            const isSame = prngRef.current!.nextFloat() > 0.5;
            const target = generateSpatialGvRotationTrial(level, polycubeSize, prngRef.current!);
            const objectA = target.target;
            let objectB: Polycube;
            if (isSame) {
                objectB = target.options.find(opt => opt.index === target.correctIndex)!.polycube;
            } else {
                objectB = prngRef.current!.shuffle(target.options.filter(opt => opt.index !== target.correctIndex))[0].polycube;
            }
            return { type: 'spatial_compare', objectA, objectB, isSame };
        });
    }

    startNewTrial();
  }, [startNewTrial, resumeContext, updateAdaptiveState, currentMode, getAdaptiveState]);

  const handleAnswer = useCallback((answer: number | string | boolean) => {
    const currentState = getAdaptiveState(GAME_ID, currentMode);
    if (gameState !== 'running' || !currentState || !problem) return;
    
    setGameState('feedback');
    const reactionTimeMs = performance.now() - trialStartTime.current;
    const levelPlayed = currentState.currentLevel;

    const levelDef = policy.levelMap[levelPlayed] || policy.levelMap[1];
    const { mechanic_config } = levelDef;
    
    let isCorrect = false;
    let telemetry: Record<string, any> = {};

    if (problem.type === 'lexical') {
        isCorrect = problem.isReal === answer;
        telemetry = { classificationRule: 'lexical_decision' };
    } else if(problem.type === 'symbol') {
        isCorrect = problem.keyMap![problem.stimulus as string] === answer;
        telemetry = { classificationRule: problem.classificationRule, symbolsInKey: Object.keys(problem.keyMap!).length };
    } else if (problem.type === 'rhythm') {
        isCorrect = problem.isSame === answer;
        telemetry = { classificationRule: 'rhythm_comparison' };
    } else if (problem.type === 'spatial_compare') {
        isCorrect = problem.isSame === answer;
        telemetry = { classificationRule: 'spatial_comparison' };
    }
    isCorrect = isCorrect && reactionTimeMs < (mechanic_config.responseWindowMs || 5000);

    if (!isCorrect) {
        mistakes.current++;
    }

    const trialResult: TrialResult = { 
        correct: isCorrect, 
        reactionTimeMs, 
        telemetry: {
            ...telemetry,
            itemsAttempted: currentTrialIndex.current + 1,
            itemsCorrect: (currentTrialIndex.current + 1) - mistakes.current,
            timeLimit_ms: mechanic_config.responseWindowMs || 5000,
        }
    };
    logEvent({
      type: 'trial_complete',
      payload: {
          gameId: GAME_ID,
          focus: currentMode,
          difficultyLevel: levelPlayed,
          correct: trialResult.correct,
          rtMs: trialResult.reactionTimeMs,
          meta: trialResult.telemetry
      }
    } as any);
    
    const newState = adjustDifficulty(trialResult, currentState, policy);
    updateAdaptiveState(GAME_ID, currentMode, newState);

    if (isCorrect) {
        if(problem.type === 'symbol') keyChangeCounter.current++;
    } else {
        setInlineFeedback({ message: getFailureFeedback('Gs'), type: 'failure' });
    }

    setTimeout(() => {
        currentTrialIndex.current++;
        setInlineFeedback({ message: '', type: '' });
        if (currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
        } else {
            startNewTrial();
        }
    }, 200); // Fast transition for a Gs task
  }, [gameState, problem, startNewTrial, updateAdaptiveState, currentMode, logEvent, getAdaptiveState]);

  const renderContent = () => {
    if (!isComponentLoaded) {
      return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
    const state = getAdaptiveState(GAME_ID, currentMode);

    if (gameState === 'start') {
        if (currentMode === 'music' && !isAudioReady) {
             return (
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">Audio required for this mode.</p>
                    <Button onClick={startNewSession} size="lg" className="bg-orange-600 hover:bg-orange-500 text-white">Tap to Enable Audio & Start</Button>
                </div>
            )
        }
        const { Icon, label } = FOCUS_MODE_META[currentMode];
        return (
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-2 text-orange-300 mb-4">
                <Icon className="w-10 h-10" />
                <span className="font-semibold">{label} Mode</span>
              </div>
              <div className="font-mono text-lg text-orange-300">Level: {state?.currentLevel}</div>
              <Button onClick={startNewSession} size="lg" className="bg-orange-600 hover:bg-orange-500 text-white">Rapid Code Match</Button>
            </div>
          );
    }
    if (gameState === 'finished') {
      const accuracy = currentTrialIndex.current > 0 ? ((currentTrialIndex.current - mistakes.current) / currentTrialIndex.current) : 0;
      const score = (currentTrialIndex.current - mistakes.current);
      return (
        <div className="flex flex-col items-center gap-4">
          <CardTitle>Game Over!</CardTitle>
          <p className="text-xl">Score: {score}</p>
          <p>Accuracy: {isNaN(accuracy) ? 'N/A' : (accuracy * 100).toFixed(0) + '%'}</p>
          <Button onClick={() => setGameState('start')} size="lg" className="bg-orange-600 hover:bg-orange-500 text-white">Play Again</Button>
        </div>
      );
    }
    if (!problem) return <Loader2 className="animate-spin"/>;
    
    const score = (currentTrialIndex.current - mistakes.current);

    if (currentMode === 'spatial') {
        return (
            <Suspense fallback={<Loader2 className="w-12 h-12 animate-spin"/>}>
                <GsSpatialRenderer
                    trial={problem as any}
                    onResponse={handleAnswer}
                    timeLeft={60} // Placeholder, a real timer would be implemented
                    score={score}
                />
            </Suspense>
        );
    }
    if (currentMode === 'logic') {
        return <GateSpeed />;
    }

    if (currentMode === 'eq') {
      return <GameStub name="Flash Recognition" description="A fixation cross, followed by a masked facial expression (e.g., 'surprise') flashed for 150-500ms. Rapidly classify the flashed universal emotion from a multiple-choice response array before the next trial begins." chcFactor="Processing Speed (Gs) / Micro-Expression Recognition" techStack={['Framer Motion', 'Face Asset Library']} complexity="Medium" fallbackPlan="If face assets fail, use abstract 'emoticon' style SVGs. This preserves the speeded classification mechanic but loses the micro-expression subtlety." difficultyExamples={{ level1: "Evaluate '[T] OR [F]' with a 2000ms time limit.", level8: "Evaluate 'NOT ([T] XOR [F])' with a 700ms time limit, requiring knowledge of operator precedence." }}/>
    }

    if (problem.type === 'lexical') {
        return (
            <div className="w-full">
                <div className="flex justify-between w-full text-lg font-mono mb-4 text-orange-200">
                    <span>Score: {score}</span>
                    <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                </div>
                <div className="relative mb-6 h-24 flex flex-col items-center justify-center">
                    <p className="text-5xl font-bold text-orange-400 mb-4">{problem.stimulus}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => handleAnswer(false)} variant="secondary" size="lg" className="text-2xl h-32 bg-orange-900/50 border-orange-500/20 text-white hover:bg-orange-900">
                        PSEUDOWORD
                    </Button>
                    <Button onClick={() => handleAnswer(true)} variant="secondary" size="lg" className="text-2xl h-32 bg-orange-900/50 border-orange-500/20 text-white hover:bg-orange-900">
                        REAL WORD
                    </Button>
                </div>
            </div>
        )
    }
    
    if (problem.type === 'rhythm') {
         return (
            <div className="w-full">
                <div className="flex justify-between w-full text-lg font-mono mb-4 text-orange-200">
                    <span>Score: {score}</span>
                    <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                </div>
                <div className="relative mb-6 h-24 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold text-orange-400 mb-4">Are the rhythms the same or different?</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => handleAnswer(false)} variant="secondary" size="lg" className="text-2xl h-32 bg-orange-900/50 border-orange-500/20 text-white hover:bg-orange-900">
                        Different
                    </Button>
                    <Button onClick={() => handleAnswer(true)} variant="secondary" size="lg" className="text-2xl h-32 bg-orange-900/50 border-orange-500/20 text-white hover:bg-orange-900">
                        Same
                    </Button>
                </div>
            </div>
        )
    }

    // Symbol Problem
    return (
      <div className="w-full">
        <div className="flex justify-between w-full text-lg font-mono mb-4 text-orange-200">
            <span>Score: {score}</span>
            <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
        </div>
        
        <div className="flex justify-center gap-4 p-3 bg-zinc-800 rounded-lg mb-6 flex-wrap">
          {Object.entries(problem.keyMap!).map(([symbol, digit]) => (
            <div key={symbol} className="flex flex-col items-center p-2">
              <span className="text-3xl font-bold text-orange-400">{symbol}</span>
              <span className="text-xl font-mono text-orange-200">{digit}</span>
            </div>
          ))}
        </div>

        <div className="h-6 text-sm font-semibold mb-2">
          {inlineFeedback.message && (
            <p className={cn("animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-500' : 'text-red-500')}>
              {inlineFeedback.message}
            </p>
          )}
        </div>

        <div className="relative inline-block mb-6 h-24 flex items-center justify-center">
            <div className="text-8xl font-extrabold text-orange-400">
                {problem.stimulus}
            </div>
        </div>
        
        <div className={cn("grid gap-2 justify-center max-w-md mx-auto grid-cols-5")}>
          {Object.entries(problem.keyMap!).map(([_, digit]) => (
            <Button key={digit} onClick={() => handleAnswer(digit)} variant="secondary" size="lg" className="text-2xl h-16 bg-zinc-700 hover:bg-zinc-600 text-white" disabled={gameState === 'feedback'}>
              {digit}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-2xl text-center bg-zinc-900 border-red-500/20 text-orange-100">
      <CardHeader>
        <CardTitle className="text-red-400 flex items-center justify-center gap-2">
            <span className="p-2 bg-orange-500/10 rounded-md"><domainIcons.Gs className="w-6 h-6 text-orange-400" /></span>
            Rapid Code Match
        </CardTitle>
        <CardDescription className="text-red-400/70">Match the symbol to its number as fast as you can. The key changes periodically! Wired headphones recommended.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

const symbolKeyPool = ['★', '●', '▲', '■', '◆', '✚', '❤', '⚡', '☺'];
const mathSymbolKeyPool = ['+', '−', '×', '÷', '%', '∑', '√', '∞', '='];
const musicSymbolKeyPool = ['♩', '♪', '♫', '♭', '♯', '♮', '𝄞', '𝄢', '𝄡'];
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
