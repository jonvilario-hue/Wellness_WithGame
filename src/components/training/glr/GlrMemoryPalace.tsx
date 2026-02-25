
'use client';

import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import type { TrialResult, GameId, TrainingFocus } from "@/types";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import { generateMemoryPalaceTrial, type MemoryPalacePuzzle } from "@/lib/glr-spatial-stimulus-factory";
import { PRNG } from "@/lib/rng";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GlrSpatialRenderer = lazy(() => import('./GlrSpatialRenderer'));

const GAME_ID: GameId = 'glr_fluency_storm';
const policy = difficultyPolicies[GAME_ID];

export type GlrSpatialGameState = {
  phase: 'loading' | 'start' | 'encoding' | 'delay' | 'recall' | 'feedback' | 'finished';
  puzzle: MemoryPalacePuzzle | null;
  userSelections: Record<string, string>; // landmarkId -> objectId
  feedbackMap: Record<string, 'correct' | 'incorrect'>;
};

export type GlrSpatialGameEvent = 
  | { type: 'START_SESSION' }
  | { type: 'SELECT_OBJECT'; landmarkId: string; objectId: string }
  | { type: 'SUBMIT_RECALL' };

export function GlrMemoryPalace({ onComplete, focus }: { onComplete: (result: { score: number, trials: TrialResult[] }) => void; focus: TrainingFocus }) {
    const { getAdaptiveState, updateAdaptiveState, logTrial } = usePerformanceStore();

    const [state, setState] = useState<GlrSpatialGameState>({
        phase: 'loading',
        puzzle: null,
        userSelections: {},
        feedbackMap: {}
    });
    const [timeLeft, setTimeLeft] = useState(0);

    const trialCount = useRef(0);
    const sessionTrials = useRef<TrialResult[]>([]);
    const timerRef = useRef<NodeJS.Timeout>();
    const prng = useRef(new PRNG('glr-spatial-seed'));
    const sessionId = useRef(crypto.randomUUID());

    const adaptiveState = getAdaptiveState(GAME_ID, focus);

    const startNewTrial = useCallback(() => {
        const newPuzzle = generateMemoryPalaceTrial(adaptiveState.currentLevel, prng.current);
        setState({
            phase: 'encoding',
            puzzle: newPuzzle,
            userSelections: {},
            feedbackMap: {}
        });
        setTimeLeft(newPuzzle.encodingDuration / 1000);
    }, [adaptiveState.currentLevel]);

    const handleEvent = useCallback((event: GlrSpatialGameEvent) => {
        if (event.type === 'START_SESSION') {
            const sessionState = startSession(adaptiveState);
            updateAdaptiveState(GAME_ID, focus, sessionState);
            trialCount.current = 0;
            sessionTrials.current = [];
            prng.current = new PRNG(crypto.randomUUID());
            sessionId.current = crypto.randomUUID();
            startNewTrial();
        }
        else if (event.type === 'SELECT_OBJECT') {
            setState(s => ({ ...s, userSelections: { ...s.userSelections, [event.landmarkId]: event.objectId } }));
        }
        else if (event.type === 'SUBMIT_RECALL') {
            if (!state.puzzle) return;
            let correctCount = 0;
            const newFeedbackMap: Record<string, 'correct' | 'incorrect'> = {};
            state.puzzle.objectsToPlace.forEach(obj => {
                if (state.userSelections[obj.landmarkId] === obj.id) {
                    correctCount++;
                    newFeedbackMap[obj.landmarkId] = 'correct';
                } else {
                    newFeedbackMap[obj.landmarkId] = 'incorrect';
                }
            });
            const accuracy = correctCount / state.puzzle.objectsToPlace.length;
            const trialResult: TrialResult = { correct: accuracy >= 0.75, reactionTimeMs: 0, telemetry: { accuracy } };
            
            logTrial({ sessionId: sessionId.current, gameId: GAME_ID, seq: trialCount.current, ...trialResult } as any);
            sessionTrials.current.push(trialResult);

            const newState = adjustDifficulty(trialResult, adaptiveState, policy);
            updateAdaptiveState(GAME_ID, focus, newState);
            
            setState(s => ({ ...s, phase: 'feedback', feedbackMap: newFeedbackMap }));

            setTimeout(() => {
                trialCount.current++;
                if (trialCount.current >= policy.sessionLength) {
                    onComplete({ score: sessionTrials.current.filter(t => t.correct).length, trials: sessionTrials.current });
                } else {
                    startNewTrial();
                }
            }, 4000);
        }
    }, [state.puzzle, state.userSelections, adaptiveState, focus, logTrial, onComplete, startNewTrial, updateAdaptiveState]);

    useEffect(() => {
        if (state.phase === 'encoding' || state.phase === 'delay') {
            if (timeLeft <= 0) {
                if(timerRef.current) clearInterval(timerRef.current);
                if (state.phase === 'encoding' && state.puzzle) {
                    setState(s => ({ ...s, phase: 'delay' }));
                    setTimeLeft(state.puzzle.delayDuration / 1000);
                } else {
                    setState(s => ({ ...s, phase: 'recall' }));
                }
                return;
            }
            timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
        }
        return () => { if(timerRef.current) clearInterval(timerRef.current); };
    }, [state.phase, timeLeft, state.puzzle]);
    
    useEffect(() => {
        setState({ ...state, phase: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderFallback = () => <div className="w-full min-h-[500px] flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

    if (state.phase === 'start') {
        return (
            <div className="flex flex-col items-center gap-4">
                <p>Build your memory palace. Memorize object locations, then recall them after a delay.</p>
                <Button onClick={() => handleEvent({type: 'START_SESSION'})} size="lg">Start</Button>
            </div>
        )
    }

    return (
        <Suspense fallback={renderFallback()}>
            <GlrSpatialRenderer
                gameState={state}
                onEvent={handleEvent}
                timeLeft={timeLeft}
            />
        </Suspense>
    );
}
