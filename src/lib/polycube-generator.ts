
'use client';

import { PRNG } from './rng';
import type { GameId } from '@/types';
import { difficultyPolicies } from '@/data/difficulty-policies';

const GAME_ID: GameId = 'gv_visual_lab'; // Gv is the primary user of this
const policy = difficultyPolicies[GAME_ID];

export type Cube = { x: number; y: number; z: number };
export type Polycube = Cube[];

export type PolycubePuzzle = {
  tier: number;
  target: Polycube;
  options: { polycube: Polycube, index: number }[];
  correctIndex: number;
};

// --- Core Polycube Generation ---
const getNeighbors = (cube: Cube): Cube[] => [
  { x: cube.x + 1, y: cube.y, z: cube.z }, { x: cube.x - 1, y: cube.y, z: cube.z },
  { x: cube.x, y: cube.y + 1, z: cube.z }, { x: cube.x, y: cube.y - 1, z: cube.z },
  { x: cube.x, y: cube.y, z: cube.z + 1 }, { x: cube.x, y: cube.y, z: cube.z - 1 },
];

const createPolycube = (size: number, prng: PRNG): Polycube => {
  const polycube: Polycube = [{ x: 0, y: 0, z: 0 }];
  let openSet = getNeighbors({ x: 0, y: 0, z: 0 });

  while (polycube.length < size) {
    if (openSet.length === 0) break; // Should not happen with valid size
    const newCubeIndex = prng.nextIntRange(0, openSet.length);
    const newCube = openSet.splice(newCubeIndex, 1)[0];

    polycube.push(newCube);
    const newNeighbors = getNeighbors(newCube);

    openSet.push(...newNeighbors);
    openSet = openSet.filter((c1, index, self) => 
        !polycube.some(c2 => c1.x === c2.x && c1.y === c2.y && c1.z === c2.z) &&
        index === self.findIndex(c2 => c1.x === c2.x && c1.y === c2.y && c1.z === c2.z)
    );
  }
  return polycube;
};

// --- Transformation Functions ---
const rotateX = (p: Polycube): Polycube => p.map(c => ({ x: c.x, y: -c.z, z: c.y }));
const rotateY = (p: Polycube): Polycube => p.map(c => ({ x: -c.z, y: c.y, z: c.x }));
const rotateZ = (p: Polycube): Polycube => p.map(c => ({ x: -c.y, y: c.x, z: c.z }));
const mirrorX = (p: Polycube): Polycube => p.map(c => ({ x: -c.x, y: c.y, z: c.z }));

// Center the polycube around the origin
const normalizePolycube = (p: Polycube): Polycube => {
    const center = p.reduce((acc, c) => ({x: acc.x + c.x, y: acc.y + c.y, z: acc.z + c.z}), {x:0, y:0, z:0});
    center.x /= p.length;
    center.y /= p.length;
    center.z /= p.length;
    return p.map(c => ({ x: c.x - center.x, y: c.y - center.y, z: c.z - center.z }));
};

const arePolycubesEqual = (p1: Polycube, p2: Polycube): boolean => {
    if (p1.length !== p2.length) return false;
    const key1 = p1.map(c => `${c.x},${c.y},${c.z}`).sort().join(';');
    const key2 = p2.map(c => `${c.x},${c.y},${c.z}`).sort().join(';');
    return key1 === key2;
}

// --- Main Trial Generator ---
export const generateSpatialGvRotationTrial = (level: number, prng: PRNG): PolycubePuzzle => {
  const params = policy.levelMap[level]?.content_config['spatial']?.params || policy.levelMap[1].content_config['spatial']!.params;
  const { pieceCount } = params;

  // 1. Generate base shape
  const baseShape = createPolycube(pieceCount, prng);

  // 2. Create the correctly rotated target
  let target = [...baseShape];
  const numRotations = prng.nextIntRange(1, 4);
  const rotationFns = prng.shuffle([rotateX, rotateY, rotateZ]);
  for(let i=0; i<numRotations; i++) {
    target = rotationFns[i % rotationFns.length](target);
  }

  const options: Polycube[] = [target];
  const correctIndex = 0; // The first option is always the correct one before shuffling

  // 3. Generate distractors
  // Distractor 1: Mirror image
  let mirror = mirrorX(baseShape);
  const mirrorRotations = prng.nextIntRange(0, 4);
  for(let i=0; i<mirrorRotations; i++) {
    mirror = rotationFns[i % rotationFns.length](mirror);
  }
  if (!arePolycubesEqual(target, mirror)) {
    options.push(mirror);
  }

  // Distractor 2: Near-miss (one cube moved)
  let nearMiss = [...baseShape];
  const cubeToRemoveIndex = prng.nextIntRange(0, nearMiss.length);
  nearMiss.splice(cubeToRemoveIndex, 1)[0];
  const neighbors = getNeighbors(nearMiss[prng.nextIntRange(0, nearMiss.length)]).filter(n => !nearMiss.some(c => arePolycubesEqual([n], [c])));
  if(neighbors.length > 0) {
      const newPos = neighbors[prng.nextIntRange(0, neighbors.length)];
      nearMiss.push(newPos);
      options.push(nearMiss);
  }

  // Fill remaining options with other random shapes
  while(options.length < 4) {
      const randomShape = createPolycube(pieceCount, prng);
      if(!options.some(opt => arePolycubesEqual(opt, randomShape))) {
          options.push(randomShape);
      }
  }

  const finalOptions = prng.shuffle(options.map((polycube, index) => ({ polycube: normalizePolycube(polycube), index: index })));
  const finalCorrectIndex = finalOptions.findIndex(opt => opt.index === correctIndex);

  return {
    tier: level,
    target: normalizePolycube(baseShape),
    options: finalOptions,
    correctIndex: finalCorrectIndex,
  };
};
