
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Keyboard, Music, Check, X } from 'lucide-react';
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { GameStub } from "../game-stub";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";


const GAME_ID: GameId = 'ef_focus_switch';
const policy = difficultyPolicies[GAME_ID];

type Position = 'top' | 'bottom' | 'left' | 'right';
type ArrowDir = 'up' | 'down' | 'left' | 'right';

const positionClasses: Record<Position, string> = {
  top: 'items-start justify-center',
  bottom: 'items-end justify-center',
  left: 'items-center justify-start',
  right: 'items-center justify-end',
};

const arrowMap: Record<ArrowDir, React.ElementType> = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
};

type NeutralRule = 'position' | 'arrow' | 'no_go';
type MathRule = 'parity' | 'magnitude' | 'no_go';
type MusicRule = 'pitch_direction' | 'rhythm_evenness' | 'no_go';


type Stimulus = {
    position?: Position;
    arrow?: ArrowDir;
    value?: number;
    pitch?: number;
    rhythm?: number[];
};

export function FocusSwitchReactor() {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore.getState();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
  
  const [score, setScore] = useState(0);
  const [rule, setRule] = useState<NeutralRule | MathRule | MusicRule>('position');
  const [stimulus, setStimulus] = useState<Partial<Stimulus>>({});
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });

  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const ruleSwitchCounter = useRef(0);
  const ruleRef = useRef(rule);
  const previousRuleRef = useRef(rule);
  
  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
  
  useEffect(() => {
    if (isComponentLoaded) {
      setAdaptiveState(getAdaptiveState(GAME_ID, currentMode));
      setGameState('start');
    }
  }, [isComponentLoaded, currentMode, getAdaptiveState]);
  
  useEffect(() => {
    previousRuleRef.current = ruleRef.current;
    ruleRef.current = rule;
  }, [rule]);

  const generateStimulus = useCallback(() => {
    if (currentMode === 'neutral') {
        const positions: Position[] = ['top', 'bottom', 'left', 'right'];
        const arrows: ArrowDir[] = ['up', 'down', 'left', 'right'];
        const newPosition = positions[Math.floor(Math.random() * positions.length)];
        const newArrow = arrows[Math.floor(Math.random() * arrows.length)];
        setStimulus({ position: newPosition, arrow: newArrow });
    } else if (currentMode === 'math') {
        const newValue = Math.floor(Math.random() * 99) + 1; // 1-99
        setStimulus({ value: newValue });
    } else if (currentMode === 'music') {
        const newPitch = 60 + Math.floor(Math.random() * 24); // MIDI notes C4-B5
        const isEvenRhythm = Math.random() > 0.5;
        const newRhythm = isEvenRhythm ? [0.5, 0.5] : [0.75, 0.25];
        setStimulus({ pitch: newPitch, rhythm: newRhythm });
    }
  }, [currentMode]);

  const startNewTrial = useCallback((state: AdaptiveState) => {
    generateStimulus();
    
    const levelDef = policy.levelMap[state.currentLevel] || policy.levelMap[20];
    const { mechanic_config } = levelDef;
    const contentConfig = levelDef.content_config[currentMode];
    if (!contentConfig) return;

    let availableRules = contentConfig.params?.rules as any[] || [];
    
    if (mechanic_config.noGo) availableRules.push('no_go');

    let newRule = ruleRef.current;
    
    ruleSwitchCounter.current++;
    const switchProb = mechanic_config.switchProbability || 0;
    const switchInterval = mechanic_config.switchInterval || 5;
    
    if (ruleSwitchCounter.current >= switchInterval || Math.random() < switchProb) { 
      let tempRule = newRule;
      while (tempRule === newRule) {
        tempRule = availableRules[Math.floor(Math.random() * availableRules.length)];
      }
      newRule = tempRule;
      ruleSwitchCounter.current = 0;
    }
    setRule(newRule as any);
    
    setInlineFeedback({ message: '', type: '' });
    setGameState('running');
    trialStartTime.current = Date.now();
  }, [generateStimulus, currentMode]);
  
  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    const sessionState = startSession(adaptiveState);
    updateAdaptiveState(GAME_ID, currentMode, sessionState);
    setAdaptiveState(sessionState);
    currentTrialIndex.current = 0;
    ruleSwitchCounter.current = 0;
    setScore(0);
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial, updateAdaptiveState, currentMode]);

  const processNextTurn = useCallback((correct: boolean, source: 'click' | 'keyboard' | 'timeout', responseSide?: 'left' | 'right') => {
    if (gameState !== 'running' || !adaptiveState) return;

    setGameState('feedback');
    const levelPlayed = adaptiveState.currentLevel;
    const reactionTimeMs = Date.now() - trialStartTime.current;
    if (correct) {
        setScore(prev => prev + 1);
    }
    
    let targetSide = 'left';
    let isCongruent = false;
    
    if (currentMode === 'neutral') {
        const correctDir: Record<Position, ArrowDir> = { top: 'up', bottom: 'down', left: 'left', right: 'right' };
        if (ruleRef.current === 'position') {
            targetSide = correctDir[stimulus.position!] === 'up' || correctDir[stimulus.position!] === 'left' ? 'left' : 'right';
        } else {
             targetSide = stimulus.arrow === 'up' || stimulus.arrow === 'left' ? 'left' : 'right';
        }
        isCongruent = (stimulus.position === 'left' && targetSide === 'left') || (stimulus.position === 'right' && targetSide === 'right');
    } else if (currentMode === 'math') {
        if (ruleRef.current === 'parity') {
            targetSide = stimulus.value! % 2 === 0 ? 'left' : 'right';
        } else {
             targetSide = stimulus.value! > 50 ? 'left' : 'right';
        }
    } else if (currentMode === 'music') {
        if (ruleRef.current === 'pitch_direction') {
            targetSide = stimulus.pitch! > 71 ? 'left' : 'right'; // Higher than B4
        } else {
             targetSide = stimulus.rhythm![0] === stimulus.rhythm![1] ? 'left' : 'right'; // Even vs. Uneven
        }
    }

    const trialResult: TrialResult = { 
        correct, 
        reactionTimeMs,
        telemetry: {
            inputMethod: source,
            rule: ruleRef.current,
            switchTrial: ruleRef.current !== previousRuleRef.current,
            targetSide,
            responseSide: responseSide || null,
            congruent: isCongruent,
        }
    };
    
    logTrial({
      module_id: GAME_ID,
      mode: currentMode,
      levelPlayed,
      isCorrect: correct,
      responseTime_ms: reactionTimeMs,
      meta: trialResult.telemetry
    });
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    updateAdaptiveState(GAME_ID, currentMode, newState);
    setAdaptiveState(newState);

    const feedbackMessage = correct ? getSuccessFeedback('EF') : getFailureFeedback('EF');
    setInlineFeedback({ message: feedbackMessage, type: correct ? 'success' : 'failure' });

    setTimeout(() => {
        currentTrialIndex.current++;
        if(currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
        } else {
            startNewTrial(newState);
        }
    }, 600);
  }, [gameState, adaptiveState, logTrial, updateAdaptiveState, currentMode, startNewTrial, stimulus]);
  
  const handleAnswer = useCallback((answer: 'left' | 'right', source: 'click' | 'keyboard') => {
    if (gameState !== 'running' || !stimulus) return;
    
    if (ruleRef.current === 'no_go') {
      processNextTurn(false, source, answer);
      return;
    }
    
    let isCorrect = false;
    let targetSide = 'left';

    if (currentMode === 'neutral') {
        const correctDir: Record<Position, ArrowDir> = { top: 'up', bottom: 'down', left: 'left', right: 'right' };
        if (ruleRef.current === 'position') {
            targetSide = correctDir[stimulus.position!] === 'up' || correctDir[stimulus.position!] === 'left' ? 'left' : 'right';
            isCorrect = (answer === targetSide);
        }
        else {
             targetSide = stimulus.arrow === 'up' || stimulus.arrow === 'left' ? 'left' : 'right';
            isCorrect = (answer === targetSide);
        }
    } else if (currentMode === 'math') {
        if (ruleRef.current === 'parity') {
            targetSide = stimulus.value! % 2 === 0 ? 'left' : 'right';
            isCorrect = (answer === targetSide);
        }
        else {
             targetSide = stimulus.value! > 50 ? 'left' : 'right';
            isCorrect = (answer === targetSide);
        }
    } else if (currentMode === 'music') {
        if (ruleRef.current === 'pitch_direction') {
            targetSide = stimulus.pitch! > 71 ? 'left' : 'right'; // Higher than B4 vs not
            isCorrect = (answer === targetSide);
        }
        else {
             targetSide = stimulus.rhythm![0] === stimulus.rhythm![1] ? 'left' : 'right'; // Even vs. Uneven
            isCorrect = (answer === targetSide);
        }
    }
    
    processNextTurn(isCorrect, source, answer);
  }, [gameState, processNextTurn, currentMode, stimulus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if(e.repeat || gameState !== 'running') return;
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            handleAnswer('left', 'keyboard');
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') {
            handleAnswer('right', 'keyboard');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleAnswer]);
  
  useEffect(() => {
    let noGoTimer: NodeJS.Timeout;
    if (gameState === 'running' && rule === 'no_go') {
        const waitTime = adaptiveState ? (policy.levelMap[adaptiveState.currentLevel]?.mechanic_config.noGoWaitMs || 1500) : 1500;
        noGoTimer = setTimeout(() => {
            if(ruleRef.current === 'no_go') processNextTurn(true, 'timeout');
        }, waitTime);
    }
    return () => clearTimeout(noGoTimer);
  }, [rule, stimulus, gameState, processNextTurn, adaptiveState]);

  const getRuleText = () => {
      let text = '';
      if (currentMode === 'neutral') {
        if (rule === 'position') text = 'Respond to the SHAPE\'S LOCATION';
        else if (rule === 'arrow') text = 'Respond to the ARROW\'S DIRECTION';
      } else if (currentMode === 'math') {
        if (rule === 'parity') text = 'LEFT for EVEN, RIGHT for ODD';
        else if (rule === 'magnitude') text = 'LEFT for > 50, RIGHT for <= 50';
      } else if (currentMode === 'music') {
        if (rule === 'pitch_direction') text = 'LEFT for HIGH pitch, RIGHT for LOW';
        else if (rule === 'rhythm_evenness') text = 'LEFT for EVEN rhythm, RIGHT for UNEVEN';
      }
      if (rule === 'no_go') text = "DON'T RESPOND";
      return <span className="font-bold text-primary uppercase">{text}</span>;
  }
  
  if (currentMode !== 'neutral' && currentMode !== 'math' && currentMode !== 'music') {
     return <GameStub 
      name="Focus Switch Reactor"
      chcFactor="Executive Function (EF)"
      description="This game has different variants for Music, Verbal, Spatial, EQ and Logic modes."
      techStack={['DOM']}
      complexity="Medium"
      fallbackPlan="N/A"
    />;
  }

  const renderContent = () => {
      switch (gameState) {
        case 'loading':
          return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
        case 'start':
          return (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="font-mono text-lg text-rose-300">Level: {adaptiveState?.currentLevel}</div>
              <Button onClick={startNewSession} size="lg" className="bg-rose-600 hover:bg-rose-500 text-white" disabled={!adaptiveState}>Focus Switch Reactor</Button>
               <div className="flex items-center gap-2 text-muted-foreground mt-4">
                  <Keyboard className="w-5 h-5"/>
                  <p>Controls: Use (A / ←) and (L / →) keys</p>
                </div>
            </div>
          );
        case 'finished':
          return (
            <div className="flex flex-col items-center gap-4">
              <CardTitle>Session Complete!</CardTitle>
              <p>Score: {score} / {policy.sessionLength}</p>
              <Button onClick={() => setGameState('start')} size="lg" className="bg-rose-600 hover:bg-rose-500 text-white">Play Again</Button>
            </div>
          );
        case 'running':
        case 'feedback':
           const options: ('left' | 'right')[] = ['left', 'right'];
           return (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex justify-between w-full font-mono text-rose-200">
                <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                <span>Score: {score}</span>
              </div>
              <div className="relative p-8 bg-card rounded-lg w-full h-48 flex items-center justify-center">
                  <div className={cn("absolute inset-0 flex", stimulus.position ? positionClasses[stimulus.position] : 'items-center justify-center')}>
                    {currentMode === 'neutral' && stimulus.arrow && (
                        <div className="w-20 h-20 bg-background rounded-md flex items-center justify-center">
                            {React.createElement(arrowMap[stimulus.arrow], { className: "w-16 h-16 text-primary" })}
                        </div>
                    )}
                    {currentMode === 'math' && stimulus.value !== undefined && (
                        <div className="text-7xl font-bold text-primary">
                            {stimulus.value}
                        </div>
                    )}
                    {currentMode === 'music' && stimulus.pitch !== undefined && (
                        <div className="text-7xl font-bold text-primary flex items-center gap-2">
                           <Music /> {stimulus.pitch}
                        </div>
                    )}
                  </div>
              </div>
              <p className="text-xl mb-4 h-12 flex items-center text-center">Rule: {getRuleText()}</p>
               <div className="h-6 text-sm font-semibold">
                {inlineFeedback.message && (
                  <p className={cn(
                    "animate-in fade-in",
                    inlineFeedback.type === 'success' ? 'text-green-500' : 'text-amber-500'
                  )}>
                    {inlineFeedback.message}
                  </p>
                )}
              </div>
              <div className={cn("grid gap-4 w-full max-w-sm", options.length === 4 ? "grid-cols-4" : "grid-cols-2")}>
                {options.map((option) => {
                  const Icon = arrowMap[option as ArrowDir] || (() => <span className="text-2xl">{option}</span>);
                  return (
                      <Button key={option} onClick={() => handleAnswer(option, 'click')} disabled={gameState === 'feedback'} variant="secondary" size="lg" className="h-20 bg-rose-900/50 border-rose-500/20 text-white hover:bg-rose-900">
                          <Icon className={options.length === 4 ? "w-10 h-10" : "w-10 h-10"} />
                      </Button>
                  )
                })}
              </div>
            </div>
          );
      }
  }

  return (
    <Card className="w-full max-w-2xl text-center bg-rose-950 border-rose-500/20 text-rose-100">
      <CardHeader>
        <CardTitle className="text-rose-300 flex items-center justify-center gap-2">
           <span className="p-2 bg-rose-500/10 rounded-md"><domainIcons.EF className="w-6 h-6 text-rose-400" /></span>
           (EF) Focus Switch Reactor
        </CardTitle>
        <CardDescription className="text-rose-300/70">Inhibition & Task-Switching Challenge. Pay attention to the rule!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

    