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
import { Loader2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { GameStub } from "../game-stub";

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

type Stimulus = {
    // Neutral
    position?: Position;
    arrow?: ArrowDir;
    // Math
    value?: number;
};


export function FocusSwitchReactor() {
  const { getAdaptiveState, updateAdaptiveState } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'running' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  
  const [score, setScore] = useState(0);
  const [rule, setRule] = useState<NeutralRule | MathRule>('position');
  const [stimulus, setStimulus] = useState<Partial<Stimulus>>({});
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
      const initialState = getAdaptiveState(GAME_ID, currentMode);
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
    
    if (currentMode === 'neutral') {
        const positions: Position[] = ['top', 'bottom', 'left', 'right'];
        const arrows: ArrowDir[] = ['up', 'down', 'left', 'right'];
        const newPosition = positions[Math.floor(Math.random() * positions.length)];
        const newArrow = arrows[Math.floor(Math.random() * arrows.length)];
        setStimulus({ position: newPosition, arrow: newArrow });
    } else if (currentMode === 'math') {
        const newValue = Math.floor(Math.random() * 99) + 1; // 1-99
        setStimulus({ value: newValue });
    }
  }, [adaptiveState, currentMode]);


  const startNewTrial = useCallback((state: AdaptiveState) => {
    generateStimulus();
    
    const onRamp = state.uncertainty > 0.7;
    const loadedLevel = onRamp
      ? Math.max(state.levelFloor, state.currentLevel - 2)
      : state.currentLevel;
    const levelDef = policy.levelMap[loadedLevel] || policy.levelMap[20];
    const { mechanic_config } = levelDef;
    
    let availableRules: any[] = [];
    let options: any[] = [];

    if (currentMode === 'neutral') {
        availableRules = ['position', 'arrow'];
        options = ['up', 'down', 'left', 'right'];
    } else if (currentMode === 'math') {
        availableRules = ['parity', 'magnitude'];
        options = ['left', 'right'];
    }
    
    if (mechanic_config.noGo) availableRules.push('no_go');

    let newRule = ruleRef.current;
    
    ruleSwitchCounter.current++;
    if (ruleSwitchCounter.current >= mechanic_config.switchInterval) { 
      newRule = availableRules[Math.floor(Math.random() * availableRules.length)];
      ruleSwitchCounter.current = 0;
    }
    setRule(newRule as any);
    
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
            updateAdaptiveState(GAME_ID, currentMode, finalState);
        } else {
            startNewTrial(newState);
        }
    }, 2000);
  }, [gameState, adaptiveState, sessionTrials, updateAdaptiveState, startNewTrial, currentMode]);
  
  const handleAnswer = useCallback((answer: any) => {
    if (gameState !== 'running' || !stimulus) return;
    
    if (rule === 'no_go') {
      processNextTurn(false); // Penalty for responding on a no-go trial
      return;
    }
    
    let isCorrect = false;
    if (currentMode === 'neutral') {
        const correctDir: Record<Position, ArrowDir> = { top: 'up', bottom: 'down', left: 'left', right: 'right' };
        if (rule === 'position') {
            isCorrect = (answer === correctDir[stimulus.position!]);
        } else { // rule is 'arrow'
            isCorrect = (answer === stimulus.arrow);
        }
    } else if (currentMode === 'math') {
        if (rule === 'parity') {
            isCorrect = (answer === (stimulus.value! % 2 === 0 ? 'left' : 'right'));
        } else { // rule is 'magnitude'
            isCorrect = (answer === (stimulus.value! > 50 ? 'left' : 'right'));
        }
    }
    
    processNextTurn(isCorrect);
  }, [gameState, rule, processNextTurn, currentMode, stimulus]);
  
  useEffect(() => {
    let noGoTimer: NodeJS.Timeout;
    if (gameState === 'running' && rule === 'no_go') {
        const onRamp = adaptiveState && adaptiveState.uncertainty > 0.7;
        const loadedLevel = adaptiveState && (onRamp ? Math.max(adaptiveState.levelFloor, adaptiveState.currentLevel - 2) : adaptiveState.currentLevel);
        const waitTime = loadedLevel ? (policy.levelMap[loadedLevel]?.mechanic_config.noGoWaitMs || 1500) : 1500;

        noGoTimer = setTimeout(() => {
            if(ruleRef.current === 'no_go') {
               processNextTurn(true);
            }
        }, waitTime);
    }
    return () => clearTimeout(noGoTimer);
  }, [rule, stimulus, gameState, processNextTurn, adaptiveState]);

  const getRuleText = () => {
      let text = '';
      if (currentMode === 'neutral') {
        if (rule === 'position') text = 'Respond to the SHAPE\'S LOCATION';
        if (rule === 'arrow') text = 'Respond to the ARROW\'S DIRECTION';
      } else if (currentMode === 'math') {
        if (rule === 'parity') text = 'LEFT for EVEN, RIGHT for ODD';
        if (rule === 'magnitude') text = 'LEFT for > 50, RIGHT for <= 50';
      }
      if (rule === 'no_go') text = "DON'T RESPOND";
      
      return <span className="font-bold text-primary uppercase">{text}</span>;
  }
  
  if (currentMode !== 'neutral' && currentMode !== 'math') {
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
              <div className="relative p-8 bg-muted rounded-lg w-full h-48 flex items-center justify-center">
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
                  </div>
              </div>
              <p className="text-xl mb-4 h-12 flex items-center text-center">Rule: {getRuleText()}</p>
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
              <div className="grid grid-cols-4 gap-4 w-full max-w-sm">
                {(shuffledOptions as any[]).map((option) => {
                  const Icon = arrowMap[option as ArrowDir] || (() => <div className="w-10 h-10" />);
                  return (
                      <Button key={option} onClick={() => handleAnswer(option)} disabled={gameState === 'feedback'} variant="secondary" size="lg" className="h-20">
                          {currentMode === 'neutral' ? <Icon className="w-10 h-10" /> : <span className="text-2xl">{option}</span>}
                      </Button>
                  )
                })}
              </div>
            </div>
          );
      }
  }

  return (
    <Card className="w-full max-w-2xl text-center bg-black border-gray-700 text-white">
      <CardHeader>
        <CardTitle>(EF) Focus Switch Reactor</CardTitle>
        <CardDescription className="text-gray-400">Inhibition & Task-Switching Challenge. Pay attention to the rule!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
