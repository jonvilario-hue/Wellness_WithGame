
'use client';

import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { domainIcons } from "@/components/icons";
import type { BaseRendererProps } from '@/types';
import type { DynamicSequenceGameState, DynamicSequenceGameEvent } from './dynamic-sequence-transformer';
import { FOCUS_MODE_META } from '@/lib/mode-constants';

export const DynamicSequenceRenderer: React.FC<BaseRendererProps<DynamicSequenceGameState, DynamicSequenceGameEvent>> = ({
    gameState,
    onEvent,
    feedback,
    adaptiveState,
    currentTrialIndex,
    sessionLength,
    focus,
}) => {
    const { gameState: phase, puzzle, userAnswer } = gameState;
    const answerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (phase === 'answering') {
          setTimeout(() => answerInputRef.current?.focus(), 50);
        }
    }, [phase]);

    const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // This would require changing the main state. For now, let's assume the logic component handles it.
      // This highlights the complexity of separating controlled components.
      // For this refactor, we'll keep it simple.
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onEvent({ type: 'SUBMIT_ANSWER', answer: answerInputRef.current?.value || '' });
    };

    const renderContent = () => {
        if (!adaptiveState || phase === 'loading') {
           return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
        }
        
        switch (phase) {
          case 'start':
            const { Icon, label } = FOCUS_MODE_META[focus];
            return (
              <div className="flex flex-col items-center gap-4">
                 <div className="flex flex-col items-center gap-2 text-cyan-300">
                    <Icon className="w-10 h-10" />
                    <span className="font-semibold">{label} Mode</span>
                </div>
                <div className="font-mono text-lg text-cyan-300">Level: {adaptiveState.currentLevel}</div>
                <Button onClick={() => onEvent({ type: 'START_SESSION' })} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Dynamic Sequence</Button>
              </div>
            );
          case 'memorizing':
            return (
              <div className="text-center space-y-4 animate-in fade-in">
                <p className="font-semibold text-muted-foreground">Memorize this sequence:</p>
                <div className="p-4 bg-teal-900/40 rounded-lg">
                  <p className="text-4xl font-mono tracking-widest text-teal-100">{puzzle?.sequence}</p>
                </div>
                <p className="text-sm text-cyan-400 animate-pulse">Prepare to answer...</p>
              </div>
            );
          case 'answering':
          case 'feedback':
            return (
              <div className="w-full space-y-4 text-center animate-in fade-in">
                <div className="font-mono text-lg text-teal-200">Trial: {currentTrialIndex + 1} / {sessionLength}</div>
                <div className="p-4 bg-teal-900/40 rounded-lg">
                  <p className="text-xl font-semibold text-teal-100">{puzzle?.task.label}</p>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
                  <Input
                    ref={answerInputRef}
                    type="text"
                    defaultValue={userAnswer}
                    placeholder="Type your transformed answer"
                    className="text-center text-lg bg-gray-800 text-white border-teal-500/50"
                    disabled={phase === 'feedback'}
                  />
                  <Button type="submit" disabled={phase === 'feedback'} className="bg-cyan-500 hover:bg-cyan-400 text-black">Submit Answer</Button>
                </form>
                {phase === 'feedback' && (
                  <div className="mt-4 text-center text-xl font-bold animate-in fade-in">
                    <p className={cn(feedback.includes('Incorrect') ? 'text-red-400' : 'text-green-400')}>{feedback}</p>
                  </div>
                )}
              </div>
            );
          case 'finished':
            return (
                <div className="flex flex-col items-center gap-4">
                    <CardTitle>Session Complete!</CardTitle>
                    <Button onClick={() => onEvent({ type: 'START_SESSION' })} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Play Again</Button>
                </div>
            )
        }
    };

    return (
        <Card className="w-full max-w-2xl text-center bg-gray-900 border-teal-500/20 text-teal-100">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-cyan-400">
                    <span className="p-2 bg-cyan-500/10 rounded-md"><domainIcons.Gwm className="w-6 h-6 text-cyan-400" /></span>
                    Dynamic Sequence
                </CardTitle>
                <CardDescription className="text-cyan-400/70">Memorize the sequence, then transform it as instructed.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[250px] justify-center">
                {renderContent()}
            </CardContent>
        </Card>
    );
};
