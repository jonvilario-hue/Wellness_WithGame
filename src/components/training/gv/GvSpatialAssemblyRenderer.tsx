
'use client';

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseRendererProps } from "@/types";
import type { GvSpatialAssemblyState, GvSpatialAssemblyEvent } from "./gv-spatial-assembly";

export const GvSpatialAssemblyRenderer: React.FC<BaseRendererProps<GvSpatialAssemblyState, GvSpatialAssemblyEvent>> = ({
  gameState: { gameState, puzzle, answerOptions, selectedAnswer, feedbackMessage },
  onEvent,
  adaptiveState,
  currentTrialIndex,
  sessionLength
}) => {

  const renderContent = () => {
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-lime-400" />;
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
           <div className="font-mono text-lg">Level: {adaptiveState.currentLevel}</div>
          <Button onClick={() => onEvent({ type: 'START_SESSION' })} size="lg" className="bg-teal-600 hover:bg-teal-500 text-white">Start Assembly</Button>
        </div>
      );
    }
    
    if (gameState === 'finished') {
      return (
        <div className="text-center space-y-4">
          <CardTitle>Session Complete!</CardTitle>
          <Button onClick={() => onEvent({ type: 'START_SESSION' })} size="lg" className="bg-teal-600 hover:bg-teal-500 text-white">Play Again</Button>
        </div>
      );
    }
    
    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-lime-400" />;

    return (
      <div className="w-full flex flex-col items-center gap-6">
        <div className="w-full flex justify-between font-mono text-sm text-gray-300">
          <span>Puzzle: {currentTrialIndex + 1} / {sessionLength}</span>
          <span>Tier: {puzzle.tier}</span>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full items-center">
          <div className="flex flex-col items-center gap-4">
            <h3 className="font-semibold text-gray-400">Fragments</h3>
            <div className="w-48 h-48 bg-gray-900/70 rounded-lg border border-lime-500/30 p-4 relative">
              <div className="grid grid-cols-2 gap-2">
                {puzzle.fragments.map((frag: any, i: number) => (
                  <svg key={i} viewBox="0 0 110 110" className="w-16 h-16">
                    <path d={frag.d} transform={frag.t} fill="none" stroke="hsl(var(--primary))" strokeWidth="8" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <h3 className="font-semibold text-gray-400">Assemble into...</h3>
            <div className="grid grid-cols-1 gap-3">
              {answerOptions.map((opt: any, i: number) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className={cn(
                    "h-24 w-40 p-2 bg-gray-900 border-lime-400/30 hover:bg-lime-900/50",
                    gameState === 'feedback' && opt.d === puzzle.solution.d && "bg-green-500/30 border-green-400",
                    gameState === 'feedback' && selectedAnswer?.d === opt.d && opt.d !== puzzle.solution.d && "bg-rose-500/30 border-rose-500",
                    selectedAnswer?.d === opt.d && gameState !== 'feedback' && "bg-lime-900/50 ring-2 ring-lime-400"
                  )}
                  onClick={() => onEvent({ type: 'SELECT_ANSWER', option: opt })}
                  disabled={gameState === 'feedback'}
                >
                  <svg viewBox="-10 -10 120 120" className="w-full h-full">
                    <path d={opt.d} fill="hsl(var(--primary) / 0.5)" stroke="hsl(var(--primary))" strokeWidth="5" />
                  </svg>
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-6 mt-2 text-lg font-bold">
            {feedbackMessage && <p className={cn(feedbackMessage.includes('Incorrect') ? 'text-rose-500' : 'text-green-500')}>{feedbackMessage}</p>}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-2xl bg-gray-950 border-lime-500/20 text-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-lime-300">
          <Puzzle /> (Gv) Spatial Assembly
        </CardTitle>
        <CardDescription className="text-lime-300/70">Mentally rotate and combine the fragments to form the correct final shape.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[450px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
