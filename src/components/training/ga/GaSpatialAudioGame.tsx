
'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { adjustDifficulty, startSession as startAdaptiveSession, endSession } from '@/lib/adaptive-engine';
import { difficultyPolicies } from '@/data/difficulty-policies';
import { generateSpatialAudioTrial, type SpatialAudioTrial } from '@/lib/ga-spatial-stimulus-factory';
import { PRNG } from '@/lib/rng';
import type { GameId, TrialResult, AdaptiveState } from '@/types';
import { Loader2 } from 'lucide-react';

const GaSpatialRenderer = lazy(() => import('./GaSpatialRenderer'));

const GAME_ID: GameId = 'ga_auditory_lab';
const FOCUS_MODE = 'spatial';
const policy = difficultyPolicies[GAME_ID];

export type GaSpatialGameState = {
  phase: 'loading' | 'start' | 'playback' | 'response' | 'feedback' | 'finished';
  trial: SpatialAudioTrial | null;
  userSequence: string[];
  feedbackMessage: string;
  score: number;
};

export function GaSpatialAudioGame() {
  const { getAdaptiveState, updateAdaptiveState, logEvent, startNewGameSession, completeCurrentGameSession, activeSession } = usePerformanceStore();
  const { engine } = useAudioEngine();

  const [state, setState] = useState<GaSpatialGameState>({
    phase: 'loading',
    trial: null,
    userSequence: [],
    feedbackMessage: '',
    score: 0,
  });

  const trialCount = useRef(0);
  const prng = useRef<PRNG | null>(null);
  const trialStartTime = useRef(0);
  const sessionTrials = useRef<TrialResult[]>([]);
  const adaptiveStateRef = useRef<AdaptiveState>(getAdaptiveState(GAME_ID, FOCUS_MODE));

  const startNewTrial = useCallback(() => {
    if (!prng.current) return;

    const newTrial = generateSpatialAudioTrial(adaptiveStateRef.current.currentLevel, prng.current);
    setState(prev => ({ ...prev, phase: 'playback', trial: newTrial, userSequence: [], feedbackMessage: '' }));

    if (!engine) return;

    let time = 0;
    newTrial.sequence.forEach((posId, index) => {
      const position = newTrial.positions.find(p => p.id === posId);
      if (position) {
        const delay = index * (policy.levelMap[adaptiveStateRef.current.currentLevel]?.mechanic_config.playback_speed_ms || 600) / 1000;
        const pan = position.x / 5;
        const gain = 1.0 - (Math.abs(position.z) / 10);
        engine.playTone({
            frequency: position.frequency, 
            duration: 0.3,
            type: 'sine', 
            pan, 
            volume: gain,
            delay,
        });
        time = delay + 0.3;
      }
    });

    setTimeout(() => {
      setState(prev => ({ ...prev, phase: 'response' }));
      trialStartTime.current = performance.now();
    }, time * 1000 + 200);
  }, [engine]);
  
  const handleStartSession = useCallback(() => {
    engine?.resumeContext();
    if (!engine) return;
    
    const seed = crypto.randomUUID();
    prng.current = new PRNG(seed);
    startNewGameSession({
        gameId: GAME_ID,
        focus: FOCUS_MODE,
        prngSeed: seed,
        buildVersion: 'dev',
        difficultyConfig: policy,
    });

    const currentAdaptiveState = getAdaptiveState(GAME_ID, FOCUS_MODE);
    adaptiveStateRef.current = startAdaptiveSession(currentAdaptiveState);
    updateAdaptiveState(GAME_ID, FOCUS_MODE, adaptiveStateRef.current);
    
    trialCount.current = 0;
    sessionTrials.current = [];
    setState(prev => ({ ...prev, score: 0 }));
    startNewTrial();
  }, [engine, getAdaptiveState, startNewGameSession, startNewTrial, updateAdaptiveState]);

  const handleSubmit = () => {
    if (state.phase !== 'response' || !state.trial || !activeSession) return;

    const reactionTimeMs = performance.now() - trialStartTime.current;
    const isCorrect = JSON.stringify(state.userSequence) === JSON.stringify(state.trial.sequence);

    const trialResult: TrialResult = { 
      correct: isCorrect, 
      reactionTimeMs, 
      telemetry: { 
        sequenceLength: state.trial.sequence.length,
        positionCount: state.trial.positions.length,
        userSequence: state.userSequence,
        correctSequence: state.trial.sequence,
      }
    };
    sessionTrials.current.push(trialResult);

    const currentAdaptiveState = getAdaptiveState(GAME_ID, FOCUS_MODE);
    const newAdaptiveState = adjustDifficulty(trialResult, currentAdaptiveState, policy);
    adaptiveStateRef.current = newAdaptiveState;
    updateAdaptiveState(GAME_ID, FOCUS_MODE, newAdaptiveState);

    logEvent({
        type: 'trial_complete',
        sessionId: activeSession.sessionId,
        seq: (activeSession.trialCount || 0) + 1,
        payload: {
            gameId: GAME_ID,
            focus: FOCUS_MODE,
            trialIndex: trialCount.current,
            difficultyLevel: currentAdaptiveState.currentLevel,
            correct: isCorrect,
            rtMs: reactionTimeMs,
            stimulusParams: trialResult.telemetry
        } as any,
    });

    setState(prev => ({
        ...prev, 
        phase: 'feedback', 
        feedbackMessage: isCorrect ? 'Correct!' : 'Incorrect. Try again.',
        score: prev.score + (isCorrect ? 1 : 0),
    }));

    setTimeout(() => {
        trialCount.current++;
        if (trialCount.current >= policy.sessionLength) {
            const finalState = endSession(newAdaptiveState, sessionTrials.current);
            updateAdaptiveState(GAME_ID, FOCUS_MODE, finalState);
            completeCurrentGameSession();
            setState(prev => ({...prev, phase: 'finished'}));
        } else {
            startNewTrial();
        }
    }, 2000);
  };

  const handlePositionClick = (positionId: string) => {
    if (state.phase !== 'response') return;
    setState(prev => ({ ...prev, userSequence: [...prev.userSequence, positionId] }));
  };
  
  const handleReplay = () => {
      if (state.phase !== 'response' || !state.trial || !engine) return;
       state.trial.sequence.forEach((posId, index) => {
        const position = state.trial.positions.find(p => p.id === posId);
        if (position) {
            const delay = index * (policy.levelMap[adaptiveStateRef.current.currentLevel]?.mechanic_config.playback_speed_ms || 600) / 1000;
            const pan = position.x / 5;
            const gain = 1.0 - (Math.abs(position.z) / 10);
            engine.playTone({
                frequency: position.frequency, 
                duration: 0.3,
                type: 'sine', 
                pan, 
                volume: gain,
                delay,
            });
        }
      });
  }

  useEffect(() => {
    if (engine) {
      setState(prev => ({...prev, phase: 'start'}));
    }
  }, [engine]);

  const renderFallback = () => (
    <div className="flex items-center justify-center h-full min-h-[550px]">
      <Loader2 className="w-12 h-12 animate-spin" />
    </div>
  );

  return (
    <Suspense fallback={renderFallback()}>
      <GaSpatialRenderer 
        gameState={state}
        onStartSession={handleStartSession}
        onPositionClick={handlePositionClick}
        onSubmit={handleSubmit}
        onReplay={handleReplay}
        onClear={() => setState(prev => ({...prev, userSequence: []}))}
      />
    </Suspense>
  );
}
