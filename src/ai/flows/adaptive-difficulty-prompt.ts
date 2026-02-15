
'use server';

/**
 * @fileOverview A flow to determine the adaptive difficulty of a puzzle based on user performance.
 *
 * - adaptDifficulty - A function that adjusts puzzle difficulty based on user skill level.
 * - AdaptDifficultyInput - The input type for the adaptDifficulty function.
 * - AdaptDifficultyOutput - The return type for the adaptDifficulty function.
 */

import { z } from 'zod';
import { getDifficultyReasoning } from '@/lib/prompt-templates';

const AdaptDifficultyInputSchema = z.object({
  chcDomain: z.string().describe('The CHC domain the user is training in.'),
  userSkillLevel: z.number().describe('The user skill level in the specified CHC domain (0-100).'),
});
export type AdaptDifficultyInput = z.infer<typeof AdaptDifficultyInputSchema>;

const AdaptDifficultyOutputSchema = z.object({
  adjustedDifficulty: z.string().describe('The adjusted difficulty level of the puzzle (Easy, Medium, Hard).'),
  reasoning: z.string().describe('The reasoning for the difficulty adjustment based on user skill.'),
});
export type AdaptDifficultyOutput = z.infer<typeof AdaptDifficultyOutputSchema>;

export async function adaptDifficulty(input: AdaptDifficultyInput): Promise<AdaptDifficultyOutput> {
  let adjustedDifficulty: 'Easy' | 'Medium' | 'Hard';

  if (input.userSkillLevel < 30) {
    adjustedDifficulty = 'Easy';
  } else if (input.userSkillLevel <= 70) {
    adjustedDifficulty = 'Medium';
  } else {
    adjustedDifficulty = 'Hard';
  }

  const reasoning = getDifficultyReasoning(adjustedDifficulty, input.userSkillLevel);

  return {
    adjustedDifficulty,
    reasoning,
  };
}
