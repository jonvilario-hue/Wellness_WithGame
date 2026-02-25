
'use client';

import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useTheme } from '@/hooks/use-theme';
import type { GameId } from '@/types';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

export function SessionSparkline({ domainId }: { domainId: GameId }) {
  const { gameStates } = usePerformanceStore();
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    const neutralState = gameStates[`${domainId}/neutral`];
    const eqState = gameStates[`${domainId}/eq`];
    
    // Combine history from both modes if they exist
    const combinedHistory = [
        ...(neutralState?.levelHistory || []),
        ...(eqState?.levelHistory || []),
    ].sort((a,b) => a.sessionDate - b.sessionDate);

    if (combinedHistory.length === 0) return [];
    
    const last20 = combinedHistory.slice(-20);

    return last20.map((h, i) => ({
      session: i + 1,
      score: Math.round((h.endLevel / 10) * 100), // Assuming max level is 10 for normalization
    }));

  }, [gameStates, domainId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance History</CardTitle>
        <CardDescription>Your skill score over the last 20 sessions.</CardDescription>
      </CardHeader>
      <CardContent className="h-64 w-full">
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.colorScheme.accent} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={theme.colorScheme.accent} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="session" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
            <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                }}
            />
            <Area type="monotone" dataKey="score" stroke={`hsl(${theme.colorScheme.accent})`} fillOpacity={1} fill="url(#colorScore)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
