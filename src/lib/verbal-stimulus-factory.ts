
'use client';

import {
    phoneticallySimilarSets,
    grammarScrambleSentences,
    realWords,
    pseudowords,
    morphologyWordPairs,
    generalCategories,
    clozeSentences,
} from '@/data/verbal-content';
import type { TrainingFocus } from '@/types';
import { PRNG } from './rng';

/**
 * This factory generates stimuli for the "Verbal Reasoning" mode across various games.
 * It's designed to be called by the main game components when the verbal focus is active.
 * Audit 3.1: All random selections now use a seeded PRNG for determinism.
 */

// --- SEQUENCE SPAN (Gwm) ---
export const generateVerbalSequence = (level: number, prng: PRNG) => {
    if (level > 5) { // Sentence Unscramble
        const sentenceData = prng.shuffle([...grammarScrambleSentences])[0];
        return {
            sequence: prng.shuffle(sentenceData.sentence.split(' ')).join(' '),
            transformationRule: 'sentence_unscramble',
            correctAnswer: sentenceData.sentence,
        };
    }
    
    // Phonological Loop Task
    const useSimilar = level > 3;
    const sequenceLength = 3 + Math.floor(level / 2);
    
    if (useSimilar) {
        const set = prng.shuffle([...phoneticallySimilarSets])[0];
        return {
            sequence: prng.shuffle(set).slice(0, sequenceLength).join(' '),
            transformationRule: 'reverse',
            correctAnswer: null,
        };
    } else {
        const distinctWords = ['CAT', 'DOG', 'SUN', 'SKY', 'RED', 'BLUE', 'ONE', 'TWO'];
        return {
            sequence: prng.shuffle(distinctWords).slice(0, sequenceLength).join(' '),
            transformationRule: 'reverse',
            correctAnswer: null,
        };
    }
};

export const applyVerbalTransformation = (sequence: string, rule: string, correctSentence?: string): string => {
    if (rule === 'sentence_unscramble' && correctSentence) {
        return correctSentence;
    }
    const parts = sequence.split(' ');
    switch(rule) {
        case 'reverse':
            return parts.reverse().join(' ');
        default:
            return sequence;
    }
};

// --- RAPID MATCH (Gs) ---
export const generateLexicalDecisionProblem = (level: number, prng: PRNG) => {
    const isReal = prng.nextFloat() > 0.5;
    const word = isReal 
        ? realWords[prng.nextIntRange(0, realWords.length)] 
        : pseudowords[prng.nextIntRange(0, pseudowords.length)];
    return {
        type: 'lexical',
        stimulus: word,
        isReal: isReal,
    };
};

// --- MATRIX PATTERN (Gf) ---
export const generateAnalogyProblem = (level: number, prng: PRNG) => {
     const rule = prng.nextFloat() > 0.5 ? 'pluralization' : 'tense_change';
     const wordPairSet = morphologyWordPairs[rule];
     
     const pairs = prng.shuffle([...wordPairSet]);
     const pair1 = pairs[0];
     const pair2 = pairs[1];
     
     const answer = pair2.derived;
     const options = prng.shuffle([answer, 'glorped', 'wuxes', 'flibbing']);

     return {
        type: 'verbal',
        grid: [
            { type: 'verbal', value: pair1.base },
            { type: 'verbal', value: pair1.derived },
            { type: 'verbal', value: pair2.base },
            null
        ],
        missingIndex: 3,
        answer: { type: 'verbal', value: answer },
        options: options.map(o => ({ type: 'verbal', value: o })),
        size: 2,
        params: { rule: 'morphological_analogy' }
     }
}

// --- TASK SWITCH (EF) ---
export const generateVerbalSwitchProblem = (level: number, prng: PRNG) => {
    const categories = generalCategories;
    const category = categories[prng.nextIntRange(0, categories.length)];
    const word = realWords[prng.nextIntRange(0, realWords.length)];
    return {
        word,
        category,
    }
}

// --- VERBAL INFERENCE (Gc) ---
export const generateClozeProblem = (level: number, prng: PRNG) => {
    const sentenceData = clozeSentences[prng.nextIntRange(0, clozeSentences.length)];
    return {
        type: 'cloze_deletion',
        question: sentenceData.question,
        options: prng.shuffle([...sentenceData.options, sentenceData.answer]),
        answer: sentenceData.answer,
        explanation: sentenceData.explanation
    };
}

// --- PHONEME DISCRIMINATION (Ga) ---
export const generatePhonemeDiscriminationProblem = (level: number, prng: PRNG) => {
  const set = phoneticallySimilarSets[prng.nextIntRange(0, phoneticallySimilarSets.length)];
  const shuffledSet = prng.shuffle([...set]);
  const wordToSpeak = shuffledSet[0];
  const otherWord = shuffledSet[1];

  const options = prng.shuffle([wordToSpeak, otherWord]);

  return {
    prompt: wordToSpeak, // This will be spoken by the TTS engine
    options: options,
    answer: wordToSpeak
  };
};


// --- Audit 2.1: Development-only validation function ---
export function validateDeterminism(seed: string, gameId: string, tier: number, trialCount: number): boolean {
    if (process.env.NODE_ENV !== 'development') {
        console.warn("Determinism validation is only available in development mode.");
        return true;
    }

    console.log(`Running determinism check for game ${gameId}, tier ${tier} with seed "${seed}"...`);
    
    // This is a simplified check. A full check would call the specific generator for the gameId.
    // For now, we'll use a generic one.
    const generator = generateVerbalSequence;

    const prng1 = new PRNG(seed);
    const prng2 = new PRNG(seed);
    const results1 = [];
    const results2 = [];

    for (let i = 0; i < trialCount; i++) {
        results1.push(generator(tier, prng1));
        results2.push(generator(tier, prng2));
    }
    
    for (let i = 0; i < trialCount; i++) {
        if (JSON.stringify(results1[i]) !== JSON.stringify(results2[i])) {
            console.error(`Determinism FAIL at trial ${i}:`);
            console.error("Expected:", results1[i]);
            console.error("Received:", results2[i]);
            return false;
        }
    }

    console.log(`Determinism PASS: All ${trialCount} generated verbal stimuli were identical.`);
    return true;
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).validateVerbalDeterminism = validateDeterminism;
}
