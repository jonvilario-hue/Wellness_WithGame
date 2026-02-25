
'use client';

import React, { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder, Cone, Plane, useGLTF, Center, Grid, Environment } from '@react-three/drei';
import type { Mesh } from 'three';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GlrSpatialGameState, GlrSpatialGameEvent } from './GlrMemoryPalace';

type LandmarkProps = {
    position: [number, number, number];
    label: string;
    onClick: () => void;
    isInteractable: boolean;
    feedback?: 'correct' | 'incorrect';
    userSelection?: string;
    correctAnswer?: string;
};

const LandmarkComponent: React.FC<LandmarkProps> = ({ position, label, onClick, isInteractable, feedback, userSelection, correctAnswer }) => {
    const [hovered, setHovered] = useState(false);
    const color = feedback === 'correct' ? '#22c55e' : feedback === 'incorrect' ? '#ef4444' : hovered ? '#60a5fa' : '#3b82f6';
    const showFeedbackAnswer = feedback === 'incorrect';

    return (
        <group position={position}>
            <Cylinder 
                args={[1, 1, 0.2, 32]} 
                onClick={isInteractable ? onClick : undefined}
                onPointerOver={() => isInteractable && setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <meshStandardMaterial color={color} roughness={0.5} />
            </Cylinder>
            <Text position={[0, 0.5, 0]} fontSize={0.4} color="white">{label}</Text>
            {userSelection && (
                 <Text position={[0, 1.0, 0]} fontSize={0.35} color={feedback === 'correct' ? '#a3e635' : '#f87171'}>
                    Your answer: {userSelection}
                </Text>
            )}
            {showFeedbackAnswer && (
                 <Text position={[0, 1.4, 0]} fontSize={0.35} color="#a3e635">
                    Correct: {correctAnswer}
                </Text>
            )}
        </group>
    );
};

const PlacedObject = ({ objectId, position }: { objectId: string, position: [number, number, number] }) => {
    const scale = 0.4;
    return (
        <group position={position}>
            {objectId === 'Key' && <Box scale={scale}><meshStandardMaterial color="gold" /></Box>}
            {objectId === 'Book' && <Box scale={[scale, scale * 1.2, scale * 0.3]}><meshStandardMaterial color="saddlebrown" /></Box>}
            {objectId === 'Vase' && <Cylinder args={[scale * 0.5, scale * 0.3, scale * 1.5]}><meshStandardMaterial color="lightblue" /></Cylinder>}
            {objectId === 'Apple' && <Sphere scale={scale}><meshStandardMaterial color="red" /></Sphere>}
            {objectId === 'Cup' && <Cylinder args={[scale * 0.4, scale * 0.4, scale * 0.6]}><meshStandardMaterial color="white" /></Cylinder>}
            {objectId === 'Watch' && <Cylinder args={[scale * 0.5, scale * 0.5, scale * 0.1]}><meshStandardMaterial color="silver" /></Cylinder>}
            {objectId === 'Phone' && <Box scale={[scale * 0.5, scale, scale * 0.1]}><meshStandardMaterial color="black" /></Box>}
            {objectId === 'Pen' && <Cylinder args={[scale * 0.05, scale * 0.05, scale * 1.5]}><meshStandardMaterial color="blue" /></Cylinder>}
             <Text position={[0, 0.5, 0]} fontSize={0.3} color="white">{objectId}</Text>
        </group>
    )
}

const GlrSpatialRenderer: React.FC<{ gameState: GlrSpatialGameState; onEvent: (event: GlrSpatialGameEvent) => void; timeLeft: number }> = ({ gameState, onEvent, timeLeft }) => {
    const { phase, puzzle, userSelections, feedbackMap } = gameState;
    const [activeLandmark, setActiveLandmark] = useState<string | null>(null);

    const distractorOptions = useMemo(() => {
        if (!puzzle || !activeLandmark) return [];
        const placedObject = puzzle.objectsToPlace.find(o => o.landmarkId === activeLandmark);
        if (!placedObject) return [];

        const options = [placedObject.id];
        let i = 0;
        while (options.length < 4 && i < puzzle.distractorObjects.length) {
            if (!options.includes(puzzle.distractorObjects[i])) {
                options.push(puzzle.distractorObjects[i]);
            }
            i++;
        }
        return options.sort(() => Math.random() - 0.5);
    }, [puzzle, activeLandmark]);

    const renderPhaseContent = () => {
        if (!puzzle) return <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />;
        
        return (
            <div className="w-full h-[32rem] bg-gray-900 rounded-lg relative">
                <div className="absolute top-2 left-2 z-10 p-2 bg-black/50 rounded-lg font-mono text-xl">
                    <p className="uppercase text-emerald-400">{phase}</p>
                    {phase !== 'recall' && phase !== 'feedback' && <p>Time Left: {timeLeft}</p>}
                </div>
                 {(phase === 'delay') && (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <Loader2 className="w-16 h-16 animate-spin text-emerald-400" />
                        <p className="mt-4 text-lg">Distractor Task: Clearing working memory...</p>
                    </div>
                 )}
                 {(phase === 'encoding' || phase === 'recall' || phase === 'feedback') && (
                    <Canvas camera={{ position: [0, 5, 12], fov: 60 }}>
                        <Suspense fallback={null}>
                            <Environment preset="city" />
                            <Grid infiniteGrid sectionColor="#10b981" sectionSize={5} sectionThickness={1} fadeDistance={30} />
                            {puzzle.landmarks.map(landmark => (
                                <LandmarkComponent
                                    key={landmark.id}
                                    position={landmark.position}
                                    label={landmark.label}
                                    onClick={() => setActiveLandmark(landmark.id)}
                                    isInteractable={phase === 'recall'}
                                    feedback={feedbackMap[landmark.id]}
                                    userSelection={userSelections[landmark.id]}
                                    correctAnswer={phase === 'feedback' ? puzzle.objectsToPlace.find(o => o.landmarkId === landmark.id)?.id : undefined}
                                />
                            ))}
                            {phase === 'encoding' && puzzle.objectsToPlace.map(obj => {
                                const landmark = puzzle.landmarks.find(l => l.id === obj.landmarkId);
                                if (!landmark) return null;
                                return <PlacedObject key={obj.id} objectId={obj.id} position={[landmark.position[0], landmark.position[1] + 0.6, landmark.position[2]]} />
                            })}
                        </Suspense>
                        <OrbitControls />
                    </Canvas>
                 )}
            </div>
        )
    };

    return (
        <div className="w-full max-w-4xl flex flex-col items-center gap-4">
            {renderPhaseContent()}
            <div className="w-full text-center">
                {phase === 'recall' && (
                    <div className="flex items-center justify-center gap-4 p-2 bg-emerald-950 rounded-md">
                        <p className="text-lg font-semibold">Select a landmark and choose the object that was there.</p>
                        <DropdownMenu open={!!activeLandmark} onOpenChange={(open) => !open && setActiveLandmark(null)}>
                            <DropdownMenuTrigger asChild>
                                <Button className="w-48" variant="outline" disabled={!activeLandmark}>
                                    {activeLandmark ? `Object at ${activeLandmark}` : 'Select a Landmark'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuRadioGroup
                                    value={userSelections[activeLandmark!]}
                                    onValueChange={(value) => {
                                        onEvent({ type: 'SELECT_OBJECT', landmarkId: activeLandmark!, objectId: value });
                                        setActiveLandmark(null);
                                    }}
                                >
                                    {distractorOptions.map(opt => (
                                        <DropdownMenuRadioItem key={opt} value={opt}>{opt}</DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <Button onClick={() => onEvent({type: 'SUBMIT_RECALL'})} disabled={Object.keys(userSelections).length === 0}>
                            Submit All
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlrSpatialRenderer;
