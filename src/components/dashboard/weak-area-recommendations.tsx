
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getWeakAreaRecommendationsAction } from '@/app/actions';
import type { WeakAreaRecommendationOutput } from '@/ai/flows';
import { Lightbulb, Loader2, Info, ArrowRight, Target, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { domainIcons } from '../icons';
import { chcDomains } from '@/types';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';
import { usePerformanceStore } from '@/hooks/use-performance-store';

const INSIGHT_KEY = 'weakAreaInsightDismissed';

export function WeakAreaRecommendations() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<WeakAreaRecommendationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInsightVisible, setIsInsightVisible] = useState(false);
  const { organicGrowth } = useTheme();
  const { performance } = usePerformanceStore();

  useEffect(() => {
    startTransition(async () => {
      try {
        const flatPerformanceData = Object.entries(performance).map(([domain, data]) => ({
          domain,
          score: data.neutral.score,
          sessions: data.neutral.sessions,
        })) as any; // Cast as any to satisfy the input type

        const res = await getWeakAreaRecommendationsAction(flatPerformanceData);
        setResult(res);
      } catch (e) {
        setError('Failed to get recommendations. Please try again.');
        console.error(e);
      }
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

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full mt-2" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (result) {
      if (result.message && result.recommendations.length === 0) {
        return (
          <Alert>
             <Info className="h-4 w-4" />
            <AlertTitle>Not Enough Data Yet</AlertTitle>
            <AlertDescription>
              {result.message} Try a few different training games first.
            </AlertDescription>
          </Alert>
        );
      }

      if (result.recommendations.length > 0) {
        const weakestDomainRec = result.recommendations[0];
        const domainInfo = chcDomains.find(d => d.key === weakestDomainRec.domain);
        const Icon = domainIcons[weakestDomainRec.domain];

        return (
          <div className="space-y-3 text-center">
             <div className="p-3 bg-primary/10 rounded-full inline-block">
                <Icon className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold text-lg">
              Today's Growth Focus: {domainInfo?.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {weakestDomainRec.reason}
            </p>
            <Button asChild className="w-full">
              <Link href={`/training/${weakestDomainRec.domain}`}>
                Train {weakestDomainRec.exercise} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        );
      }
    }
    
    return <p className="text-muted-foreground text-sm text-center">Could not load recommendation.</p>;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
      {organicGrowth && <GrowthDecoration />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Target className="w-5 h-5 text-primary" />
          Weak Area Targeting
        </CardTitle>
        <CardDescription>
          AI-powered suggestions to turn weaknesses into strengths.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {renderContent()}

        {isInsightVisible && (
          <div className="p-3 bg-primary/10 rounded-lg text-center relative mt-2">
            <p className="text-sm flex items-start gap-2 pr-6">
              <Lightbulb className="w-5 h-5 mt-0.5 text-primary shrink-0" />
              <span className="text-foreground text-left"><span className="font-bold">Insight:</span> This AI tool analyzes your performance to find your biggest area for growth and recommends a specific game to train it.</span>
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
