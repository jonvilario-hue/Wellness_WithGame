
'use client';

import { CardContent } from '@/components/ui/card';
import { TrendingUp, BrainCircuit, MemoryStick, Shuffle, Lightbulb, Info, Zap, Archive, ArrowDown, ArrowUp, Minus, X } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { efficiencyData } from '@/data/efficiency-data';

type Timeframe = 'weekly' | 'monthly' | 'overall';

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
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [isInsightVisible, setIsInsightVisible] = useState(false);

  useEffect(() => {
    // This effect should only run on the client
    const dismissed = localStorage.getItem('cognitiveEfficiencyInsightDismissed');
    if (dismissed !== 'true') {
      setIsInsightVisible(true);
    }
  }, []);

  const handleDismissInsight = () => {
    setIsInsightVisible(false);
    localStorage.setItem('cognitiveEfficiencyInsightDismissed', 'true');
  };

  const currentData = efficiencyData[timeframe];
  const trendText = timeframe === 'overall' ? 'since starting' : `from last ${timeframe.slice(0, -2)}`;
  const trendColor = currentData.trend > 0 ? 'text-green-500' : 'text-amber-500';

  return (
    <CardContent>
        <TooltipProvider>
          <Tabs defaultValue="weekly" onValueChange={(value) => setTimeframe(value as Timeframe)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="overall">Overall</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Performance Trend</p>
                <p className={cn("text-4xl font-bold", trendColor)}>
                    {currentData.trend > 0 ? '+' : ''}{currentData.trend}%
                </p>
                <p className="text-sm font-semibold text-muted-foreground">
                    {trendText}
                </p>
              </div>
              
              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold text-center text-muted-foreground">Efficiency Factors</h4>
                {currentData.subMetrics.map(metric => {
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
                        <span className="text-foreground text-left"><span className="font-bold">Insight:</span> {currentData.insight}</span>
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
          </Tabs>
        </TooltipProvider>
      </CardContent>
  );
}
