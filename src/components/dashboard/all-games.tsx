
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chcDomains } from '@/types';
import { ChcDomainCard } from './chc-domain-card';
import { Gamepad2, Brain, Music } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { GrowthDecoration } from '../ui/growth-decoration';
import { useTrainingFocus } from '@/hooks/use-training-focus';
import { useTrainingOverride } from '@/hooks/use-training-override';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { SigmaIcon } from '../icons';

export function AllGames() {
  const { organicGrowth } = useTheme();
  const { focus, setFocus, isLoaded } = useTrainingFocus();
  const { setOverride } = useTrainingOverride();

  const handleFocusChange = (value: string) => {
    const newFocus = value as 'neutral' | 'math' | 'music';
    setFocus(newFocus);
    setOverride(null); 
  };
  
  const focusInfo = {
    neutral: { Icon: Brain, label: 'Core Thinking' },
    math: { Icon: SigmaIcon, label: 'Math Reasoning' },
    music: { Icon: Music, label: 'Music Cognition' },
  };

  const { Icon, label } = focusInfo[focus] || focusInfo.neutral;

  return (
    <Card className="relative overflow-hidden">
      {organicGrowth && <GrowthDecoration />}
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Gamepad2 className="w-6 h-6 text-primary" />
                    All Training Games
                </CardTitle>
                <CardDescription>
                    Choose a game to train a specific cognitive skill.
                </CardDescription>
            </div>

            <DropdownMenu>
                <TooltipProvider>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={!isLoaded} className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                <span className="hidden md:inline">{label}</span>
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Change Global Training Focus</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Global Training Focus</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={focus} onValueChange={handleFocusChange}>
                    <DropdownMenuRadioItem value="neutral" className="gap-2">
                        <Brain className="w-4 h-4"/> Core Thinking
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="math" className="gap-2">
                        <SigmaIcon className="w-4 h-4"/> Math Reasoning
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="music" className="gap-2">
                        <Music className="w-4 h-4"/> Music Cognition
                    </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {chcDomains.map((domain) => (
            <ChcDomainCard key={domain.key} domain={domain} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
