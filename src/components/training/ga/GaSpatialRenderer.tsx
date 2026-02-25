
'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Text, Line } from '@react-three/drei';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Ear, Play, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GaSpatialGameState } from './GaSpatialAudioGame';

interface RendererProps {
  gameState: GaSpatialGameState;
  onStartSession: () => void;
  onPositionClick: (id: string) => void;
  onSubmit: () => void;
  onReplay: () => void;
  onClear: () => void;
}

const PositionNode = ({ position, onClick, isActive, sequenceNumber }: { position: any, onClick: (id: string) => void, isActive: boolean, sequenceNumber?: number }) => {
  const isUserSelection = sequenceNumber !== undefined;
  return (
    <group position={[position.x, position.y, position.z]}>
      <Sphere
        args={[0.5, 32, 32]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(position.id);
        }}
        onPointerOver={(e) => (e.eventObject.parent.scale.set(1.2, 1.2, 1.2))}
        onPointerOut={(e) => (e.eventObject.parent.scale.set(1, 1, 1))}
      >
        <meshStandardMaterial
          color={isActive ? '#34d399' : (isUserSelection ? '#60a5fa' : '#4b5563')}
          emissive={isActive ? '#34d399' : (isUserSelection ? '#60a5fa' : '#4b5563')}
          emissiveIntensity={isActive || isUserSelection ? 0.8 : 0.2}
          roughness={0.4}
        />
      </Sphere>
      {isUserSelection && (
        <Text fontSize={0.5} position={[0, 0.8, 0]} color="white">
          {sequenceNumber}
        </Text>
      )}
    </group>
  );
};

const GaSpatialRenderer: React.FC<RendererProps> = ({
  gameState,
  onStartSession,
  onPositionClick,
  onSubmit,
  onReplay,
  onClear,
}) => {
  const { phase, trial, userSequence, feedbackMessage } = gameState;

  const renderContent = () => {
    if (phase === 'loading') {
      return <Loader2 className="w-12 h-12 animate-spin text-violet-400" />;
    }
    if (phase === 'start' || phase === 'finished') {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <CardTitle>{phase === 'finished' ? 'Session Complete!' : 'Auditory Spatial Tracer'}</CardTitle>
          <Button onClick={onStartSession} size="lg" className="bg-violet-600 hover:bg-violet-500 text-white">
            {phase === 'finished' ? 'Play Again' : 'Start Session'}
          </Button>
        </div>
      );
    }
    if (!trial) return <Loader2 className="w-12 h-12 animate-spin text-violet-400" />;

    return (
      <div className="flex flex-col items-center gap-4 w-full h-full">
        <p className="font-semibold">
          {phase === 'playback' ? 'Listen to the sequence...' : 'Reproduce the sequence.'}
        </p>
        <div className="w-full h-80 rounded-lg bg-gray-900/50">
          <Canvas camera={{ position: [0, 5, 12], fov: 60 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.3} />
              <pointLight position={[10, 10, 10]} intensity={0.8} />
              {trial.positions.map(pos => (
                <PositionNode 
                    key={pos.id} 
                    position={pos} 
                    onClick={onPositionClick}
                    isActive={phase === 'playback'}
                    sequenceNumber={userSequence.includes(pos.id) ? userSequence.indexOf(pos.id) + 1 : undefined}
                />
              ))}
              {userSequence.length > 1 && userSequence.map((id, i) => {
                  if (i === 0) return null;
                  const from = trial.positions.find(p => p.id === userSequence[i-1]);
                  const to = trial.positions.find(p => p.id === id);
                  if (!from || !to) return null;
                  return <Line key={i} points={[[from.x, from.y, from.z], [to.x, to.y, to.z]]} color="white" lineWidth={2} dashed dashScale={10} />
              })}
            </Suspense>
            <OrbitControls enablePan={true} enableZoom={true} />
          </Canvas>
        </div>

        <div className="h-6 text-lg font-bold text-center">
            {feedbackMessage && <p className={cn(feedbackMessage.includes('Incorrect') ? 'text-rose-400' : 'text-green-400')}>{feedbackMessage}</p>}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onReplay} disabled={phase !== 'response'}>
                <Play className="mr-2 h-4 w-4" /> Replay
            </Button>
            <Button onClick={onClear} variant="secondary" disabled={phase !== 'response' || userSequence.length === 0}>
                <RotateCcw className="mr-2 h-4 w-4" /> Clear
            </Button>
            <Button onClick={onSubmit} disabled={phase !== 'response' || userSequence.length === 0} className="bg-violet-600 hover:bg-violet-500">
                <Check className="mr-2 h-4 w-4" /> Submit
            </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-3xl bg-gray-900 border-violet-500/30 text-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
          <Ear /> (Ga) Spatial Sound Tracer
        </CardTitle>
        <CardDescription className="text-center text-violet-300/70">Listen to the sequence of spatialized tones and reconstruct the shape by clicking the spheres in the correct order.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 min-h-[550px] justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default GaSpatialRenderer;
