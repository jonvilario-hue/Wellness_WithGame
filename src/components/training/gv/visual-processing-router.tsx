
'use client';

import { useTrainingFocus } from '@/hooks/use-training-focus';
import { useTrainingOverride } from '@/hooks/use-training-override';
import { MentalRotationLab } from './mental-rotation-lab';
import { BalancePuzzle } from './balance-puzzle';
import { Skeleton } from '@/components/ui/skeleton';
import { VisualMusicMatch } from './visual-music-match';
import { OrthographicConstruction } from './orthographic-construction';
import { TypographicSearch } from './typographic-search';
import { GamePlaceholder } from '../game-placeholder';

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
        // The Orthographic Construction task was replaced by Typographic Search 
        // to better align with the Gv domain (visual scanning).
        return <TypographicSearch focus={effectiveFocus} />;
    case 'spatial':
        return <GamePlaceholder title="Voxel Jigsaw / Proportion Match" description="This game has two variants. 1) Voxel Jigsaw: An 'exploded view' of a complex 3D object is shown. Select the correctly assembled final shape from a set of similar options. A 2D fallback uses isometric pixel art sprites. 2) Proportion Match: A 3D object is shown. Select its correctly scaled 2D shadow from a set of distorted options." />;
    case 'neutral':
    default:
      return <MentalRotationLab focus={effectiveFocus} />;
  }
}
