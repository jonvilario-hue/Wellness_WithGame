'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { DOMAIN_META, chcDomains } from '@/lib/domain-constants';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import type { AdaptiveState, CHCDomain, TrainingFocus } from '@/types';
import { cn } from '@/lib/utils';
import { GrowthDecoration } from '../ui/growth-decoration';
import { useTheme } from '@/hooks/use-theme';
import { FOCUS_MODE_META } from '@/lib/mode-constants';

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

const getScoreForFocus = (gameStates: any, focus: TrainingFocus): number => {
    let totalScore = 0;
    let count = 0;

    chcDomains.forEach(domain => {
        const key = `${domain.id}/${focus}`;
        const state = gameStates[key];
        if (state && state.sessionCount > 0) {
            totalScore += (state.currentLevel / state.levelCeiling) * 100;
            count++;
        }
    });

    if (count === 0) return 40; // Baseline for no data
    return Math.round(totalScore / count);
};


export function StrengthsWeaknesses({ subject, viewMode = 'domain' }: { subject?: TrainingFocus; viewMode?: 'domain' | 'focus' }) {
  const { gameStates } = usePerformanceStore();
  const { organicGrowth } = useTheme();
  const router = useRouter();

  const domainScores = useMemo(() => {
    return (Object.keys(DOMAIN_META) as CHCDomain[]).map(key => ({
      key,
      friendlyLabel: DOMAIN_META[key].friendlyLabel,
      score: viewMode === 'domain' ? getAggregatedDomainScore(gameStates, key) : getScoreForDomain(gameStates, key, subject!),
      color: DOMAIN_META[key].color.replace('bg-', 'text-'),
    })).sort((a, b) => b.score - a.score);
  }, [gameStates, subject, viewMode]);

  const focusScores = useMemo(() => {
    if (viewMode !== 'focus') return [];
    return (Object.keys(FOCUS_MODE_META) as TrainingFocus[]).map(key => ({
        key,
        label: FOCUS_MODE_META[key].label,
        score: getScoreForFocus(gameStates, key),
        color: 'text-primary',
    })).sort((a,b) => b.score - a.score);
  }, [gameStates, viewMode]);


  if (viewMode === 'focus') {
    const strengths = focusScores.slice(0, 3);
    const weaknesses = focusScores.slice(-focusScores.length + 3).reverse();
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                {organicGrowth && <GrowthDecoration />}
                <CardHeader><CardTitle className="font-headline text-green-500">Strongest Training Modes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {strengths.map(focus => (
                        <div key={focus.key}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{focus.label}</span>
                                <span className="text-sm font-bold text-green-500">{focus.score}</span>
                            </div>
                            <Progress value={focus.score} className="h-2 [&>div]:bg-green-500" />
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                {organicGrowth && <GrowthDecoration />}
                <CardHeader><CardTitle className="font-headline text-amber-500">Growth Areas in Training</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {weaknesses.map(focus => (
                        <div key={focus.key}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium">{focus.label}</span>
                                <span className="text-sm font-bold text-amber-500">{focus.score}</span>
                            </div>
                            <Progress value={focus.score} className="h-2 [&>div]:bg-amber-500" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
  }

  // Default: viewMode === 'domain'
  const strengths = domainScores.slice(0, 3);
  const weaknesses = domainScores.slice(-3).reverse();

  const handleBarClick = (domainKey: CHCDomain) => {
    router.push(`/games/${domainKey}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
        {organicGrowth && <GrowthDecoration />}
        <CardHeader>
          <CardTitle className="font-headline text-green-500">Top Strengths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {strengths.map(domain => (
            <div key={domain.key} className="cursor-pointer" onClick={() => handleBarClick(domain.key)}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{domain.friendlyLabel}</span>
                <span className={cn("text-sm font-bold", domain.color)}>{domain.score}</span>
              </div>
              <Progress value={domain.score} className="h-2 [&>div]:bg-green-500" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
        {organicGrowth && <GrowthDecoration />}
        <CardHeader>
          <CardTitle className="font-headline text-amber-500">Growth Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {weaknesses.map(domain => (
             <div key={domain.key} className="cursor-pointer" onClick={() => handleBarClick(domain.key)}>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{domain.friendlyLabel}</span>
                    <span className={cn("text-sm font-bold", domain.color)}>{domain.score}</span>
                </div>
              <Progress value={domain.score} className="h-2 [&>div]:bg-amber-500" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
