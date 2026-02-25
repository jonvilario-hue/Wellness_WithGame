
'use client';

import { Button } from "@/components/ui/button";
import { usePerformanceStore } from "@/hooks/use-performance-store";
import { DOMAIN_META } from "@/lib/domain-constants";
import type { CHCDomain } from "@/types";
import { ArrowUp, ArrowDown, Minus, Play } from "lucide-react";
import Link from 'next/link';
import { useMemo } from "react";
import { ModuleStats } from "./module-stats";
import { SessionSparkline } from "./session-sparkline";
import { cn } from "@/lib/utils";

export function GameDetailPage({ domainInfo }: { domainInfo: (typeof import('@/lib/domain-constants').chcDomains)[0] }) {
  const { gameStates } = usePerformanceStore();

  const { score, trend } = useMemo(() => {
    // This logic should be expanded to combine scores from different focuses if needed
    const primaryState = gameStates[`${domainInfo.id}/neutral`] || gameStates[`${domainInfo.id}/eq`] || null;
    
    if (!primaryState) {
      return { score: 0, trend: 0 };
    }

    const score = Math.round((primaryState.currentLevel / primaryState.levelCeiling) * 100);
    
    let trend = 0;
    if (primaryState.levelHistory.length >= 5) {
      const recentHistory = primaryState.levelHistory.slice(-5);
      const startScore = (recentHistory[0].startLevel / primaryState.levelCeiling) * 100;
      const endScore = (recentHistory[recentHistory.length - 1].endLevel / primaryState.levelCeiling) * 100;
      trend = endScore - startScore;
    }

    return { score, trend };
  }, [gameStates, domainInfo.id]);

  const TrendIcon = trend > 2 ? ArrowUp : trend < -2 ? ArrowDown : Minus;
  const trendColor = trend > 2 ? 'text-green-500' : trend < -2 ? 'text-amber-500' : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{domainInfo.gameTitle}</h1>
          <p className={cn("text-lg font-semibold", domainInfo.color.replace('bg-','text-'))}>{domainInfo.friendlyLabel}</p>
        </div>
        <Button asChild size="lg">
            <Link href={`/training/${domainInfo.key}`}>
                <Play className="mr-2 h-5 w-5"/> Play Now
            </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Overall Skill Score</p>
            <p className={cn("text-8xl font-bold", domainInfo.color.replace('bg-','text-'))}>{score}</p>
             <div className={cn("flex items-center font-bold text-lg", trendColor)}>
                <TrendIcon className="w-5 h-5 mr-1" />
                <span>{trend.toFixed(1)}%</span>
                <span className="text-sm text-muted-foreground ml-2">(last 5 sessions)</span>
            </div>
        </div>
        <div className="lg:col-span-2">
            <SessionSparkline domainId={domainInfo.id} />
        </div>
      </div>
      
      <ModuleStats domain={domainInfo.key} />

    </div>
  );
}
