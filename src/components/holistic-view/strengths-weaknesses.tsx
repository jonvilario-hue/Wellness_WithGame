
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { DOMAIN_META } from '@/lib/domain-constants';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import type { CHCDomain } from '@/types';
import type { Subject } from './holistic-view';
import { cn } from '@/lib/utils';
import { GrowthDecoration } from '../ui/growth-decoration';
import { useTheme } from '@/hooks/use-theme';

const getFilteredScore = (gameStates: any, domainKey: CHCDomain, subject: Subject) => {
    const domainId = DOMAIN_META[domainKey].id;
    const focus = subject === 'eq' ? 'eq' : 'neutral';
    
    const state = gameStates[`${domainId}/${focus}`];
    if (!state || state.sessionCount === 0) return 40; // Baseline for no data

    return Math.round((state.currentLevel / state.levelCeiling) * 100);
}


export function StrengthsWeaknesses({ subject }: { subject: Subject }) {
  const { gameStates } = usePerformanceStore();
  const { organicGrowth } = useTheme();
  const router = useRouter();

  const domainScores = useMemo(() => {
    return (Object.keys(DOMAIN_META) as CHCDomain[]).map(key => ({
      key,
      friendlyLabel: DOMAIN_META[key].friendlyLabel,
      score: getFilteredScore(gameStates, key, subject),
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
