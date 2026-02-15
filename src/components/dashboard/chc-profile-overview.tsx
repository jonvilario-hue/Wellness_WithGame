
'use client';

import { TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { useState, useEffect } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

type Timeframe = 'weekly' | 'monthly' | 'overall';

const generateMockData = (timeframe: Timeframe) => {
  const data = [];
  let numPoints = 5;
  let scoreMultiplier = 2;
  let trendBonus = 5;
  let labelPrefix = 'D';

  if (timeframe === 'monthly') {
    numPoints = 4; // 4 weeks
    scoreMultiplier = 4;
    trendBonus = 10;
    labelPrefix = 'W';
  } else if (timeframe === 'overall') {
    numPoints = 6; // 6 months
    scoreMultiplier = 6;
    trendBonus = 25;
    labelPrefix = 'M';
  }

  for (let i = 0; i < numPoints; i++) {
    const score = 60 + Math.random() * 15 + i * scoreMultiplier - (numPoints * scoreMultiplier) / 2 + trendBonus;
    const barColor = `hsl(var(--chart-${(i % 5) + 1}))`;
    data.push({
      name: `${labelPrefix}${i + 1}`,
      score: Math.max(10, Math.min(100, score)),
      fill: barColor,
    });
  }
  return data;
};

const calculateMetrics = (data: { name: string, score: number }[]) => {
  if (data.length === 0) return { score: 0, trend: 0 };
  const scores = data.map(d => d.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const startScore = scores[0];
  const endScore = scores[scores.length - 1];
  const trend = startScore > 0 ? ((endScore - startScore) / startScore) * 100 : 0;
  return { score: Math.round(averageScore), trend: parseFloat(trend.toFixed(1)) };
};


export function ChcProfileOverview() {
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
        <Card className="bg-muted/30 p-4 rounded-lg h-[150px] animate-pulse" />
    );
  }

  const chartData = generateMockData(timeframe);
  const { score, trend } = calculateMetrics(chartData);
  
  const trendColor = trend > 0 ? 'text-green-500' : 'text-amber-500';
  const timeframeText = {
      weekly: "from last week",
      monthly: "from last month",
      overall: "from baseline"
  }

  return (
    <Card className="bg-muted/30 p-4 rounded-lg">
       <div className="flex justify-center mb-4">
            <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)} className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="overall">Overall</TabsTrigger>
              </TabsList>
            </Tabs>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-sm text-muted-foreground font-semibold">Average Score</p>
          <p className="text-4xl font-bold text-primary">{score}</p>
          <p className="text-xs text-muted-foreground capitalize">{timeframe} average</p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-1">
          <p className="text-sm text-muted-foreground font-semibold">Performance Trend</p>
          <p className={cn('text-4xl font-bold', trendColor)}>
            {trend >= 0 ? '+' : ''}
            {trend}%
          </p>
           <p className="text-xs text-muted-foreground">Change {timeframeText[timeframe]}</p>
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
