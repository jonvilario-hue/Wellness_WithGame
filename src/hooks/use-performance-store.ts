
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, Tier, AdaptiveState, TrialResult } from '@/types';
import { getDefaultState, TIER_CONFIG } from '@/lib/adaptive-engine';
import { chcDomains } from '@/types';

type PerformanceStateData = {
  globalTier: Tier;
  gameStates: Record<GameId, AdaptiveState>;
};

type PerformanceActions = {
  setGlobalTier: (tier: Tier) => void;
  setGameTier: (gameId: GameId, tier: Tier) => void;
  getAdaptiveState: (gameId: GameId) => AdaptiveState;
  updateAdaptiveState: (gameId: GameId, newState: AdaptiveState) => void;
  resetGameToTierDefault: (gameId: GameId) => void;
};

const initialGameStates = (): Record<GameId, AdaptiveState> => {
  const state: Partial<Record<GameId, AdaptiveState>> = {};
  for (const domain of chcDomains) {
    state[domain.id] = getDefaultState(domain.id, 1); // Default to Tier 1
  }
  return state as Record<GameId, AdaptiveState>;
};

export const usePerformanceStore = create<PerformanceStateData & PerformanceActions>()(
  persist(
    immer((set, get) => ({
      globalTier: 1, // Default to "Developing"
      gameStates: initialGameStates(),
      
      setGlobalTier: (tier) => {
        set((state) => {
          state.globalTier = tier;
          // When global tier changes, reset any game that was using the global tier
          for (const gameId in state.gameStates) {
             const gameState = state.gameStates[gameId as GameId];
             if (gameState.tier === get().globalTier) { // Check against old global tier
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

      getAdaptiveState: (gameId) => {
        const state = get();
        const gameState = state.gameStates[gameId];
        // If a game state somehow doesn't exist, create it.
        if (!gameState) {
          const newGameState = getDefaultState(gameId, state.globalTier);
          set(s => {
              s.gameStates[gameId] = newGameState;
          });
          return newGameState;
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
      name: 'cognitive-performance-storage-v2-adaptive',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
