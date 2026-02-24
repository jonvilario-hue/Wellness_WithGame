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

/**
 * This factory generates stimuli for the "Verbal Reasoning" mode across various games.
 * It's designed to be called by the main game components when the verbal focus is active.
 */

// --- SEQUENCE SPAN (Gwm) ---
export const generateVerbalSequence = (level: number) => {
    // This function can be expanded to pull from a larger corpus
    if (level > 5) { // Sentence Unscramble
        const sentenceData = grammarScrambleSentences[Math.floor(Math.random() * grammarScrambleSentences.length)];
        return {
            sequence: sentenceData.sentence.split(' ').sort(() => Math.random() - 0.5).join(' '),
            transformationRule: 'sentence_unscramble',
            correctAnswer: sentenceData.sentence,
        };
    }
    
    // Phonological Loop Task
    const useSimilar = level > 3;
    const sequenceLength = 3 + Math.floor(level / 2);
    
    if (useSimilar) {
        const set = phoneticallySimilarSets[Math.floor(Math.random() * phoneticallySimilarSets.length)];
        return {
            sequence: set.slice(0, sequenceLength).join(' '),
            transformationRule: 'reverse', // Default transformation
            correctAnswer: null,
        };
    } else {
        const distinctWords = ['CAT', 'DOG', 'SUN', 'SKY', 'RED', 'BLUE', 'ONE', 'TWO'];
        return {
            sequence: distinctWords.sort(() => 0.5 - Math.random()).slice(0, sequenceLength).join(' '),
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
            return sequence; // Default to no transformation if rule is unknown
    }
};

// --- RAPID MATCH (Gs) ---
export const generateLexicalDecisionProblem = (level: number) => {
    const isReal = Math.random() > 0.5;
    const word = isReal 
        ? realWords[Math.floor(Math.random() * realWords.length)] 
        : pseudowords[Math.floor(Math.random() * pseudowords.length)];
    return {
        type: 'lexical',
        stimulus: word,
        isReal: isReal,
    };
};

// --- MATRIX PATTERN (Gf) ---
export const generateAnalogyProblem = (level: number) => {
     const rule = Math.random() > 0.5 ? 'pluralization' : 'tense_change';
     const wordPairSet = morphologyWordPairs[rule];
     
     const pair1 = wordPairSet[0];
     const pair2 = wordPairSet[1];
     
     const question = `${pair1.base} is to ${pair1.derived} as ${pair2.base} is to...`;
     const answer = pair2.derived;
     const options = [answer, 'glorped', 'wuxes', 'flibbing'].sort(() => Math.random() - 0.5);

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
export const generateVerbalSwitchProblem = (level: number) => {
    const categories = generalCategories;
    const category = categories[Math.floor(Math.random() * categories.length)];
    // This is a placeholder. A real implementation would need a larger word list with metadata.
    const word = realWords[Math.floor(Math.random() * realWords.length)];
    return {
        word,
        category,
    }
}

// --- VERBAL INFERENCE (Gc) ---
export const generateClozeProblem = (level: number) => {
    // Select a cloze sentence based on difficulty
    const sentenceData = clozeSentences[Math.floor(Math.random() * clozeSentences.length)];
    return {
        type: 'cloze_deletion',
        question: sentenceData.question,
        options: [...sentenceData.options, sentenceData.answer].sort(() => Math.random() - 0.5),
        answer: sentenceData.answer,
        explanation: sentenceData.explanation
    };
}
