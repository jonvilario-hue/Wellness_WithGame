'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, TrialRecord, TrainingFocus, AdaptiveState, TierSelection } from '@/types';
import { getDefaultState } from '@/lib/adaptive-engine';
import * as idbStore from '@/lib/idb-store';
import * as aggregator from '@/lib/local-aggregator';
import type { LatencyInfo } from '@/types/local-store';

type PerformanceState = {
    gameStates: Record<string, AdaptiveState>;
    globalTier: TierSelection;
    isHydrated: boolean;
};

type PerformanceActions = {
    getAdaptiveState: (gameId: GameId, focus: TrainingFocus) => AdaptiveState;
    updateAdaptiveState: (gameId: GameId, focus: TrainingFocus, newState: Partial<AdaptiveState>) => void;
    setGameTier: (gameId: GameId, focus: TrainingFocus, tier: TierSelection) => void;
    setGlobalTier: (tier: TierSelection) => void;
    hydrate: () => Promise<void>;
    logTrial: (record: TrialRecord) => Promise<void>;
    exportData: () => Promise<string>;
    importData: (json: string) => Promise<void>;
    clearAllData: () => Promise<void>;
};

export const usePerformanceStore = create<PerformanceState & PerformanceActions>()(
    persist(
        immer((set, get) => ({
            gameStates: {},
            globalTier: 4,
            isHydrated: false,

            hydrate: async () => {
                const profiles = await idbStore.getAllProfiles();
                const newGameStates: Record<string, AdaptiveState> = {};
                for (const profile of profiles) {
                    newGameStates[profile.id] = profile.state;
                }
                set({ gameStates: newGameStates, isHydrated: true });
            },

            getAdaptiveState: (gameId, focus) => {
                const key = `${gameId}/${focus}`;
                const existingState = get().gameStates[key];
                if (existingState) {
                    return existingState;
                }
                
                const globalTier = get().globalTier;
                const tierForNewGame = globalTier === 4 ? 1 : globalTier;
                const defaultState = getDefaultState(gameId, tierForNewGame);
                const finalState = { ...defaultState, lastFocus: focus };
                
                // Optimistically update in-memory state, and write to DB in the background.
                // This keeps the getter synchronous for UI components.
                set(state => {
                    state.gameStates[key] = finalState;
                });
                idbStore.setProfile(key, finalState);

                return finalState;
            },

            updateAdaptiveState: (gameId, focus, newState) => {
                const key = `${gameId}/${focus}`;
                set(state => {
                    if (state.gameStates[key]) {
                        state.gameStates[key] = { ...state.gameStates[key], ...newState };
                        idbStore.setProfile(key, state.gameStates[key]);
                    }
                });
            },

            setGlobalTier: (tier) => set({ globalTier: tier }),

            setGameTier: (gameId, focus, tier) => {
                const key = `${gameId}/${focus}`;
                const currentState = get().gameStates[key] || get().getAdaptiveState(gameId, focus);
                
                set(state => {
                    state.gameStates[key] = { ...currentState, tier };
                    idbStore.setProfile(key, state.gameStates[key]);
                });
            },

            logTrial: async (record) => {
                await idbStore.logTrial(record);
            },

            exportData: idbStore.exportAllData,
            
            importData: async (json) => {
                await idbStore.importData(json);
                get().hydrate();
            },

            clearAllData: async () => {
                await idbStore.clearAllData();
                set({ gameStates: {}, isHydrated: true });
            },
        })),
        {
            name: 'cognitune-adaptive-store-v4',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ globalTier: state.globalTier }),
        }
    )
);
