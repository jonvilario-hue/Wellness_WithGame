
/**
 * @jest-environment jsdom
 */

import { difficultyPolicies, getDifficultyParams } from '@/data/difficulty-policies';
import type { GameId, TrainingFocus } from '@/types';
import { isModeSupported } from '../mode-capabilities';

const ALL_GAME_IDS: GameId[] = Object.keys(difficultyPolicies) as GameId[];
const ALL_MODES: TrainingFocus[] = ['neutral', 'math', 'music', 'verbal', 'spatial', 'eq', 'logic'];

describe('Mode Matrix Test Suite', () => {
  ALL_GAME_IDS.forEach(gameId => {
    describe(`Game: ${gameId}`, () => {
      ALL_MODES.forEach(mode => {
        
        const isIntentionallyIncompatible = !isModeSupported(gameId, mode);

        if (isIntentionallyIncompatible) {
          test(`should be explicitly incompatible with '${mode}' mode`, () => {
            const policy = difficultyPolicies[gameId];
            const hasContentConfig = !!policy.levelMap[1]?.content_config[mode];
            expect(hasContentConfig).toBe(false);
          });
        } else {
          test(`should have valid difficulty params for '${mode}' mode at all tiers`, () => {
            const policy = difficultyPolicies[gameId];
            const maxLevel = Object.keys(policy.levelMap).length;

            for (let level = 1; level <= maxLevel; level++) {
              if (!policy.levelMap[level]) continue;
              
              const params = getDifficultyParams(gameId, level, mode);
              
              const expectedContent = policy.levelMap[level].content_config[mode] || policy.levelMap[level].content_config['neutral'];

              expect(params).not.toBeNull();
              expect(params).toHaveProperty('mechanics');
              
              if (expectedContent && Object.keys(expectedContent).length > 0) {
                  expect(params).toHaveProperty('content');
              }
            }
          });
        }
      });
    });
  });
});
