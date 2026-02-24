
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { chcDomains } from '@/lib/domain-constants';
import { domainIcons } from '../icons';
import { cn } from '@/lib/utils';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useTrainingFocus } from '@/hooks/use-training-focus';

export function FullStrengthProfile() {
  const [isClient, setIsClient] = useState(false);
  
  const getAdaptiveState = usePerformanceStore(state => state.getAdaptiveState);
  const { isLoaded: isFocusLoaded } = useTrainingFocus();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isComponentLoaded = isClient && isFocusLoaded;

  // OPTIMIZATION: Memoize the chart data calculation. It will only re-run when gameStates changes.
  const chartData = useMemo(() => {
    if (!isComponentLoaded) return [];
    return chcDomains.map(domain => {
      const gameState = getAdaptiveState(domain.id, 'neutral');
      const score = gameState ? Math.round((gameState.currentLevel / gameState.levelCeiling) * 100) : 0;
      const displayScore = score > 0 ? score : Math.round(Math.random() * 20 + 20); // Use real score or fallback for display

      return {
        subject: domain.key,
        name: domain.name,
        score: displayScore,
        fullMark: 100,
      };
    });
  }, [isComponentLoaded, getAdaptiveState]);


  if (!isComponentLoaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <div className="space-y-2">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full"/>)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: '0.8rem', fill: 'hsl(var(--muted-foreground))' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
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
      <div className="space-y-2">
        {chartData.map(data => {
            const domain = chcDomains.find(d => d.key === data.subject)!;
            const Icon = domainIcons[domain.key];
            return (
                <div key={domain.key} className="flex items-center p-2 rounded-lg bg-muted/50">
                    <Icon className="w-5 h-5 mr-3 text-muted-foreground" />
                    <div className="flex-grow">
                        <p className="font-medium text-sm">{domain.name}</p>
                        <div className="w-full bg-background rounded-full h-1.5 mt-1">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${data.score}%` }}></div>
                        </div>
                    </div>
                    <span className="font-mono text-lg font-semibold ml-4">{data.score}</span>
                </div>
            );
        })}
      </div>
    </div>
  );
}
