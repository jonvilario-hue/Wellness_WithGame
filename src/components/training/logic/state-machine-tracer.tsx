'use client';

import { GameStub } from '../game-stub';

export function StateMachineTracer() {
  return (
    <GameStub 
      name="State Machine Tracer"
      chcFactor="Working Memory (Gwm) / Logic"
      description="A state diagram is shown. An auditory or visual sequence of inputs is presented. Hold the input sequence in working memory, mentally trace the path through the state machine, and identify the final resting state."
      techStack={['SVG', 'Dagre/Graphviz']}
      complexity="Medium"
      fallbackPlan="If the graph layout fails, the state machine is described in text rules (e.g., 'From State A, input 1 goes to B'). The cognitive task is identical but the visual load is lower."
    />
  );
}
