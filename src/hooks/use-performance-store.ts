
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, Tier, AdaptiveState, TrialResult, TrainingFocus } from '@/types';
import { getDefaultState, TIER_CONFIG } from '@/lib/adaptive-engine';
import { chcDomains } from '@/types';

type PerformanceStateData = {
  globalTier: Tier;
  gameStates: Record<GameId, Partial<Record<TrainingFocus, AdaptiveState>>>;
};

type PerformanceActions = {
  setGlobalTier: (tier: Tier) => void;
  setGameTier: (gameId: GameId, tier: Tier) => void;
  getAdaptiveState: (gameId: GameId, focus: TrainingFocus) => AdaptiveState;
  updateAdaptiveState: (gameId: GameId, focus: TrainingFocus, newState: AdaptiveState) => void;
  resetGameToTierDefault: (gameId: GameId, focus: TrainingFocus) => void;
};

const initialGameStates = (): Record<GameId, Partial<Record<TrainingFocus, AdaptiveState>>> => {
  const state: Partial<Record<GameId, Partial<Record<TrainingFocus, AdaptiveState>>>> = {};
  const focuses: TrainingFocus[] = ['neutral', 'math', 'music'];
  for (const domain of chcDomains) {
    state[domain.id] = {};
    for (const focus of focuses) {
        state[domain.id]![focus] = getDefaultState(domain.id, focus, 1); // Default to Tier 1
    }
  }
  return state as Record<GameId, Partial<Record<TrainingFocus, AdaptiveState>>>;
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
          // When global tier changes, reset any game that was using the old global tier
          for (const gameId in state.gameStates) {
             const gameFocuses = state.gameStates[gameId as GameId];
             for (const focus in gameFocuses) {
                 const gameState = gameFocuses[focus as TrainingFocus];
                 if (gameState && gameState.tier === oldTier) { // Check against old global tier
                    state.gameStates[gameId as GameId]![focus as TrainingFocus] = getDefaultState(gameId as GameId, focus as TrainingFocus, tier);
                 }
             }
          }
        });
      },

      setGameTier: (gameId, tier) => {
        set((state) => {
            if (!state.gameStates[gameId]) state.gameStates[gameId] = {};
            const focuses: TrainingFocus[] = ['neutral', 'math', 'music'];
            for (const focus of focuses) {
                 state.gameStates[gameId]![focus] = getDefaultState(gameId, focus, tier);
            }
        });
      },

      getAdaptiveState: (gameId, focus) => {
        const state = get();
        let gameState = state.gameStates[gameId]?.[focus];
        
        // If a game state somehow doesn't exist, create it.
        if (!gameState) {
          const newGameState = getDefaultState(gameId, focus, state.globalTier);
          set(s => {
              if (!s.gameStates[gameId]) s.gameStates[gameId] = {};
              s.gameStates[gameId]![focus] = newGameState;
          });
          gameState = newGameState;
        }

        // Layer Switching Logic (Rule 6)
        if (gameState.lastFocus !== focus) {
            set(s => {
                const stateToUpdate = s.gameStates[gameId]![focus]!;
                stateToUpdate.uncertainty = Math.min(stateToUpdate.uncertainty + 0.3, 0.8);
                stateToUpdate.consecutiveCorrect = 0;
                stateToUpdate.consecutiveWrong = 0;
                stateToUpdate.smoothedAccuracy = 0.75;
                stateToUpdate.smoothedRT = 0;
                stateToUpdate.lastFocus = focus;
            });
            // Re-get the state after the update
            return get().gameStates[gameId]![focus]!;
        }

        return gameState;
      },

      updateAdaptiveState: (gameId, focus, newState) => {
        set(state => {
            if (!state.gameStates[gameId]) state.gameStates[gameId] = {};
            state.gameStates[gameId]![focus] = newState;
        });
      },
      
      resetGameToTierDefault: (gameId, focus) => {
         set(state => {
            if (!state.gameStates[gameId]) state.gameStates[gameId] = {};
            const gameTier = state.gameStates[gameId]?.[focus]?.tier ?? state.globalTier;
            state.gameStates[gameId]![focus] = getDefaultState(gameId, focus, gameTier);
         });
      }
    })),
    {
      name: 'cognitive-performance-storage-v4-layer-aware', // Incremented version
      storage: createJSONStorage(() => localStorage),
    }
  )
);
