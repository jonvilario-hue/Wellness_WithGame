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

const domainHslColors: Record<CHCDomain, string> = {
    Gf: 'hsl(217, 91.2%, 59.8%)', // blue-400
    Gc: 'hsl(43.3, 95.5%, 53.1%)', // amber-400
    Gwm: 'hsl(190.1, 95.1%, 46.9%)',// cyan-400
    Gs: 'hsl(28.1, 96.5%, 52.9%)', // orange-400
    Gv: 'hsl(75.5, 83.5%, 50.8%)', // lime-400
    Ga: 'hsl(263.4, 90.9%, 60.8%)', // violet-400
    Glr: 'hsl(150.8, 79.8%, 43.1%)', // emerald-400
    EF: 'hsl(340.5, 94.3%, 65.5%)', // rose-400
};

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


export function StrengthsWeaknesses({ subject }: { subject?: TrainingFocus }) {
  const { gameStates } = usePerformanceStore();
  const { organicGrowth } = useTheme();
  const router = useRouter();

  const domainScores = useMemo(() => {
    return (Object.keys(DOMAIN_META) as CHCDomain[]).map(key => ({
      key,
      friendlyLabel: DOMAIN_META[key].friendlyLabel,
      score: subject ? getScoreForDomain(gameStates, key, subject) : getAggregatedDomainScore(gameStates, key),
      color: DOMAIN_META[key].color.replace('bg-', 'text-'),
    })).sort((a, b) => b.score - a.score);
  }, [gameStates, subject]);

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
              <Progress value={domain.score} className="h-2" indicatorColor={domainHslColors[domain.key]} />
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
              <Progress value={domain.score} className="h-2" indicatorColor={domainHslColors[domain.key]} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
