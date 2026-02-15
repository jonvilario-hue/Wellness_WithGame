
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BrainCircuit, ChevronDown } from 'lucide-react';
import { useFocusBuilder } from '@/hooks/use-focus-builder';
import { Skeleton } from '../ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { chcDomains } from '@/types';
import { GrowthDecoration } from '../ui/growth-decoration';
import { useTheme } from '@/hooks/use-theme';

export function HyperfocusBuilder() {
  const { currentFocus, daysCompleted, cycleLength, progress, isLoaded, setManualFocus } = useFocusBuilder();
  const { organicGrowth } = useTheme();

  if (!isLoaded) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                 <div className="space-y-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col bg-primary/5 border-primary/20 relative overflow-hidden">
      {organicGrowth && <GrowthDecoration />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <BrainCircuit className="w-5 h-5 text-primary" />
          Hyperfocus Builder
        </CardTitle>
        <CardDescription>Train one skill deeply, 30 days at a time.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div>
            <p className="text-sm font-medium text-muted-foreground">This month's focus</p>
            <p className="text-lg font-bold text-primary">{currentFocus.name}</p>
        </div>
         <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-muted-foreground">
                    Cycle Progress
                </span>
                <span className="text-sm font-bold text-primary">{daysCompleted} / {cycleLength} days</span>
            </div>
            <Progress value={progress} aria-label={`${daysCompleted} of ${cycleLength} days completed in the focus cycle`} />
        </div>
      </CardContent>
      <CardFooter>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                    Change Focus
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
                <DropdownMenuRadioGroup 
                    value={currentFocus.key} 
                    onValueChange={(value) => setManualFocus(value as any)}
                >
                    {chcDomains.map(domain => (
                        <DropdownMenuRadioItem key={domain.key} value={domain.key}>
                            {domain.name}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
