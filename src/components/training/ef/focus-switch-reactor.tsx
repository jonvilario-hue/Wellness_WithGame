
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Keyboard, Music, Check, X, Ear, Timer } from 'lucide-react';
import { adjustDifficulty, startSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { GameStub } from "../game-stub";
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override.tsx";
import { domainIcons } from "@/components/icons";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { FOCUS_MODE_META } from "@/lib/mode-constants";


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
type MusicRule = 'pitch' | 'duration';

type Stimulus = {
    // Neutral
    position?: Position;
    arrow?: ArrowDir;
    // Math
    value?: number;
    // Music
    pitch?: number;
    duration?: number;
};

export function FocusSwitchReactor() {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();
  const { playNote, scheduleTone, resumeContext, isAudioReady, getAudioContextTime, getLatencyInfo } = useAudioEngine();

  const [gameState, setGameState] = useState<'loading' | 'start' | 'cueing' | 'running' | 'feedback' | 'finished'>('loading');
  
  const [score, setScore] = useState(0);
  const [rule, setRule] = useState<NeutralRule | MathRule | MusicRule>('position');
  const [stimulus, setStimulus] = useState<Partial<Stimulus>>({});
  const [inlineFeedback, setInlineFeedback] = useState({ message: '', type: '' });

  const stimulusOnsetTs = useRef(0);
  const currentTrialIndex = useRef(0);
  const ruleSwitchCounter = useRef(0);
  const ruleRef = useRef(rule);
  const previousRuleRef = useRef(rule);
  const sessionId = useRef<string | null>(null);
  const deviceInfo = useRef<any>(null);
  
  const isComponentLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  const currentMode = isComponentLoaded ? (override || globalFocus) : 'neutral';
  
  useEffect(() => {
    if (isComponentLoaded) {
      setGameState('start');
    }
  }, [isComponentLoaded]);
  
  useEffect(() => {
    previousRuleRef.current = ruleRef.current;
    ruleRef.current = rule;
  }, [rule]);

  const generateStimulus = useCallback((): Partial<Stimulus> => {
    if (currentMode === 'neutral') {
        const positions: Position[] = ['top', 'bottom', 'left', 'right'];
        const arrows: ArrowDir[] = ['up', 'down', 'left', 'right'];
        const newPosition = positions[Math.floor(Math.random() * positions.length)];
        const newArrow = arrows[Math.floor(Math.random() * arrows.length)];
        const newStimulus = { position: newPosition, arrow: newArrow };
        setStimulus(newStimulus);
        return newStimulus;
    } else if (currentMode === 'math') {
        const newValue = Math.floor(Math.random() * 99) + 1; // 1-99
        const newStimulus = { value: newValue };
        setStimulus(newStimulus);
        return newStimulus;
    } else if (currentMode === 'music') {
        const state = getAdaptiveState(GAME_ID, 'music');
        const params = policy.levelMap[state.currentLevel]?.content_config['music']?.params;
        if (!params) return {};

        const pitch = Math.random() > 0.5 ? params.high_pitch_hz : params.low_pitch_hz;
        const duration = Math.random() > 0.5 ? params.long_duration_ms : params.short_duration_ms;
        const newStimulus = { pitch, duration };
        setStimulus(newStimulus);
        return newStimulus;
    }
    return {};
  }, [currentMode, getAdaptiveState]);

  const startNewTrial = useCallback((state: AdaptiveState) => {
    const newStimulus = generateStimulus();
    
    const levelDef = policy.levelMap[state.currentLevel] || policy.levelMap[20];
    const { mechanic_config } = levelDef;
    const contentConfig = levelDef.content_config[currentMode];
    if (!contentConfig) return;

    let availableRules: any[] = [];
    if (currentMode === 'music') {
        availableRules = ['pitch', 'duration'];
    } else {
        availableRules = contentConfig.params?.rules as any[] || [];
    }
    
    if (mechanic_config.noGo) availableRules.push('no_go');

    let newRule = ruleRef.current;
    const switchProb = mechanic_config.switchProbability || 0.2;
    
    if (Math.random() < switchProb) { 
      let tempRule = newRule;
      while (tempRule === newRule) {
        tempRule = availableRules[Math.floor(Math.random() * availableRules.length)];
      }
      newRule = tempRule;
    }
    setRule(newRule as any);
    
    setInlineFeedback({ message: '', type: '' });
    
    if (currentMode === 'music') {
        setGameState('cueing');
        const csi = contentConfig.params?.csi_ms || 1000;
        setTimeout(() => {
            const stimulusToPlay = newStimulus;
            if(stimulusToPlay.pitch && stimulusToPlay.duration) {
                const handle = scheduleTone(stimulusToPlay.pitch, getAudioContextTime(), stimulusToPlay.duration / 1000);
                if (handle) stimulusOnsetTs.current = handle.scheduledOnset;
            }
            setGameState('running');
        }, csi);

    } else {
        setGameState('running');
        stimulusOnsetTs.current = getAudioContextTime();
    }
  }, [generateStimulus, currentMode, getAudioContextTime, scheduleTone]);

  const startNewSession = useCallback(() => {
    resumeContext();
    const info = getLatencyInfo();
    deviceInfo.current = info;

    const state = getAdaptiveState(GAME_ID, currentMode);
    const sessionState = startSession(state);
    updateAdaptiveState(GAME_ID, currentMode, sessionState);
    currentTrialIndex.current = 0;
    ruleSwitchCounter.current = 0;
    setScore(0);
    sessionId.current = crypto.randomUUID();
    startNewTrial(sessionState);
  }, [startNewTrial, resumeContext, updateAdaptiveState, currentMode, getAdaptiveState, getLatencyInfo]);

  const processNextTurn = useCallback((correct: boolean, source: 'click' | 'keyboard' | 'timeout', responseValue?: any) => {
    const state = getAdaptiveState(GAME_ID, currentMode);
    if ((gameState !== 'running' && gameState !== 'cueing') || !state) return;

    setGameState('feedback');
    const responseTs = getAudioContextTime();
    const levelPlayed = state.currentLevel;
    const reactionTimeMs = (responseTs - stimulusOnsetTs.current) * 1000;
    if (correct) {
        setScore(prev => prev + 1);
    }
    
    let isSwitchTrial = ruleRef.current !== previousRuleRef.current;
    
    const telemetry: Record<string, any> = {
        condition: isSwitchTrial ? 'switch' : 'stay',
        cued_task: ruleRef.current,
        previous_task: previousRuleRef.current,
        correct_response: 'unknown',
        player_response: responseValue,
        response_source: source,
    };

    if (currentMode === 'music') {
        const params = policy.levelMap[state.currentLevel]?.content_config['music']?.params;
        telemetry.csi_ms = params.csi_ms;
        telemetry.stimulus_pitch_hz = stimulus.pitch;
        telemetry.stimulus_duration_ms = stimulus.duration;
        telemetry.correct_response = ruleRef.current === 'pitch' 
            ? (stimulus.pitch === params.high_pitch_hz ? 'high' : 'low')
            : (stimulus.duration === params.long_duration_ms ? 'long' : 'short');
    }

    const trialResult: TrialResult = { 
        correct, 
        reactionTimeMs,
        telemetry,
    };
    
    logTrial({
      sessionId: sessionId.current!,
      gameId: GAME_ID,
      trialIndex: currentTrialIndex.current,
      difficultyLevel: levelPlayed,
      stimulusOnsetTs: stimulusOnsetTs.current,
      responseTs,
      rtMs: reactionTimeMs,
      deviceInfo: deviceInfo.current,
      responseType: 'n/a',
      ...trialResult,
    } as any);
    
    const newState = adjustDifficulty(trialResult, state, policy);
    updateAdaptiveState(GAME_ID, currentMode, newState);

    const feedbackMessage = correct ? getSuccessFeedback('EF') : getFailureFeedback('EF');
    setInlineFeedback({ message: feedbackMessage, type: correct ? 'success' : 'failure' });

    setTimeout(() => {
        currentTrialIndex.current++;
        if(currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
        } else {
            startNewTrial(newState);
        }
    }, 1500);
  }, [gameState, getAdaptiveState, logTrial, updateAdaptiveState, currentMode, startNewTrial, stimulus, getAudioContextTime]);
  
  const handleAnswer = useCallback((answer: any, source: 'click' | 'keyboard') => {
    if (gameState !== 'running' || !stimulus) return;
    
    if (ruleRef.current === 'no_go') {
      processNextTurn(false, source, answer);
      return;
    }
    
    let isCorrect = false;

    if (currentMode === 'music') {
        const state = getAdaptiveState(GAME_ID, 'music');
        const params = policy.levelMap[state.currentLevel]?.content_config['music']?.params;
        if (ruleRef.current === 'pitch') {
            const correctPitch = stimulus.pitch === params.high_pitch_hz ? 'high' : 'low';
            isCorrect = answer === correctPitch;
        } else { // duration
            const correctDuration = stimulus.duration === params.long_duration_ms ? 'long' : 'short';
            isCorrect = answer === correctDuration;
        }
    } else {
      // Logic for neutral/math modes...
      let targetSide = 'left';
      if (currentMode === 'neutral') {
          const correctDir: Record<Position, ArrowDir> = { top: 'up', bottom: 'down', left: 'left', right: 'right' };
          if (ruleRef.current === 'position') targetSide = correctDir[stimulus.position!] === 'up' || correctDir[stimulus.position!] === 'left' ? 'left' : 'right';
          else targetSide = stimulus.arrow === 'up' || stimulus.arrow === 'left' ? 'left' : 'right';
      } else if (currentMode === 'math') {
          if (ruleRef.current === 'parity') targetSide = stimulus.value! % 2 === 0 ? 'left' : 'right';
          else targetSide = stimulus.value! > 50 ? 'left' : 'right';
      }
      isCorrect = (answer === targetSide);
    }
    
    processNextTurn(isCorrect, source, answer);
  }, [gameState, processNextTurn, currentMode, stimulus, getAdaptiveState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if(e.repeat || gameState !== 'running' || currentMode === 'music') return;
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') handleAnswer('left', 'keyboard');
        else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') handleAnswer('right', 'keyboard');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleAnswer, currentMode]);
  
  useEffect(() => {
    let noGoTimer: NodeJS.Timeout;
    const state = getAdaptiveState(GAME_ID, currentMode);
    if (gameState === 'running' && rule === 'no_go') {
        const waitTime = state ? (policy.levelMap[state.currentLevel]?.mechanic_config.noGoWaitMs || 1500) : 1500;
        noGoTimer = setTimeout(() => {
            if(ruleRef.current === 'no_go') processNextTurn(true, 'timeout');
        }, waitTime);
    }
    return () => clearTimeout(noGoTimer);
  }, [rule, stimulus, gameState, processNextTurn, getAdaptiveState, currentMode]);

  const getRuleText = () => {
      let text = '';
      if (currentMode === 'neutral') {
        if (rule === 'position') text = 'Respond to the SHAPE\'S LOCATION';
        else if (rule === 'arrow') text = 'Respond to the ARROW\'S DIRECTION';
      } else if (currentMode === 'math') {
        if (rule === 'parity') text = 'LEFT for EVEN, RIGHT for ODD';
        else if (rule === 'magnitude') text = 'LEFT for > 50, RIGHT for <= 50';
      } else if (currentMode === 'music') {
        if (rule === 'pitch') text = 'Judge the PITCH';
        else if (rule === 'duration') text = 'Judge the DURATION';
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
      if (!isComponentLoaded) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
      const state = getAdaptiveState(GAME_ID, currentMode);

      switch (gameState) {
        case 'loading':
          return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
        case 'start':
            if (currentMode === 'music' && !isAudioReady) {
                return (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <p className="text-muted-foreground">Audio required for this mode.</p>
                        <Button onClick={startNewSession} size="lg" className="bg-rose-600 hover:bg-rose-500 text-white">Tap to Enable Audio & Start</Button>
                    </div>
                )
            }
            const { Icon, label } = FOCUS_MODE_META[currentMode];
          return (
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex flex-col items-center gap-2 text-rose-300">
                    <Icon className="w-10 h-10" />
                    <span className="font-semibold">{label} Mode</span>
                </div>
              <div className="font-mono text-lg text-rose-300">Level: {state?.currentLevel}</div>
              <Button onClick={startNewSession} size="lg" className="bg-rose-600 hover:bg-rose-500 text-white">Focus Switch Reactor</Button>
               <div className="flex items-center gap-2 text-muted-foreground mt-4">
                  <Keyboard className="w-5 h-5"/>
                  <p>Controls: Use (A / ←) and (L / →) keys for non-music modes.</p>
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
        case 'cueing':
             return (
                 <div className="flex flex-col items-center gap-4 w-full animate-in fade-in">
                    <p className="text-xl mb-4 h-12 flex items-center text-center">Rule: {getRuleText()}</p>
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Get ready...</p>
                </div>
             );
        case 'running':
        case 'feedback':
          if (currentMode === 'music') {
            const ruleText = rule === 'pitch' ? 'PITCH' : 'DURATION';
            return (
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex justify-between w-full font-mono text-rose-200">
                        <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
                        <span>Score: {score}</span>
                    </div>
                    <div className="relative p-8 bg-card rounded-lg w-full h-48 flex items-center justify-center">
                        <Ear className="w-24 h-24 text-primary opacity-20" />
                    </div>
                    <p className="text-xl mb-4 h-12 flex items-center text-center">Rule: <span className="font-bold text-primary uppercase ml-2">{ruleText}</span></p>
                    <div className="h-6 text-sm font-semibold">
                        {inlineFeedback.message && (
                        <p className={cn( "animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-500' : 'text-amber-500' )}>
                            {inlineFeedback.message}
                        </p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        <Button onClick={() => handleAnswer(rule === 'pitch' ? 'high' : 'long', 'click')} disabled={gameState === 'feedback'} variant="secondary" size="lg" className="h-20 bg-rose-900/50 border-rose-500/20 text-white hover:bg-rose-900">
                            {rule === 'pitch' ? 'High' : 'Long'}
                        </Button>
                         <Button onClick={() => handleAnswer(rule === 'pitch' ? 'low' : 'short', 'click')} disabled={gameState === 'feedback'} variant="secondary" size="lg" className="h-20 bg-rose-900/50 border-rose-500/20 text-white hover:bg-rose-900">
                            {rule === 'pitch' ? 'Low' : 'Short'}
                        </Button>
                    </div>
                </div>
            );
          }
          // Fallback for neutral/math modes
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
                  </div>
              </div>
              <p className="text-xl mb-4 h-12 flex items-center text-center">Rule: {getRuleText()}</p>
               <div className="h-6 text-sm font-semibold">
                {inlineFeedback.message && (
                  <p className={cn( "animate-in fade-in", inlineFeedback.type === 'success' ? 'text-green-500' : 'text-amber-500' )}>
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
           Focus Switch Reactor
        </CardTitle>
        <CardDescription className="text-rose-300/70">Inhibition & Task-Switching Challenge. Pay attention to the rule! Wired headphones recommended for best results.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
