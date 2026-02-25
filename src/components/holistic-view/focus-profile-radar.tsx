'use client';
import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useTheme } from '@/hooks/use-theme';
import { FOCUS_MODE_META } from '@/lib/mode-constants';
import { chcDomains } from '@/lib/domain-constants';
import type { TrainingFocus } from '@/types';

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

export function FocusProfileRadar() {
  const [isClient, setIsClient] = useState(false);
  const { gameStates } = usePerformanceStore();
  const { theme } = useTheme();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const chartData = Object.entries(FOCUS_MODE_META).map(([key, { label }]) => ({
    subject: label,
    score: getScoreForFocus(gameStates, key as TrainingFocus),
    fullMark: 100,
  }));
  
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

  const radarColor = `hsl(${theme.colorScheme.accent})`;

  return (
    <>
      <CardHeader>
        <CardTitle className="font-headline">My Performance by Training Focus</CardTitle>
        <CardDescription>A holistic overview of your strengths across different training modes.</CardDescription>
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
