'use client';

import { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { DOMAIN_META, chcDomains } from '@/lib/domain-constants';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import type { TrainingFocus, AdaptiveState } from '@/types';
import { useTheme } from '@/hooks/use-theme';
import { FOCUS_MODE_META } from '@/lib/mode-constants';

const focusColors: Partial<Record<TrainingFocus, string>> = {
    math: 'hsl(28.1, 96.5%, 52.9%)', // orange-400 from Gs
    music: 'hsl(263.4, 90.9%, 60.8%)', // violet-400 from Ga
    verbal: 'hsl(43.3, 95.5%, 53.1%)', // amber-400 from Gc
    spatial: 'hsl(75.5, 83.5%, 50.8%)', // lime-400 from Gv
    eq: 'hsl(340.5, 94.3%, 65.5%)', // rose-400 from EF
    logic: 'hsl(217, 91.2%, 59.8%)' // blue-400 from Gf
};

const getAggregatedScore = (gameStates: any, domainKey: keyof typeof DOMAIN_META): number => {
    const domainId = DOMAIN_META[domainKey].id;
    const allStatesForDomain = Object.keys(gameStates)
        .filter(key => key.startsWith(`${domainId}/`))
        .map(key => gameStates[key] as AdaptiveState);

    if (allStatesForDomain.length === 0) return 40; // Baseline

    const activeStates = allStatesForDomain.filter(s => s.sessionCount > 0);
    if (activeStates.length === 0) return 40;

    const totalScore = activeStates.reduce((acc, state) => acc + (state.currentLevel / state.levelCeiling) * 100, 0);
    return Math.round(totalScore / activeStates.length);
};

const getFilteredScore = (gameStates: any, domainKey: keyof typeof DOMAIN_META, focus: TrainingFocus) => {
    const domainId = DOMAIN_META[domainKey].id;
    
    const state = gameStates[`${domainId}/${focus}`];
    if (!state || state.sessionCount === 0) return 40; // Baseline for no data

    return Math.round((state.currentLevel / state.levelCeiling) * 100);
}

export function StrengthProfileRadar({ focus }: { focus?: TrainingFocus }) {
  const [isClient, setIsClient] = useState(false);
  const { gameStates } = usePerformanceStore();
  const { theme } = useTheme();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const chartData = chcDomains.map(domain => ({
    subject: `(${domain.key}) ${domain.friendlyLabel}`,
    score: focus ? getFilteredScore(gameStates, domain.key, focus) : getAggregatedScore(gameStates, domain.key),
    fullMark: 100,
  }));
  
  const title = focus ? `My ${FOCUS_MODE_META[focus].label} Profile` : 'My Full Strength';

  if (!isClient) {
    return (
        <>
            <CardHeader>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-80 w-full" />
            </CardContent>
        </>
    );
  }

  const radarColor = (focus && focusColors[focus])
    ? focusColors[focus]
    : `hsl(${theme.colorScheme.accent})`;

  return (
    <>
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        <CardDescription>A holistic overview of your domain strengths.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: '0.8rem', fill: 'hsl(var(--muted-foreground))' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="score" stroke={radarColor} fill={radarColor} fillOpacity={0.6} />
               <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </>
  );
}
