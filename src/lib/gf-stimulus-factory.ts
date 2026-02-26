
'use client';

import { PRNG } from './rng';

export type Emotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
const emotions: Emotion[] = ['neutral', 'happy', 'sad', 'angry', 'surprised'];

export type EQStimulus = {
  emotion: Emotion;
  intensity: number; // 0 to 1
};

export type EQMatrixPuzzle = {
  type: 'eq';
  ruleFamily: 'Intensity' | 'Valence Alternation' | 'Arousal Shift' | 'Emotion Blending' | 'Context Negation';
  grid: (EQStimulus | null)[];
  missingIndex: number;
  answer: EQStimulus;
  options: EQStimulus[];
  size: number;
};

const getNextEmotion = (current: Emotion, direction: number): Emotion => {
  const currentIndex = emotions.indexOf(current);
  const nextIndex = (currentIndex + direction + emotions.length) % emotions.length;
  return emotions[nextIndex];
};

export const generateEQMatrixPuzzle = (level: number, prng: PRNG): EQMatrixPuzzle => {
    const size = 3;
    const grid: (EQStimulus | null)[] = Array(size * size).fill(null);
    const missingIndex = prng.nextIntRange(0, size * size);
    
    // Determine rule based on level
    const ruleFamilies: EQMatrixPuzzle['ruleFamily'][] = ['Intensity'];
    if (level >= 3) ruleFamilies.push('Valence Alternation');
    if (level >= 5) ruleFamilies.push('Emotion Blending');
    const ruleFamily = prng.shuffle(ruleFamilies)[0];

    let answer: EQStimulus;
    
    // --- Rule Implementation ---
    if (ruleFamily === 'Intensity') {
        const baseEmotion = prng.shuffle([...emotions])[0];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r * size + c] = { emotion: baseEmotion, intensity: 0.25 + c * 0.25 };
            }
        }
    } else if (ruleFamily === 'Valence Alternation') {
        const posEmotion: Emotion = 'happy';
        const negEmotion: Emotion = 'sad';
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                 grid[r * size + c] = { emotion: c % 2 === 0 ? posEmotion : negEmotion, intensity: 0.5 + r * 0.2 };
            }
        }
    } else { // Default to Intensity as a robust fallback for unimplemented rules
        const baseEmotion = prng.shuffle([...emotions])[0];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r * size + c] = { emotion: baseEmotion, intensity: 0.25 + c * 0.25 };
            }
        }
    }
    
    answer = grid[missingIndex]!;
    grid[missingIndex] = null;

    // --- Generate Decoys ---
    const options: EQStimulus[] = [answer];
    while (options.length < 4) {
        const decoyEmotion = prng.shuffle(emotions.filter(e => e !== answer.emotion))[0];
        const decoyIntensity = prng.shuffle([0.25, 0.5, 0.75, 1.0].filter(i => i !== answer.intensity))[0];
        
        let decoy: EQStimulus;
        if (prng.nextFloat() > 0.5) {
             decoy = { emotion: answer.emotion, intensity: decoyIntensity };
        } else {
             decoy = { emotion: decoyEmotion, intensity: answer.intensity };
        }
        
        if (!options.some(o => JSON.stringify(o) === JSON.stringify(decoy))) {
            options.push(decoy);
        }
    }

    return {
        type: 'eq',
        ruleFamily,
        grid,
        missingIndex,
        answer,
        options: prng.shuffle(options),
        size,
    };
};
