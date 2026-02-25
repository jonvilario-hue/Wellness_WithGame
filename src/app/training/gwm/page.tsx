
'use client';

import Link from 'next/link';
import { ArrowLeft, Brain, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type CHCDomain, type TrainingFocus } from '@/types';
import { chcDomains } from '@/lib/domain-constants';
import { domainIcons } from '@/components/icons';
import { notFound } from 'next/navigation';
import { gameComponents } from '@/components/training/game-components';
import { useTrainingFocus } from '@/hooks/use-training-focus';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrainingOverride } from '@/hooks/use-training-override';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DualNBack } from '@/components/training/gwm/dual-n-back';
import { FOCUS_MODE_META } from '@/lib/mode-constants';


export default function TrainingPage() {
  const domain = 'Gwm' as CHCDomain;
  const domainInfo = chcDomains.find(d => d.key === domain);
  
  const { override, setOverride } = useTrainingOverride();
  const { focus: globalDefaultFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();

  if (!domainInfo) {
    notFound();
  }

  const effectiveFocus = override || globalDefaultFocus;
  const ModeIcon = FOCUS_MODE_META[effectiveFocus]?.Icon || Brain;

  // Since this is the Gwm page, we will render DualNBack for music mode
  // and the default Gwm game for other modes.
  const GameComponent = effectiveFocus === 'music' ? DualNBack : (gameComponents[domainInfo.key] || (() => <p>Game not found</p>));
  const gameTitle = effectiveFocus === 'music' ? "Dual N-Back" : (domainInfo.gameTitle || domainInfo.name);
  const PageIcon = domainIcons[domainInfo.key];

  const supportedModes: { key: TrainingFocus; Icon: any; label: string; }[] = 
    Object.entries(FOCUS_MODE_META).map(([key, { Icon, label }]) => {
      const modeKey = key as TrainingFocus;
      const domainSupport = domainInfo as any;
      if (modeKey === 'math' && !domainSupport.supportsMath) return null;
      if (modeKey === 'music' && !domainSupport.supportsMusic) return null;
      if (modeKey === 'verbal' && !domainSupport.supportsVerbal) return null;
      if (modeKey === 'spatial' && !domainSupport.supportsSpatial) return null;
      if (modeKey === 'eq' && !domainSupport.supportsEq) return null;
      if (modeKey === 'logic' && !domainSupport.supportsLogic) return null;
      return { key: modeKey, Icon, label };
  }).filter(Boolean) as { key: TrainingFocus; Icon: any; label: string; }[];


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
              <div className="flex items-center gap-2 mt-1">
                 <Badge variant="secondary" className="capitalize">
                   {domainInfo.name}
                 </Badge>
                 <Badge variant="outline" className="capitalize flex items-center gap-1.5">
                    <ModeIcon className="h-3.5 w-3.5" />
                    {FOCUS_MODE_META[effectiveFocus].label} Mode
                 </Badge>
              </div>
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <Button variant="ghost" size="icon">
              <Link href="/settings">
                <Settings />
              </Link>
            </Button>
          </div>
        </div>
      </header>

       <div className="border-b bg-card sticky top-[93px] z-10">
         <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
            <Tabs
              value={effectiveFocus}
              onValueChange={(value) => setOverride(value as TrainingFocus)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7">
                {supportedModes.map(mode => (
                  <TabsTrigger key={mode.key} value={mode.key} className="gap-2">
                    <mode.Icon className="h-4 w-4"/> {mode.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
         </div>
       </div>

      <main className="flex-1 p-4 sm:p-6 md:p-8 flex items-center justify-center">
        {isGlobalFocusLoaded ? <GameComponent /> : <Skeleton className="h-96 w-full max-w-2xl" />}
      </main>
    </div>
  );
}
