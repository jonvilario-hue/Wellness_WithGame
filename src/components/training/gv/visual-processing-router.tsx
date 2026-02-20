'use client';

import { useTrainingFocus } from '@/hooks/use-training-focus';
import { useTrainingOverride } from '@/hooks/use-training-override';
import { MentalRotationLab } from './mental-rotation-lab';
import { BalancePuzzle } from './balance-puzzle';
import { Skeleton } from '@/components/ui/skeleton';
import { VisualMusicMatch } from './visual-music-match';
import { TypographicSearch } from './typographic-search';
import { GameStub } from '../game-stub';
import { FlowchartTracer } from '../logic/flowchart-tracer';
import { EmotionalCrowdSearch } from './emotional-crowd-search';

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
        return <TypographicSearch focus={effectiveFocus} />;
    case 'spatial':
        return <GameStub 
            name="Voxel Jigsaw"
            description="Assemble an 'exploded view' of a complex object made of voxels (3D pixels). Then, select the correctly assembled final shape from a set of highly similar options, some with subtle assembly errors."
            chcFactor="Visual Processing (Gv) / Spatial Visualization"
            techStack={['Three.js', 'Voxel Engine']}
            complexity="High"
            fallbackPlan="Use 2D 'pixel art' sprites on an isometric grid. The task becomes assembling a 2.5D object from its parts, preserving the part-to-whole visualization goal."
        />;
    case 'logic':
        return <FlowchartTracer />;
    case 'eq':
        return <EmotionalCrowdSearch />;
    case 'neutral':
    default:
      return <MentalRotationLab focus={effectiveFocus} />;
  }
}
