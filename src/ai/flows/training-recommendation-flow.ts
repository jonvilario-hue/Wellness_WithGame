
'use server';
/**
 * @fileOverview This file defines a deterministic flow for generating smart training recommendations.
 * It decides which of three types of recommendations to provide based on user performance data:
 * 1. Weak Area Targeting: Focus on the lowest-performing domain.
 * 2. Performance Insight: Capitalize on peak performance times (e.g., morning for EF).
 * 3. Momentum Starter: Build confidence by training in a high-performing domain.
 *
 * - getTrainingRecommendation - A function that takes user data and returns a single, prioritized training recommendation.
 * - TrainingRecommendationInput - The input type for the function.
 * - TrainingRecommendationOutput - The return type for the function.
 */

import { z } from 'zod';
import type { CHCDomain } from '@/types';
import { getRecommendationTemplate } from '@/lib/prompt-templates';

const CHCDomainEnum = z.enum([
  'Gf',
  'Gc',
  'Gwm',
  'Gs',
  'Gv',
  'Ga',
  'Glr',
  'EF',
]);

const UserPerformanceSchema = z.object({
  domain: CHCDomainEnum,
  score: z.number().describe('Average score over the last 5 sessions (0-100).'),
  trend: z.number().describe('Percentage change in score over the last 5 sessions.'),
});

const TrainingRecommendationInputSchema = z.object({
  performanceData: z.array(UserPerformanceSchema),
  sessionStreak: z.number().describe('Current daily training streak.'),
  hoursSinceLastSession: z.number().describe('Hours since the user last completed a session.'),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).describe('Current time of day for the user.'),
  recentFailures: z.number().describe('Number of failed games or early exits in the last session.'),
});
export type TrainingRecommendationInput = z.infer<typeof TrainingRecommendationInputSchema>;

const RecommendationTypeEnum = z.enum([
  'weakArea',
  'performanceInsight',
  'momentumStarter',
]);

const TrainingRecommendationOutputSchema = z.object({
  recommendationType: RecommendationTypeEnum.describe('The type of recommendation provided.'),
  title: z.string().describe('A catchy, motivating title for the button label.'),
  description: z.string().describe('A short, persuasive reason for this recommendation.'),
  domain: CHCDomainEnum.describe('The recommended CHC domain to train.'),
  performanceData: z.array(UserPerformanceSchema).optional(), // This was added to fix type issues in actions.ts
});
export type TrainingRecommendationOutput = z.infer<typeof TrainingRecommendationOutputSchema>;


export async function getTrainingRecommendation(input: TrainingRecommendationInput): Promise<TrainingRecommendationOutput> {
  const { performanceData, sessionStreak, hoursSinceLastSession, timeOfDay, recentFailures } = input;

  // Rule 1: Performance Insight (Highest Priority)
  if (timeOfDay === 'morning') {
    const template = getRecommendationTemplate('performanceInsight', 'EF', { timeOfDay });
    return {
      recommendationType: 'performanceInsight',
      title: template.title,
      description: template.description,
      domain: 'EF',
    };
  }

  // Rule 2: Momentum Starter (Second Priority)
  const isReturningAfterBreak = hoursSinceLastSession > 24;
  const hasBrokenStreak = sessionStreak === 0 && hoursSinceLastSession > 0;
  const needsConfidenceBoost = isReturningAfterBreak || hasBrokenStreak || recentFailures > 2;
  
  if (needsConfidenceBoost && performanceData.length > 0) {
    const strongestDomain = [...performanceData].sort((a, b) => b.score - a.score)[0];
    const template = getRecommendationTemplate('momentumStarter', strongestDomain.domain, { domain: strongestDomain.domain });
    return {
        recommendationType: 'momentumStarter',
        title: template.title,
        description: template.description,
        domain: strongestDomain.domain,
    };
  }

  // Rule 3: Weak Area Targeting (Default Priority)
  if (performanceData.length > 0) {
    const weakestDomain = [...performanceData].sort((a, b) => a.score - b.score)[0];
    const template = getRecommendationTemplate('weakArea', weakestDomain.domain, { domain: weakestDomain.domain });
    return {
        recommendationType: 'weakArea',
        title: template.title,
        description: template.description,
        domain: weakestDomain.domain,
    };
  }
  
  // Fallback (should not be reached with valid data)
  const fallbackDomain: CHCDomain = 'Gf';
  const template = getRecommendationTemplate('weakArea', fallbackDomain, { domain: fallbackDomain });
  return {
    recommendationType: 'weakArea',
    title: template.title,
    description: template.description,
    domain: fallbackDomain,
  };
}
