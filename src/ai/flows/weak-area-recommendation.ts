
// Weak Area Targeting: Smart repeat algorithms identify weak areas for revisit across all 8 CHC domains.
// A tool for helping the user train the appropriate skills.

'use server';
/**
 * @fileOverview This file defines a deterministic function for identifying a user's weak areas across the 8 CHC domains
 * and recommending specific training exercises or puzzles to help improve those areas.
 *
 * - weakAreaRecommendation - A function that takes user's performance data and returns recommendations for weak area training.
 * - WeakAreaRecommendationInput - The input type for the weakAreaRecommendation function.
 * - WeakAreaRecommendationOutput - The return type for the weakAreaRecommendation function.
 */

import { z } from 'zod';
import { chcDomains } from '@/types';
import { getWeakAreaTemplate } from '@/lib/prompt-templates';

const CHCDomainSchema = z.enum([
  'Gf',
  'Gc',
  'Gwm',
  'Gs',
  'Gv',
  'Ga',
  'Glr',
  'EF',
]);

const UserPerformanceDataSchema = z.object({
  domain: CHCDomainSchema.describe('The CHC domain the performance data is for'),
  score: z.number().describe('The user score in the domain'),
  sessions: z.number().describe('The number of training sessions completed in the domain'),
});

const WeakAreaRecommendationInputSchema = z.object({
  performanceData: z
    .array(UserPerformanceDataSchema)
    .describe('The user performance data across all 8 CHC domains.'),
});
export type WeakAreaRecommendationInput = z.infer<
  typeof WeakAreaRecommendationInputSchema
>;

const TrainingRecommendationSchema = z.object({
  domain: CHCDomainSchema.describe('The CHC domain for the recommended training.'),
  exercise: z.string().describe('A specific training exercise or puzzle to improve the identified weak area.'),
  reason: z.string().describe('Why this exercise is recommended for this particular weak area'),
});

const WeakAreaRecommendationOutputSchema = z.object({
  recommendations: z
    .array(TrainingRecommendationSchema)
    .describe('An array of training recommendations for the user. This will be empty if there is not enough data.'),
  message: z
    .string()
    .optional()
    .describe('A message to the user, especially if there is not enough data to generate recommendations.'),
});
export type WeakAreaRecommendationOutput = z.infer<
  typeof WeakAreaRecommendationOutputSchema
>;

export async function weakAreaRecommendation(
  input: WeakAreaRecommendationInput
): Promise<WeakAreaRecommendationOutput> {
  const { performanceData } = input;
  const totalSessions = performanceData.reduce((sum, d) => sum + d.sessions, 0);

  // 1. Check if the user has completed at least 5 sessions in total.
  if (totalSessions < 5) {
    return {
      recommendations: [],
      message: getWeakAreaTemplate('insufficientData').reason,
    };
  }

  // 2. Identify the single domain with the lowest score.
  const weakestDomainData = [...performanceData].sort((a, b) => a.score - b.score)[0];
  
  if (!weakestDomainData) {
     return {
      recommendations: [],
      message: getWeakAreaTemplate('insufficientData').reason,
    };
  }

  const domainInfo = chcDomains.find(d => d.key === weakestDomainData.domain);
  const exercise = domainInfo?.gameTitle || 'Training';
  const reason = getWeakAreaTemplate('focusArea', weakestDomainData.domain).reason;

  const recommendation: z.infer<typeof TrainingRecommendationSchema> = {
    domain: weakestDomainData.domain,
    exercise,
    reason,
  };

  return {
    recommendations: [recommendation],
  };
}
