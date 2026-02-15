
'use client';

import { Flame } from 'lucide-react';
import type { CHCDomain } from '@/types';
import { domainIcons } from '../icons';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { memo } from 'react';

export type DomainStreakProps = {
  domainKey: CHCDomain;
  name: string;
  streak: number;
  isTop: boolean;
};

const DomainStreakComponent = ({ domainKey, name, streak, isTop }: DomainStreakProps) => {
  const Icon = domainIcons[domainKey];

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-lg transition-all',
              isTop ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-1.5 rounded-md", isTop ? 'bg-primary/20' : 'bg-background/50')}>
                <Icon className={cn("w-5 h-5", isTop ? 'text-primary' : 'text-muted-foreground')} />
              </div>
              <span className={cn("font-medium", isTop ? 'text-foreground font-semibold' : '')}>{name}</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-lg">
              <Flame className={cn('w-5 h-5', isTop ? 'text-amber-400' : 'text-muted-foreground/80')} />
              <span>{streak}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{streak}-day streak in {name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const DomainStreak = memo(DomainStreakComponent);
