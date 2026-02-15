
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";

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
  const [gameState, setGameState] = useState('idle'); // idle, running, finished
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [rule, setRule] = useState<NeutralRule | MathRule | MusicRule>('word');
  const [stimulus, setStimulus] = useState<any>({ word: 'PRIMARY', color: 'text-primary', value: 7, noteSequence: ['C','E','G'] });
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });

  const ruleRef = useRef(rule);
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  const { logGameResult } = usePerformanceStore();
  
  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isLoaded ? (override || globalFocus) : 'neutral';

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
  
   const finishGame = useCallback(() => {
    setGameState('finished');
    const time = (Date.now() - startTime) / 1000;
    logGameResult('EF', currentMode, { score, time });
  }, [logGameResult, score, startTime, currentMode]);
  
  const restartGame = useCallback(() => {
    setScore(0);
    setTimeLeft(45);
    setStartTime(Date.now());
    setGameState('running');
    setInlineFeedback({ message: '', type: '' });
    generateStimulus();
    generateRule();
  }, [generateStimulus, generateRule]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (gameState === 'running' && timeLeft > 0) {
      timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'running') {
      finishGame();
    }
    return () => clearTimeout(timerId);
  }, [gameState, timeLeft, finishGame]);
  
  // This effect handles mode changes.
  useEffect(() => {
    if (isLoaded) {
      setGameState('idle');
      setScore(0);
      setTimeLeft(45);
    }
  }, [currentMode, isLoaded]);
  
  const processNextTurn = useCallback((correct: boolean) => {
    setScore(prev => correct ? prev + 1 : Math.max(0, prev - 1));
    const feedbackMessage = correct ? getSuccessFeedback('EF') : getFailureFeedback('EF');
    setInlineFeedback({ message: feedbackMessage, type: correct ? 'success' : 'failure' });
    
    setTimeout(() => setInlineFeedback({ message: '', type: '' }), 1500);

    if (Math.random() < 0.3) { 
      generateRule();
    }
    generateStimulus();
  }, [generateRule, generateStimulus]);

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

  return (
    <Card className="w-full max-w-2xl text-center">
      <CardHeader>
        <CardTitle>(EF) Focus Switch Reactor</CardTitle>
        <CardDescription>Inhibition & Task-Switching Challenge. Pay attention to the rule!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {gameState === 'idle' && (
          <Button onClick={restartGame} size="lg" disabled={!isLoaded}>
              {isLoaded ? "Start Game" : "Loading..."}
          </Button>
        )}
        
        {gameState === 'running' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex justify-between w-full text-lg font-mono">
              <span>Score: {score}</span>
              <span>Time: {timeLeft}s</span>
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
                  <Button key={option} onClick={() => handleAnswer(option)} variant="secondary" size="lg">
                    {option}
                  </Button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="flex flex-col items-center gap-4">
            <CardTitle>Game Over!</CardTitle>
            <p className="text-xl">Your final score is: <span className="text-primary font-bold">{score}</span></p>
            <Button onClick={restartGame} size="lg">Play Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
