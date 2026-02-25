
'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Text } from '@react-three/drei';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, View, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseRendererProps } from '@/types';
import type { GwmGameState, GwmGameEvent } from './dynamic-sequence-transformer';
import type { CorsiBlock } from '@/lib/gwm-spatial-stimulus-factory';
import { FOCUS_MODE_META } from '@/lib/mode-constants';

const Block = ({ block, onBlockClick, isHighlighted, sequenceNumber, disabled }: { block: CorsiBlock, onBlockClick: (id: string) => void, isHighlighted: boolean, sequenceNumber?: number, disabled: boolean }) => {
    return (
        <group position={[block.x, block.y, block.z]}>
            <Sphere
                args={[0.5, 32, 32]}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onBlockClick(block.id);
                }}
            >
                <meshStandardMaterial
                    color={isHighlighted ? '#34d399' : (sequenceNumber ? '#3b82f6' : '#4b5563')}
                    emissive={isHighlighted ? '#34d399' : (sequenceNumber ? '#3b82f6' : '#4b5563')}
                    emissiveIntensity={isHighlighted || !!sequenceNumber ? 0.8 : 0.2}
                    roughness={0.4}
                />
            </Sphere>
            {sequenceNumber !== undefined && (
                <Text fontSize={0.5} position={[0, 0.8, 0]} color="white" anchorX="center">
                    {sequenceNumber}
                </Text>
            )}
        </group>
    );
};

export const GwmSpatialRenderer: React.FC<BaseRendererProps<GwmGameState, GwmGameEvent>> = ({
  gameState: { gameState, puzzle, userAnswer },
  onEvent,
  feedback,
  adaptiveState,
  currentTrialIndex,
  sessionLength,
  focus
}) => {
    const [highlightedBlock, setHighlightedBlock] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (gameState === 'memorizing' && puzzle?.type === 'spatial_corsi') {
            let i = 0;
            const interval = setInterval(() => {
                if (i < puzzle.sequence.length) {
                    setHighlightedBlock(puzzle.sequence[i]);
                    i++;
                } else {
                    clearInterval(interval);
                    setHighlightedBlock(null);
                }
            }, 800);
            return () => clearInterval(interval);
        }
    }, [gameState, puzzle]);

  const renderContent = () => {
    if (!adaptiveState || gameState === 'loading') {
      return <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />;
    }
    
    if (gameState === 'start') {
        const { Icon, label } = FOCUS_MODE_META[focus];
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2 text-cyan-300">
                    <Icon className="w-10 h-10" />
                    <span className="font-semibold">{label} Mode</span>
                </div>
                <div className="font-mono text-lg text-cyan-300">Level: {adaptiveState.currentLevel}</div>
                <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Start 3D Corsi Task</Button>
            </div>
        );
    }
    
    if (gameState === 'finished') {
      return (
        <div className="flex flex-col items-center gap-4">
          <CardTitle>Session Complete!</CardTitle>
          <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white">Play Again</Button>
        </div>
      );
    }
    
    if (!puzzle || puzzle.type !== 'spatial_corsi') return <Loader2 className="animate-spin text-cyan-400"/>;

    return (
      <div className="flex flex-col items-center gap-4 w-full h-full">
        <div className="w-full flex justify-between font-mono text-sm text-cyan-200 px-4">
          <span>Trial: {currentTrialIndex + 1} / {sessionLength}</span>
          <span>Span: {puzzle.sequence.length}</span>
        </div>

        <p className="font-semibold text-center h-6">
            {gameState === 'memorizing' && 'Memorize the sequence...'}
            {gameState === 'answering' && 'Recall the sequence.'}
            {gameState === 'feedback' && feedback}
        </p>

        <div className="w-full h-96 rounded-lg bg-gray-900/50">
           <Canvas camera={{ position: [0, 0, 18], fov: 50 }}>
             <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                
                {puzzle.blocks.map(block => (
                    <Block 
                        key={block.id} 
                        block={block}
                        onBlockClick={(id) => onEvent({ type: 'SUBMIT_ANSWER', answer: [...(userAnswer as string[]), id]})}
                        isHighlighted={highlightedBlock === block.id}
                        sequenceNumber={Array.isArray(userAnswer) && userAnswer.includes(block.id) ? userAnswer.indexOf(block.id) + 1 : undefined}
                        disabled={gameState !== 'answering'}
                    />
                ))}
            </Suspense>
            <OrbitControls enablePan={true} enableZoom={true} />
          </Canvas>
        </div>
        
         <div className="flex gap-4">
            <Button onClick={() => onEvent({ type: 'SUBMIT_ANSWER', answer: []})} variant="secondary" disabled={gameState !== 'answering'}>Clear</Button>
            <Button onClick={() => onEvent({ type: 'SUBMIT_ANSWER', answer: userAnswer })} disabled={gameState !== 'answering' || userAnswer.length === 0}>Submit</Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-3xl bg-gray-900 border-cyan-500/30 text-cyan-100">
        <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-cyan-300">
                <span className="p-2 bg-cyan-500/10 rounded-md"><Brain className="w-6 h-6 text-cyan-400" /></span>
                3D Spatial Span
            </CardTitle>
            <CardDescription className="text-center text-cyan-300/70">Observe the sequence of flashing blocks, then repeat it by clicking them in the same order.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 min-h-[600px] justify-center">
            {renderContent()}
        </CardContent>
    </Card>
  );
};

export default GwmSpatialRenderer;
