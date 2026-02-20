
'use client';

import { useTrainingFocus } from '@/hooks/use-training-focus';
import { useTrainingOverride } from '@/hooks/use-training-override';
import { MentalRotationLab } from './mental-rotation-lab';
import { BalancePuzzle } from './balance-puzzle';
import { Skeleton } from '@/components/ui/skeleton';
import { VisualMusicMatch } from './visual-music-match';
import { OrthographicConstruction } from './orthographic-construction';
import { TypographicSearch } from './typographic-search';
import { GameStub } from '../game-stub';

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
        return <GameStub 
            title="Voxel Jigsaw"
            description="Assemble an 'exploded view' of a complex object made of voxels (3D pixels). Then, select the correctly assembled final shape from a set of highly similar options, some with subtle assembly errors."
            subdomain="Spatial Visualization"
            assetComplexity="High"
            fallback="Use 2D 'pixel art' sprites on an isometric grid. The task becomes assembling a 2.5D object from its parts, preserving the part-to-whole visualization goal."
        />;
    case 'neutral':
    default:
      return <MentalRotationLab focus={effectiveFocus} />;
  }
}
