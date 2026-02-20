
'use client';

import { Settings, BrainCircuit } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { GlobalFocusSwitcher } from './global-focus-switcher';
  
export function Header() {
  return (
    <header className="px-4 sm:px-6 md:px-8 py-2 border-b bg-card">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex-1 flex justify-start items-center gap-2">
            <GlobalFocusSwitcher />
        </div>

        <div className="flex items-center gap-2">
             <BrainCircuit className="h-7 w-7 text-primary" />
             <h1 className="text-xl font-bold text-foreground tracking-tight">PuzzleMaster</h1>
        </div>
        
        <TooltipProvider>
            <div className="flex-1 flex justify-end items-center gap-1">
              <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button asChild variant="ghost" size="icon">
                      <Link href="/settings">
                        <Settings className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
