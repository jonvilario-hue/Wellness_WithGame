
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { domainIcons, SigmaIcon } from '@/components/icons';
import type { CHCDomain } from '@/types';
import { useState, useEffect, memo } from 'react';
import { ArrowDown, ArrowUp, Info, Minus, Brain, Music } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTrainingFocus, type TrainingFocus } from '@/hooks/use-training-focus';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { usePerformanceStore } from '@/hooks/use-performance-store';

interface ChcDomainCardProps {
  domain: {
    key: CHCDomain;
    name: string;
    description: string;
    gameTitle: string;
    tasks: string[];
    supportsMath: boolean;
    supportsMusic: boolean;
  };
}

const ChcDomainCardComponent = ({ domain }: ChcDomainCardProps) => {
  const Icon = domainIcons[domain.key];
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { performance } = usePerformanceStore();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const getTrendInfo = (trend: number) => {
    if (trend > 2) {
      return { Icon: ArrowUp, color: 'text-green-500', text: 'Trending upward' };
    }
    if (trend < -2) {
      return { Icon: ArrowDown, color: 'text-muted-foreground', text: 'Natural fluctuation' };
    }
    return { Icon: Minus, color: 'text-primary', text: 'Holding steady' };
  };

  const isLoaded = isGlobalFocusLoaded && isClient;
  
  const focusInfo = {
    neutral: { Icon: Brain, label: 'Core Thinking', color: 'text-muted-foreground', supported: true },
    math: { Icon: SigmaIcon, label: 'Math Reasoning', color: 'text-energize', supported: domain.supportsMath },
    music: { Icon: Music, label: 'Music Cognition', color: 'text-blue-500', supported: domain.supportsMusic },
  };
  
  const activeMode = focusInfo[globalFocus];
  const modeToDisplay = activeMode.supported ? globalFocus : 'neutral';
  const { Icon: ModeIcon, label: modeLabel, color: modeColor } = focusInfo[modeToDisplay];
  
  const perfData = isLoaded ? performance[domain.key] : null;
  const scoreData = perfData ? perfData[modeToDisplay] : null;
  const score = Math.round(scoreData?.score ?? 0);
  const trend = scoreData?.trend ?? 0;
  
  const { Icon: TrendIcon, color: trendColor, text: trendText } = getTrendInfo(trend);

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2 flex-grow">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-base">{domain.name}</CardTitle>
          <CardDescription className="text-xs">{domain.description}</CardDescription>
        </div>
        {isLoaded && (activeMode.supported || modeToDisplay !== 'neutral') && (
           <TooltipProvider>
             <Tooltip delayDuration={0}>
               <TooltipTrigger>
                  <ModeIcon className={cn("w-5 h-5", modeColor)} />
               </TooltipTrigger>
               <TooltipContent>
                 <p>Mode: {modeLabel}</p>
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
        )}
      </CardHeader>
      <CardContent className="space-y-4 py-4 flex-grow">
        {!isLoaded || !scoreData ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <TooltipProvider>
            <div>
              <div className="flex justify-between items-center mb-1">
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1 cursor-help">
                        Current Score <Info className="w-3 h-3"/>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adaptive skill rating (50 = average, 100 = high mastery)</p>
                      <p className="font-bold capitalize">{modeToDisplay} Mode</p>
                    </TooltipContent>
                  </Tooltip>
                <span className="text-sm font-bold text-primary">{score}</span>
              </div>
              <Progress value={score} />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 cursor-help">
                      Weekly Trend <Info className="w-3 h-3"/>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{trendText}</p>
                     <p className="font-bold capitalize">{modeToDisplay} Mode</p>
                  </TooltipContent>
                </Tooltip>
                <div className={`flex items-center font-bold ${trendColor}`}>
                    <TrendIcon className="w-4 h-4 mr-1"/>
                    {trend.toFixed(1)}%
                </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-2 pt-0">
        <Button asChild className="w-full">
          <Link href={`/training/${domain.key}`}>{domain.gameTitle}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ChcDomainCard = memo(ChcDomainCardComponent);
