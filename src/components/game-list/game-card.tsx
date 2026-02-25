
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus, Play } from 'lucide-react';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import type { CHCDomain, GameId } from '@/types';
import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

const useDomainStats = (domainId: GameId) => {
  const { gameStates } = usePerformanceStore();

  return useMemo(() => {
    const allStatesForGame = Object.values(gameStates).filter(state => state.gameId === domainId);

    if (allStatesForGame.length === 0) {
      return { score: 0, trend: 0, lastPlayed: 'Never' };
    }
    
    // Aggregate score and history from all focus modes for this game
    const combinedHistory = allStatesForGame.flatMap(state => state.levelHistory).sort((a,b) => a.sessionDate - b.sessionDate);
    
    const mostRecentState = allStatesForGame.reduce((latest, current) => {
        const latestTs = latest.lastSessionAt || 0;
        const currentTs = current.lastSessionAt || 0;
        return currentTs > latestTs ? current : latest;
    });
    
    const totalScore = allStatesForGame.reduce((acc, state) => acc + (state.currentLevel / state.levelCeiling), 0);
    const avgScore = (totalScore / allStatesForGame.length) * 100;

    const lastPlayed = mostRecentState.lastSessionAt ? formatDistanceToNow(new Date(mostRecentState.lastSessionAt), { addSuffix: true }) : 'Never';
    
    let trend = 0;
    if (combinedHistory.length >= 5) {
        const recentHistory = combinedHistory.slice(-5);
        const startScore = (recentHistory[0].startLevel / 10) * 100;
        const endScore = (recentHistory[recentHistory.length - 1].endLevel / 10) * 100;
        trend = endScore - startScore;
    }

    return { score: Math.round(avgScore), trend, lastPlayed };
  }, [gameStates, domainId]);
};


export function GameCard({ domain, onSelect }: { domain: (typeof import('@/lib/domain-constants').chcDomains)[0], onSelect: (domainKey: CHCDomain) => void }) {
  const router = useRouter();
  const { score, trend, lastPlayed } = useDomainStats(domain.id);
  
  const TrendIcon = trend > 2 ? ArrowUp : trend < -2 ? ArrowDown : Minus;
  const trendColor = trend > 2 ? 'text-green-500' : trend < -2 ? 'text-amber-500' : 'text-muted-foreground';

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card's onClick from firing
    router.push(`/training/${domain.key}`);
  };

  return (
    <Card
      onClick={() => onSelect(domain.key)}
      className="flex flex-col aspect-square justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-card"
    >
      <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
        <div className={cn("p-3 rounded-lg", domain.color)}>
          <domain.icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-base">{domain.name}</CardTitle>
          <CardDescription className="text-sm">{domain.friendlyLabel}</CardDescription>
        </div>
        <div className={cn("flex items-center font-bold text-sm", trendColor)}>
            <TrendIcon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 py-0">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground">Skill Score</span>
            <span className={cn("text-sm font-bold", domain.color.replace('bg-','text-'))}>{score}</span>
          </div>
          <Progress value={score} aria-label={`${domain.name} skill score`} />
        </div>
         <p className="text-xs text-muted-foreground pt-2">Last played: {lastPlayed}</p>
      </CardContent>
       <CardFooter className="p-4">
        <Button onClick={handlePlayClick} className="w-full">
            {domain.gameTitle}
        </Button>
      </CardFooter>
    </Card>
  );
}
