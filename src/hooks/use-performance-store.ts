
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

      getAdaptiveState: (gameId, focus) => {
        const state = get();
        let gameState = state.gameStates[gameId];
        
        // Determine the effective tier for this session
        let effectiveTier: Tier;
        if (state.globalTier === 4) { // Auto mode
            const allGameStates = Object.values(state.gameStates);
            const avgLevel = allGameStates.length > 0 ? allGameStates.reduce((sum, s) => sum + s.currentLevel, 0) / allGameStates.length : TIER_CONFIG[1].range[0];
            
            if (avgLevel <= TIER_CONFIG[0].range[1]) effectiveTier = 0;
            else if (avgLevel <= TIER_CONFIG[1].range[1]) effectiveTier = 1;
            else if (avgLevel <= TIER_CONFIG[2].range[1]) effectiveTier = 2;
            else effectiveTier = 3;
        } else {
            effectiveTier = state.globalTier;
        }

        if (!gameState || gameState.tier !== effectiveTier) {
          gameState = getDefaultState(gameId, effectiveTier);
          set(s => { s.gameStates[gameId] = gameState!; });
        }
        
        // --- LAYER SWITCH HANDLING ---
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
            // Handle auto case
            const finalTier = gameTier === 4 ? 1 : gameTier;
            state.gameStates[gameId] = getDefaultState(gameId, finalTier);
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
            if (oldGameLayers && typeof oldGameLayers === 'object' && oldGameLayers.neutral) { // Check if it's the old, nested structure
              const layers = ['neutral', 'math', 'music', 'verbal'].map(f => oldGameLayers[f]).filter(Boolean);
              
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
        if(!persistedState.globalTier) {
            persistedState.globalTier = 4; // Default new users to Automatic
        }
        return persistedState as PerformanceStateData & PerformanceActions;
      },
      version: 5,
    }
  )
);
