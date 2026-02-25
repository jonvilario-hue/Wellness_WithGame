
'use client';

import { PRNG } from './rng';

export interface SpatialAudioPosition {
  id: string;
  x: number;
  y: number;
  z: number;
  frequency: number;
}

export interface SpatialAudioTrial {
  positions: SpatialAudioPosition[];
  sequence: string[]; // Array of position IDs
}

export const generateSpatialAudioTrial = (
  level: number,
  prng: PRNG
): SpatialAudioTrial => {
  const positionCount = level < 3 ? 4 : (level < 6 ? 6 : 8);
  const sequenceLength = level < 3 ? 3 : (level < 6 ? 5 : 7);
  const pitchSet = level < 3 
    ? [200, 400, 600, 800] 
    : (level < 6 ? [200, 275, 350, 425, 500, 575] : [200, 240, 280, 320, 360, 400, 440, 480]);

  const positions: SpatialAudioPosition[] = [];
  const angleStep = (2 * Math.PI) / positionCount;
  const radius = 5;

  for (let i = 0; i < positionCount; i++) {
    const angle = i * angleStep;
    positions.push({
      id: `pos-${i}`,
      x: radius * Math.cos(angle),
      y: level > 3 ? prng.nextFloat() * 4 - 2 : 0, // Add verticality at higher levels
      z: radius * Math.sin(angle),
      frequency: pitchSet[i % pitchSet.length],
    });
  }

  const sequence = Array.from({ length: sequenceLength }, () => {
    return `pos-${prng.nextIntRange(0, positionCount)}`;
  });

  return {
    positions: prng.shuffle(positions),
    sequence,
  };
};
