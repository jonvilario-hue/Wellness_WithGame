
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
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { chcDomains } from '@/types';
import { domainIcons } from '../icons';
import { cn } from '@/lib/utils';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useTrainingFocus } from '@/hooks/use-training-focus';

export function FullStrengthProfile() {
  const [isClient, setIsClient] = useState(false);
  const { performance } = usePerformanceStore();
  const { focus: globalFocus, isLoaded: isFocusLoaded } = useTrainingFocus();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !isFocusLoaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <div className="space-y-2">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full"/>)}
        </div>
      </div>
    );
  }

  const chartData = chcDomains.map(domain => {
    const perfData = performance[domain.key];
    const modeToDisplay = domain.supportsMath && globalFocus === 'math' ? 'math' : domain.supportsMusic && globalFocus === 'music' ? 'music' : 'neutral';
    const scoreData = perfData?.[modeToDisplay];
    const score = Math.round(scoreData?.score || 0);

    return {
      subject: domain.key,
      name: domain.name,
      score: score > 0 ? score : Math.round(Math.random() * 20 + 20), // Use real score or fallback for display
      fullMark: 100,
    };
  });

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
        {chcDomains.map(domain => {
          const Icon = domainIcons[domain.key];
          const data = chartData.find(d => d.subject === domain.key);
          const score = data?.score ?? 0;
          return (
            <div key={domain.key} className="flex items-center p-2 rounded-lg bg-muted/50">
              <Icon className="w-5 h-5 mr-3 text-muted-foreground" />
              <div className="flex-grow">
                <p className="font-medium text-sm">{domain.name}</p>
                <div className="w-full bg-background rounded-full h-1.5 mt-1">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${score}%` }}></div>
                </div>
              </div>
              <span className="font-mono text-lg font-semibold ml-4">{score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
