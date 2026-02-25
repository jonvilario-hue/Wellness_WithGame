
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import type { CHCDomain } from '@/types';
import { DOMAIN_META } from '@/lib/domain-constants';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';

const useDomainStats = (domainId: GameId) => {
  const { gameStates } = usePerformanceStore();

  return useMemo(() => {
    const neutralState = gameStates[`${domainId}/neutral`];
    const eqState = gameStates[`${domainId}/eq`];
    
    // Prioritize EQ score if it exists, otherwise use neutral
    const primaryState = eqState || neutralState;
    
    if (!primaryState) {
        return { score: 0, trend: 0, lastPlayed: null };
    }

    const score = Math.round((primaryState.currentLevel / primaryState.levelCeiling) * 100);

    const history = primaryState.levelHistory;
    let trend = 0;
    if (history.length >= 5) {
        const recentHistory = history.slice(-5);
        const startScore = (recentHistory[0].startLevel / primaryState.levelCeiling) * 100;
        const endScore = (recentHistory[recentHistory.length - 1].endLevel / primaryState.levelCeiling) * 100;
        trend = endScore - startScore;
    }
    
    const lastPlayed = primaryState.lastSessionAt ? formatDistanceToNow(new Date(primaryState.lastSessionAt), { addSuffix: true }) : 'Never';

    return { score, trend, lastPlayed };
  }, [gameStates, domainId]);
};


export function GameCard({ domain, onSelect }: { domain: (typeof import('@/lib/domain-constants').chcDomains)[0], onSelect: (domainKey: CHCDomain) => void }) {
  const { score, trend, lastPlayed } = useDomainStats(domain.id);
  
  const TrendIcon = trend > 2 ? ArrowUp : trend < -2 ? ArrowDown : Minus;
  const trendColor = trend > 2 ? 'text-green-500' : trend < -2 ? 'text-amber-500' : 'text-muted-foreground';

  return (
    <Card
      onClick={() => onSelect(domain.key)}
      className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
    >
      <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
        <div className={cn("p-3 rounded-lg", domain.color)}>
          <domain.icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-lg">{domain.gameTitle}</CardTitle>
          <CardDescription className="text-sm">{domain.friendlyLabel}</CardDescription>
        </div>
        <div className={cn("flex items-center font-bold text-sm", trendColor)}>
            <TrendIcon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 py-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground">Skill Score</span>
            <span className={cn("text-sm font-bold", domain.color.replace('bg-','text-'))}>{score}</span>
          </div>
          <Progress value={score} aria-label={`${domain.name} skill score`} />
        </div>
      </CardContent>
       <CardFooter>
        <p className="text-xs text-muted-foreground">Last played: {lastPlayed}</p>
      </CardFooter>
    </Card>
  );
}
