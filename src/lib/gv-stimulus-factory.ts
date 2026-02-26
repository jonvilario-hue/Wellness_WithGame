
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
    
    let options: EmotionRotationStimulus[] = [correctOption];
    const usedDecoys = new Set<string>([JSON.stringify(correctOption)]);

    // Add the mirror image as the primary distractor
    const mirrorOption = { ...correctOption, mirrored: true };
    if(JSON.stringify(correctOption) !== JSON.stringify(mirrorOption)) {
        if(options.length < 4 && !usedDecoys.has(JSON.stringify(mirrorOption))) {
            options.push(mirrorOption);
            usedDecoys.add(JSON.stringify(mirrorOption));
        }
    }
    
    let attempts = 0;
    while (options.length < 4 && attempts < 20) {
        attempts++;
        const isAngleDecoy = prng.nextFloat() > 0.5;
        let decoy: EmotionRotationStimulus;

        const availableAngles = angles.filter(a => a !== rotationAngle);
        if (availableAngles.length === 0) { // Should not happen with current policies
            availableAngles.push( (rotationAngle + 90) % 360 );
        }
        
        if (isAngleDecoy) {
            const decoyAngle = prng.shuffle(availableAngles)[0];
            decoy = { ...correctOption, rotation: decoyAngle, mirrored: prng.nextFloat() > 0.5 };
        } else {
            const decoyEmotion = prng.shuffle(emotions.filter(e => e !== targetEmotion))[0];
            decoy = { ...correctOption, emotion: decoyEmotion, mirrored: prng.nextFloat() > 0.5 };
        }
        
        const decoyKey = JSON.stringify(decoy);
        if (!usedDecoys.has(decoyKey)) {
            options.push(decoy);
            usedDecoys.add(decoyKey);
        }
    }
    
    const shuffledOptions = prng.shuffle(options);
    const correctIndex = shuffledOptions.findIndex(opt => opt && !opt.mirrored && opt.emotion === targetEmotion);

    return {
        target,
        options: shuffledOptions,
        correctIndex,
        angularDisparity: rotationAngle,
    };
};
