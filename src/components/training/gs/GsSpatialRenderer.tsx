
'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import type { Mesh } from 'three';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Polycube } from '@/lib/polycube-generator';

interface GsSpatialRendererProps {
    trial: {
        objectA: Polycube;
        objectB: Polycube;
    };
    onResponse: (answer: boolean) => void;
    timeLeft: number;
    score: number;
}

const PolycubeObject = ({ polycube }: { polycube: Polycube }) => {
    const groupRef = useRef<THREE.Group>(null!);
    useFrame((_, delta) => {
        if(groupRef.current) {
            groupRef.current.rotation.y += delta * 0.5;
            groupRef.current.rotation.x += delta * 0.2;
        }
    });

    return (
        <group ref={groupRef}>
            {polycube.map((cube, i) => (
                <mesh key={i} position={[cube.x, cube.y, cube.z]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#fb923c" roughness={0.6} />
                </mesh>
            ))}
        </group>
    );
};

const GsSpatialRenderer: React.FC<GsSpatialRendererProps> = ({ trial, onResponse, timeLeft, score }) => {
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') onResponse(true);
        if (e.key === 'ArrowRight') onResponse(false);
    };

    React.useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onResponse]);

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full flex justify-between font-mono text-lg text-orange-200">
                <span>Score: {score}</span>
                <span>Time: {timeLeft}s</span>
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4 h-64">
                <div className="bg-zinc-800/50 rounded-lg">
                    <Canvas camera={{ position: [3, 3, 3], fov: 35 }}>
                        <Suspense fallback={null}>
                             <Stage environment="city" intensity={0.5}>
                                <Center><PolycubeObject polycube={trial.objectA} /></Center>
                            </Stage>
                        </Suspense>
                    </Canvas>
                </div>
                <div className="bg-zinc-800/50 rounded-lg">
                     <Canvas camera={{ position: [3, 3, 3], fov: 35 }}>
                        <Suspense fallback={null}>
                            <Stage environment="city" intensity={0.5}>
                                <Center><PolycubeObject polycube={trial.objectB} /></Center>
                            </Stage>
                        </Suspense>
                    </Canvas>
                </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4">
                <Button onClick={() => onResponse(true)} className="h-20 text-2xl bg-orange-600 hover:bg-orange-500 text-white">
                    SAME
                    <kbd className="hidden md:inline ml-2 p-1 text-xs bg-zinc-700 rounded">←</kbd>
                </Button>
                 <Button onClick={() => onResponse(false)} className="h-20 text-2xl bg-orange-800 hover:bg-orange-700 text-white">
                    DIFFERENT
                    <kbd className="hidden md:inline ml-2 p-1 text-xs bg-zinc-700 rounded">→</kbd>
                </Button>
            </div>
        </div>
    );
};

export default GsSpatialRenderer;
