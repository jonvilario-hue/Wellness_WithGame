
'use client';

import { PRNG } from './rng';
import type { GameId, TrainingFocus } from '@/types';
import { difficultyPolicies } from '@/data/difficulty-policies';

const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

export type CorsiBlock = {
  id: string;
  x: number;
  y: number;
  z: number;
};

export type CorsiBlockPuzzle = {
  type: 'spatial_corsi';
  blocks: CorsiBlock[];
  sequence: string[]; // Array of block IDs
  reverse: boolean;
};

export const generateCorsiBlockTrial = (
  level: number,
  prng: PRNG
): CorsiBlockPuzzle => {
    const levelParams = policy.levelMap[level]?.content_config['spatial']?.params || policy.levelMap[1].content_config['spatial']!.params;
    const { blockCount, spanLength, depthVariance, reverse } = levelParams;

    const blocks: CorsiBlock[] = [];
    const minDistance = 2.5; // Minimum distance between block centers

    for (let i = 0; i < blockCount; i++) {
        let x, y, z, validPosition;
        do {
            validPosition = true;
            x = prng.nextFloat() * 10 - 5;
            y = prng.nextFloat() * 8 - 4;
            z = prng.nextFloat() * (depthVariance * 2) - depthVariance;
            for (const block of blocks) {
                const dist = Math.sqrt(Math.pow(block.x - x, 2) + Math.pow(block.y - y, 2) + Math.pow(block.z - z, 2));
                if (dist < minDistance) {
                    validPosition = false;
                    break;
                }
            }
        } while (!validPosition);
        blocks.push({ id: `block-${i}`, x, y, z });
    }

    const sequence = prng.shuffle(blocks.map(b => b.id)).slice(0, spanLength);

    return {
        type: 'spatial_corsi',
        blocks,
        sequence,
        reverse,
    };
};
