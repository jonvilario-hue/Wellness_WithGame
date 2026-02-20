
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { TrainingFocus } from '@/types';

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

export type SpacedPair = {
    id: string;
    word1: string;
    word2: string;
    createdAt: number; // timestamp
    nextReviewAt: number; // timestamp
    intervalStage: number; // index in the intervals array
};

const gameModes: ('associative' | 'spaced' | 'category')[] = ['category', 'associative', 'spaced'];

type GlrState = {
    spacedPairs: Record<string, SpacedPair>;
    submittedWords: Record<string, string[]>; // category -> words[]
    lastModeIndex: number;
};

type GlrActions = {
    getNextMode: (focus: TrainingFocus) => 'associative' | 'spaced' | 'category';
    // Spaced Retrieval
    addSpacedPairs: (pairs: { word1: string; word2: string }[]) => void;
    getDueReviewPairs: () => SpacedPair[];
    updatePairOnResult: (pairId: string, correct: boolean) => void;
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
            lastModeIndex: 2, // Start with 2 so first mode is 0 (category)

            getNextMode: (focus) => {
                // Math and Music modes have more specific, mechanically distinct games
                if (focus === 'math') return 'associative';
                if (focus === 'music') return 'spaced';

                // For Neutral/Verbal, rotate through all games
                const nextIndex = (get().lastModeIndex + 1) % gameModes.length;
                set({ lastModeIndex: nextIndex });
                return gameModes[nextIndex];
            },

            addSpacedPairs: (pairs) => {
                const now = Date.now();
                const newPairs: Record<string, SpacedPair> = {};
                for (const pair of pairs) {
                    const id = `${pair.word1}-${pair.word2}`;
                    if (!get().spacedPairs[id]) {
                         newPairs[id] = {
                            id,
                            ...pair,
                            createdAt: now,
                            nextReviewAt: now, // Due for immediate recall
                            intervalStage: 0,
                        };
                    }
                }
                set((state) => {
                    state.spacedPairs = { ...state.spacedPairs, ...newPairs };
                });
            },

            getDueReviewPairs: () => {
                const now = Date.now();
                return Object.values(get().spacedPairs).filter(p => p.nextReviewAt <= now);
            },
            
            updatePairOnResult: (pairId, correct) => {
                set(state => {
                    const pair = state.spacedPairs[pairId];
                    if (pair) {
                        const now = Date.now();
                        if (correct) {
                            const nextStage = Math.min(pair.intervalStage + 1, spacedRetrievalIntervals.length - 1);
                            pair.intervalStage = nextStage;
                            pair.nextReviewAt = now + spacedRetrievalIntervals[nextStage];
                        } else {
                            // Reset to first interval on failure
                            pair.intervalStage = 0;
                            pair.nextReviewAt = now + spacedRetrievalIntervals[0];
                        }
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
            name: 'glr-training-storage-v2',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
