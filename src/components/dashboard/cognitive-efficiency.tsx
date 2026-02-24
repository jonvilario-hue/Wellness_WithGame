
'use client';

import { CardContent } from '@/components/ui/card';
import { Lightbulb, Info, ArrowDown, ArrowUp, Minus, X } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { usePerformanceStore } from '@/hooks/use-performance-store';
import { chcDomains } from '@/lib/domain-constants';
import type { CHCDomain } from '@/types';

type ChcFactor = 'Gf' | 'Gwm' | 'EF' | 'Gs' | 'Glr';

const TrendIndicator = ({ trend }: { trend: number }) => {
  const trendInfo = {
    Icon: trend > 2 ? ArrowUp : trend < -2 ? ArrowDown : Minus,
    color: trend > 2 ? 'text-green-500' : trend < -2 ? 'text-amber-500' : 'text-muted-foreground',
    text: `${trend >= 0 ? '+' : ''}${trend}%`
  };

  return (
    <div className={cn("flex items-center font-bold text-sm", trendInfo.color)}>
      <trendInfo.Icon className="w-4 h-4 mr-1" />
      {trendInfo.text}
    </div>
  );
};

export function CognitiveEfficiency() {
  const [isInsightVisible, setIsInsightVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { getAdaptiveState } = usePerformanceStore();

  useEffect(() => {
    setIsClient(true);
    const dismissed = localStorage.getItem('cognitiveEfficiencyInsightDismissed');
    if (dismissed !== 'true') {
      setIsInsightVisible(true);
    }
  }, []);

  const handleDismissInsight = () => {
    setIsInsightVisible(false);
    localStorage.setItem('cognitiveEfficiencyInsightDismissed', 'true');
  };

  const efficiencyFactors = useMemo(() => {
    if (!isClient) return [];

    const coreFactorKeys: ChcFactor[] = ['Gf', 'Gwm', 'EF', 'Gs', 'Glr'];
    
    return coreFactorKeys.map(key => {
        const domainInfo = chcDomains.find(d => d.key === key)!;
        const state = getAdaptiveState(domainInfo.id, 'neutral');

        const value = state ? Math.round((state.currentLevel / state.levelCeiling) * 100) : 0;
        
        let trend = 0;
        if (state && state.levelHistory.length > 0) {
             const startLevel = state.levelHistory[0].startLevel;
             const endLevel = state.levelHistory[state.levelHistory.length - 1].endLevel;
             if (startLevel > 0) {
                 trend = Math.round(((endLevel - startLevel) / startLevel) * 100);
             }
        }

        return {
            name: domainInfo.name.replace(/\(.*\)\s/, ''),
            key,
            trend,
            value,
            icon: domainInfo.icon,
            description: domainInfo.description,
        };
    });
  }, [isClient, getAdaptiveState]);
  
  const overallTrend = useMemo(() => {
    if (efficiencyFactors.length === 0) return 0;
    const averageTrend = efficiencyFactors.reduce((acc, factor) => acc + factor.trend, 0) / efficiencyFactors.length;
    return Math.round(averageTrend);
  }, [efficiencyFactors]);

  const trendColor = overallTrend > 0 ? 'text-green-500' : 'text-amber-500';
  const insight = "Your performance trend reflects your growth across different cognitive domains.";

  return (
    <CardContent>
        <TooltipProvider>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Overall Performance Trend</p>
                <p className={cn("text-4xl font-bold", trendColor)}>
                    {overallTrend > 0 ? '+' : ''}{overallTrend}%
                </p>
                <p className="text-sm font-semibold text-muted-foreground">
                    since starting
                </p>
              </div>
              
              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-center text-muted-foreground">Skill Index</h4>
                {efficiencyFactors.map(metric => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 cursor-help">
                                  <Icon className="w-4 h-4 shrink-0" />
                                  <span className='truncate'>{metric.name}</span>
                                  <Info className="w-3 h-3 opacity-50 shrink-0" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{metric.description}</p>
                              </TooltipContent>
                            </Tooltip>
                            <TrendIndicator trend={metric.trend} />
                        </div>
                         <Progress value={metric.value} aria-label={`${metric.name} progress`} />
                    </div>
                  );
                })}
              </div>
              
              {isInsightVisible && (
                <>
                <Separator />
                <div className="p-3 bg-primary/10 rounded-lg text-center relative">
                    <p className="text-sm flex items-start gap-2 pr-6">
                        <Lightbulb className="w-5 h-5 mt-0.5 text-primary shrink-0"/> 
                        <span className="text-foreground text-left"><span className="font-bold">Insight:</span> {insight}</span>
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
                </>
              )}
            </div>
        </TooltipProvider>
      </CardContent>
  );
}
