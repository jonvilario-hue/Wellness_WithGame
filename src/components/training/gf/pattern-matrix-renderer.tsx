
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, PieChart } from "lucide-react";
import type { AdaptiveState } from "@/types";
import { CardTitle } from '@/components/ui/card';

const ElementComponent = ({ element }: { element: any }) => {
    if (!element) return null;
    if (element.type === 'verbal') {
        return <div className="text-2xl font-semibold text-blue-300">{element.value}</div>;
    }
    if(element.type === 'probability_sample') {
        return <div className="text-3xl font-bold text-blue-300">{element.value}%</div>
    }
    if (element.type === 'math') {
      return <div className={cn("text-4xl font-bold text-blue-300")}>{element.value}</div>;
    }
     if (element.type === 'music') {
        return <div className="text-3xl font-bold text-blue-300">♪</div>
    }

    // Default Neutral Element
    const { shape, color, rotation, fill } = element;
    const baseClasses = "w-10 h-10 transition-all";
    const style = { transform: `rotate(${rotation}deg)` };
    
    const colorMap: Record<string, string> = {
        'bg-primary': 'bg-blue-400',
        'bg-accent': 'bg-cyan-400',
        'bg-chart-3': 'bg-slate-400',
        'bg-chart-4': 'bg-blue-300',
    };
    const mappedColor = colorMap[color] || 'bg-blue-400';
    const outlineClasses = `bg-transparent border-4 ${mappedColor.replace('bg-','border-')}`;

    if (shape === 'circle') return <div className={cn(baseClasses, "rounded-full", fill === 'fill' ? mappedColor : outlineClasses)} style={style} />;
    if (shape === 'square') return <div className={cn(baseClasses, "rounded-md", fill === 'fill' ? mappedColor : outlineClasses)} style={style} />;
    if (shape === 'triangle') {
        if (fill === 'fill') {
            const triangleColorClass = mappedColor.replace('bg-', 'border-b-');
            const triangleStyle = { ...style, width: 0, height: 0, borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottomWidth: '40px', borderBottomStyle: 'solid' };
            return <div style={triangleStyle} className={cn("!bg-transparent", triangleColorClass, 'h-auto w-auto')} />;
        }
        return <div className="w-10 h-10" style={style}> <svg viewBox="0 0 100 100" className={`fill-transparent ${mappedColor.replace('bg-', 'stroke-')}`} strokeWidth="10"><polygon points="50,10 90,90 10,90" /></svg></div>
    }
    if (shape === 'diamond') return <div className={cn(baseClasses, "transform rotate-45 rounded-sm", fill === 'fill' ? mappedColor : outlineClasses)} style={{ transform: `rotate(${rotation + 45}deg)` }}/>;
    return <div className={cn(baseClasses, mappedColor)} />;
};

export interface PatternMatrixRendererProps {
  gameState: 'loading' | 'start' | 'playing' | 'feedback' | 'finished';
  puzzle: any;
  selectedOption: any;
  feedback: string;
  isAudioReady: boolean;
  isComponentLoaded: boolean;
  currentMode: string;
  adaptiveState: AdaptiveState | null;
  currentTrialIndex: number;
  sessionLength: number;
  onStartSession: () => void;
  onSelectOption: (option: any) => void;
}

export const PatternMatrixRenderer: React.FC<PatternMatrixRendererProps> = ({
  gameState,
  puzzle,
  selectedOption,
  feedback,
  isAudioReady,
  isComponentLoaded,
  currentMode,
  adaptiveState,
  currentTrialIndex,
  sessionLength,
  onStartSession,
  onSelectOption,
}) => {
  if (!isComponentLoaded) {
    return <Loader2 className="h-12 w-12 animate-spin text-blue-400" />;
  }
  
  switch (gameState) {
    case 'loading':
      return <Loader2 className="h-12 w-12 animate-spin text-blue-400" />;
    case 'start':
      if (currentMode === 'music' && !isAudioReady) {
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground">Audio required for this mode.</p>
            <Button onClick={onStartSession} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Tap to Enable Audio & Start</Button>
          </div>
        )
      }
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="font-mono text-lg text-blue-300">Level: {adaptiveState?.currentLevel}</div>
          <Button onClick={onStartSession} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Pattern Matrix</Button>
        </div>
      );
    case 'finished':
      return (
        <div className="flex flex-col items-center gap-4">
          <CardTitle>Session Complete!</CardTitle>
          <p>Your performance has been logged.</p>
          <Button onClick={onStartSession} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Play Again</Button>
        </div>
      );
    case 'playing':
    case 'feedback':
      if (!puzzle) return <Loader2 className="animate-spin text-blue-400"/>;
      const gridClass = puzzle.size === 3 ? "grid-cols-3" : (puzzle.size === 2 ? "grid-cols-2" : "grid-cols-1");

      if (puzzle.type === 'probability') {
          return (
              <div className="flex flex-col items-center gap-6 w-full">
                  <div className="flex justify-between w-full font-mono text-sm text-blue-200">
                      <span>Trial: {currentTrialIndex + 1} / {sessionLength}</span>
                      <span>Level: {adaptiveState?.currentLevel}</span>
                  </div>
                  <div className="text-center">
                      <p className="text-slate-300 mb-2">A sample was drawn from a hidden population.</p>
                      <div className="flex items-center justify-center gap-4 p-4 bg-slate-700 rounded-lg">
                          <PieChart className="w-10 h-10 text-blue-400" />
                          <p className="text-3xl font-bold">Sample has {puzzle.grid[0].value}% blue items.</p>
                      </div>
                      <p className="text-slate-300 mt-4">Which population was it most likely drawn from?</p>
                  </div>
                  <div className="h-6 text-sm font-semibold mb-2 text-center">
                      {feedback && (
                          <p className={cn("animate-in fade-in", feedback.includes('Incorrect') ? 'text-red-400' : 'text-green-400')}>{feedback}</p>
                      )}
                  </div>
                   <div className="grid grid-cols-4 gap-3">
                      {puzzle.options.map((option: any, index: number) => (
                      <button 
                          key={index} 
                          onClick={() => onSelectOption(option)}
                          className={cn(
                          "h-24 bg-slate-700/50 rounded-lg flex items-center justify-center transition-all border-2",
                          selectedOption === option && gameState !== 'feedback' ? 'border-blue-400 scale-105' : 'border-transparent hover:border-slate-500/50',
                          gameState === 'feedback' && JSON.stringify(option) === JSON.stringify(puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                          gameState === 'feedback' && selectedOption === option && JSON.stringify(option) !== JSON.stringify(puzzle.answer) && 'bg-red-500/20 border-red-500',
                          )}
                          disabled={gameState === 'feedback'}
                      >
                          <ElementComponent element={option} />
                      </button>
                      ))}
                  </div>
              </div>
          )
      }

      return (
          <div className="flex flex-col items-center gap-6 w-full">
               <div className="flex justify-between w-full font-mono text-sm text-blue-200">
                  <span>Trial: {currentTrialIndex + 1} / {sessionLength}</span>
                  <span>Level: {adaptiveState?.currentLevel}</span>
              </div>
              <div className={cn("grid gap-2 p-3 bg-slate-700/50 rounded-lg", gridClass)}>
              {puzzle.grid.map((cell: any, index: number) => (
                  <div key={index} className="w-20 h-20 bg-slate-800 rounded-md flex items-center justify-center">
                  {index === puzzle.missingIndex ? (
                      selectedOption ? <ElementComponent element={selectedOption} /> : <span className="text-4xl font-bold text-blue-400">?</span>
                  ) : (
                      cell && <ElementComponent element={cell} />
                  )}
                  </div>
              ))}
              </div>
              <div className="w-full">
                  <h3 className="text-center text-sm text-slate-300 font-semibold mb-2">Choose the correct piece:</h3>
                  <div className="h-6 text-sm font-semibold mb-2 text-center">
                      {feedback && (
                          <p className={cn("animate-in fade-in", feedback.includes('Incorrect') ? 'text-red-400' : 'text-green-400')}>{feedback}</p>
                      )}
                  </div>
                  <div className={cn("grid gap-3", puzzle.type === 'verbal' || puzzle.type === 'music' ? 'grid-cols-2' : 'grid-cols-3')}>
                      {puzzle.options.map((option: any, index: number) => (
                      <button 
                          key={index} 
                          onClick={() => onSelectOption(option)}
                          className={cn(
                          "h-24 bg-slate-700/50 rounded-lg flex items-center justify-center transition-all border-2",
                          selectedOption === option && gameState !== 'feedback' ? 'border-blue-400 scale-105' : 'border-transparent hover:border-slate-500/50',
                          gameState === 'feedback' && JSON.stringify(option) === JSON.stringify(puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                          gameState === 'feedback' && selectedOption === option && JSON.stringify(option) !== JSON.stringify(puzzle.answer) && 'bg-red-500/20 border-red-500',
                          )}
                          disabled={gameState === 'feedback'}
                      >
                          <ElementComponent element={option} />
                      </button>
                      ))}
                  </div>
              </div>
          </div>
      );
    default:
        return null;
    }
};

