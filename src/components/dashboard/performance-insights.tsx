
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Lightbulb, TrendingUp, Zap, X } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import type { TrainingRecommendationOutput } from '@/ai/flows';
import { useState, useEffect, useTransition } from 'react';
import { getTrainingRecommendationAction } from '@/app/actions';
import { Skeleton } from '../ui/skeleton';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';
import { usePerformanceStore } from '@/hooks/use-performance-store';

const recommendationIcons = {
  weakArea: TrendingUp,
  performanceInsight: Lightbulb,
  momentumStarter: Zap,
};

const INSIGHT_KEY = 'performanceInsightsInsightDismissed';

export function PerformanceInsights() {
  const [recommendation, setRecommendation] = useState<TrainingRecommendationOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isInsightVisible, setIsInsightVisible] = useState(false);
  const { organicGrowth } = useTheme();
  const { performance } = usePerformanceStore();


  useEffect(() => {
    startTransition(async () => {
      const flatPerformanceData = Object.entries(performance).map(([domain, data]) => ({
        domain,
        score: data.neutral.score,
        trend: data.neutral.trend,
      })) as any;
      const result = await getTrainingRecommendationAction(flatPerformanceData);
      setRecommendation(result);
    });

    const dismissed = localStorage.getItem(INSIGHT_KEY);
    if (dismissed !== 'true') {
      setIsInsightVisible(true);
    }
  }, [performance]);

  const handleDismissInsight = () => {
    setIsInsightVisible(false);
    localStorage.setItem(INSIGHT_KEY, 'true');
  };

  const renderBody = () => {
    if (isPending || !recommendation) {
      return (
        <div className="flex-grow flex flex-col justify-center items-center text-center space-y-3">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      );
    }

    const RecIcon = recommendationIcons[recommendation.recommendationType] || Sparkles;

    return (
      <div className="flex-grow flex flex-col justify-center items-center text-center space-y-3">
        <div className="p-3 bg-primary/10 rounded-full">
            <RecIcon className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
            {recommendation.description}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/training/${recommendation.domain}`}>{recommendation.title}</Link>
        </Button>
      </div>
    );
  };


  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col relative overflow-hidden">
      {organicGrowth && <GrowthDecoration />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Sparkles className="w-5 h-5 text-primary" />
          Performance Insights
        </CardTitle>
        <CardDescription>
          Personalized tips based on your training habits.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        {renderBody()}

        {isInsightVisible && (
          <div className="p-3 bg-primary/10 rounded-lg text-center relative mt-2">
            <p className="text-sm flex items-start gap-2 pr-6">
              <Lightbulb className="w-5 h-5 mt-0.5 text-primary shrink-0" />
              <span className="text-foreground text-left"><span className="font-bold">Insight:</span> This card uses AI to analyze your recent activity and provide a smart suggestion for your next training session.</span>
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={handleDismissInsight}
              aria-label="Dismiss insight"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
