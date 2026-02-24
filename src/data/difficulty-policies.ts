
import type { DifficultyPolicy, GameId } from "@/types";

// This file is being created with the interfaces and a placeholder structure.
// The full logic for each game's music mode will be populated in the next phase.

const policies: Partial<Record<GameId, DifficultyPolicy>> = {
  // Example for one game to show the structure. Others will be added.
  gwm_dynamic_sequence: {
    gameId: "gwm_dynamic_sequence",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.65,
    levelMap: {
      1: { 
        mechanic_config: { sequenceLength: 3, transformationType: 'reverse' }, 
        content_config: { 
          music: { params: { scale: 'pentatonic' } },
        } 
      },
      // ... more levels to be populated
    }
  },
  ef_focus_switch: {
    gameId: 'ef_focus_switch',
    sessionLength: 20,
    windowSize: 15,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.68,
    levelMap: {
        1: { 
            mechanic_config: { switchInterval: 8 },
            content_config: { music: { params: { rules: ['pitch', 'rhythm'] } } }
        },
        // ... more levels to be populated
    }
  },
   gs_rapid_code: {
    gameId: 'gs_rapid_code',
    sessionLength: 1, // Timed session, not trial count
    windowSize: 30, // Based on time
    targetAccuracyHigh: 0.9,
    targetAccuracyLow: 0.7,
    levelMap: {
        1: {
            mechanic_config: { sessionTimeSec: 30 },
            content_config: { music: { params: { rule: 'high_low', gap_semitones: 12 } } }
        },
        // ... more levels to be populated
    }
  }
};

export const difficultyPolicies = policies as Record<GameId, DifficultyPolicy>;
