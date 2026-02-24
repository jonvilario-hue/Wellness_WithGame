
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, TrialRecord, TrainingFocus } from '@/types';
import type { GameProfile, SessionSummary, LatencyInfo } from '@/types/local-store';
import * as idbStore from '@/lib/idb-store';
import * as aggregator from '@/lib/local-aggregator';

type PerformanceState = {
    activeSessionId: string | null;
    profiles: Record<string, GameProfile>;
};

type PerformanceActions = {
    // Game Lifecycle
    startSession: (gameId: GameId, mode: TrainingFocus, deviceInfo: LatencyInfo) => Promise<{ sessionId: string, difficulty: number }>;
    logTrial: (record: Omit<TrialRecord, 'id' | 'sessionId' | 'timestamp'>) => Promise<void>;
    endSession: () => Promise<void>;

    // Data Management
    exportData: () => Promise<string>;
    importData: (json: string) => Promise<void>;
    clearAllData: () => Promise<void>;
    
    // Profile access
    getProfile: (gameId: GameId) => GameProfile | null;
};

export const usePerformanceStore = create<PerformanceState & PerformanceActions>()(
    persist(
        immer((set, get) => ({
            activeSessionId: null,
            profiles: {},

            startSession: async (gameId, mode, deviceInfo) => {
                await idbStore.initDB();
                const profile = await idbStore.getProfile(gameId) || {
                    gameId,
                    currentDifficulty: 1,
                    rollingAccuracy: 0,
                    rollingMeanRt: 0,
                    lastPlayedTimestamp: 0,
                    sessionsCompleted: 0
                };
                
                set(state => { state.profiles[gameId] = profile; });
                
                const sessionId = await idbStore.startSession({
                    gameId,
                    mode,
                    deviceInfo,
                    startTimestamp: Date.now()
                });

                set({ activeSessionId: sessionId });

                return { sessionId, difficulty: profile.currentDifficulty };
            },

            logTrial: async (record) => {
                const sessionId = get().activeSessionId;
                if (!sessionId) {
                    console.error("Cannot log trial: no active session.");
                    return;
                }
                const trial: TrialRecord = {
                    ...record,
                    id: crypto.randomUUID(),
                    sessionId,
                    timestamp: Date.now(),
                };
                await idbStore.logTrial(trial);
            },

            endSession: async () => {
                const sessionId = get().activeSessionId;
                const profiles = get().profiles;

                if (!sessionId) {
                    console.error("Cannot end session: no active session.");
                    return;
                }

                const trials = await idbStore.getTrials(sessionId);
                const sessionRecord = await idbStore.getRecentSessions(trials[0]?.gameId, 1);
                const gameId = sessionRecord[0]?.gameId;
                
                if (!gameId) {
                     console.error("Could not find gameId for session.");
                     set({ activeSessionId: null });
                     return;
                }

                const currentProfile = profiles[gameId];
                const summary = aggregator.computeSessionSummary(trials, currentProfile.currentDifficulty);
                
                await idbStore.endSession(sessionId, summary);

                const recentSessions = await idbStore.getRecentSessions(gameId, 10);
                const newProfile = aggregator.updateGameProfile(gameId, currentProfile, recentSessions, summary);

                await idbStore.setProfile(newProfile);
                set(state => {
                    state.profiles[gameId] = newProfile;
                    state.activeSessionId = null;
                });
            },
            
            getProfile: (gameId) => {
                return get().profiles[gameId] || null;
            },

            exportData: idbStore.exportAllData,
            importData: idbStore.importData,
            clearAllData: async () => {
                await idbStore.clearAllData();
                set({ profiles: {}, activeSessionId: null });
            },

        })),
        {
            name: 'cognitune-performance-store-v1',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ profiles: state.profiles }), // Only persist profiles, not session ID
        }
    )
);

// Initialize DB on load
if (typeof window !== 'undefined') {
    idbStore.initDB();
}
