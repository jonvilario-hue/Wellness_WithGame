
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Smile, View, Loader2 } from "lucide-react";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { getSuccessFeedback, getFailureFeedback } from "@/lib/feedback-system";
import { adjustDifficulty, startSession, endSession } from "@/lib/adaptive-engine";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { AdaptiveState, TrialResult, GameId, TrainingFocus } from "@/types";
import { generateEmotionRotationTrial, type EmotionRotationPuzzle } from "@/lib/gv-stimulus-factory";
import { PRNG } from "@/lib/rng";

const GAME_ID: GameId = 'gv_visual_lab';
const policy = difficultyPolicies[GAME_ID];

// Placeholder component for rendering a face stimulus
const FaceRenderer = ({ stimulus }: { stimulus: { emotion: string, rotation: number, mirrored: boolean } }) => (
    <div
      className="flex items-center justify-center w-24 h-24"
      style={{ transform: `rotate(${stimulus.rotation}deg) ${stimulus.mirrored ? 'scaleX(-1)' : ''}` }}
    >
      <Smile className="w-16 h-16 text-lime-400" />
      <p className="absolute text-xs capitalize bottom-1">{stimulus.emotion}</p>
    </div>
);


export function GvEQRotation({ focus }: { focus: TrainingFocus }) {
  const { getAdaptiveState, updateAdaptiveState, logEvent } = usePerformanceStore();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [gameState, setGameState] = useState<'loading' | 'start' | 'playing' | 'feedback' | 'finished'>('loading');
  const [sessionTrials, setSessionTrials] = useState<TrialResult[]>([]);
  const [puzzle, setPuzzle] = useState<EmotionRotationPuzzle | null>(null);
  const [selectedOption, setSelectedOption] = useState<{ option: any, index: number } | null>(null);
  const [feedback, setFeedback] = useState('');
  
  const trialStartTime = useRef(0);
  const currentTrialIndex = useRef(0);
  const prngRef = useRef<PRNG>(new PRNG(Date.now().toString()));

  useEffect(() => {
    const initialState = getAdaptiveState(GAME_ID, focus);
    setAdaptiveState(initialState);
    setGameState('start');
  }, [focus, getAdaptiveState]);
  
  const startNewTrial = useCallback((state: AdaptiveState) => {
    setPuzzle(generateEmotionRotationTrial(state.currentLevel, prngRef.current));
    setSelectedOption(null);
    setFeedback('');
    setGameState('playing');
    trialStartTime.current = Date.now();
  }, []);

  const startNewSession = useCallback(() => {
    if (!adaptiveState) return;
    prngRef.current = new PRNG(Date.now().toString());
    const sessionState = startSession(adaptiveState);
    setAdaptiveState(sessionState);
    updateAdaptiveState(GAME_ID, focus, sessionState);
    setSessionTrials([]);
    currentTrialIndex.current = 0;
    startNewTrial(sessionState);
  }, [adaptiveState, startNewTrial, updateAdaptiveState, focus]);

  const handleSelectOption = (option: any, index: number) => {
    if (gameState !== 'playing' || !puzzle || !adaptiveState) return;
    setGameState('feedback');
    setSelectedOption({ option, index });
    const reactionTimeMs = Date.now() - trialStartTime.current;
    const isCorrect = index === puzzle.correctIndex;

    const trialResult: TrialResult = { correct: isCorrect, reactionTimeMs, telemetry: { angularDisparity: puzzle.angularDisparity } };
    
    // logEvent would go here
    setSessionTrials(prev => [...prev, trialResult]);
    
    const newState = adjustDifficulty(trialResult, adaptiveState, policy);
    setAdaptiveState(newState);
    updateAdaptiveState(GAME_ID, focus, newState);

    setFeedback(isCorrect ? getSuccessFeedback('Gv') : getFailureFeedback('Gv'));

    setTimeout(() => {
        currentTrialIndex.current++;
        if (currentTrialIndex.current >= policy.sessionLength) {
            setGameState('finished');
        } else {
            startNewTrial(newState);
        }
    }, 2000);
  };

  const renderContent = () => {
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-lime-400" />;
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="font-mono text-lg">Level: {adaptiveState.currentLevel}</div>
          <Button onClick={startNewSession} size="lg" className="bg-teal-600 hover:bg-teal-500 text-white">Start Emotion Rotation</Button>
        </div>
      );
    }
    if (gameState === 'finished') {
      return (
        <div className="text-center space-y-4">
          <CardTitle>Session Complete!</CardTitle>
          <Button onClick={() => setGameState('start')} size="lg" className="bg-teal-600 hover:bg-teal-500 text-white">Play Again</Button>
        </div>
      );
    }
    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-lime-400" />;

    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex.current + 1} / {policy.sessionLength}</span>
          <span>Level: {adaptiveState.currentLevel}</span>
        </div>
        <div>
          <h3 className="text-center font-semibold mb-2">Target Shape</h3>
          <div className="p-4 bg-muted rounded-lg inline-block">
             <FaceRenderer stimulus={puzzle.target} />
          </div>
        </div>
        
        <div className="h-6 text-lg font-bold">
          {feedback && <p className={cn(feedback.includes('Incorrect') ? 'text-rose-500' : 'text-green-500')}>{feedback}</p>}
        </div>

        <div className="w-full">
          <h3 className="text-center font-semibold mb-3">Which is the same shape, just rotated?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {puzzle.options.map((option, index) => (
              <button 
                key={index} 
                onClick={() => handleSelectOption(option, index)}
                className={cn(
                  "p-4 rounded-lg flex items-center justify-center transition-all border-2",
                  gameState === 'feedback' && index === puzzle.correctIndex && "bg-green-500/20 border-green-500 animate-pulse",
                  gameState === 'feedback' && selectedOption?.index === index && index !== puzzle.correctIndex && "bg-destructive/20 border-destructive",
                  !selectedOption && "hover:border-lime-400",
                  "border-transparent bg-muted/50"
                )}
                disabled={gameState === 'feedback'}
              >
                <FaceRenderer stimulus={option} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-3xl bg-gray-950 border-lime-500/20 text-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-lime-300">
            <View />
            (Gv) Emotion-Invariant Rotation
        </CardTitle>
        <CardDescription className="text-lime-300/70">Mentally rotate the faces to find the one that matches the target shape, ignoring mirrored images.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
