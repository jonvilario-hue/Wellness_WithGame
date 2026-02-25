
import type { GameId, TrainingFocus } from '@/types';

/**
 * Defines which games are explicitly incompatible with certain modes.
 * This is the single source of truth for the router/stubbing logic.
 */
const INCOMPATIBILITY_MAP: Partial<Record<GameId, TrainingFocus[]>> = {
    'glr_fluency_storm': ['spatial'],
    'ga_auditory_lab': ['spatial'],
};

/**
 * Checks if a given game is compatible with a given training focus.
 * @param gameId The ID of the game.
 * @param focus The training focus.
 * @returns `true` if the combination is supported, `false` otherwise.
 */
export const isModeSupported = (gameId: GameId, focus: TrainingFocus): boolean => {
    return !INCOMPATIBILITY_MAP[gameId]?.includes(focus);
};

/**
 * Gets a list of all supported modes for a given game.
 * @param gameId The ID of the game.
 * @returns An array of supported TrainingFocus values.
 */
export const getSupportedModes = (gameId: GameId): TrainingFocus[] => {
    const allModes: TrainingFocus[] = ['neutral', 'math', 'music', 'verbal', 'spatial', 'eq', 'logic'];
    const incompatibleModes = INCOMPATIBILITY_MAP[gameId] || [];
    return allModes.filter(mode => !incompatibleModes.includes(mode));
};
