'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, TrialRecord, TrainingFocus, AdaptiveState, TierSelection, DifficultyPolicy } from '@/types';
import type { ReplayInputs } from '@/types/local-store';
import { getDefaultState } from '@/lib/adaptive-engine';
import * as idbStore from '@/lib/idb-store';
import * as aggregator from '@/lib/local-aggregator';

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

type PerformanceState = {
    gameStates: Record<string, AdaptiveState>;
    globalTier: TierSelection;
    isHydrated: boolean;
    storageAvailable: boolean; // B2.4: New flag for IDB availability
    failedWrites: TrialRecord[];
};

type PerformanceActions = {
    getAdaptiveState: (gameId: GameId, focus: TrainingFocus) => AdaptiveState;
    updateAdaptiveState: (gameId: GameId, focus: TrainingFocus, newState: Partial<AdaptiveState>, replayInputs?: ReplayInputs) => void;
    setGameTier: (gameId: GameId, focus: TrainingFocus, tier: TierSelection) => void;
    setGlobalTier: (tier: TierSelection) => void;
    hydrate: () => Promise<void>;
    logTrial: (record: Omit<TrialRecord, 'id' | 'seq' | 'schemaVersion'>) => Promise<void>;
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
            storageAvailable: false, // B2.4: Default to false until hydration
            failedWrites: [],

            hydrate: async () => {
                // B2.4: Top-level guard for IDB availability
                try {
                    await idbStore.initDB();
                    const profiles = await idbStore.getAllProfiles();
                    const newGameStates: Record<string, AdaptiveState> = {};
                    for (const profile of profiles) {
                        newGameStates[profile.id] = profile.state;
                    }
                    set({ gameStates: newGameStates, isHydrated: true, storageAvailable: true });
                    get().flushFailedWrites();
                } catch (e) {
                    console.error("Hydration from IndexedDB failed. The app may be in an environment where IndexedDB is not available. App will continue in memory-only mode.", e);
                    set({ isHydrated: true, storageAvailable: false }); // Gracefully degrade
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
                
                // Guard against server-side execution for side-effects
                if (typeof window !== 'undefined') {
                    setTimeout(() => {
                        set(state => {
                            if (!state.gameStates[key]) {
                                state.gameStates[key] = finalState;
                                 if (state.storageAvailable) {
                                    idbStore.setProfile(key, finalState).catch(e => console.error("Failed to save new profile to IDB", e));
                                 }
                            }
                        });
                    }, 0);
                }

                return finalState;
            },

            updateAdaptiveState: (gameId, focus, newState, replayInputs) => {
                const key = `${gameId}/${focus}`;
                set(state => {
                    if (state.gameStates[key]) {
                        state.gameStates[key] = { ...state.gameStates[key], ...newState };
                         if (state.storageAvailable) {
                            idbStore.setProfile(key, state.gameStates[key]).catch(e => console.error("Failed to update profile in IDB", e));
                         }
                    }
                });
                if (replayInputs && newState.sessionCount && get().storageAvailable) {
                    idbStore.startOrUpdateSession({
                        sessionId: `session-${gameId}-${focus}-${Date.now()}`,
                        gameId,
                        mode: focus,
                        deviceInfo: { baseLatency: 0, outputLatency: 0, sampleRate: 0},
                        startTimestamp: Date.now(),
                        sessionComplete: false,
                        replayInputs: replayInputs,
                    });
                }
            },

            setGlobalTier: (tier) => set({ globalTier: tier }),

            setGameTier: (gameId, focus, tier) => {
                const key = `${gameId}/${focus}`;
                const currentState = get().gameStates[key] || get().getAdaptiveState(gameId, focus);
                
                set(state => {
                    state.gameStates[key] = { ...currentState, tier };
                    if (state.storageAvailable) {
                        idbStore.setProfile(key, state.gameStates[key]).catch(e => console.error("Failed to set game tier in IDB", e));
                    }
                });
            },
            
            flushFailedWrites: async () => {
                const buffered = get().failedWrites;
                if (buffered.length === 0 || !get().storageAvailable) return;

                console.log(`[Storage] Flushing ${buffered.length} buffered trial records...`);
                try {
                    await idbStore.logTrialBatch(buffered);
                    set({ failedWrites: [] });
                    console.log(`[Storage] Flush successful.`);
                } catch (error) {
                    console.error("[Storage] Critical: Failed to flush telemetry buffer during retry. Data may be lost.", error);
                }
            },
            
            // B2 OFFLINE RESILIENCE: This is the entry point for logging.
            logTrial: async (record) => {
                // FIX A1: Assign monotonic sequence number at creation time.
                const fullRecord: TrialRecord = {
                    ...record,
                    id: `${record.sessionId}-${record.trialIndex}`,
                    seq: record.trialIndex,
                    schemaVersion: 2,
                };

                // B2.4: If storage is down, buffer immediately.
                if (!get().storageAvailable) {
                    console.warn("[Storage] IDB not available. Buffering trial record.");
                    set(state => {
                        state.failedWrites.push(fullRecord);
                    });
                    return;
                }

                // B2.1 & B2.2: Wrap the call to the storage layer. If it fails,
                // the record is added to the in-memory buffer for a later retry.
                try {
                    await idbStore.logTrial(fullRecord);
                } catch (error) {
                    console.warn("[Storage] IDB write failed. Buffering trial record.", error);
                    set(state => {
                        state.failedWrites.push(fullRecord);
                        // B2.3: To prevent unbounded memory usage, cap the buffer.
                        if (state.failedWrites.length > 500) {
                            console.warn(`[Storage] In-memory buffer full. Dropping oldest trial record.`);
                            state.failedWrites.shift(); 
                        }
                    });
                }
                
                if (get().failedWrites.length > 0) {
                    await get().flushFailedWrites();
                }
            },

            exportData: async () => {
                if (!get().storageAvailable) return "{}";
                return idbStore.exportAllData();
            },
            
            importData: async (json) => {
                if (!get().storageAvailable) {
                     console.error("Cannot import data: storage is not available.");
                     return;
                }
                await idbStore.importData(json);
                get().hydrate();
            },

            clearAllData: async () => {
                 if (!get().storageAvailable) {
                     set({ gameStates: {}, failedWrites: [] });
                     return;
                 }
                await idbStore.clearAllData();
                set({ gameStates: {}, isHydrated: true, failedWrites: [] });
            },
        })),
        {
            name: 'cognitune-adaptive-store-v4',
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({ globalTier: state.globalTier }),
        }
    )
);
