'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Lightbulb } from 'lucide-react';
import { GrowthDecoration } from '../ui/growth-decoration';
import { useTheme } from '@/hooks/use-theme';
import type { TrainingFocus, CHCDomain, AdaptiveState } from '@/types';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { DOMAIN_META } from '@/lib/domain-constants';

const getAggregatedDomainScore = (gameStates: any, domainKey: CHCDomain): number => {
    const domainId = DOMAIN_META[domainKey].id;
    const allStatesForDomain = Object.keys(gameStates)
        .filter(key => key.startsWith(`${domainId}/`))
        .map(key => gameStates[key] as AdaptiveState);
    
    if (allStatesForDomain.length === 0) return 40;

    const activeStates = allStatesForDomain.filter(s => s.sessionCount > 0);
    if (activeStates.length === 0) return 40;

    const totalScore = activeStates.reduce((acc, state) => acc + (state.currentLevel / state.levelCeiling) * 100, 0);
    return Math.round(totalScore / activeStates.length);
};

const getScoreForDomain = (gameStates: any, domainKey: CHCDomain, focus: TrainingFocus) => {
    const domainId = DOMAIN_META[domainKey].id;
    const state = gameStates[`${domainId}/${focus}`];
    if (!state || state.sessionCount === 0) return 40; // Baseline for no data
    return Math.round((state.currentLevel / state.levelCeiling) * 100);
};


export function SubjectInsightCard({ subject }: { subject?: TrainingFocus }) {
    const { organicGrowth } = useTheme();
    const { gameStates } = usePerformanceStore();

    const insight = useMemo(() => {
        const domainScores = (Object.keys(DOMAIN_META) as CHCDomain[]).map(key => ({
            key,
            friendlyLabel: DOMAIN_META[key].friendlyLabel,
            score: subject ? getScoreForDomain(gameStates, key, subject) : getAggregatedDomainScore(gameStates, key),
        })).sort((a, b) => b.score - a.score);

        if (domainScores.length < 3) return "Keep playing to unlock new insights!";

        const strongest = domainScores[0];
        const weakest = domainScores[domainScores.length - 1];

        if (strongest.score > weakest.score + 20) {
             return `Your top strength is currently ${strongest.friendlyLabel}, while ${weakest.friendlyLabel} is a great area for growth.`;
        }
        
        if (subject) {
             return `You're showing balanced development across all domains within the ${subject} focus.`;
        }

        return "You are showing balanced development across all cognitive domains. Keep up the great work!";

    }, [gameStates, subject]);
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
       {organicGrowth && <GrowthDecoration />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Lightbulb className="w-5 h-5 text-primary" />
          Key Insight
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg italic text-center">"{insight}"</p>
      </CardContent>
    </Card>
  );
}
