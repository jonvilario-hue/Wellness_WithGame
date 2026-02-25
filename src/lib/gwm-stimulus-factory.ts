

'use client';

import { PRNG } from './rng';
import { difficultyPolicies } from '@/data/difficulty-policies';
import type { GameId } from '@/types';

const GAME_ID: GameId = 'gwm_dynamic_sequence';
const policy = difficultyPolicies[GAME_ID];

// --- SPATIAL MODE ---
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


// --- EQ MODE ---

const emotions = ["happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral", "contemptuous"];
const faceIdentities = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

type EQStimulus = {
    emotionCategory: string;
    intensity: number;
    faceId: string;
    valence: number;
    arousal: number;
    sprite: {
        sheetUrl: string;
        coords: { x: number, y: number, w: number, h: number };
    };
};

export type EQFacePuzzle = {
    type: 'eq_face_sequence';
    sequence: EQStimulus[];
    recallOptions: EQStimulus[];
    correctAnswer: string[];
    presentationRate: number;
    labelShown: boolean;
    recallDelay: number;
};

export const generateEQFaceSequence = (level: number, prng: PRNG): EQFacePuzzle => {
    const levelParams = policy.levelMap[level]?.content_config['eq']?.params;
    if (!levelParams) {
        throw new Error(`EQ mode params not found for Gwm level ${level}`);
    }

    const { sequence_length, presentation_rate_ms, recall_delay_ms, lure_emotion_count, label_shown } = levelParams;
    
    const sequence: EQStimulus[] = [];
    const usedEmotions = new Set<string>();

    for (let i = 0; i < sequence_length; i++) {
        let emotion;
        do {
            emotion = prng.shuffle(emotions)[0];
        } while (usedEmotions.has(emotion) && usedEmotions.size < emotions.length);
        
        usedEmotions.add(emotion);

        sequence.push({
            emotionCategory: emotion,
            intensity: prng.nextFloat(),
            faceId: prng.shuffle(faceIdentities)[0],
            valence: (prng.nextFloat() * 2) - 1, // Placeholder
            arousal: prng.nextFloat(), // Placeholder
            sprite: {
                sheetUrl: '/assets/sprites/faces-sheet.png', // Placeholder URL
                coords: { x: (emotions.indexOf(emotion) % 4 * 128), y: (Math.floor(emotions.indexOf(emotion) / 4) * 128), w: 128, h: 128 },
            },
        });
    }

    const correctAnswer = sequence.map(s => s.emotionCategory);
    const recallOptionsSet = new Set<string>(correctAnswer);
    const lurePool = emotions.filter(e => !recallOptionsSet.has(e));

    for (let i = 0; i < lure_emotion_count && lurePool.length > 0; i++) {
        const lureIndex = prng.nextIntRange(0, lurePool.length);
        recallOptionsSet.add(lurePool.splice(lureIndex, 1)[0]);
    }
    
    const recallOptions = prng.shuffle(Array.from(recallOptionsSet)).map(emotion => ({
        emotionCategory: emotion,
        intensity: 1.0,
        faceId: 'generic',
        valence: 0,
        arousal: 0,
        sprite: {
             sheetUrl: '/assets/sprites/faces-sheet.png',
             coords: { x: (emotions.indexOf(emotion) % 4 * 128), y: (Math.floor(emotions.indexOf(emotion) / 4) * 128), w: 128, h: 128 },
        }
    }));

    return {
        type: 'eq_face_sequence',
        sequence,
        recallOptions,
        correctAnswer,
        presentationRate: presentation_rate_ms,
        labelShown: label_shown,
        recallDelay: recall_delay_ms,
    };
};
