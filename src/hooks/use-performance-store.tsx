
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, TrialRecord, TrainingFocus, AdaptiveState, TierSelection, DifficultyPolicy } from '@/types';
import type { ReplayInputs, SessionRecord } from '@/types/local-store';
import { getDefaultState } from '@/lib/adaptive-engine';
import * as idbStore from '@/lib/idb-store';
import * as aggregator from '@/lib/local-aggregator';
import type { TelemetryEvent, TrialCompletePayload } from '@/lib/telemetry-events';

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
    failedWrites: TelemetryEvent[];
    activeSession: SessionRecord | null;
};

type PerformanceActions = {
    getAdaptiveState: (gameId: GameId, focus: TrainingFocus) => AdaptiveState;
    updateAdaptiveState: (gameId: GameId, focus: TrainingFocus, newState: Partial<AdaptiveState>, replayInputs?: ReplayInputs) => void;
    setGameTier: (gameId: GameId, focus: TrainingFocus, tier: TierSelection) => void;
    setGlobalTier: (tier: TierSelection) => void;
    hydrate: () => Promise<void>;
    logEvent: (event: Omit<TelemetryEvent, 'eventId' | 'timestamp' | 'schemaVersion'>) => Promise<void>;
    flushFailedWrites: () => Promise<void>;
    exportData: () => Promise<string>;
    importData: (json: string) => Promise<void>;
    clearAllData: () => Promise<void>;
    startNewGameSession: (params: { gameId: GameId, focus: TrainingFocus, prngSeed: string, buildVersion: string, difficultyConfig: any, gameQueue?: GameId[] }) => void;
    completeCurrentGameSession: () => void;
};

export const usePerformanceStore = create<PerformanceState & PerformanceActions>()(
    persist(
        immer((set, get) => ({
            gameStates: {},
            globalTier: 4,
            isHydrated: false,
            storageAvailable: false,
            failedWrites: [],
            activeSession: null,

            hydrate: async () => {
                if (typeof window === 'undefined') {
                    set({ isHydrated: true, storageAvailable: false });
                    return;
                }
                // B2.4: Top-level guard for IDB availability
                try {
                    await idbStore.initDB();
                    const profiles = await idbStore.getAllProfiles();
                    const newGameStates: Record<string, AdaptiveState> = {};
                    for (const profile of profiles) {
                        newGameStates[profile.id] = profile.state;
                    }
                    set({ gameStates: newGameStates, isHydrated: true, storageAvailable: true });

                    // B3 Session Recovery
                    const sessionPointerJSON = window.sessionStorage.getItem('__cog_active_session');
                    if (sessionPointerJSON) {
                        const sessionPointer = JSON.parse(sessionPointerJSON);
                        const trials = await idbStore.getEventsForSession(sessionPointer.sessionId);
                        
                        set({ activeSession: { ...sessionPointer, trialCount: trials.length } });

                        // Fast-forward PRNG and other state restoration would happen in the component layer
                        // that uses this session data.
                         console.log("Session resumed from where you left off.");
                        // This would typically be a toast notification
                    }
                    get().flushFailedWrites();
                } catch (e) {
                    console.error("Hydration from IndexedDB failed. The app may be in an environment where IndexedDB is not available. App will continue in memory-only mode.", e);
                    set({ isHydrated: true, storageAvailable: false });
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
                    await idbStore.logEventBatch(buffered);
                    set({ failedWrites: [] });
                    console.log(`[Storage] Flush successful.`);
                } catch (error) {
                    console.error("[Storage] Critical: Failed to flush telemetry buffer during retry. Data may be lost.", error);
                }
            },

            logEvent: async (event) => {
                let eventWithSeq = { ...event };
                if (event.type === 'trial_complete') {
                    const newTrialCount = (get().activeSession?.trialCount || 0) + 1;
                     set(state => {
                        if (state.activeSession) {
                            state.activeSession.trialCount = newTrialCount;
                        }
                    });
                    eventWithSeq.seq = newTrialCount;
                }


                const fullEvent: TelemetryEvent = {
                    ...eventWithSeq,
                    eventId: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    timestamp: Date.now(),
                    schemaVersion: 2,
                } as TelemetryEvent; 

                if (fullEvent.type === 'trial_complete' && fullEvent.payload) {
                    (fullEvent.payload as any).seq = fullEvent.seq;
                }

                if (!get().storageAvailable) {
                    console.warn("[Storage] IDB not available. Buffering event.");
                    set(state => {
                        state.failedWrites.push(fullEvent);
                    });
                    return;
                }

                try {
                    await idbStore.logEvent(fullEvent);
                } catch (error) {
                    console.warn("[Storage] IDB write failed. Buffering event.", error);
                    set(state => {
                        state.failedWrites.push(fullEvent);
                        if (state.failedWrites.length > 500) {
                            console.warn(`[Storage] In-memory buffer full. Dropping oldest event.`);
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
                     set({ gameStates: {}, failedWrites: [], activeSession: null });
                     return;
                 }
                await idbStore.clearAllData();
                set({ gameStates: {}, isHydrated: true, failedWrites: [], activeSession: null });
            },

            startNewGameSession: (params) => {
                const newSessionId = `session-${Date.now()}`;
                const replayInputs: ReplayInputs = {
                    seed: params.prngSeed,
                    buildVersion: params.buildVersion,
                    gameId: params.gameId,
                    focus: params.focus,
                    difficultyConfig: params.difficultyConfig,
                    samplerConfig: null,
                };
                const newSession: SessionRecord = {
                    sessionId: newSessionId,
                    gameId: params.gameId,
                    mode: params.focus,
                    deviceInfo: { baseLatency: 0, outputLatency: 0, sampleRate: 0 }, // Placeholder
                    startTimestamp: Date.now(),
                    sessionComplete: false,
                    replayInputs,
                    trialCount: 0,
                };
                
                set({ activeSession: newSession });
                idbStore.startOrUpdateSession(newSession);
                if (typeof window !== 'undefined') {
                    window.sessionStorage.setItem('__cog_active_session', JSON.stringify(newSession));
                }

                get().logEvent({
                    type: 'session_start',
                    sessionId: newSessionId,
                    seq: 0,
                    payload: {
                        gameId: params.gameId,
                        focus: params.focus,
                        prngSeed: params.prngSeed,
                        buildVersion: params.buildVersion,
                        difficultyConfig: params.difficultyConfig,
                        samplerConfig: null
                    }
                });
            },

            completeCurrentGameSession: () => {
                const session = get().activeSession;
                if (!session) return;
                
                const endTime = Date.now();
                idbStore.completeSession(session.sessionId, endTime);
                set({ activeSession: null });

                get().logEvent({
                    type: 'session_complete',
                    sessionId: session.sessionId,
                    seq: -1, // Not a trial event
                    payload: {
                        gameId: session.gameId,
                        finalSeq: session.trialCount || 0, // trialCount would need to be tracked
                        durationMs: endTime - session.startTimestamp,
                    }
                });
                if (typeof window !== 'undefined') {
                    window.sessionStorage.removeItem('__cog_active_session');
                }
            },
        })),
        {
            name: 'cognitune-adaptive-store-v4',
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({ globalTier: state.globalTier }),
        }
    )
);

    
