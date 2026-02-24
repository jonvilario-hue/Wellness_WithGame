

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, TrialRecord, TrainingFocus, AdaptiveState, TierSelection } from '@/types';
import { getDefaultState } from '@/lib/adaptive-engine';
import * as idbStore from '@/lib/idb-store';
import * as aggregator from '@/lib/local-aggregator';

type PerformanceState = {
    gameStates: Record<string, AdaptiveState>;
    globalTier: TierSelection;
    isHydrated: boolean;
    failedWrites: TrialRecord[];
};

type PerformanceActions = {
    getAdaptiveState: (gameId: GameId, focus: TrainingFocus) => AdaptiveState;
    updateAdaptiveState: (gameId: GameId, focus: TrainingFocus, newState: Partial<AdaptiveState>) => void;
    setGameTier: (gameId: GameId, focus: TrainingFocus, tier: TierSelection) => void;
    setGlobalTier: (tier: TierSelection) => void;
    hydrate: () => Promise<void>;
    logTrial: (record: TrialRecord) => Promise<void>;
    flushFailedWrites: () => Promise<void>;
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
            failedWrites: [],

            hydrate: async () => {
                try {
                    await idbStore.initDB();
                    const profiles = await idbStore.getAllProfiles();
                    const newGameStates: Record<string, AdaptiveState> = {};
                    for (const profile of profiles) {
                        newGameStates[profile.id] = profile.state;
                    }
                    set({ gameStates: newGameStates, isHydrated: true });
                    // On hydration, try to flush any writes that failed from the last session
                    get().flushFailedWrites();
                } catch (e) {
                    console.error("Hydration from IndexedDB failed. The app may be in an environment where IndexedDB is not available.", e);
                    set({ isHydrated: true });
                }
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
                
                setTimeout(() => {
                    set(state => {
                        if (!state.gameStates[key]) {
                            state.gameStates[key] = finalState;
                             idbStore.setProfile(key, finalState).catch(e => console.error("Failed to save new profile to IDB", e));
                        }
                    });
                }, 0);

                return finalState;
            },

            updateAdaptiveState: (gameId, focus, newState) => {
                const key = `${gameId}/${focus}`;
                set(state => {
                    if (state.gameStates[key]) {
                        state.gameStates[key] = { ...state.gameStates[key], ...newState };
                        idbStore.setProfile(key, state.gameStates[key]).catch(e => console.error("Failed to update profile in IDB", e));
                    }
                });
            },

            setGlobalTier: (tier) => set({ globalTier: tier }),

            setGameTier: (gameId, focus, tier) => {
                const key = `${gameId}/${focus}`;
                const currentState = get().gameStates[key] || get().getAdaptiveState(gameId, focus);
                
                set(state => {
                    state.gameStates[key] = { ...currentState, tier };
                    idbStore.setProfile(key, state.gameStates[key]).catch(e => console.error("Failed to set game tier in IDB", e));
                });
            },
            
            flushFailedWrites: async () => {
                const buffered = get().failedWrites;
                if (buffered.length === 0) return;

                console.log(`[Storage] Flushing ${buffered.length} buffered trial records...`);
                try {
                    await idbStore.logTrialBatch(buffered);
                    set({ failedWrites: [] });
                    console.log(`[Storage] Flush successful.`);
                } catch (error) {
                    console.error("[Storage] Critical: Failed to flush telemetry buffer. Data may be lost.", error);
                }
            },

            logTrial: async (record) => {
                 // First, try to log the new record. This may trigger an eviction run.
                try {
                    await idbStore.logTrial(record);
                } catch (error) {
                    console.warn("[Storage] IDB write failed. Buffering trial record.", error);
                    set(state => {
                        state.failedWrites.push(record);
                        if (state.failedWrites.length > 500) {
                            console.warn(`[Storage] In-memory buffer full. Dropping oldest trial record.`);
                            state.failedWrites.shift(); 
                        }
                    });
                }
                // After the new record is handled, try flushing any older failed writes.
                // This prevents a flush from triggering an eviction that deletes the record we just added.
                if (get().failedWrites.length > 0) {
                    await get().flushFailedWrites();
                }
            },

            exportData: idbStore.exportAllData,
            
            importData: async (json) => {
                await idbStore.importData(json);
                get().hydrate();
            },

            clearAllData: async () => {
                await idbStore.clearAllData();
                set({ gameStates: {}, isHydrated: true, failedWrites: [] });
            },
        })),
        {
            name: 'cognitune-adaptive-store-v4',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ globalTier: state.globalTier }),
        }
    )
);
