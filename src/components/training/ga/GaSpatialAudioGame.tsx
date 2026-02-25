
'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { adjustDifficulty, startSession, endSession } from '@/lib/adaptive-engine';
import { difficultyPolicies } from '@/data/difficulty-policies';
import { generateSpatialAudioTrial, type SpatialAudioTrial } from '@/lib/ga-spatial-stimulus-factory';
import { PRNG } from '@/lib/rng';
import type { GameId, TrialResult } from '@/types';
import { Loader2 } from 'lucide-react';

const GaSpatialRenderer = lazy(() => import('./GaSpatialRenderer'));

const GAME_ID: GameId = 'ga_auditory_lab';
const policy = difficultyPolicies[GAME_ID];

export type GaSpatialGameState = {
  phase: 'loading' | 'start' | 'playback' | 'response' | 'feedback' | 'finished';
  trial: SpatialAudioTrial | null;
  userSequence: string[];
  feedbackMessage: string;
};

export function GaSpatialAudioGame() {
  const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();
  const { engine } = useAudioEngine();

  const [state, setState] = useState<GaSpatialGameState>({
    phase: 'loading',
    trial: null,
    userSequence: [],
    feedbackMessage: '',
  });

  const trialCount = useRef(0);
  const prng = useRef(new PRNG(Date.now()));
  const sessionId = useRef(crypto.randomUUID());
  const trialStartTime = useRef(0);
  const sessionTrials = useRef<TrialResult[]>([]);

  const startNewTrial = useCallback(() => {
    const adaptiveState = getAdaptiveState(GAME_ID, 'spatial');
    const newTrial = generateSpatialAudioTrial(adaptiveState.currentLevel, prng.current);
    setState({ phase: 'playback', trial: newTrial, userSequence: [], feedbackMessage: '' });

    if (!engine) return;

    let time = 0;
    newTrial.sequence.forEach((posId, index) => {
      const position = newTrial.positions.find(p => p.id === posId);
      if (position) {
        const delay = index * 0.6; // 600ms interval
        const pan = position.x / 5; // Normalize x-coord to -1 to 1 for panning
        const gain = 1.0 - (Math.abs(position.z) / 10); // Attenuate based on depth
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
      trialStartTime.current = Date.now();
    }, time * 1000 + 200);
  }, [getAdaptiveState, engine]);
  
  const handleStartSession = useCallback(() => {
    engine?.resumeContext();
    if (!engine) return;
    
    const adaptiveState = getAdaptiveState(GAME_ID, 'spatial');
    startSession(adaptiveState);
    prng.current = new PRNG(Date.now());
    sessionId.current = crypto.randomUUID();
    trialCount.current = 0;
    sessionTrials.current = [];
    startNewTrial();
  }, [engine, getAdaptiveState, startNewTrial]);

  const handlePositionClick = (positionId: string) => {
    if (state.phase !== 'response') return;
    setState(prev => ({ ...prev, userSequence: [...prev.userSequence, positionId] }));
  };

  const handleSubmit = () => {
    if (state.phase !== 'response' || !state.trial) return;

    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = JSON.stringify(state.userSequence) === JSON.stringify(state.trial.sequence);

    const adaptiveState = getAdaptiveState(GAME_ID, 'spatial');
    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs, telemetry: { /* ... */ } };
    sessionTrials.current.push(trialResult);

    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    updateAdaptiveState(GAME_ID, 'spatial', newState);

    setState(prev => ({...prev, phase: 'feedback', feedbackMessage: isCorrect ? 'Correct!' : 'Incorrect. Try again.'}));

    setTimeout(() => {
        trialCount.current++;
        if (trialCount.current >= policy.sessionLength) {
            endSession(newState, sessionTrials.current);
            setState(prev => ({...prev, phase: 'finished'}));
        } else {
            startNewTrial();
        }
    }, 2000);
  };
  
  const handleReplay = () => {
      if (state.phase !== 'response' || !state.trial || !engine) return;
      // In a real implementation, this would decrement a replay counter
      // and re-trigger the playback sequence.
       state.trial.sequence.forEach((posId, index) => {
        const position = state.trial.positions.find(p => p.id === posId);
        if (position) {
            const delay = index * 0.6;
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
    <div className="flex items-center justify-center h-full">
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
