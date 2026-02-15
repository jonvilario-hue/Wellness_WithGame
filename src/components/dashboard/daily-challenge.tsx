
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useTransition } from 'react';
import { getDailyCircuitAction } from '@/app/actions';
import type { DailyCircuitOutput } from '@/ai/flows';
import { domainIcons } from '../icons';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';

export function DailyChallenge() {
  const [circuit, setCircuit] = useState<DailyCircuitOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { organicGrowth } = useTheme();

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getDailyCircuitAction();
        if (result) {
          setCircuit(result);
        } else {
          setError('Could not load a daily circuit. Please try again later.');
        }
      } catch (e) {
        setError('An unexpected error occurred while fetching the daily circuit.');
        console.error(e);
      }
    });
  }, []);

  if (isPending) {
    return (
      <Card className="relative overflow-hidden">
        {organicGrowth && <GrowthDecoration />}
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-primary"/>
            <Skeleton className="h-7 w-3/4" />
          </div>
          <Skeleton className="h-4 w-1/2 mx-auto mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-muted/30 p-4 flex flex-col items-center text-center gap-3">
                 <Skeleton className="h-12 w-12 rounded-lg" />
                 <div className="space-y-2 flex-1 w-full mt-2">
                    <Skeleton className="h-5 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-full" />
                 </div>
              </Card>
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
     return (
        <Card className="relative overflow-hidden">
          {organicGrowth && <GrowthDecoration />}
          <CardHeader>
               <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                  <Zap className="w-6 h-6 text-primary"/>
                  Daily Challenge
              </CardTitle>
          </CardHeader>
          <CardContent>
              <Alert variant="destructive">
                  <AlertTitle>Error Loading Challenge</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          </CardContent>
        </Card>
     );
  }

  if (!circuit) {
    return null; // Don't render anything if there's no circuit and no error
  }

  return (
    <Card className="bg-primary/5 border-primary/20 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
      {organicGrowth && <GrowthDecoration />}
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-primary"/>
            {circuit.circuitTitle}
        </CardTitle>
        <CardDescription>
          Your daily 3-part AI-curated workout to sharpen your mind.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {circuit.segments.map((segment, index) => {
            const Icon = domainIcons[segment.domain];
            return (
              <Card key={index} className="bg-muted/30 p-4 flex flex-col items-center text-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div className='flex-grow'>
                  <h4 className="font-bold text-lg text-foreground">{segment.title}</h4>
                  <p className="text-sm text-muted-foreground">{segment.transferAnchor}</p>
                </div>
              </Card>
            );
          })}
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href={`/training/daily-challenge`}>
            Start Daily Challenge <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
