
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
import { cn } from '@/lib/utils';
import { Info, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useTrainingFocus } from '@/hooks/use-training-focus';
import { DOMAIN_META, MODE_INCOMPATIBILITY_MAP } from '@/lib/domain-constants';
import type { CHCDomain, TrainingFocus } from '@/types';

// This is a simplified progress data retrieval. In a real app,
// this would come from a more complex state or API call.
const useDomainProgress = (domainKey: CHCDomain, focus: TrainingFocus) => {
    const getAdaptiveState = usePerformanceStore(state => state.getAdaptiveState);
    const domainId = DOMAIN_META[domainKey].id;
    const gameState = getAdaptiveState(domainId, focus);
    
    const score = gameState ? Math.round((gameState.currentLevel / gameState.levelCeiling) * 100) : Math.random() * 25 + 20;
    const trend = gameState ? (gameState.levelHistory.at(-1)?.endLevel ?? 0) - (gameState.levelHistory.at(-2)?.endLevel ?? 0) : Math.random() * 10 - 5;
    
    return { score, trend };
};


export function ChcDomainCard({ domain, onPlay }: { domain: CHCDomain, onPlay: (domain: CHCDomain) => void }) {
  const { focus: currentMode } = useTrainingFocus();
  const { score, trend } = useDomainProgress(domain, currentMode);
  
  const domainMeta = DOMAIN_META[domain];
  const incompatibilityReason = MODE_INCOMPATIBILITY_MAP[currentMode as TrainingFocus]?.[domain];
  const isLocked = !!incompatibilityReason;

  const cardContent = (
    <Card
      className={cn(
        'flex flex-col h-full transition-all duration-300',
        isLocked
          ? 'bg-muted/50 opacity-60'
          : 'hover:shadow-lg hover:-translate-y-1'
      )}
    >
      <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
        <div className={cn('p-3 rounded-lg', domainMeta.color)}>
          <domainMeta.icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-base">{domainMeta.name}</CardTitle>
          <CardDescription className="text-xs">{domainMeta.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 py-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              Skill Score
            </span>
            <span className="text-sm font-bold text-primary">{score.toFixed(0)}</span>
          </div>
          <Progress value={score} aria-label={`${domainMeta.name} skill score`} />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={isLocked}
          onClick={() => !isLocked && onPlay(domain)}
        >
          {isLocked ? 'Unavailable in Core' : domainMeta.gameTitle}
        </Button>
      </CardFooter>
    </Card>
  );

  if (isLocked) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {/* The div wrapper is essential for the tooltip to trigger on a disabled element group */}
                    <div className="relative h-full"> 
                        {cardContent}
                        <div
                            tabIndex={0}
                            role="tooltip"
                            className="absolute top-2 right-2 p-1.5 bg-background/50 rounded-full cursor-help"
                        >
                            <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" align="center" className="max-w-xs">
                    <p className="font-bold text-base mb-2">Assessment Locked</p>
                    <p>{incompatibilityReason}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
  }

  return cardContent;
}
