
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from 'lucide-react';
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId } from "@/types";
import { GamePlaceholder } from "../game-placeholder";

const GAME_ID: GameId = 'ef_focus_switch';
const policy = difficultyPolicies[GAME_ID];

// --- Neutral Mode Config ---
const colorMap = [
    { name: 'DESTRUCTIVE', textClass: 'text-destructive', bgClass: 'bg-destructive hover:bg-destructive/90', textFgClass: 'text-destructive-foreground' },
    { name: 'PRIMARY', textClass: 'text-primary', bgClass: 'bg-primary hover:bg-primary/90', textFgClass: 'text-primary-foreground' },
    { name: 'ACCENT', textClass: 'text-accent', bgClass: 'bg-accent hover:bg-accent/90', textFgClass: 'text-accent-foreground' },
    { name: 'CHART-3', textClass: 'text-chart-3', bgClass: 'bg-chart-3 hover:opacity-90', textFgClass: 'text-white' },
];
type NeutralRule = 'color' | 'word' | 'no_go';

// --- Math Mode Config ---
type MathRule = 'parity' | 'magnitude' | 'digit_sum' | 'no_go';

// --- Music Mode Config ---
type MusicRule = 'pitch_direction' | 'rhythm_evenness' | 'harmony_quality' | 'timbre_family' | 'no_go';

// --- Verbal Mode Config ---
type VerbalRule = 'rhyme' | 'category' | 'no_go';

type Stimulus = {
    word: string;
    color: string;
    value: number;
    pitch: number;
    rhythm: number[];
    harmony: string;
    timbre: string;
    category?: 'animal' | 'object';
};


export function FocusSwitchReactor() {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  
  const [score, setScore] = useState(0);
  const [rule, setRule] = useState<NeutralRule | MathRule | MusicRule | VerbalRule>('word');
  const [stimulus, setStimulus] = useState<Partial<Stimulus>>({ word: 'PRIMARY', color: 'text-primary', value: 7 });
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });
  const [shuffledOptions, setShuffledOptions] = useState<any[]>([]);

  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const ruleSwitchCounter = useRef(0);
  const ruleRef = useRef(rule);
  
  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
  
  useEffect(() => {
    if (isComponentLoaded) {
      const initialState = getAdaptiveState(GAME_ID);
      setAdaptiveState(initialState);
      setGameState('start');
    }
  }, [isComponentLoaded, currentMode, getAdaptiveState]);
  
  useEffect(() => {
    ruleRef.current = rule;
  }, [rule]);

  const generateStimulus = useCallback(() => {
    const state = adaptiveState;
    if (!state) return;
    
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp ? Math.max(state.levelFloor, state.currentLevel - 2) : state.currentLevel;
    const levelDef = policy.levelMap[loadedLevel] || policy.levelMap[20];
    const contentConfig = levelDef.content_config[currentMode];
    if (!contentConfig || !contentConfig.params) return;

    const contentParams = contentConfig.params;

    if (currentMode === 'verbal') {
        const wordPool = contentParams.word_pool || ['BAT', 'CAT', 'DOG', 'LOG'];
        const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)];
        setStimulus({ word: randomWord, category: contentParams.categories[randomWord] });
    } else if (currentMode === 'math') {
        const value = Math.floor(Math.random() * 98) + 2;
        setStimulus({ value });
    } else if (currentMode === 'music') {
        const pitchDirection = Math.random() > 0.5 ? 'ascending' : 'descending';
        const isEven = Math.random() > 0.5;
        const rhythm = isEven ? [0.5, 0.5] : [0.75, 0.25];
        const harmony = Math.random() > 0.5 ? 'major' : 'minor';
        const families = ['piano', 'guitar', 'strings', 'brass'];
        const timbre = families[Math.floor(Math.random() * families.length)];
        setStimulus({ pitchDirection, rhythm, harmony, timbre });
    } else { // Neutral
        const randomWord = colorMap[Math.floor(Math.random() * colorMap.length)];
        const randomColor = colorMap[Math.floor(Math.random() * colorMap.length)];
        setStimulus({ word: randomWord.name, color: randomColor.textClass });
    }
  }, [adaptiveState, currentMode]);


  const startNewTrial = useCallback((state: AdaptiveState) => {
    generateStimulus();
    
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;
    const levelDef = policy.levelMap[loadedLevel] || policy.levelMap[20];
    const { mechanic_config, content_config } = levelDef;
    const contentParams = content_config[currentMode]?.params;
    
    let availableRules: (NeutralRule | MathRule | MusicRule | VerbalRule)[] = contentParams.rules || ['color', 'word'];
    if(mechanic_config.noGo) availableRules.push('no_go');

    let newRule = ruleRef.current;
    
    ruleSwitchCounter.current++;
    if (ruleSwitchCounter.current >= mechanic_config.switchInterval) { 
      newRule = availableRules[Math.floor(Math.random() * availableRules.length)];
      ruleSwitchCounter.current = 0;
    }
    setRule(newRule as any);

    let options: any[] = [];
    if (currentMode === 'verbal') {
        if (newRule === 'rhyme') options = ['RHYMES WITH HAT', 'RHYMES WITH FOG'];
        else if (newRule === 'category') options = ['IS AN ANIMAL', 'IS AN OBJECT'];
        else options = ['IS AN ANIMAL', 'IS AN OBJECT'];
    } else if (currentMode === 'math') {
        if (newRule === 'parity') options = ['EVEN', 'ODD'];
        else if (newRule === 'magnitude') options = ['< 50', '> 50'];
        else if (newRule === 'digit_sum') options = ['SUM < 10', 'SUM > 10'];
        else options = ['EVEN', 'ODD']; // Fallback
    } else if (currentMode === 'music') {
        if (newRule === 'pitch_direction') options = ['ASCENDING', 'DESCENDING'];
        else if (newRule === 'rhythm_evenness') options = ['EVEN', 'UNEVEN'];
        else if (newRule === 'harmony_quality') options = ['MAJOR', 'MINOR'];
        else if (newRule === 'timbre_family') options = ['PIANO', 'GUITAR', 'STRINGS', 'BRASS'];
        else options = ['ASCENDING', 'DESCENDING']; // Fallback
    } else { // Neutral mode
        options = colorMap;
    }
    
    setShuffledOptions([...options].sort(() => Math.random() - 0.5));

    setInlineFeedback({ message: '', type: '' });
    setGameState('running');
    trialStartTime.current = Date.now();
  }, [generateStimulus, currentMode]);
  
  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    ruleSwitchCounter.current = 0;
    setScore(0);
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial]);

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
            updateAdaptiveState(finalState);
        } else {
            startNewTrial(newState);
        }
    }, 2000);
  }, [gameState, adaptiveState, sessionTrials, updateAdaptiveState, startNewTrial]);
  
  const handleAnswer = useCallback((answer: any) => {
    if (gameState !== 'running') return;
    
    if (rule === 'no_go') {
      processNextTurn(false); // Penalty for responding on a no-go trial
      return;
    }
    
    let isCorrect = false;
    if (currentMode === 'verbal') {
        const word = stimulus.word?.toLowerCase();
        if (rule === 'rhyme') {
            const rhymesWithHat = ['bat', 'cat', 'hat', 'flat'].includes(word || '');
            const correctBin = rhymesWithHat ? 'RHYMES WITH HAT' : 'RHYMES WITH FOG';
            isCorrect = (answer === correctBin);
        } else if (rule === 'category') {
            const category = stimulus.category;
            const correctBin = category === 'animal' ? 'IS AN ANIMAL' : 'IS AN OBJECT';
            isCorrect = (answer === correctBin);
        }
    } else if (currentMode === 'neutral') {
        const answerName = (answer as {name: string}).name;
        let correctAnswer;
        if (rule === 'word') {
            correctAnswer = stimulus.word;
        } else { // rule is 'color'
            const correctOption = colorMap.find(opt => opt.textClass === stimulus.color);
            correctAnswer = correctOption?.name;
        }
        isCorrect = (answerName === correctAnswer);
    } else if (currentMode === 'math') {
        const num = stimulus.value!;
        if (rule === 'parity') {
            const parity = num % 2 === 0 ? 'EVEN' : 'ODD';
            isCorrect = (answer === parity);
        } else if (rule === 'magnitude') {
            const magnitude = num > 50 ? '> 50' : '< 50';
            isCorrect = (answer === magnitude);
        } else if (rule === 'digit_sum') {
            const sum = String(num).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
            const digitSum = sum > 10 ? 'SUM > 10' : 'SUM < 10';
            isCorrect = (answer === digitSum);
        }
    } else { // Music mode
        if (rule === 'pitch_direction') {
            isCorrect = (stimulus.pitchDirection!.toUpperCase() === answer);
        } else if (rule === 'rhythm_evenness') {
            const evenness = stimulus.rhythm![0] === 0.5 ? 'EVEN' : 'UNEVEN';
            isCorrect = (evenness === answer);
        } else if (rule === 'harmony_quality') {
            isCorrect = (stimulus.harmony!.toUpperCase() === answer);
        } else if (rule === 'timbre_family') {
            isCorrect = (stimulus.timbre!.toUpperCase() === answer);
        }
    }
    
    processNextTurn(isCorrect);
  }, [gameState, rule, processNextTurn, currentMode, stimulus]);
  
  // This function is for when the user correctly waits on a "no_go" trial
  useEffect(() => {
    let noGoTimer: NodeJS.Timeout;
    if (gameState === 'running' && rule === 'no_go') {
        const onRamp = adaptiveState && adaptiveState.uncertainty > 0.7;
        const loadedLevel = adaptiveState && (onRamp ? Math.max(adaptiveState.levelFloor, adaptiveState.currentLevel - 2) : adaptiveState.currentLevel);
        const waitTime = loadedLevel ? (policy.levelMap[loadedLevel]?.mechanic_config.noGoWaitMs || 1500) : 1500;

        noGoTimer = setTimeout(() => {
            if(ruleRef.current === 'no_go') {
               processNextTurn(true); // Reward for correctly inhibiting response
            }
        }, waitTime);
    }
    return () => clearTimeout(noGoTimer);
  }, [rule, stimulus, gameState, processNextTurn, adaptiveState]);


  const getRuleText = () => {
      let text = '';
      if (rule === 'color') text = 'Respond to the COLOR';
      if (rule === 'word') text = 'Respond to the WORD';
      if (rule === 'parity') text = 'Is the number EVEN or ODD?';
      if (rule === 'magnitude') text = 'Is the number GREATER or LESS than 50?';
      if (rule === 'digit_sum') text = 'Is the SUM OF DIGITS GREATER or LESS than 10?';
      if (rule === 'pitch_direction') text = 'Is the melody ASCENDING or DESCENDING?';
      if (rule === 'rhythm_evenness') text = 'Is the rhythm EVEN or UNEVEN?';
      if (rule === 'harmony_quality') text = 'Is the harmony MAJOR or MINOR?';
      if (rule === 'timbre_family') text = 'What is the instrument family?';
      if (rule === 'rhyme') text = 'Does it RHYME with HAT or FOG?';
      if (rule === 'category') text = 'Is it an ANIMAL or an OBJECT?';
      if (rule === 'no_go') text = "DON'T RESPOND";
      
      return <span className="font-bold text-primary uppercase">{text}</span>;
  }
  
  const buttonGridCols = (currentMode === 'neutral' || currentMode === 'music') ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2';

  if (currentMode === 'spatial') {
    return <GamePlaceholder title="Perspective Shift" description="A 3D spatial version of the Focus Switch Reactor is under construction. In this mode, you will be shown a simple scene with 3D objects and must rapidly answer questions about their relative positions. The twist is that the required perspective ('Your View' vs. 'Map View') will change randomly, testing your mental flexibility and spatial orientation." />;
  }

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
                <p className="text-xl mb-4">Rule: {getRuleText()}</p>
                <div className="text-6xl font-extrabold" >
                  {currentMode === 'neutral' && <span className={stimulus.color}>{stimulus.word}</span>}
                  {currentMode === 'math' && <span className="text-primary">{stimulus.value}</span>}
                  {currentMode === 'verbal' && <span className="text-primary">{stimulus.word}</span>}
                  {currentMode === 'music' && <span className="text-primary tracking-widest">{stimulus.timbre}</span>}
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
                {shuffledOptions.map((option, index) => {
                  if (currentMode === 'neutral' && typeof option === 'object') {
                      return (
                          <Button 
                              key={option.name + index} 
                              onClick={() => handleAnswer(option)} 
                              disabled={gameState === 'feedback'} 
                              size="lg"
                              className={cn(
                                  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                  "h-11 rounded-md px-8", // size="lg"
                                  option.bgClass, 
                                  option.textFgClass
                              )}
                          >
                            {option.name}
                          </Button>
                      )
                  }
                  // Fallback for math/music/verbal modes
                  const optionKey = typeof option === 'object' ? JSON.stringify(option) : option;
                  return (
                      <Button key={optionKey + index} onClick={() => handleAnswer(option)} disabled={gameState === 'feedback'} variant="secondary" size="lg">
                        {option}
                      </Button>
                  )
                })}
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
