
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseRendererProps } from "@/types";
import { domainIcons } from '@/components/icons';
import type { PatternMatrixState, PatternMatrixEvent } from "./pattern-matrix";
import { FOCUS_MODE_META } from '@/lib/mode-constants';

const LogicElement = ({ element }: { element: any }) => {
    if (!element || !element.value) return null;
    const isOperator = ['&&', '||', '!'].includes(element.value);
    const isKeyword = ['true', 'false', 'null', 'undefined', 'error'].includes(element.value);

    return (
        <div className={cn(
            "text-2xl font-mono",
            isOperator && "text-cyan-400",
            isKeyword && "text-purple-400",
            element.value === '?' && "text-blue-400 text-4xl animate-pulse"
        )}>
            {element.value}
        </div>
    );
};

const GfLogicRenderer: React.FC<BaseRendererProps<PatternMatrixState, PatternMatrixEvent>> = ({
  gameState: { gameState, puzzle, selectedOption },
  feedback,
  onEvent,
  adaptiveState,
  currentTrialIndex,
  sessionLength,
  focus
}) => {

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
          <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Start Logic Matrix</Button>
        </div>
      );
    }
    
    if (gameState === 'finished') {
      return (
        <div className="flex flex-col items-center gap-4">
          <CardTitle>Session Complete!</CardTitle>
          <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Play Again</Button>
        </div>
      );
    }
    
    if (!puzzle) return <div className="p-4 text-center text-amber-400"><AlertTriangle className="mx-auto mb-2"/>No puzzle available for this level/mode combination yet.</div>;

    if (puzzle.type === 'logic_matrix') {
        return (
            <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex justify-between w-full font-mono text-sm text-blue-200">
                    <span>Trial: {currentTrialIndex + 1} / {sessionLength}</span>
                    <span>Level: {adaptiveState.currentLevel}</span>
                </div>
                <p className="font-semibold text-center h-10">{puzzle.title}</p>

                <div className="grid grid-cols-4 gap-1 p-2 bg-slate-700/50 rounded-lg font-mono text-center">
                    <div className="p-2 font-bold">A</div>
                    <div className="p-2 font-bold">B</div>
                    <div className="p-2 font-bold">Operator</div>
                    <div className="p-2 font-bold">Output</div>
                    {puzzle.grid.flat().map((cell: any, index: number) => (
                        <div key={index} className="w-20 h-16 bg-slate-800 rounded-md flex items-center justify-center">
                            {cell && <LogicElement element={cell} />}
                        </div>
                    ))}
                </div>

                <div className="w-full mt-4">
                    <div className="h-6 text-sm font-semibold mb-2 text-center">
                        {feedback && (
                            <p className={cn("animate-in fade-in", feedback.type === 'failure' ? 'text-red-400' : 'text-green-400')}>{feedback.message}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {puzzle.options.map((option: any, index: number) => (
                        <button 
                            key={index} 
                            onClick={() => onEvent({ type: 'SELECT_OPTION', option })}
                            className={cn(
                                "h-20 bg-slate-700/50 rounded-lg flex items-center justify-center transition-all border-2",
                                selectedOption === option && gameState !== 'feedback' ? 'border-blue-400 scale-105' : 'border-transparent hover:border-slate-500/50',
                                gameState === 'feedback' && JSON.stringify(option) === JSON.stringify(puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                                gameState === 'feedback' && selectedOption === option && JSON.stringify(option) !== JSON.stringify(puzzle.answer) && 'bg-red-500/20 border-red-500',
                            )}
                            disabled={gameState === 'feedback'}
                        >
                            <LogicElement element={option} />
                        </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (puzzle.type === 'logic_sequence') {
        return (
             <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex justify-between w-full font-mono text-sm text-blue-200">
                    <span>Trial: {currentTrialIndex + 1} / {sessionLength}</span>
                    <span>Level: {adaptiveState.currentLevel}</span>
                </div>
                <p className="text-center font-semibold">{puzzle.title}</p>
                <div className="flex items-center justify-center gap-2 p-4 bg-slate-700/50 rounded-lg">
                    {puzzle.sequence.map((item: any, index: number) => (
                        <React.Fragment key={index}>
                           <div className="w-20 h-20 bg-slate-800 rounded-md flex items-center justify-center">
                             <LogicElement element={item} />
                           </div>
                           {index < puzzle.sequence.length -1 && <span className="text-xl text-slate-400">→</span>}
                        </React.Fragment>
                    ))}
                    <span className="text-xl text-slate-400">→</span>
                    <div className="w-20 h-20 bg-slate-900 border-2 border-dashed border-blue-400 rounded-md flex items-center justify-center text-4xl font-bold text-blue-400">?</div>
                </div>
                 <div className="w-full mt-4">
                     <div className="h-6 text-sm font-semibold mb-2 text-center">
                        {feedback && (
                            <p className={cn("animate-in fade-in", feedback.type === 'failure' ? 'text-red-400' : 'text-green-400')}>{feedback.message}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                         {puzzle.options.map((option: any, index: number) => (
                        <button 
                            key={index} 
                            onClick={() => onEvent({ type: 'SELECT_OPTION', option })}
                            className={cn(
                                "h-20 bg-slate-700/50 rounded-lg flex items-center justify-center transition-all border-2",
                                selectedOption === option && gameState !== 'feedback' ? 'border-blue-400 scale-105' : 'border-transparent hover:border-slate-500/50',
                                gameState === 'feedback' && JSON.stringify(option) === JSON.stringify(puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                                gameState === 'feedback' && selectedOption === option && JSON.stringify(option) !== JSON.stringify(puzzle.answer) && 'bg-red-500/20 border-red-500',
                            )}
                            disabled={gameState === 'feedback'}
                        >
                            <LogicElement element={option} />
                        </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return <div className="text-center text-amber-400"><AlertTriangle className="mx-auto mb-2"/>No renderer available for this puzzle type: '{puzzle.type}'.</div>
  };

  return (
    <Card className="w-full max-w-xl bg-slate-800 border-blue-500/30 text-slate-100">
        <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-blue-300">
                <span className="p-2 bg-blue-500/10 rounded-md"><domainIcons.Gf className="w-6 h-6 text-blue-400" /></span>
                Logic Matrix
            </CardTitle>
            <CardDescription className="text-center text-blue-300/70">Deduce the logical rule and find the missing piece.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 min-h-[600px] justify-center">
            {renderContent()}
        </CardContent>
    </Card>
  )
};

export default GfLogicRenderer;
