'use client';

import Link from 'next/link';
import { ArrowLeft, Brain, Settings, Music, MessageSquare, View, Smile, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chcDomains, type CHCDomain, type TrainingFocus } from '@/types';
import { domainIcons, SigmaIcon } from '@/components/icons';
import { notFound, useParams } from 'next/navigation';
import { gameComponents } from '@/components/training/game-components';
import { useTrainingFocus } from '@/hooks/use-training-focus';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrainingOverride } from '@/hooks/use-training-override';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';


export default function TrainingPage() {
  const params = useParams();
  const domain = params.domain as CHCDomain;
  const domainInfo = chcDomains.find(d => d.key === domain);
  
  // The new override hook replaces the global focus switcher for this page's logic
  const { override, setOverride } = useTrainingOverride();
  const { focus: globalDefaultFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();

  if (!domainInfo) {
    notFound();
  }

  // Determine the effective training focus: override (local tab) > global default
  const effectiveFocus = override || globalDefaultFocus;

  const PageIcon = domainIcons[domainInfo.key];
  const GameComponent = gameComponents[domainInfo.key] || (() => <p>Game not found</p>);
  const gameTitle = domainInfo.gameTitle || domainInfo.name;

  const supportedModes: { key: TrainingFocus; Icon: any; label: string; }[] = [
    { key: 'neutral', Icon: Brain, label: 'Core' },
    { key: 'math', Icon: SigmaIcon, label: 'Math' },
    { key: 'music', Icon: Music, label: 'Music' },
    { key: 'verbal', Icon: MessageSquare, label: 'Verbal' },
    { key: 'spatial', Icon: View, label: 'Spatial' },
    { key: 'eq', Icon: Smile, label: 'EQ' },
    { key: 'logic', Icon: Share2, label: 'Logic' },
  ].filter(mode => {
      if (mode.key === 'math' && !domainInfo.supportsMath) return false;
      if (mode.key === 'music' && !domainInfo.supportsMusic) return false;
      if (mode.key === 'verbal' && !domainInfo.supportsVerbal) return false;
      if (mode.key === 'spatial' && !domainInfo.supportsSpatial) return false;
      if (mode.key === 'eq' && !domainInfo.supportsEq) return false;
      if (mode.key === 'logic' && !domainInfo.supportsLogic) return false;
      return true;
  });

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
               <Badge variant="secondary" className="capitalize">
                 Training: {domainInfo.name}
               </Badge>
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </div>
        </div>
      </header>

       <div className="border-b bg-card sticky top-[85px] z-10">
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
