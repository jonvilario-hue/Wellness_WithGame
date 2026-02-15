
import type { CHCDomain } from '@/types';
import { PatternMatrix } from './gf/pattern-matrix';
import { DynamicSequenceTransformer } from './gwm/dynamic-sequence-transformer';
import { RapidCodeMatch } from './gs/rapid-code-match';
import { VisualProcessingRouter } from './gv/visual-processing-router';
import { AuditoryProcessingRouter } from './ga/auditory-processing-router';
import { VerbalInferenceBuilder } from './gc/verbal-inference-builder';
import { SemanticFluencyStorm } from './glr/semantic-fluency-storm';
import { FocusSwitchReactor } from './ef/focus-switch-reactor';

export const gameComponents: Record<CHCDomain, React.ComponentType> = {
  Gf: PatternMatrix,
  Gc: VerbalInferenceBuilder,
  Gwm: DynamicSequenceTransformer,
  Gs: RapidCodeMatch,
  Gv: VisualProcessingRouter,
  Ga: AuditoryProcessingRouter,
  Glr: SemanticFluencyStorm,
  EF: FocusSwitchReactor,
};
