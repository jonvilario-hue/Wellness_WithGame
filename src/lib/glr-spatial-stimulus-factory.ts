
'use client';

import { PRNG } from './rng';
import { realWords } from '@/data/verbal-content';

export interface Landmark {
    id: string;
    label: string;
    position: [number, number, number];
}

export interface PlacedObject {
    id: string;
    landmarkId: string;
}

export interface MemoryPalacePuzzle {
    landmarks: Landmark[];
    objectsToPlace: PlacedObject[];
    distractorObjects: string[];
    encodingDuration: number; // in ms
    delayDuration: number; // in ms
}

const landmarkPool: Landmark[] = [
    { id: 'table', label: 'Table', position: [-4, 0, 0] },
    { id: 'shelf', label: 'Bookshelf', position: [4, 0, 0] },
    { id: 'window', label: 'Window', position: [0, 2, -5] },
    { id: 'doorway', label: 'Doorway', position: [5, 0, 4] },
    { id: 'pillar', label: 'Pillar', position: [-4, 0, 4] },
    { id: 'painting', label: 'Painting', position: [0, 3, 5] },
    { id: 'plant', label: 'Plant', position: [4, 0, -4] },
    { id: 'chair', label: 'Chair', position: [-2, 0, 2] },
];

const objectPool = [
    'Key', 'Book', 'Vase', 'Apple', 'Cup', 'Watch', 'Phone', 'Pen',
    'Lamp', 'Goggles', 'Hat', 'Mask', 'Medal', 'Ring', 'Cube', 'Sphere'
];


export const generateMemoryPalaceTrial = (level: number, prng: PRNG): MemoryPalacePuzzle => {
    const landmarkCount = level < 3 ? 4 : (level < 6 ? 6 : 8);
    const objectCount = landmarkCount;
    const encodingDuration = 30000 - (level * 1000);
    const delayDuration = 10000 + (level * 2000);

    const selectedLandmarks = prng.shuffle(landmarkPool).slice(0, landmarkCount);
    const selectedObjects = prng.shuffle(objectPool).slice(0, objectCount);

    const objectsToPlace: PlacedObject[] = selectedLandmarks.map((landmark, index) => ({
        id: selectedObjects[index],
        landmarkId: landmark.id,
    }));

    const distractorObjects = prng.shuffle(objectPool.filter(obj => !selectedObjects.includes(obj)));

    return {
        landmarks: selectedLandmarks,
        objectsToPlace,
        distractorObjects,
        encodingDuration,
        delayDuration,
    };
};
