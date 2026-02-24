
'use client';

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
import { Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { useTrainingFocus } from '@/hooks/use-training-focus';
import { MODE_INCOMPATIBILITY_MAP } from '@/lib/domain-constants';
import type { CHCDomain, TrainingFocus } from '@/types';

// This is a simplified progress data retrieval. In a real app,
// this would come from a more complex state or API call.
const useDomainProgress = (domainId: string, focus: TrainingFocus) => {
    const getAdaptiveState = usePerformanceStore(state => state.getAdaptiveState);
    const gameState = getAdaptiveState(domainId as any, focus);
    
    const score = gameState ? Math.round((gameState.currentLevel / gameState.levelCeiling) * 100) : 0;
    
    return { score };
};


export function ChcDomainCard({ domain, onPlay }: { domain: (typeof import('@/lib/domain-constants').chcDomains)[0], onPlay: (domain: CHCDomain) => void }) {
  const { focus: currentMode } = useTrainingFocus();
  const { score } = useDomainProgress(domain.id, currentMode);
  
  const incompatibilityReason = MODE_INCOMPATIBILITY_MAP[currentMode as TrainingFocus]?.[domain.key];
  const isLocked = !!incompatibilityReason;
  const iconColor = domain.color.split(' ')[1] ?? 'text-primary';

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
        <div className={cn('p-3 rounded-lg', domain.color.split(' ')[0])}>
          <domain.icon className={cn("w-6 h-6", iconColor)} />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-base">{domain.name}</CardTitle>
          <CardDescription className="text-xs">{domain.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 py-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              Skill Score
            </span>
            <span className={cn("text-sm font-bold", iconColor)}>{score.toFixed(0)}</span>
          </div>
          <Progress value={score} aria-label={`${domain.name} skill score`} />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={isLocked}
          onClick={() => !isLocked && onPlay(domain.key)}
        >
          {isLocked ? 'Unavailable in this Mode' : domain.gameTitle}
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
