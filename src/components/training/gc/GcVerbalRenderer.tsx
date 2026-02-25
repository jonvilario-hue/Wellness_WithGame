
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { domainIcons } from "@/components/icons";
import type { BaseRendererProps } from '@/types';
import type { GcVerbalGameState, GcVerbalGameEvent } from './verbal-inference-builder';

export const GcVerbalRenderer: React.FC<BaseRendererProps<GcVerbalGameState, GcVerbalGameEvent>> = ({
  gameState,
  onEvent,
  feedback,
  adaptiveState,
  sessionLength,
  currentTrialIndex,
}) => {
  const { gameState: phase, puzzle, selectedAnswer } = gameState;

  const getButtonClass = (option: string) => {
    if (phase !== 'feedback' || !puzzle) return "bg-background";
    if (option === puzzle.answer) return "bg-green-600 hover:bg-green-700 text-white";
    if (option === selectedAnswer) return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
    return "bg-background";
  }

  const renderContent = () => {
    if (phase === 'loading') {
      return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
    if (phase === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="font-mono text-lg">Level: {adaptiveState?.currentLevel}</div>
          <Button onClick={() => onEvent({ type: 'START_SESSION' })} size="lg" disabled={!adaptiveState}>Verbal Inference Builder</Button>
        </div>
      );
    }
    if (phase === 'finished') {
       return (
        <div className="text-center space-y-4 animate-in fade-in">
          <CardTitle>Session Complete!</CardTitle>
          <Button onClick={() => onEvent({ type: 'START_SESSION' })} size="lg">Play Again</Button>
        </div>
      );
    }
    if (!puzzle) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;

    return (
      <>
        <div className="w-full flex justify-between font-mono text-sm">
          <span>Trial: {currentTrialIndex + 1} / {sessionLength}</span>
          <span>Level: {adaptiveState?.currentLevel}</span>
        </div>
        <div className="p-6 bg-muted rounded-lg w-full text-center min-h-[100px] flex items-center justify-center">
          <p className="text-lg md:text-xl font-medium">{puzzle.question}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {puzzle.options.map((option, index) => (
            <Button 
              key={index} 
              onClick={() => onEvent({ type: 'SUBMIT_ANSWER', answer: option })}
              disabled={phase === 'feedback'}
              size="lg"
              variant="outline"
              className={cn("h-auto py-3 whitespace-normal transition-all duration-300", getButtonClass(option))}
            >
              {option}
            </Button>
          ))}
        </div>
        <div className="h-16 mt-2 text-center">
          {phase === 'feedback' && feedback && (
            <div className="animate-in fade-in">
                <p className={cn("text-lg font-semibold", feedback.type === 'success' ? 'text-green-600' : 'text-amber-600')}>
                    {feedback.message}
                </p>
                <p className="text-sm text-muted-foreground">{puzzle.explanation}</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <Card className="w-full max-w-2xl bg-amber-900/10 border-amber-500/20 text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-amber-500">
            <span className="p-2 bg-amber-500/10 rounded-md"><domainIcons.Gc className="w-6 h-6 text-amber-400" /></span>
            Verbal Inference Builder
        </CardTitle>
        <CardDescription className="text-center text-amber-500/80">
            Deduce the meaning or relationship from the context provided.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[400px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
};
