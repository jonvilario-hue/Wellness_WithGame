'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { getFailureFeedback } from "@/lib/feedback-system";
import { Loader2 } from "lucide-react";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { realWords, pseudowords } from "@/data/verbal-content";

const GAME_ID: GameId = 'gs_rapid_code';
const policy = difficultyPolicies[GAME_ID];

const symbolKeyPool = ['★', '●', '▲', '■', '◆', '✚', '❤', '⚡', '☺'];
const mathSymbolKeyPool = ['+', '−', '×', '÷', '%', '∑', '√', '∞', '='];
const musicSymbolKeyPool = ['♩', '♪', '♫', '♭', '♯', '♮', '𝄞', '𝄢', '𝄡'];
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

type GameVariant = 'symbol_substitution' | 'magnitude_comparison' | 'lexical_decision';

type LexicalProblem = {
    type: 'lexical';
    word: string;
    isReal: boolean;
}

type NumeracyProblem = {
    type: 'numeracy';
    values: string[];
    correctAnswer: string;
};

type SymbolProblem = {
    type: 'symbol';
    keyMap: { [key: string]: number };
    stimulus: string;
};

type Problem = NumeracyProblem | SymbolProblem | LexicalProblem;

const NoiseOverlay = () => (
  <div 
    className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")` }}
  />
);

export function RapidCodeMatch() {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);

  const [timeLeft, setTimeLeft] = useState(policy.sessionLength);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  
  const trialStartTime = useRef(0);
  const keyChangeCounter = useRef(0);
  const trialVariant = useRef<GameVariant>('symbol_substitution');

  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
  
  const symbolPool = useMemo(() => {
    switch (currentMode) {
        case 'music': return musicSymbolKeyPool;
        case 'math': return mathSymbolKeyPool;
        default: return symbolKeyPool;
    }
  }, [currentMode]);

  const generateLexicalProblem = useCallback((): LexicalProblem => {
      const isReal = Math.random() > 0.5;
      const word = isReal 
          ? realWords[Math.floor(Math.random() * realWords.length)]
          : pseudowords[Math.floor(Math.random() * pseudowords.length)];
      return { type: 'lexical', word, isReal };
  }, []);
  
  const generateSymbolProblem = useCallback((level: number): SymbolProblem => {
    const levelDef = policy.levelMap[level] || policy.levelMap[1];
    const { mechanic_config } = levelDef;
    const content_config = levelDef.content_config[currentMode];
    if (!content_config) throw new Error("Invalid content config");
    
    const numSymbols = mechanic_config.distractorCount + 1;
    const shuffledSymbols = [...symbolPool].sort(() => Math.random() - 0.5);
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
    const stimulus = symbolsInKey[Math.floor(Math.random() * symbolsInKey.length)];
    
    return { type: 'symbol', keyMap: currentKeyMap, stimulus };
  }, [symbolPool, problem, currentMode]);

  const generateNumeracyProblem = useCallback((level: number): NumeracyProblem => {
    const levelDef = policy.levelMap[level] || policy.levelMap[1];
    const content_config = levelDef.content_config.math;
    if(!content_config || !content_config.params) throw new Error("Invalid numeracy config");
    const params = content_config.params;
    const formats = params.formats as ('decimal' | 'fraction' | 'percent')[];

    const generateValue = () => {
        const format = formats[Math.floor(Math.random() * formats.length)];
        if (format === 'fraction') {
            const d = Math.floor(Math.random() * (params.max_denominator - 2)) + 2;
            const n = Math.floor(Math.random() * (d - 1)) + 1;
            return { str: `${n}/${d}`, val: n/d };
        }
        if (format === 'percent') {
            const val = Math.floor(Math.random() * 99) + 1;
            return { str: `${val}%`, val: val / 100 };
        }
        // decimal
        return { str: (Math.random() * 0.98 + 0.01).toFixed(params.decimal_places || 2), val: Math.random() };
    }

    let val1 = generateValue();
    let val2 = generateValue();
    while(Math.abs(val1.val - val2.val) < 0.05) val2 = generateValue();

    const correctAnswer = val1.val > val2.val ? val1.str : val2.str;
      
    return { type: 'numeracy', values: [val1.str, val2.str], correctAnswer };
  }, []);

  const startNewTrial = (state: AdaptiveState) => {
      const onRamp = state.uncertainty > 0.7;
      const loadedLevel = onRamp
          ? Math.max(state.levelFloor, state.currentLevel - 2)
          : state.currentLevel;

      const levelDef = policy.levelMap[loadedLevel] || policy.levelMap[1];
      const contentParams = levelDef.content_config[currentMode];
      if (!contentParams) throw new Error("Invalid content params for mode " + currentMode);

      if (currentMode === 'verbal') {
          trialVariant.current = 'lexical_decision';
          setProblem(generateLexicalProblem());
      } else {
        const subVariant = contentParams.sub_variant || 'symbol_substitution';
        if (subVariant === 'magnitude_comparison' && Math.random() > 0.5) {
             trialVariant.current = 'magnitude_comparison';
             setProblem(generateNumeracyProblem(loadedLevel));
        } else {
            trialVariant.current = 'symbol_substitution';
            setProblem(generateSymbolProblem(loadedLevel));
        }
      }
      
      setGameState('running');
      trialStartTime.current = Date.now();
  };

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    setTimeLeft(policy.sessionLength);
    keyChangeCounter.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial]);

  useEffect(() => {
    if (isComponentLoaded) {
      const initialState = getAdaptiveState(GAME_ID, currentMode);
      setAdaptiveState(initialState);
      setGameState('start');
    }
  }, [isComponentLoaded, currentMode, getAdaptiveState]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'running' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft <= 0 && gameState === 'running' && adaptiveState) {
        setGameState('finished');
        const finalState = endSession(adaptiveState, sessionTrials);
        updateAdaptiveState(finalState);
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft, adaptiveState, sessionTrials, updateAdaptiveState]);

  const handleAnswer = useCallback((answer: number | string | boolean) => {
    if (gameState !== 'running' || !adaptiveState || !problem) return;
    
    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;

    const levelDef = policy.levelMap[adaptiveState.currentLevel] || policy.levelMap[1];
    const { mechanic_config } = levelDef;
    
    let isCorrect = false;
    if (problem.type === 'lexical') {
        isCorrect = problem.isReal === answer;
    } else if(problem.type === 'symbol') {
        isCorrect = problem.keyMap[problem.stimulus] === answer;
    } else { // numeracy
        isCorrect = problem.correctAnswer === answer;
    }
    isCorrect = isCorrect && reactionTimeMs < mechanic_config.responseWindowMs;

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    if (isCorrect) {
        if(problem.type === 'symbol') keyChangeCounter.current++;
    } else {
        setInlineFeedback({ message: getFailureFeedback('Gs'), type: 'failure' });
    }

    setTimeout(() => {
        if(timeLeft > 0) {
            startNewTrial(newState);
        }
    }, 500);
  }, [gameState, problem, adaptiveState, timeLeft]);

  const renderContent = () => {
    if (gameState === 'loading' || !isComponentLoaded) {
      return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
    if (gameState === 'start') {
        return (
            <div className="flex flex-col items-center gap-4">
              <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
              <Button onClick={startNewSession} size="lg">Start Session</Button>
            </div>
          );
    }
    if (gameState === 'finished') {
      const finalScore = sessionTrials.filter(t => t.correct).length;
      return (
        <div className="flex flex-col items-center gap-4">
          <CardTitle>Game Over!</CardTitle>
          <p className="text-xl">Your final score is: <span className="text-primary font-bold">{finalScore}</span></p>
          <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
        </div>
      );
    }
    if (!problem) return <Loader2 className="animate-spin"/>;
    
    if (problem.type === 'lexical') {
        return (
            <div className="w-full">
                <div className="flex justify-between w-full text-lg font-mono mb-4">
                    <span>Score: {sessionTrials.filter(t => t.correct).length}</span>
                    <span>Time: {timeLeft}s</span>
                </div>
                <div className="relative mb-6 h-24 flex flex-col items-center justify-center">
                    <p className="text-5xl font-bold text-primary mb-4">{problem.word}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => handleAnswer(false)} variant="secondary" size="lg" className="text-2xl h-32" disabled={gameState === 'feedback'}>
                        PSEUDOWORD
                    </Button>
                    <Button onClick={() => handleAnswer(true)} variant="secondary" size="lg" className="text-2xl h-32" disabled={gameState === 'feedback'}>
                        REAL WORD
                    </Button>
                </div>
            </div>
        )
    }

    if (problem.type === 'numeracy') {
        return (
            <div className="w-full">
                <div className="flex justify-between w-full text-lg font-mono mb-4">
                    <span>Score: {sessionTrials.filter(t => t.correct).length}</span>
                    <span>Time: {timeLeft}s</span>
                </div>
                 <div className="relative mb-6 h-24 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-primary mb-4">Which is larger?</p>
                 </div>
                <div className="grid grid-cols-2 gap-4">
                  {problem.values.map((val) => (
                     <Button key={String(val)} onClick={() => handleAnswer(String(val))} variant="secondary" size="lg" className="text-4xl h-32" disabled={gameState === 'feedback'}>
                      {val}
                    </Button>
                  ))}
                </div>
            </div>
        )
    }

    // Symbol Problem
    return (
      <div className="w-full">
        <div className="flex justify-between w-full text-lg font-mono mb-4">
          <span>Score: {sessionTrials.filter(t => t.correct).length}</span>
          <span>Time: {timeLeft}s</span>
        </div>
        
        <div className="flex justify-center gap-4 p-3 bg-muted rounded-lg mb-6 flex-wrap">
          {Object.entries(problem.keyMap).map(([symbol, digit]) => (
            <div key={symbol} className="flex flex-col items-center p-2">
              <span className="text-3xl font-bold text-primary">{symbol}</span>
              <span className="text-xl font-mono">{digit}</span>
            </div>
          ))}
        </div>

        <div className="h-6 text-sm font-semibold mb-2">
          {inlineFeedback.message && (
            <p className={cn("animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
              {inlineFeedback.message}
            </p>
          )}
        </div>

        <div className="relative inline-block mb-6 h-24 flex items-center justify-center">
            <div className="text-8xl font-extrabold text-primary">
                {problem.stimulus}
            </div>
            <NoiseOverlay />
        </div>
        
        <div className={cn("grid gap-2 justify-center max-w-md mx-auto grid-cols-5")}>
          {Object.entries(problem.keyMap).map(([_, digit]) => (
            <Button key={digit} onClick={() => handleAnswer(digit)} variant="secondary" size="lg" className="text-2xl h-16" disabled={gameState === 'feedback'}>
              {digit}
            </Button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-2xl text-center">
      <CardHeader>
        <CardTitle>(Gs) Rapid Code Match</CardTitle>
        <CardDescription>Match the symbol to the correct digit using the key as fast as you can. The key changes periodically!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}