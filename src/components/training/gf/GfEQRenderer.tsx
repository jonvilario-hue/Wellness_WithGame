
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BaseRendererProps } from "@/types";
import { FOCUS_MODE_META } from '@/lib/mode-constants';
import type { PatternMatrixState, PatternMatrixEvent } from "./pattern-matrix";
import type { EQMatrixPuzzle } from '@/lib/gf-stimulus-factory';
import { Loader2 } from 'lucide-react';

const FaceStimulus = ({ stimulus }: { stimulus: any }) => {
  // Defense-in-depth: Ensure stimulus and emotion property exist.
  if (!stimulus || !stimulus.emotion) return null;
  
  // In a real implementation, this would use the sprite sheet.
  // For now, we use text placeholders.
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <span className="text-xl">{stimulus.emotion.charAt(0).toUpperCase() + stimulus.emotion.slice(1)}</span>
      <span className="text-xs text-slate-400">Intensity: {stimulus.intensity}</span>
    </div>
  );
};

export const GfEQRenderer: React.FC<BaseRendererProps<PatternMatrixState, PatternMatrixEvent>> = ({
  gameState: { gameState, puzzle, selectedOption },
  feedback,
  onEvent,
  adaptiveState,
  currentTrialIndex,
  sessionLength,
  focus
}) => {

  // This guard handles the race condition where the puzzle state from a previous
  // mode is still present when this renderer is mounted for the new mode.
  if (puzzle && puzzle.type !== 'eq') {
    return (
      <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
      </div>
    );
  }

  const eqPuzzle = puzzle as EQMatrixPuzzle | null;
  
  const renderContent = () => {
    if (!adaptiveState || gameState === 'loading') {
      return <Loader2 className="h-12 w-12 animate-spin text-blue-400" />;
    }
    
    if (gameState === 'start') {
      const { Icon, label } = FOCUS_MODE_META[focus];
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2 text-blue-300">
            <Icon className="w-10 h-10" />
            <span className="font-semibold">{label} Mode</span>
          </div>
          <div className="font-mono text-lg text-blue-300">Level: {adaptiveState.currentLevel}</div>
          <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Start Emotion Matrix</Button>
        </div>
      );
    }
    
    if (gameState === 'finished') {
      return (
        <div className="flex flex-col items-center gap-4">
          <p>Session Complete!</p>
          <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Play Again</Button>
        </div>
      );
    }
    
    if (!eqPuzzle) return <Loader2 className="h-12 w-12 animate-spin text-blue-400"/>;

    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex justify-between w-full font-mono text-sm text-blue-200">
          <span>Trial: {currentTrialIndex + 1} / {sessionLength}</span>
          <span>Level: {adaptiveState.currentLevel}</span>
        </div>
        <p className="font-semibold text-center">Rule Family: <span className="text-primary">{eqPuzzle.ruleFamily}</span></p>

        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-700/50 rounded-lg">
          {eqPuzzle.grid.map((cell, index) => (
            <div key={index} className="w-24 h-24 bg-slate-800 rounded-md flex items-center justify-center">
              {index === eqPuzzle.missingIndex ? (
                selectedOption ? <FaceStimulus stimulus={selectedOption} /> : <span className="text-4xl font-bold text-blue-400">?</span>
              ) : (
                cell && <FaceStimulus stimulus={cell} />
              )}
            </div>
          ))}
        </div>

        <div className="w-full">
          <div className="h-6 text-sm font-semibold mb-2 text-center">
            {feedback && (
              <p className={cn("animate-in fade-in", feedback.type === 'failure' ? 'text-red-400' : 'text-green-400')}>{feedback.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {eqPuzzle.options.map((option, index) => (
              <button 
                key={index} 
                onClick={() => onEvent({ type: 'SELECT_OPTION', option })}
                className={cn(
                  "h-24 bg-slate-800/80 rounded-lg flex items-center justify-center transition-all border-2",
                  selectedOption === option && gameState !== 'feedback' ? 'border-blue-400 scale-105' : 'border-transparent hover:border-slate-500/50',
                  gameState === 'feedback' && JSON.stringify(option) === JSON.stringify(eqPuzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                  gameState === 'feedback' && selectedOption === option && JSON.stringify(option) !== JSON.stringify(eqPuzzle.answer) && 'bg-red-500/20 border-red-500',
                )}
                disabled={gameState === 'feedback'}
              >
                <FaceStimulus stimulus={option} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return <>{renderContent()}</>
};

export default GfEQRenderer;
