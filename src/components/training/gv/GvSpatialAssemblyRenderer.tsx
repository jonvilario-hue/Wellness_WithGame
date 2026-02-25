
'use client';

import React, { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges, Center, Stage } from "@react-three/drei";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Puzzle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BaseRendererProps } from "@/types";
import type { GvSpatialAssemblyState, GvSpatialAssemblyEvent } from "./gv-spatial-assembly";
import type { Polycube } from "@/lib/polycube-generator";

const PolycubeObject = ({ polycube, color }: { polycube: Polycube, color: string }) => (
  <group>
    {polycube.map((cube, i) => (
      <mesh key={i} position={[cube.x, cube.y, cube.z]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.6} />
        <Edges scale={1} threshold={15} color="black" />
      </mesh>
    ))}
  </group>
);


export const GvSpatialAssemblyRenderer: React.FC<BaseRendererProps<GvSpatialAssemblyState, GvSpatialAssemblyEvent>> = ({
  gameState: { gameState, puzzle, selectedAnswer, feedbackMessage },
  onEvent,
  adaptiveState,
  currentTrialIndex,
  sessionLength
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        return () => {
          // Cleanup logic if needed
        };
    }, []);

  const renderContent = () => {
    if (gameState === 'loading' || !adaptiveState) return <Loader2 className="h-12 w-12 animate-spin text-lime-400" />;
    
    if (gameState === 'start') {
      return (
        <div className="flex flex-col items-center gap-4">
           <div className="font-mono text-lg">Level: {adaptiveState.currentLevel}</div>
          <Button onClick={() => onEvent({ type: 'START_SESSION' })} size="lg" className="bg-teal-600 hover:bg-teal-500 text-white">Start 3D Assembly</Button>
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
      <div className="w-full flex flex-col items-center gap-4">
        <div className="w-full flex justify-between font-mono text-sm text-gray-300">
          <span>Puzzle: {currentTrialIndex + 1} / {sessionLength}</span>
          <span>Tier: {puzzle.tier}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full items-center">
          {/* Target Object */}
          <div className="flex flex-col items-center gap-2">
            <h3 className="font-semibold text-gray-400">Target Shape</h3>
            <div className="w-full h-48 lg:h-64 bg-gray-900/70 rounded-lg border border-lime-500/30 p-2">
                <Canvas camera={{ position: [5, 5, 5], fov: 35 }}>
                    <Suspense fallback={null}>
                        <Stage environment="city" intensity={0.5} adjustCamera={false}>
                            <Center>
                                <PolycubeObject polycube={puzzle.target} color="#4ade80" />
                            </Center>
                        </Stage>
                    </Suspense>
                    <OrbitControls autoRotate autoRotateSpeed={1} enableZoom={false} enablePan={false} />
                </Canvas>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-col items-center gap-2">
            <h3 className="font-semibold text-gray-400">Which is the same shape?</h3>
            <div className="grid grid-cols-2 gap-2 w-full">
              {puzzle.options.map((opt: any, i: number) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className={cn(
                    "h-28 lg:h-32 p-1 bg-gray-900 border-lime-400/30 hover:bg-lime-900/50 relative",
                    selectedAnswer?.index === i && gameState !== 'feedback' && "ring-2 ring-lime-400",
                    gameState === 'feedback' && opt.index === puzzle.correctIndex && "bg-green-800/50 border-green-500",
                    gameState === 'feedback' && selectedAnswer?.index === i && i !== puzzle.correctIndex && "bg-rose-800/50 border-rose-500"
                  )}
                  onClick={() => onEvent({ type: 'SELECT_ANSWER', option: { polycube: opt.polycube, index: i } })}
                  disabled={gameState === 'feedback'}
                >
                  <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
                     <ambientLight intensity={0.6} />
                     <directionalLight position={[10, 10, 5]} />
                     <Suspense fallback={null}>
                       <PolycubeObject polycube={opt.polycube} color="#84cc16" />
                     </Suspense>
                     <OrbitControls enableZoom={false} enablePan={false} />
                  </Canvas>
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
    <Card className="w-full max-w-4xl bg-gray-950 border-lime-500/20 text-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-lime-300">
          <Puzzle /> (Gv) Spatial Assembly
        </CardTitle>
        <CardDescription className="text-lime-300/70">Mentally rotate the options to find the one that matches the target shape.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 min-h-[450px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
