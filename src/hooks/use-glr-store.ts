
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
    lastModeIndex: Record<TrainingFocus, number>;
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
            lastModeIndex: {
                neutral: 2, // will always cycle to spaced (index 2)
                math: 2,
                music: 2,
                verbal: 2,
                spatial: 2,
                eq: 2,
                logic: 2,
            },

            getNextMode: (focus) => {
                /**
                 * --- CORE MODE DESIGN DOCUMENTATION (from audit CORE-Glr-4) ---
                 * The Glr (Long-Term Retrieval) factor has three primary facets:
                 * 1. Category Fluency (retrieving items from a known semantic category).
                 * 2. Associative Fluency (creating chains of related concepts).
                 * 3. Spaced Retrieval (strengthening memory for specific items over time).
                 * For a "Core" or "Neutral" mode to be psychometrically valid, it cannot rely on
                 * pre-existing semantic or linguistic knowledge. Therefore, this logic enforces that
                 * for 'neutral' focus, we ONLY use the 'spaced' retrieval mechanic (with abstract symbols),
                 * as the other two require domain knowledge.
                 */
                if (focus === 'neutral') return 'spaced';

                if (focus === 'math') return 'spaced'; // Math facts are best trained with spaced repetition.
                if (focus === 'music') return 'spaced'; // Music theory terms also fit spaced repetition.
                if (focus === 'logic') return 'associative'; // Logic is about associating concepts.
                if (focus === 'eq') return 'category'; // EQ maps well to category fluency.

                // For Verbal/Spatial, rotate through all games
                const lastIndex = get().lastModeIndex[focus];
                const nextIndex = (lastIndex + 1) % gameModes.length;
                set(state => { state.lastModeIndex[focus] = nextIndex });
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
            name: 'glr-training-storage-v3-router',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
