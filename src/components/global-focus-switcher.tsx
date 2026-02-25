
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
import { FOCUS_MODE_META } from "@/lib/mode-constants";

export function GlobalFocusSwitcher() {
  const { focus, setFocus, isLoaded } = useTrainingFocus();

  const handleFocusChange = (value: string) => {
    const newFocus = value as TrainingFocus;
    setFocus(newFocus);
  };
  
  const { Icon, label } = FOCUS_MODE_META[focus] || FOCUS_MODE_META.neutral;

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
          {Object.entries(FOCUS_MODE_META).map(([key, { Icon, label }]) => (
             <DropdownMenuRadioItem key={key} value={key} className="gap-2">
              <Icon className="w-4 h-4"/> {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
