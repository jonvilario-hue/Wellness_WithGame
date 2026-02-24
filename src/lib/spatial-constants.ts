
import type { GameId } from '@/types';

// This file defines which games are explicitly incompatible with the Spatial training focus.
// This is used by the mode-matrix test to ensure that the application correctly
// handles these cases by showing a GameStub instead of crashing.

export const SPATIAL_INCOMPATIBLE_GAMES: GameId[] = [
    'glr_fluency_storm',
    'ga_auditory_lab',
];
