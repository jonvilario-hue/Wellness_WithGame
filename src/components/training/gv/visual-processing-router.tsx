
'use client';

import { useTrainingFocus } from '@/hooks/use-training-focus';
import { useTrainingOverride } from '@/hooks/use-training-override';
import { MentalRotationLab } from './mental-rotation-lab';
import { Skeleton } from '@/components/ui/skeleton';
import { VisualMusicMatch } from './visual-music-match';
import { TypographicSearch } from './typographic-search';
import { GameStub } from "../game-stub";
import { FlowchartTracer } from '../logic/flowchart-tracer';
import { EmotionalCrowdSearch } from './emotional-crowd-search';
import { GvSpatialAssembly } from './gv-spatial-assembly';
import { BalancePuzzle } from './balance-puzzle';


export function VisualProcessingRouter() {
  const { focus: globalFocus, isLoaded: isGlobalFocusLoaded } = useTrainingFocus();
  const { override, isLoaded: isOverrideLoaded } = useTrainingOverride();

  const isLoaded = isGlobalFocusLoaded && isOverrideLoaded;
  
  if (!isLoaded) {
    return <Skeleton className="w-full max-w-xl h-96" />;
  }

  const effectiveFocus = override || globalFocus;
  
  switch (effectiveFocus) {
    case 'math':
      return <BalancePuzzle focus={effectiveFocus} />;
    case 'music':
      return <VisualMusicMatch focus={effectiveFocus} />;
    case 'verbal':
        return <TypographicSearch focus={effectiveFocus} />;
    case 'spatial':
        return <GvSpatialAssembly />;
    case 'logic':
        return <FlowchartTracer />;
    case 'eq':
        return <EmotionalCrowdSearch />;
    case 'neutral':
    default:
      return <MentalRotationLab focus={effectiveFocus} />;
  }
}
