
'use client';

import { GameStub } from '../game-stub';

export function AlgorithmFluency() {
  return (
    <GameStub 
      name="Algorithm Fluency"
      chcFactor="Long-Term Retrieval (Glr) / Logic"
      description="A prompt is given, such as 'Name situations where a 'loop' is more efficient than 'recursion'.' Retrieve and type as many distinct, valid examples as possible from your long-term memory within a time limit."
      techStack={['DOM', 'Text Input']}
      complexity="Low"
      fallbackPlan="Not required. This is a text-based game."
      difficultyExamples={{
        level1: "Prompt: 'Name examples of 'sorting'.'",
        level8: "Prompt: 'Describe scenarios where a 'greedy algorithm' fails to find the optimal solution.'"
      }}
    />
  );
}
