
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, Tier, AdaptiveState, TrialResult, TrainingFocus } from '@/types';
import { getDefaultState, TIER_CONFIG } from '@/lib/adaptive-engine';
import { chcDomains } from '@/types';

type PerformanceStateData = {
  globalTier: Tier;
  gameStates: Record<GameId, AdaptiveState>;
};

type PerformanceActions = {
  setGlobalTier: (tier: Tier) => void;
  setGameTier: (gameId: GameId, tier: Tier) => void;
  getAdaptiveState: (gameId: GameId, focus: TrainingFocus) => AdaptiveState;
  updateAdaptiveState: (gameId: GameId, newState: AdaptiveState) => void;
  resetGameToTierDefault: (gameId: GameId) => void;
};

const initialGameStates = (): Record<GameId, AdaptiveState> => {
  const state: Partial<Record<GameId, AdaptiveState>> = {};
  for (const domain of chcDomains) {
    state[domain.id] = getDefaultState(domain.id, 1); // Default all games to Tier 1
  }
  return state as Record<GameId, AdaptiveState>;
};

export const usePerformanceStore = create<PerformanceStateData & PerformanceActions>()(
  persist(
    immer((set, get) => ({
      globalTier: 1, // Default to "Developing"
      gameStates: initialGameStates(),
      
      setGlobalTier: (tier) => {
        const oldTier = get().globalTier;
        set((state) => {
          state.globalTier = tier;
          for (const gameId in state.gameStates) {
             const gameState = state.gameStates[gameId as GameId];
             if (gameState && gameState.tier === oldTier) {
                state.gameStates[gameId as GameId] = getDefaultState(gameId as GameId, tier);
             }
          }
        });
      },

      setGameTier: (gameId, tier) => {
        set((state) => {
            state.gameStates[gameId] = getDefaultState(gameId, tier);
        });
      },

      getAdaptiveState: (gameId, focus) => {
        const state = get();
        let gameState = state.gameStates[gameId];
        
        if (!gameState) {
          const newGameState = getDefaultState(gameId, state.globalTier);
          set(s => { s.gameStates[gameId] = newGameState; });
          gameState = newGameState;
        }

        // --- LAYER SWITCH HANDLING (Rule 3) ---
        if (gameState.lastFocus !== focus) {
            set(s => {
                const stateToUpdate = s.gameStates[gameId]!;
                stateToUpdate.uncertainty = Math.min(stateToUpdate.uncertainty + 0.3, 0.85);
                stateToUpdate.consecutiveCorrect = 0;
                stateToUpdate.consecutiveWrong = 0;
                stateToUpdate.smoothedAccuracy = 0.75;
                stateToUpdate.smoothedRT = null;
                stateToUpdate.lastFocus = focus;
            });
            // Re-get the state after the update
            return get().gameStates[gameId]!;
        }

        return gameState;
      },

      updateAdaptiveState: (gameId, newState) => {
        set(state => {
            state.gameStates[gameId] = newState;
        });
      },
      
      resetGameToTierDefault: (gameId) => {
         set(state => {
            const gameTier = state.gameStates[gameId]?.tier ?? state.globalTier;
            state.gameStates[gameId] = getDefaultState(gameId, gameTier);
         });
      }
    })),
    {
      name: 'cognitive-performance-storage-v5-unified', // Incremented version for migration
      storage: createJSONStorage(() => localStorage),
      // --- MIGRATION LOGIC (Rule 1) ---
      migrate: (persistedState: any, version: number) => {
        if (version < 5 && persistedState.gameStates) {
          const newGameStates: Record<GameId, AdaptiveState> = {};
          for (const gameId in persistedState.gameStates) {
            const oldGameLayers = persistedState.gameStates[gameId];
            if (oldGameLayers.neutral) { // Check if it's the old structure
              const layers = ['neutral', 'math', 'music'].map(f => oldGameLayers[f]).filter(Boolean);
              
              // Take the highest level achieved across all layers
              const unifiedLevel = Math.max(...layers.map(l => l.currentLevel || 1));
              
              // Use the neutral layer as the base, then merge
              newGameStates[gameId as GameId] = {
                ...oldGameLayers.neutral,
                currentLevel: unifiedLevel,
                uncertainty: 0.6, // Force re-calibration
                lastFocus: oldGameLayers.neutral.focus || 'neutral',
              };
            } else {
              // It's already in the new format or is malformed, just copy it
              newGameStates[gameId as GameId] = oldGameLayers;
            }
          }
          persistedState.gameStates = newGameStates;
        }
        return persistedState as PerformanceStateData & PerformanceActions;
      },
      version: 5,
    }
  )
);

    