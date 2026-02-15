
'use client';

import Link from 'next/link';
import { ArrowLeft, Brain, Settings, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chcDomains, type CHCDomain } from '@/types';
import { domainIcons, SigmaIcon } from '@/components/icons';
import { notFound, useParams } from 'next/navigation';
import { gameComponents } from '@/components/training/game-components';
import { useTrainingFocus } from '@/hooks/use-training-focus';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrainingOverride } from '@/hooks/use-training-override.tsx';

export default function TrainingPage() {
  const params = useParams();
  const domain = params.domain as CHCDomain;
  const domainInfo = chcDomains.find(d => d.key === domain);
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  if (!domainInfo) {
    notFound();
  }
  
  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  // Determine the effective training focus: override > global
  const effectiveFocus = isLoaded ? (override || globalFocus) : 'neutral';

  const PageIcon = domainIcons[domainInfo.key];
  const GameComponent = gameComponents[domainInfo.key] || (() => <p>Game not found</p>);
  const gameTitle = domainInfo.gameTitle || domainInfo.name;
  
  const focusSupportsMath = domainInfo.supportsMath;
  const focusSupportsMusic = domainInfo.supportsMusic;

  const focusInfo = {
      neutral: { Icon: Brain, label: 'Core Thinking' },
      math: { Icon: SigmaIcon, label: 'Math Reasoning' },
      music: { Icon: Music, label: 'Music Cognition' },
  };

  const currentFocusConfig = focusInfo[effectiveFocus] || focusInfo.neutral;
  const { Icon: FocusIcon, label: focusLabel } = currentFocusConfig;
  
  const isFocusSupported = () => {
      if (effectiveFocus === 'math') return focusSupportsMath;
      if (effectiveFocus === 'music') return focusSupportsMusic;
      return true; // Neutral is always supported
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 sm:px-6 md:px-8 py-4 border-b bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex-1 flex justify-start">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <PageIcon className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground font-headline tracking-tight">
                {gameTitle}
              </h1>
               {isLoaded ? (
                 isFocusSupported() && (
                    <Badge variant="secondary" className="capitalize">
                      <FocusIcon className="w-3 h-3 mr-1.5"/>
                      {focusLabel}
                      {override && <span className="ml-1.5 text-xs font-bold">(Session Override)</span>}
                    </Badge>
                 )
              ) : (
                <Skeleton className="h-5 w-24" />
              )}
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <GameComponent />
      </main>
    </div>
  );
}
