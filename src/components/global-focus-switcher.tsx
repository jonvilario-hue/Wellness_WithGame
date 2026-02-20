'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTrainingFocus, type TrainingFocus } from '@/hooks/use-training-focus';
import { useTrainingOverride } from '@/hooks/use-training-override';
import { Brain, Music, MessageSquare, View, Sigma, Smile, Share2 } from 'lucide-react';
import { SigmaIcon } from './icons';

export function GlobalFocusSwitcher() {
  const { focus, setFocus, isLoaded } = useTrainingFocus();
  const { setOverride } = useTrainingOverride();

  const handleFocusChange = (value: string) => {
    const newFocus = value as TrainingFocus;
    setFocus(newFocus);
    setOverride(null); 
  };
  
  const focusInfo: Record<TrainingFocus, { Icon: React.ElementType; label: string }> = {
    neutral: { Icon: Brain, label: 'Core Thinking' },
    math: { Icon: SigmaIcon, label: 'Math Reasoning' },
    music: { Icon: Music, label: 'Music Cognition' },
    verbal: { Icon: MessageSquare, label: 'Verbal Reasoning' },
    spatial: { Icon: View, label: 'Spatial Reasoning' },
    eq: { Icon: Smile, label: 'Emotional Intelligence' },
    logic: { Icon: Share2, label: 'Logic & Coding' }
  };

  const { Icon, label } = focusInfo[focus] || focusInfo.neutral;

  return (
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
      <DropdownMenuContent align="start">
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
          <DropdownMenuRadioItem value="verbal" className="gap-2">
            <MessageSquare className="w-4 h-4"/> Verbal Reasoning
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="spatial" className="gap-2">
            <View className="w-4 h-4"/> Spatial Reasoning
          </DropdownMenuRadioItem>
           <DropdownMenuRadioItem value="eq" className="gap-2">
            <Smile className="w-4 h-4"/> Emotional Intelligence
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="logic" className="gap-2">
            <Share2 className="w-4 h-4"/> Logic & Coding
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
