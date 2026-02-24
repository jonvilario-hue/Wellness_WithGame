
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
import type { CHCDomain, TrainingFocus } from '@/types';
import { useState, useEffect, memo, useMemo } from 'react';
import { ArrowDown, ArrowUp, Info, Minus, Brain, Music, MessageSquare, View, Smile, Share2 } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTrainingFocus } from '@/hooks/use-training-focus';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { usePerformanceStore } from '@/hooks/use-performance-store';

interface ChcDomainCardProps {
  domain: {
    key: CHCDomain;
    id: any;
    name: string;
    description: string;
    gameTitle: string;
    supportsMath: boolean;
    supportsMusic: boolean;
    supportsVerbal: boolean;
    supportsSpatial: boolean;
    supportsEq: boolean;
    supportsLogic: boolean;
  };
}

const getTrendInfo = (trend: number) => {
    if (trend > 2) {
      return { Icon: ArrowUp, color: 'text-green-500', text: 'Trending upward' };
    }
    if (trend < -2) {
      return { Icon: ArrowDown, color: 'text-muted-foreground', text: 'Natural fluctuation' };
    }
    return { Icon: Minus, color: 'text-primary', text: 'Holding steady' };
};

const ChcDomainCardComponent = ({ domain }: ChcDomainCardProps) => {
  const Icon = domainIcons[domain.key];
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  
  const getAdaptiveState = usePerformanceStore(state => state.getAdaptiveState);
  
  const [gameState, setGameState] = useState(() => getAdaptiveState(domain.id, globalFocus));

  useEffect(() => {
    if (isGlobalFocusLoaded) {
      setGameState(getAdaptiveState(domain.id, globalFocus));
    }
  }, [globalFocus, isGlobalFocusLoaded, getAdaptiveState, domain.id]);


  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const isDisabledByFocus = globalFocus === 'neutral' && domain.key === 'Gc';
  
  const focusInfo: Record<TrainingFocus, { Icon: any; label: string; color: string; supported: boolean; }> = {
    neutral: { Icon: Brain, label: 'Core Thinking', color: 'text-muted-foreground', supported: true },
    math: { Icon: SigmaIcon, label: 'Math Reasoning', color: 'text-energize', supported: domain.supportsMath },
    music: { Icon: Music, label: 'Music Cognition', color: 'text-blue-500', supported: domain.supportsMusic },
    verbal: { Icon: MessageSquare, label: 'Verbal Reasoning', color: 'text-purple-500', supported: domain.supportsVerbal },
    spatial: { Icon: View, label: 'Spatial Reasoning', color: 'text-teal-500', supported: domain.supportsSpatial },
    eq: { Icon: Smile, label: 'Emotional Intelligence', color: 'text-pink-500', supported: domain.supportsEq },
    logic: { Icon: Share2, label: 'Logic & Coding', color: 'text-cyan-500', supported: domain.supportsLogic },
  };
  
  const activeMode = focusInfo[globalFocus] || focusInfo.neutral;
  
  const isLoaded = isGlobalFocusLoaded && isClient;
  
  const score = useMemo(() => {
    if (!isLoaded || !gameState) return 0;
    return Math.round((gameState.currentLevel / gameState.levelCeiling) * 100);
  }, [isLoaded, gameState]);
  
  const trend = useMemo(() => {
    if (!isLoaded || !gameState || !gameState.levelHistory || gameState.levelHistory.length === 0) return 0;
    const history = gameState.levelHistory;
    if (history.length > 1) {
        const last = history[history.length - 1].endLevel;
        const prev = history[history.length - 2].endLevel;
        if (prev > 0) return ((last - prev) / prev) * 100;
    } else if (history.length === 1) {
        const session = history[0];
        if(session.startLevel > 0) return ((session.endLevel - session.startLevel) / session.startLevel) * 100;
    }
    return 0;
  }, [isLoaded, gameState]);
  
  const { Icon: TrendIcon, color: trendColor, text: trendText } = getTrendInfo(trend);

  const cardContent = (
    <Card className={cn("flex flex-col h-full hover:shadow-lg transition-shadow duration-300", isDisabledByFocus && "opacity-50 bg-muted/50")}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2 flex-grow">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-base">{domain.name}</CardTitle>
          <CardDescription className="text-xs">{domain.description}</CardDescription>
        </div>
        {isLoaded && activeMode.supported && !isDisabledByFocus && (
           <TooltipProvider>
             <Tooltip delayDuration={0}>
               <TooltipTrigger>
                  <activeMode.Icon className={cn("w-5 h-5", activeMode.color)} />
               </TooltipTrigger>
               <TooltipContent>
                 <p>Current Focus: {activeMode.label}</p>
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
        )}
      </CardHeader>
      <CardContent className="space-y-4 py-4 flex-grow">
        {!isLoaded || !gameState ? (
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
                        Skill Score <Info className="w-3 h-3"/>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unified adaptive skill rating (0-100)</p>
                      <p className="font-bold">Cognitive Level: {gameState?.currentLevel ?? 'N/A'}</p>
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
        <Button asChild className="w-full" disabled={isDisabledByFocus}>
          <Link href={`/training/${domain.key}`}>{domain.gameTitle}</Link>
        </Button>
      </CardFooter>
    </Card>
  );

  if (isDisabledByFocus) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {cardContent}
                </TooltipTrigger>
                <TooltipContent>
                    <p>(Gc) Crystallized Intelligence cannot be trained in a 'neutral' mode as it relies on existing knowledge.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
  }

  return cardContent;
};

export const ChcDomainCard = memo(ChcDomainCardComponent);
