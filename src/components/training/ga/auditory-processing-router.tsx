
'use client';

import { useTrainingFocus } from '@/hooks/use-training-focus';
import { useTrainingOverride } from '@/hooks/use-training-override';
import { Skeleton } from '@/components/ui/skeleton';
import { ToneGridChallenge } from './tone-grid-challenge';
import { SpokenArithmeticChallenge } from './spoken-arithmetic-challenge';


export function AuditoryProcessingRouter() {
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  
  if (!isLoaded) {
    return <Skeleton className="w-full max-w-xl h-96" />;
  }

  // Determine the effective training focus: override > global
  const effectiveFocus = override || globalFocus;
  
  if (effectiveFocus === 'math') {
    return <SpokenArithmeticChallenge />;
  }
  
  // Default to Core Mode (which is also the Music mode for this game)
  return <ToneGridChallenge />;
}
