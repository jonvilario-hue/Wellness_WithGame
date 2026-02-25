
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { TrainingFocus } from '@/types';
import { allLogicPairs, logicPairsTier1, logicPairsTier2, logicPairsTier3 } from '@/data/logic-glr-content';
import { realWords } from '@/data/verbal-content';

// Server-safe storage object for Zustand's persist middleware
const storage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(name);
    }
  },
};

// --- Types ---
const anHour = 60 * 60 * 1000;
const aDay = 24 * anHour;
export const spacedRetrievalIntervals = [
    2 * 60 * 1000, // 2 minutes
    10 * 60 * 1000, // 10 minutes
    anHour,
    aDay, // 1 day
    3 * aDay, // 3 days
    7 * aDay, // 7 days
    14 * aDay // 14 days
];

export interface SpacedPair {
    id: string;
    word1: string; // The stimulus (e.g., '&&', 'cat')
    word2: string; // The response (e.g., 'AND', 'dog')
    createdAt: number;
    nextReviewAt: number;
    intervalStage: number;
    correctStreak: number;
    strength: number; // 0 to 1
    type: 'verbal' | 'logic'; // To distinguish content types
    hint?: string;
}

const gameModes: ('associative' | 'spaced' | 'category' | 'operator_recall' | 'spatial')[] = ['category', 'associative', 'spaced', 'operator_recall', 'spatial'];

type GlrState = {
    spacedPairs: Record<string, SpacedPair>;
    submittedWords: Record<string, string[]>;
    lastModeIndex: Record<TrainingFocus, number>;
    logicTierUnlocked: 1 | 2 | 3;
};

type GlrActions = {
    getNextMode: (focus: TrainingFocus) => 'associative' | 'spaced' | 'category' | 'operator_recall' | 'spatial';
    // Spaced Retrieval
    introduceNewPairs: (focus: TrainingFocus, count: number) => SpacedPair[];
    getDueReviewPairs: (focus?: TrainingFocus) => SpacedPair[];
    updatePairOnResult: (pairId: string, correct: boolean) => void;
    prioritizePairForReview: (stimulus: string) => void;
    // Category Sprint
    logSubmittedWord: (category: string, word: string) => void;
    isWordSubmitted: (category: string, word: string) => boolean;
    getSubmittedWordsForCategory: (category: string) => string[];
};

export const useGlrStore = create<GlrState & GlrActions>()(
    persist(
        immer((set, get) => ({
            spacedPairs: {},
            submittedWords: {},
            lastModeIndex: {
                neutral: 2,
                math: 2,
                music: 2,
                verbal: 2,
                spatial: 2,
                eq: 2,
                logic: 2,
            },
            logicTierUnlocked: 1,

            getNextMode: (focus) => {
                if (focus === 'neutral') return 'spaced';
                if (focus === 'math') return 'spaced';
                if (focus === 'music') return 'spaced';
                if (focus === 'logic') return 'operator_recall'; // Logic mode always uses Operator Recall
                if (focus === 'spatial') return 'spatial';

                const validModesForFocus: typeof gameModes = ['category', 'associative', 'spaced'];
                const lastIndex = get().lastModeIndex[focus];
                const nextIndex = (lastIndex + 1) % validModesForFocus.length;
                set(state => { state.lastModeIndex[focus] = nextIndex });
                return validModesForFocus[nextIndex];
            },
            
            introduceNewPairs: (focus, count) => {
                const existingPairs = get().spacedPairs;
                let newPairs: {word1: string, word2: string, hint?: string}[] = [];
                let tier: 1 | 2 | 3 = 1;

                if (focus === 'logic') {
                    tier = get().logicTierUnlocked;
                    const allLogicPairs = tier === 1 ? logicPairsTier1 : tier === 2 ? [...logicPairsTier1, ...logicPairsTier2] : [...logicPairsTier1, ...logicPairsTier2, ...logicPairsTier3];
                    const unlearnedPairs = allLogicPairs.filter(p => !existingPairs[`logic-${p.stimulus}`]);
                    newPairs = unlearnedPairs.slice(0, count);
                } else {
                    const shuffledWords = [...realWords].sort(() => 0.5 - Math.random());
                    let i = 0;
                    while (newPairs.length < count && i < shuffledWords.length - 1) {
                         const pair = { word1: shuffledWords[i], word2: shuffledWords[i+1] };
                         const id = `verbal-${pair.word1}-${pair.word2}`;
                         if (!existingPairs[id]) {
                            newPairs.push(pair);
                         }
                         i += 2;
                    }
                }

                const now = Date.now();
                const createdPairs: SpacedPair[] = [];
                for (const pair of newPairs) {
                    const id = `${focus}-${pair.word1}`;
                    const newSpacedPair: SpacedPair = {
                        id,
                        word1: pair.word1,
                        word2: pair.word2,
                        hint: pair.hint,
                        createdAt: now,
                        nextReviewAt: now,
                        intervalStage: 0,
                        correctStreak: 0,
                        strength: 0,
                        type: focus === 'logic' ? 'logic' : 'verbal',
                    };
                    set(state => { state.spacedPairs[id] = newSpacedPair });
                    createdPairs.push(newSpacedPair);
                }
                return createdPairs;
            },

            getDueReviewPairs: (focus) => {
                const now = Date.now();
                const pairType = focus === 'logic' ? 'logic' : 'verbal';
                return Object.values(get().spacedPairs)
                    .filter(p => (focus ? p.type === pairType : true) && p.nextReviewAt <= now)
                    .sort((a, b) => a.strength - b.strength); // Review weakest due pairs first
            },
            
            updatePairOnResult: (pairId, correct) => {
                set(state => {
                    const pair = state.spacedPairs[pairId];
                    if (pair) {
                        const now = Date.now();
                        if (correct) {
                            pair.correctStreak++;
                            const nextStage = Math.min(pair.intervalStage + 1, spacedRetrievalIntervals.length - 1);
                            pair.intervalStage = nextStage;
                            pair.nextReviewAt = now + spacedRetrievalIntervals[nextStage];
                            pair.strength = Math.min(1.0, pair.strength + 0.15);
                        } else {
                            pair.correctStreak = 0;
                            const nextStage = Math.max(0, pair.intervalStage - 2);
                            pair.intervalStage = nextStage;
                            pair.nextReviewAt = now + spacedRetrievalIntervals[0]; // Reset to first interval
                             pair.strength = Math.max(0.0, pair.strength - 0.2);
                        }
                    }

                    // Check for tier unlock
                    const allLogicPairs = Object.values(state.spacedPairs).filter(p => p.type === 'logic');
                    const tier1Pairs = allLogicPairs.filter(p => logicPairsTier1.some(lp => lp.stimulus === p.word1));

                    if (state.logicTierUnlocked === 1 && tier1Pairs.length > 0 && tier1Pairs.every(p => p.strength >= 0.6)) {
                        state.logicTierUnlocked = 2;
                        console.log("LOGIC TIER 2 UNLOCKED");
                    }
                     const tier2Pairs = allLogicPairs.filter(p => logicPairsTier2.some(lp => lp.stimulus === p.word1));
                     if (state.logicTierUnlocked === 2 && tier2Pairs.length > 0 && tier2Pairs.every(p => p.strength >= 0.6)) {
                        state.logicTierUnlocked = 3;
                        console.log("LOGIC TIER 3 UNLOCKED");
                    }
                });
            },

            prioritizePairForReview: (stimulus) => {
                const id = `logic-${stimulus}`;
                set(state => {
                    const pairExists = !!allLogicPairs.find(p => p.stimulus === stimulus);
                    if (pairExists && state.spacedPairs[id]) {
                        state.spacedPairs[id].nextReviewAt = Date.now();
                    }
                });
            },

            logSubmittedWord: (category, word) => {
                set(state => {
                    if (!state.submittedWords[category]) {
                        state.submittedWords[category] = [];
                    }
                    if (!state.submittedWords[category].includes(word)) {
                        state.submittedWords[category].push(word);
                    }
                });
            },
            
            isWordSubmitted: (category, word) => {
                return get().submittedWords[category]?.includes(word.toLowerCase()) ?? false;
            },

            getSubmittedWordsForCategory: (category) => {
                 return get().submittedWords[category] || [];
            }

        })),
        {
            name: 'glr-training-storage-v4-spaced',
            storage: createJSONStorage(() => storage),
        }
    )
);
