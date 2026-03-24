

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseRendererProps } from '@/types';
import type { GwmGameState, GwmGameEvent } from './dynamic-sequence-transformer';
import type { EQFacePuzzle } from '@/lib/gwm-stimulus-factory';
import { FOCUS_MODE_META } from '@/lib/mode-constants';

const FaceSprite = ({ stimulus, showLabel }: { stimulus: any, showLabel: boolean }) => {
    if (!stimulus || !stimulus.emotionCategory || !stimulus.sprite) return null;
    return (
        <div className="flex flex-col items-center gap-2">
            <div
            aria-label={`Face showing ${stimulus.emotionCategory}`}
            className="w-32 h-32 bg-no-repeat rounded-lg border-2 border-cyan-700"
            style={{
                backgroundImage: `url(${stimulus.sprite.sheetUrl})`,
                backgroundPosition: `-${stimulus.sprite.coords.x}px -${stimulus.sprite.coords.y}px`,
                imageRendering: 'pixelated',
            }}
            />
            {showLabel && (
            <span className="font-semibold text-cyan-200 capitalize">{stimulus.emotionCategory}</span>
            )}
        </div>
    );
};

export const GwmEQRenderer: React.FC<BaseRendererProps<GwmGameState, GwmGameEvent>> = ({
  gameState,
  onEvent,
  feedback,
  adaptiveState,
  currentTrialIndex,
  sessionLength,
  focus,
}) => {
  const { gameState: phase, puzzle, userAnswer } = gameState;
  const [sequenceIndex, setSequenceIndex] = useState(0);

  // --- Animation for sequence presentation ---
  useEffect(() => {
    if (phase === 'memorizing' && puzzle?.type === 'eq_face_sequence') {
      setSequenceIndex(0);
      const interval = setInterval(() => {
        setSequenceIndex(prev => {
          if (prev >= puzzle.sequence.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, puzzle.presentationRate);
      return () => clearInterval(interval);
    }
  }, [phase, puzzle]);

  const handleRecallClick = (emotion: string) => {
    if (phase !== 'answering') return;
    onEvent({ type: 'UPDATE_ANSWER', answer: [...(userAnswer as string[]), emotion] });
  };
  
  const handleClear = () => {
    if (phase !== 'answering') return;
    onEvent({ type: 'UPDATE_ANSWER', answer: [] }); 
  }

  const handleSubmit = () => {
    onEvent({ type: 'SUBMIT_ANSWER', answer: userAnswer });
  }

  const renderContent = () => {
    if (!adaptiveState || phase === 'loading') {
      return <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />;
    }
    
    if (phase === 'start') {
        const { Icon, label } = FOCUS_MODE_META[focus];
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2 text-cyan-300 mb-4">
                    <Icon className="w-10 h-10" />
                    <span className="font-semibold">{label} Mode</span>
                </div>
                <div className="font-mono text-lg">Level: {adaptiveState.currentLevel}</div>
                <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Start Affective Span</Button>
            </div>
        );
    }

    if (!puzzle || puzzle.type !== 'eq_face_sequence') {
      return <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />;
    }

    if (phase === 'memorizing') {
      const currentStimulus = puzzle.sequence[sequenceIndex];
      return (
        <div className="text-center space-y-4 animate-in fade-in">
          <p className="font-semibold text-muted-foreground">Memorize the emotion sequence:</p>
          <div className="h-48 flex items-center justify-center">
            {currentStimulus && <FaceSprite stimulus={currentStimulus} showLabel={puzzle.labelShown} />}
          </div>
          <p className="text-sm text-cyan-400">Item {sequenceIndex + 1} of {puzzle.sequence.length}</p>
        </div>
      );
    }

    if (phase === 'answering' || phase === 'feedback') {
        const recalledEmotions = userAnswer as string[];
      return (
        <div className="w-full space-y-4 text-center animate-in fade-in">
          <div className="font-mono text-lg text-teal-200">Trial: {currentTrialIndex + 1} / {sessionLength}</div>
          <p className="text-xl font-semibold text-teal-100">Recall the sequence of emotions.</p>
          <div className="min-h-[4rem] p-2 bg-gray-800 rounded-md border border-cyan-700 flex flex-wrap gap-2 justify-center items-center">
            {recalledEmotions.map((emotion, i) => (
                <span key={i} className="px-3 py-1 bg-cyan-600 text-white rounded-md font-semibold capitalize">{emotion}</span>
            ))}
          </div>

           <div className="h-6 text-xl font-bold mt-2">
            {phase === 'feedback' && feedback && (
              <p className={cn(feedback.includes('Incorrect') ? 'text-red-400' : 'text-green-400', 'animate-in', 'fade-in')}>
                {feedback}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {puzzle.recallOptions.map((option, i) => (
                <Button key={`${option.emotionCategory}-${i}`} onClick={() => handleRecallClick(option.emotionCategory)} disabled={phase === 'feedback'} className="h-20 flex flex-col gap-1 capitalize">
                   <FaceSprite stimulus={option} showLabel={false} />
                   {option.emotionCategory}
                </Button>
            ))}
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleClear} variant="secondary" disabled={phase === 'feedback'}>Clear</Button>
            <Button onClick={handleSubmit} disabled={phase === 'feedback' || recalledEmotions.length === 0}>Submit</Button>
          </div>
        </div>
      );
    }

     if (phase === 'finished') {
        return (
            <div className="flex flex-col items-center gap-4">
                <CardTitle>Session Complete!</CardTitle>
                <Button onClick={() => onEvent({ type: 'START_SESSION' })} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Play Again</Button>
            </div>
        )
    }

  };

  return <CardContent className="flex flex-col items-center gap-6 min-h-[500px] justify-center">{renderContent()}</CardContent>
};

export default GwmEQRenderer;

    