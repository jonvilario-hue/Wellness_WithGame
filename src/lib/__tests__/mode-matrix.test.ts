
/**
 * @jest-environment jsdom
 */

import { difficultyPolicies, getDifficultyParams } from '@/data/difficulty-policies';
import type { GameId, TrainingFocus } from '@/types';
import { SPATIAL_INCOMPATIBLE_GAMES } from '../spatial-constants';

const ALL_GAME_IDS: GameId[] = Object.keys(difficultyPolicies) as GameId[];
const ALL_MODES: TrainingFocus[] = ['neutral', 'math', 'music', 'verbal', 'spatial', 'eq', 'logic'];

describe('Mode Matrix Test Suite', () => {
  ALL_GAME_IDS.forEach(gameId => {
    describe(`Game: ${gameId}`, () => {
      ALL_MODES.forEach(mode => {
        
        const isIntentionallyIncompatible =
          mode === 'spatial' && SPATIAL_INCOMPATIBLE_GAMES.includes(gameId);

        if (isIntentionallyIncompatible) {
          test(`should be explicitly incompatible with '${mode}' mode`, () => {
            const params = getDifficultyParams(gameId, 1, mode);
            // Incompatible modes should not have a content_config for that focus
            expect(params?.content).toBeUndefined();
          });
        } else {
          test(`should have valid difficulty params for '${mode}' mode at all tiers`, () => {
            const policy = difficultyPolicies[gameId];
            const maxLevel = Object.keys(policy.levelMap).length;

            for (let level = 1; level <= maxLevel; level++) {
              const params = getDifficultyParams(gameId, level, mode);
              
              // It should either have a specific config or fallback to neutral's config
              const expectedContent = policy.levelMap[level].content_config[mode] || policy.levelMap[level].content_config['neutral'];

              expect(params).not.toBeNull();
              expect(params).toHaveProperty('mechanics');
              
              if (expectedContent) {
                  expect(params).toHaveProperty('content');
              }
            }
          });
        }
      });
    });
  });
});
