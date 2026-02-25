
'use client';

import { PRNG } from './rng';
import { difficultyPolicies } from '@/data/difficulty-policies';
import type { GameId } from '@/types';

const GAME_ID: GameId = 'gv_visual_lab';

const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];
const angles = [45, 90, 135, 180, 225, 270, 315];

export type EmotionRotationStimulus = {
  emotion: string;
  rotation: number;
  mirrored: boolean;
};

export type EmotionRotationPuzzle = {
  target: EmotionRotationStimulus;
  options: EmotionRotationStimulus[];
  correctIndex: number;
  angularDisparity: number;
};

export const generateEmotionRotationTrial = (level: number, prng: PRNG): EmotionRotationPuzzle => {
    const policy = difficultyPolicies[GAME_ID];
    const params = policy.levelMap[level]?.content_config['eq']?.params || policy.levelMap[1].content_config['eq']!.params;

    const targetEmotion = prng.shuffle(emotions)[0];
    const rotationAngle = prng.shuffle(params.angles || angles)[0];

    const target: EmotionRotationStimulus = { emotion: targetEmotion, rotation: 0, mirrored: false };
    
    // The correct answer is a true rotation
    const correctOption: EmotionRotationStimulus = { emotion: targetEmotion, rotation: rotationAngle, mirrored: false };
    
    // The incorrect answer is a mirrored rotation
    const incorrectOption: EmotionRotationStimulus = { emotion: targetEmotion, rotation: rotationAngle, mirrored: true };
    
    let options = [correctOption, incorrectOption];
    
    // Add foil emotions in higher tiers
    if (params.emotionFoil && emotions.length > 1) {
        const foilEmotion = prng.shuffle(emotions.filter(e => e !== targetEmotion))[0];
        const foilOption: EmotionRotationStimulus = { emotion: foilEmotion, rotation: rotationAngle, mirrored: prng.nextFloat() > 0.5 };
        options.push(foilOption);
    }
     while (options.length < params.distractorCount) {
        const foilEmotion = prng.shuffle(emotions.filter(e => e !== targetEmotion))[0];
        const foilRotation = prng.shuffle(angles.filter(a => a !== rotationAngle))[0];
        const foilOption: EmotionRotationStimulus = { emotion: foilEmotion, rotation: foilRotation, mirrored: prng.nextFloat() > 0.5 };
        if(!options.some(o => JSON.stringify(o) === JSON.stringify(foilOption))) {
            options.push(foilOption);
        }
    }
    
    const shuffledOptions = prng.shuffle(options);
    const correctIndex = shuffledOptions.findIndex(opt => !opt.mirrored && opt.emotion === targetEmotion);

    return {
        target,
        options: shuffledOptions,
        correctIndex,
        angularDisparity: rotationAngle,
    };
};
