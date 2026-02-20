'use client';

import { GameStub } from '../game-stub';

export function FlowchartTracer() {
  return (
    <GameStub 
      name="Flowchart Tracer"
      chcFactor="Visual Processing (Gv) / Logic"
      description="Mentally trace the execution path of a given set of input values through a complex flowchart diagram with nested conditional and process blocks to determine the final output value."
      techStack={['SVG', 'Dagre/Graphviz']}
      complexity="High"
      fallbackPlan="If the graph layout engine fails, the flowchart is presented as a simplified, vertically stacked list of 'IF/THEN' text blocks rather than a connected diagram."
    />
  );
}
