
'use client';

import { useTrainingFocus } from '@/hooks/use-training-focus';
import { useTrainingOverride } from '@/hooks/use-training-override';
import { MentalRotationLab } from './mental-rotation-lab';
import { BalancePuzzle } from './balance-puzzle';
import { Skeleton } from '@/components/ui/skeleton';
import { VisualMusicMatch } from './visual-music-match';
import { OrthographicConstruction } from './orthographic-construction';

export function VisualProcessingRouter() {
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  
  if (!isLoaded) {
    return <Skeleton className="w-full max-w-xl h-96" />;
  }

  // Determine the effective training focus: override > global
  const effectiveFocus = override || globalFocus;
  
  switch (effectiveFocus) {
    case 'math':
      return <BalancePuzzle focus={effectiveFocus} />;
    case 'music':
      return <VisualMusicMatch focus={effectiveFocus} />;
    case 'verbal':
        return <OrthographicConstruction focus={effectiveFocus} />;
    case 'neutral':
    default:
      return <MentalRotationLab focus={effectiveFocus} />;
  }
}
