
'use client';

import { TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { usePerformanceStore } from '@/hooks/use-performance-store';

export function ChcProfileOverview() {
  const [isClient, setIsClient] = useState(false);
  const { gameStates } = usePerformanceStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { chartData, score, trend } = useMemo(() => {
    if (!isClient) return { chartData: [], score: 0, trend: 0 };

    const allHistory = Object.values(gameStates).flatMap(gs => gs.levelHistory);
    allHistory.sort((a, b) => a.sessionDate - b.sessionDate);
    const recentHistory = allHistory.slice(-15);
    
    if (recentHistory.length === 0) return { chartData: [], score: 0, trend: 0 };
    
    const chartPoints = recentHistory.map((h, i) => ({
        name: `S${i + 1}`,
        score: h.avgAccuracy * 100,
        fill: `hsl(var(--chart-${(i % 5) + 1}))`,
    }));

    const averageScore = recentHistory.reduce((acc, h) => acc + (h.avgAccuracy * 100), 0) / recentHistory.length;
    
    const startScore = recentHistory[0]?.avgAccuracy * 100 || 0;
    const endScore = recentHistory[recentHistory.length - 1]?.avgAccuracy * 100 || 0;
    const trendValue = startScore > 0 ? ((endScore - startScore) / startScore) * 100 : 0;

    return {
        chartData: chartPoints,
        score: Math.round(averageScore),
        trend: parseFloat(trendValue.toFixed(1))
    };
  }, [gameStates, isClient]);
  

  if (!isClient) {
    return (
        <Card className="bg-muted/30 p-4 rounded-lg h-[150px] animate-pulse" />
    );
  }

  const trendColor = trend > 0 ? 'text-green-500' : 'text-amber-500';
  
  return (
    <Card className="bg-muted/30 p-4 rounded-lg">
       <div className="text-center text-sm font-semibold text-muted-foreground mb-4">
            Performance Snapshot (Last {chartData.length} Sessions)
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-sm text-muted-foreground font-semibold">Average Accuracy</p>
          <p className="text-4xl font-bold text-primary">{score}%</p>
          <p className="text-xs text-muted-foreground capitalize">across all games</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-sm text-muted-foreground font-semibold">Accuracy Trend</p>
          <p className={cn('text-4xl font-bold', trendColor)}>
            {trend >= 0 ? '+' : ''}
            {trend}%
          </p>
           <p className="text-xs text-muted-foreground">change over this period</p>
        </div>
        <div className="h-24 md:col-span-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                cursor={{ fill: 'hsl(var(--muted))' }}
                formatter={(value) => `${(value as number).toFixed(0)}%`}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} />
               <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide={true} domain={[0, 100]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
