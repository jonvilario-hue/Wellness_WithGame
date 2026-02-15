
'use server';

import { weakAreaRecommendation, adaptDifficulty, getTrainingRecommendation, getDailyCircuit } from '@/ai/flows';
import type { AdaptDifficultyInput, TrainingRecommendationInput, WeakAreaRecommendationInput } from '@/ai/flows';

export async function getWeakAreaRecommendationsAction(performanceData: WeakAreaRecommendationInput['performanceData']) {
  try {
    const inputData = performanceData.map(({ domain, score, sessions }) => ({
        domain,
        score,
        sessions: sessions || 0, // Ensure sessions is a number
    }));
    return await weakAreaRecommendation({ performanceData: inputData });
  } catch (error)
  {
    console.error(error);
    return null;
  }
}

export async function getAdaptiveDifficultyAction(input: AdaptDifficultyInput) {
  try {
    return await adaptDifficulty(input);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getTrainingRecommendationAction(performanceData: TrainingRecommendationInput['performanceData']) {
   const input: TrainingRecommendationInput = {
    performanceData: performanceData,
    sessionStreak: 5,
    hoursSinceLastSession: 12,
    timeOfDay: 'morning', 
    recentFailures: 0,
  };

  try {
    const result = await getTrainingRecommendation(input);
    if (!result.performanceData) {
      result.performanceData = performanceData;
    }
    return result;
  } catch (error) {
    console.error('Error getting training recommendation:', error);
    return null;
  }
}

export async function getDailyCircuitAction() {
  try {
    const result = await getDailyCircuit();
    return result;
  } catch (error) {
    console.error('Error getting daily circuit:', error);
    return null;
  }
}
