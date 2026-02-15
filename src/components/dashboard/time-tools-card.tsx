
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlarmClock, ArrowRight, CirclePlay, Hourglass, Clock } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';

export function TimeToolsCard() {
  const { organicGrowth } = useTheme();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col relative overflow-hidden">
      {organicGrowth && <GrowthDecoration />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Clock className="w-5 h-5 text-primary" />
          Clock Tools
        </CardTitle>
        <CardDescription>
          Access tools to structure your work, rest, and cognitive warm-ups.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-around text-center">
            <div className="flex flex-col items-center gap-1">
                <CirclePlay className="w-6 h-6 text-muted-foreground" />
                <p className="text-xs font-semibold">Pomodoro</p>
            </div>
            <div className="flex flex-col items-center gap-1">
                <AlarmClock className="w-6 h-6 text-muted-foreground" />
                <p className="text-xs font-semibold">Smart Alarms</p>
            </div>
            <div className="flex flex-col items-center gap-1">
                <Hourglass className="w-6 h-6 text-muted-foreground" />
                <p className="text-xs font-semibold">Timers</p>
            </div>
        </div>
        <p className="text-sm text-muted-foreground">
            Use the cognitive alarm to wake up your brain, the pomodoro timer to manage focus, and standard timers for any task.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/time">
            Open Clock Tools <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
