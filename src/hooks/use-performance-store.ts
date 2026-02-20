
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, Tier, AdaptiveState, TrainingFocus, TierSelection } from '@/types';
import { getDefaultState, TIER_CONFIG } from '@/lib/adaptive-engine';
import { chcDomains } from '@/types';

type PerformanceStateData = {
  globalTier: TierSelection;
  gameStates: Record<GameId, AdaptiveState>;
};

type PerformanceActions = {
  setGlobalTier: (tier: TierSelection) => void;
  setGameTier: (gameId: GameId, tier: Tier) => void;
  handleFocusChange: (newFocus: TrainingFocus) => void;
  getAdaptiveState: (gameId: GameId) => AdaptiveState;
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
      globalTier: 4, // Default to "Automatic"
      gameStates: initialGameStates(),
      
      setGlobalTier: (tier) => {
        set({ globalTier: tier });
      },

      setGameTier: (gameId, tier) => {
        set((state) => {
            state.gameStates[gameId] = getDefaultState(gameId, tier);
        });
      },

      handleFocusChange: (newFocus: TrainingFocus) => {
        set(state => {
            for (const gameId in state.gameStates) {
                const gameState = state.gameStates[gameId as GameId];
                if (gameState && gameState.lastFocus !== newFocus) {
                    gameState.uncertainty = Math.min(1.0, gameState.uncertainty + 0.3);
                    gameState.consecutiveCorrect = 0;
                    gameState.consecutiveWrong = 0;
                    gameState.smoothedAccuracy = 0.75;
                    gameState.smoothedRT = null;
                    gameState.lastFocus = newFocus;
                }
            }
        });
      },

      getAdaptiveState: (gameId) => {
        // This function is now a pure selector.
        // It relies on `handleFocusChange` to have been called to update the state.
        return get().gameStates[gameId]!;
      },

      updateAdaptiveState: (gameId, newState) => {
        set(state => {
            state.gameStates[gameId] = newState;
        });
      },
      
      resetGameToTierDefault: (gameId) => {
         set(state => {
            const gameTier = state.gameStates[gameId]?.tier ?? state.globalTier;
            const finalTier = gameTier === 4 ? 1 : gameTier;
            state.gameStates[gameId] = getDefaultState(gameId, finalTier);
         });
      }
    })),
    {
      name: 'cognitive-performance-storage-v6-unified',
      storage: createJSONStorage(() => localStorage),
      version: 6,
    }
  )
);
