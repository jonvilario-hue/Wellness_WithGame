'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameId, Tier, AdaptiveState, TrainingFocus, TierSelection } from '@/types';
import { getDefaultState, TIER_CONFIG } from '@/lib/adaptive-engine';
import { DOMAIN_META } from '@/lib/domain-constants';

const allDomainIds = Object.values(DOMAIN_META).map(meta => meta.id);

// The key is now a composite: `${GameId}/${TrainingFocus}`
type GameStateKey = `${GameId}/${TrainingFocus}`;

type PerformanceStateData = {
  globalTier: TierSelection;
  gameStates: Record<GameStateKey, AdaptiveState>;
};

type PerformanceActions = {
  setGlobalTier: (tier: TierSelection) => void;
  setGameTier: (gameId: GameId, focus: TrainingFocus, tier: Tier) => void;
  getAdaptiveState: (gameId: GameId, focus: TrainingFocus) => AdaptiveState;
  updateAdaptiveState: (gameId: GameId, focus: TrainingFocus, newState: AdaptiveState) => void;
  resetGameToTierDefault: (gameId: GameId, focus: TrainingFocus) => void;
};

const initialGameStates = (): Record<GameStateKey, AdaptiveState> => {
  const state: Partial<Record<GameStateKey, AdaptiveState>> = {};
  for (const domainId of allDomainIds) {
    // Only initialize the neutral state
    const key: GameStateKey = `${domainId}/neutral`;
    state[key] = getDefaultState(domainId, 1); // Default all games to Tier 1
  }
  return state as Record<GameStateKey, AdaptiveState>;
};

export const usePerformanceStore = create<PerformanceStateData & PerformanceActions>()(
  persist(
    immer((set, get) => ({
      globalTier: 4, // Default to "Automatic"
      gameStates: initialGameStates(),
      
      setGlobalTier: (tier) => {
        set({ globalTier: tier });
      },

      setGameTier: (gameId, focus, tier) => {
        set((state) => {
            const key: GameStateKey = `${gameId}/${focus}`;
            state.gameStates[key] = getDefaultState(gameId, tier);
        });
      },

      getAdaptiveState: (gameId, focus) => {
        const key: GameStateKey = `${gameId}/${focus}`;
        const neutralKey: GameStateKey = `${gameId}/neutral`;
        const existingState = get().gameStates[key];

        if (existingState) {
          return existingState;
        }

        // Cold-Start: If a mode doesn't have a state, create one.
        const neutralState = get().gameStates[neutralKey] || getDefaultState(gameId, 1);
        
        // Create a fresh default state for the new mode's tier.
        const newModeDefaultState = getDefaultState(gameId, neutralState.tier as Tier);

        // "Taxed Transfer": Seed the new mode's level from the core mode,
        // but apply a penalty to account for context-switching costs.
        const seededLevel = Math.max(
          newModeDefaultState.levelFloor, // Don't go below the floor
          neutralState.currentLevel - 3   // Apply a 3-level "tax"
        );
        
        const newState: AdaptiveState = {
            ...newModeDefaultState,
            currentLevel: seededLevel,
            lastFocus: focus,
            // High uncertainty means the algorithm will adapt much faster for the first few trials.
            uncertainty: 0.8, 
        };
        
        // Immediately persist this new state so it exists for the next call.
        set(state => {
            state.gameStates[key] = newState;
        });

        return newState;
      },

      updateAdaptiveState: (gameId, focus, newState) => {
        set(state => {
            const key: GameStateKey = `${gameId}/${focus}`;
            state.gameStates[key] = newState;
        });
      },
      
      resetGameToTierDefault: (gameId, focus) => {
         set(state => {
            const key: GameStateKey = `${gameId}/${focus}`;
            const gameTier = state.gameStates[key]?.tier ?? state.globalTier;
            const finalTier = gameTier === 4 ? 1 : gameTier;
            state.gameStates[key] = getDefaultState(gameId, finalTier);
         });
      }
    })),
    {
      name: 'cognitive-performance-storage-v8-taxed', // Version bump for new structure
      storage: createJSONStorage(() => localStorage),
      version: 8,
    }
  )
);
