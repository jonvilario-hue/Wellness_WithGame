
'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Center, Text3D } from '@react-three/drei';
import type { Mesh } from 'three';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseRendererProps } from "@/types";
import { domainIcons } from '@/components/icons';
import type { PatternMatrixState, PatternMatrixEvent, SpatialObject } from "./pattern-matrix";
import { FOCUS_MODE_META } from '@/lib/mode-constants';

// --- 3D Shape Components ---
const Shape: React.FC<{ object: SpatialObject }> = ({ object }) => {
    const meshRef = useRef<Mesh>(null!);
    useFrame(() => {
        if(meshRef.current) {
            // Can add animations here if needed
        }
    });

    return (
        <mesh ref={meshRef} scale={object.scale} rotation={object.rotation}>
            {object.shape === 'box' && <boxGeometry />}
            {object.shape === 'sphere' && <sphereGeometry args={[0.6]} />}
            {object.shape === 'cone' && <coneGeometry args={[0.6, 1.2, 32]} />}
            {object.shape === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />}
            <meshStandardMaterial color={object.color} />
        </mesh>
    );
};

// --- Main Renderer Component ---
const GfSpatialRenderer: React.FC<BaseRendererProps<PatternMatrixState, PatternMatrixEvent>> = ({
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
          <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">Start Spatial Matrix</Button>
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
    
    if (!puzzle || puzzle.type !== 'spatial') return <Loader2 className="animate-spin text-blue-400"/>;

    return (
      <div className="flex flex-col items-center gap-4 w-full h-full">
        <div className="flex justify-between w-full font-mono text-sm text-blue-200">
          <span>Trial: {currentTrialIndex + 1} / {sessionLength}</span>
          <span>Level: {adaptiveState.currentLevel}</span>
        </div>

        {/* 3D Grid */}
        <div className="w-full h-80 bg-slate-900/50 rounded-lg">
          <Canvas camera={{ position: [0, 4.5, 9], fov: 50 }}>
            <Suspense fallback={null}>
                <Stage environment="city" intensity={0.5} adjustCamera={false}>
                    <Center>
                        <group>
                            {puzzle.grid.map((cell: SpatialObject | null, index: number) => {
                                if (!cell) return (
                                    <mesh key={index} position={[(index % 3 - 1) * 2.5, -(Math.floor(index / 3) - 1) * 2.5, 0]}>
                                        <boxGeometry args={[1.5, 1.5, 0.2]} />
                                        <meshStandardMaterial color="hsl(var(--primary))" emissive="hsl(var(--primary))" emissiveIntensity={0.5} toneMapped={false} />
                                    </mesh>
                                );
                                return (
                                    <group key={index} position={[(index % 3 - 1) * 2.5, -(Math.floor(index / 3) - 1) * 2.5, 0]}>
                                        <Shape object={cell} />
                                    </group>
                                );
                            })}
                        </group>
                    </Center>
                </Stage>
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.2} />
          </Canvas>
        </div>

        {/* Options */}
        <div className="w-full">
          <h3 className="text-center text-sm text-slate-300 font-semibold mb-2">Choose the correct piece:</h3>
          <div className="h-6 text-sm font-semibold mb-2 text-center">
            {feedback && (
              <p className={cn("animate-in fade-in", feedback.type === 'failure' ? 'text-red-400' : 'text-green-400')}>{feedback.message}</p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {puzzle.options.map((option: any, index: number) => (
              <Button 
                key={index} 
                onClick={() => onEvent({ type: 'SELECT_OPTION', option })}
                className={cn(
                  "h-24 bg-slate-800/80 rounded-lg transition-all border-2",
                  selectedOption === option && gameState !== 'feedback' ? 'border-blue-400 scale-105' : 'border-transparent hover:border-slate-500/50',
                  gameState === 'feedback' && JSON.stringify(option) === JSON.stringify(puzzle.answer) && 'bg-green-500/20 border-green-500 animate-pulse',
                  gameState === 'feedback' && selectedOption === option && JSON.stringify(option) !== JSON.stringify(puzzle.answer) && 'bg-red-500/20 border-red-500',
                )}
                disabled={gameState === 'feedback'}
              >
                  <Canvas camera={{ position: [0, 0, 3], fov: 35 }}>
                      <ambientLight intensity={0.8} />
                      <directionalLight position={[5, 5, 5]} />
                       <Suspense fallback={null}>
                          <Shape object={option} />
                       </Suspense>
                  </Canvas>
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-xl bg-slate-800 border-blue-500/30 text-slate-100">
        <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-blue-300">
                <span className="p-2 bg-blue-500/10 rounded-md"><domainIcons.Gf className="w-6 h-6 text-blue-400" /></span>
                Spatial Matrix
            </CardTitle>
            <CardDescription className="text-center text-blue-300/70">Deduce the spatial pattern and find the missing object.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 min-h-[600px] justify-center">
            {renderContent()}
        </CardContent>
    </Card>
  );
};

export default GfSpatialRenderer;
