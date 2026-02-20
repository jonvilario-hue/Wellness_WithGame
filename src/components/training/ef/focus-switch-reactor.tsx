
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";

// --- Imports for adaptive engine ---
import { Loader2 } from 'lucide-react';
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";

const GAME_ID: GameId = 'ef_focus_switch';
const policy = difficultyPolicies[GAME_ID];


// --- Neutral Mode Config ---
const colorOptions = [
    { name: 'DESTRUCTIVE', class: 'text-destructive' },
    { name: 'PRIMARY', class: 'text-primary' },
    { name: 'ACCENT', class: 'text-accent' },
    { name: 'CHART-3', class: 'text-chart-3' },
];
type NeutralRule = 'color' | 'word' | 'no_go';


// --- Math Mode Config ---
type MathRule = 'parity' | 'primality' | 'no_go';

const isPrime = (num: number) => {
  if (num <= 1) return false;
  for (let i = 2; i < num; i++) {
    if (num % i === 0) return false;
  }
  return true;
};

// --- Music Mode Config ---
const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const qualities = ['MAJOR', 'MINOR'];
type MusicRule = 'quality' | 'no_go';

// Simple check for major/minor "feel"
const isMajor = (noteSequence: string[]) => {
    // This is a heuristic. A true major scale has a specific interval pattern.
    // For this game, we'll use a simpler rule: if it contains a 'happy' sounding interval like C-E or G-B.
    const majorIntervals = new Set(['CE', 'FA', 'GB']);
    for(let i = 0; i < noteSequence.length - 1; i++) {
        const interval = noteSequence[i] + noteSequence[i+1];
        if (majorIntervals.has(interval)) return true;
    }
    return false;
}

export function FocusSwitchReactor() {
  // ADAPTIVE ENGINE STATE
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);

  // ORIGINAL COMPONENT STATE
  const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
  const [score, setScore] = useState(0);
  const [rule, setRule] = useState<NeutralRule | MathRule | MusicRule>('word');
  const [stimulus, setStimulus] = useState<any>({ word: 'PRIMARY', color: 'text-primary', value: 7, noteSequence: ['C','E','G'] });
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });

  const ruleRef = useRef(rule);
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  
  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isLoaded ? (override || globalFocus) : 'neutral';

  // INITIALIZE ADAPTIVE STATE
  useEffect(() => {
    if (isLoaded) {
      const initialState = getAdaptiveState(GAME_ID);
      setAdaptiveState(initialState);
      setGameState('start');
    }
  }, [isLoaded, getAdaptiveState]);
  
  useEffect(() => {
    ruleRef.current = rule;
  }, [rule]);

  const generateNeutralStimulus = useCallback(() => {
    const randomWord = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    setStimulus({ word: randomWord.name, color: randomColor.class });
  }, []);
  
  const generateMathStimulus = useCallback(() => {
    const value = Math.floor(Math.random() * 20) + 2; // numbers from 2 to 21
    setStimulus({ value });
  }, []);
  
  const generateMusicStimulus = useCallback(() => {
    const sequenceLength = 3;
    const noteSequence = Array.from({length: sequenceLength}, () => notes[Math.floor(Math.random() * notes.length)]);
    setStimulus({ noteSequence });
  }, []);

  const generateStimulus = useCallback(() => {
    if (currentMode === 'math') {
        generateMathStimulus();
    } else if (currentMode === 'music') {
        generateMusicStimulus();
    } else {
        generateNeutralStimulus();
    }
  }, [currentMode, generateMathStimulus, generateNeutralStimulus, generateMusicStimulus]);

  const generateRule = useCallback(() => {
    const noGoChance = 0.2;
    if (Math.random() < noGoChance) {
        setRule('no_go');
        return;
    }
    
    if (currentMode === 'math') {
        setRule(Math.random() < 0.5 ? 'parity' : 'primality');
    } else if (currentMode === 'music') {
        setRule('quality');
    } else { // Neutral mode
        setRule(Math.random() < 0.5 ? 'color' : 'word');
    }
  }, [currentMode]);
  
  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    setScore(0);
    startNewTrial(sessionState);
  }, [adaptiveState]);

  const startNewTrial = (state: AdaptiveState) => {
    generateStimulus();
    // Rule switching logic from original component. A more advanced version would use the policy.
    if (Math.random() < 0.3) { 
      generateRule();
    }
    setInlineFeedback({ message: '', type: '' });
    setGameState('running');
    trialStartTime.current = Date.now();
  };

  const processNextTurn = useCallback((correct: boolean) => {
    if (gameState !== 'running' || !adaptiveState) return;

    setGameState('feedback');
    const reactionTimeMs = Date.now() - trialStartTime.current;
    if (correct) {
        setScore(prev => prev + 1);
    }
    
    const trialResult: TrialResult = { correct, reactionTimeMs };
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);

    const feedbackMessage = correct ? getSuccessFeedback('EF') : getFailureFeedback('EF');
    setInlineFeedback({ message: feedbackMessage, type: correct ? 'success' : 'failure' });

    setTimeout(() => {
        currentTrialIndex.current++;
        if(currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
            const finalState = endSession(newState, [...sessionTrials, trialResult]);
            updateAdaptiveState(GAME_ID, finalState);
        } else {
            startNewTrial(newState);
        }
    }, 2000);
  }, [gameState, adaptiveState, sessionTrials, updateAdaptiveState, generateRule, generateStimulus]);
  
  const handleAnswer = useCallback((answer: string) => {
    if (gameState !== 'running') return;
    
    if (rule === 'no_go') {
      processNextTurn(false); // Penalty for responding on a no-go trial
      return;
    }
    
    let isCorrect = false;
    if (currentMode === 'neutral') {
        let correctAnswer;
        if (rule === 'word') {
            correctAnswer = stimulus.word;
        } else { // rule is 'color'
            const correctOption = colorOptions.find(opt => opt.class === stimulus.color);
            correctAnswer = correctOption?.name;
        }
        isCorrect = (answer === correctAnswer);
    } else if (currentMode === 'math') {
        const num = stimulus.value;
        if (rule === 'parity') {
            const parity = num % 2 === 0 ? 'EVEN' : 'ODD';
            isCorrect = (answer === parity);
        } else if (rule === 'primality') {
            const primality = isPrime(num) ? 'PRIME' : 'COMPOSITE';
            isCorrect = (answer === primality);
        }
    } else { // Music mode
        const quality = isMajor(stimulus.noteSequence) ? 'MAJOR' : 'MINOR';
        isCorrect = (answer === quality);
    }
    
    processNextTurn(isCorrect);
  }, [gameState, rule, processNextTurn, currentMode, stimulus]);
  
  // This function is for when the user correctly waits on a "no_go" trial
  useEffect(() => {
    let noGoTimer: NodeJS.Timeout;
    if (gameState === 'running' && rule === 'no_go') {
        noGoTimer = setTimeout(() => {
            if(ruleRef.current === 'no_go') {
               processNextTurn(true); // Reward for correctly inhibiting response
            }
        }, 1500); // 1.5 seconds to wait
    }
    return () => clearTimeout(noGoTimer);
  }, [rule, stimulus, gameState, processNextTurn]);


  const getRuleText = () => {
      if (rule === 'color') return 'Respond to the COLOR';
      if (rule === 'word') return 'Respond to the WORD';
      if (rule === 'parity') return 'Is the number EVEN or ODD?';
      if (rule === 'primality') return 'Is the number PRIME or COMPOSITE?';
      if (rule === 'quality') return 'Is the sequence MAJOR or MINOR?';
      if (rule === 'no_go') return "DON'T RESPOND";
      return '';
  }
  
  const getAnswerOptions = () => {
      if (currentMode === 'math') {
        if (rule === 'parity') return ['EVEN', 'ODD'];
        if (rule === 'primality') return ['PRIME', 'COMPOSITE'];
        return ['EVEN', 'ODD', 'PRIME', 'COMPOSITE']; // Fallback for no-go
      }
      if (currentMode === 'music') {
        return qualities;
      }
      // Neutral mode
      return colorOptions.map(c => c.name);
  }
  
  const answerOptions = useMemo(getAnswerOptions, [rule, currentMode]);
  const buttonGridCols = currentMode === 'neutral' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2';

  const renderContent = () => {
      switch (gameState) {
        case 'loading':
          return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
        case 'start':
          return (
            <div className="flex flex-col items-center gap-4">
              <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
              <Button onClick={startNewSession} size="lg" disabled={!adaptiveState}>Start Session</Button>
            </div>
          );
        case 'finished':
          const finalAccuracy = sessionTrials.filter(t => t.correct).length / sessionTrials.length;
          return (
            <div className="flex flex-col items-center gap-4">
              <CardTitle>Session Complete!</CardTitle>
              <p>Accuracy: {isNaN(finalAccuracy) ? 'N/A' : (finalAccuracy * 100).toFixed(0) + '%'}</p>
              <Button onClick={() => setGameState('start')} size="lg">Play Again</Button>
            </div>
          );
        case 'running':
        case 'feedback':
           return (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex justify-between w-full font-mono">
                <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                <span>Score: {score}</span>
              </div>
              <div className="p-8 bg-muted rounded-lg w-full">
                <p className="text-xl mb-4">Rule: <span className="font-bold text-primary uppercase">{getRuleText()}</span></p>
                <div className="text-6xl font-extrabold" >
                  {currentMode === 'neutral' && <span className={stimulus.color}>{stimulus.word}</span>}
                  {currentMode === 'math' && <span className="text-primary">{stimulus.value}</span>}
                  {currentMode === 'music' && <span className="text-primary tracking-widest">{stimulus.noteSequence?.join(' ')}</span>}
                </div>
              </div>
               <div className="h-6 text-sm font-semibold">
                {inlineFeedback.message && (
                  <p className={cn(
                    "animate-in fade-in",
                    inlineFeedback.type === 'success' ? 'text-green-600' : 'text-amber-600'
                  )}>
                    {inlineFeedback.message}
                  </p>
                )}
              </div>
              <div className={cn("grid gap-4 w-full", buttonGridCols)}>
                {answerOptions.map(option => (
                    <Button key={option} onClick={() => handleAnswer(option)} disabled={gameState === 'feedback'} variant="secondary" size="lg">
                      {option}
                    </Button>
                ))}
              </div>
            </div>
          );
      }
  }

  return (
    <Card className="w-full max-w-2xl text-center">
      <CardHeader>
        <CardTitle>(EF) Focus Switch Reactor</CardTitle>
        <CardDescription>Inhibition & Task-Switching Challenge. Pay attention to the rule!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
