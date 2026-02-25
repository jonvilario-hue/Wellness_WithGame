
'use client';

import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import type { Mesh } from 'three';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseRendererProps } from "@/types";
import { domainIcons } from '@/components/icons';
import type { GcVerbalGameState, GcVerbalGameEvent } from './verbal-inference-builder';
import type { GcSpatialPuzzleNode } from '@/lib/gc-spatial-stimulus-factory';

const Node: React.FC<{ node: GcSpatialPuzzleNode, onNodeClick: (node: GcSpatialPuzzleNode) => void, isSelected: boolean, isCorrect: boolean, isIncorrect: boolean, disabled: boolean }> = ({ node, onNodeClick, isSelected, isCorrect, isIncorrect, disabled }) => {
    const meshRef = useRef<Mesh>(null!);
    
    useFrame(({ clock }) => {
        if(meshRef.current) {
            meshRef.current.position.y += Math.sin(clock.getElapsedTime() + node.position[0]) * 0.002;
        }
    });

    const color = useMemo(() => {
        if(isCorrect) return '#22c55e'; // green-500
        if(isIncorrect) return '#ef4444'; // red-500
        if(isSelected) return '#3b82f6'; // blue-500
        return '#f59e0b'; // amber-500
    }, [isSelected, isCorrect, isIncorrect]);

    return (
        <group position={node.position}>
            <mesh 
                ref={meshRef} 
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onNodeClick(node);
                }}
            >
                <sphereGeometry args={[0.4, 32, 32]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} emissive={color} emissiveIntensity={isSelected || isCorrect || isIncorrect ? 0.5 : 0.1} />
            </mesh>
            <Text
                position={[0, 0.6, 0]}
                fontSize={0.25}
                color="white"
                anchorX="center"
                anchorY="middle"
                maxWidth={3}
                textAlign='center'
            >
                {node.label}
            </Text>
        </group>
    );
};


const GcSpatialRenderer: React.FC<BaseRendererProps<GcVerbalGameState, GcVerbalGameEvent>> = ({
  gameState: { gameState, puzzle, selectedAnswer },
  onEvent,
  adaptiveState,
  currentTrialIndex,
  sessionLength
}) => {

  const renderContent = () => {
    if (!adaptiveState || gameState === 'loading') {
      return <Loader2 className="h-12 w-12 animate-spin text-amber-400" />;
    }
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="font-mono text-lg text-amber-300">Level: {adaptiveState.currentLevel}</div>
          <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-amber-600 hover:bg-amber-500 text-white">Start Spatial Concepts</Button>
        </div>
      );
    }
    
    if (gameState === 'finished') {
      return (
        <div className="flex flex-col items-center gap-4">
          <CardTitle>Session Complete!</CardTitle>
          <Button onClick={() => onEvent({type: 'START_SESSION'})} size="lg" className="bg-amber-600 hover:bg-amber-500 text-white">Play Again</Button>
        </div>
      );
    }
    
    if (!puzzle || puzzle.type !== 'spatial_concept_map') return <Loader2 className="animate-spin text-amber-400"/>;
    const spatialPuzzle = puzzle;

    return (
      <div className="flex flex-col items-center gap-4 w-full h-full">
        <div className="w-full flex justify-between font-mono text-sm text-amber-200 px-4">
          <span>Trial: {currentTrialIndex + 1} / {sessionLength}</span>
          <span>Level: {adaptiveState.currentLevel}</span>
        </div>

        <div className="p-2 bg-slate-900/50 rounded-lg w-full text-center">
            <p className="text-sm font-semibold text-amber-300">Find the concept:</p>
            <p className="text-base text-slate-100">{spatialPuzzle.targetDescription}</p>
        </div>

        <div className="w-full h-96 rounded-lg bg-slate-900/50">
           <Canvas camera={{ position: [0, 0, 18], fov: 50 }}>
             <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                
                {spatialPuzzle.nodes.map(node => (
                    <Node 
                        key={node.id} 
                        node={node}
                        onNodeClick={(n) => onEvent({ type: 'SUBMIT_ANSWER', answer: n })}
                        isSelected={selectedAnswer?.id === node.id}
                        isCorrect={gameState === 'feedback' && node.isCorrect}
                        isIncorrect={gameState === 'feedback' && selectedAnswer?.id === node.id && !node.isCorrect}
                        disabled={gameState === 'feedback'}
                    />
                ))}

                {spatialPuzzle.edges.map((edge, i) => {
                    const fromNode = spatialPuzzle.nodes.find(n => n.id === edge.from);
                    const toNode = spatialPuzzle.nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;
                    return (
                        <Line
                            key={i}
                            points={[fromNode.position, toNode.position]}
                            color="white"
                            lineWidth={1}
                            dashed
                            dashScale={10}
                            opacity={0.2}
                        />
                    );
                })}
            </Suspense>
            <OrbitControls enablePan={true} enableZoom={true} />
          </Canvas>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-3xl bg-slate-800 border-amber-500/30 text-slate-100">
        <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-amber-300">
                <span className="p-2 bg-amber-500/10 rounded-md"><domainIcons.Gc className="w-6 h-6 text-amber-400" /></span>
                Spatial Concept Map
            </CardTitle>
            <CardDescription className="text-center text-amber-300/70">Navigate the 3D graph to find the word that matches the definition.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 min-h-[600px] justify-center">
            {renderContent()}
        </CardContent>
    </Card>
  );
};

export default GcSpatialRenderer;
