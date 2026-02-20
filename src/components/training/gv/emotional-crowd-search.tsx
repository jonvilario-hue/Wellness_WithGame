'use client';

import { GameStub } from '../game-stub';

export function EmotionalCrowdSearch() {
  return (
    <GameStub 
      name="Emotional Crowd Search"
      chcFactor="Visual Processing (Gv) / Visual Search"
      description="A grid of 9, 16, or 25 faces is displayed. All faces are neutral except one, which displays a target emotion (e.g., 'subtle joy'). The user must rapidly scan the grid and tap the one face that is different."
      techStack={['CSS Grid', 'Face Asset Library']}
      complexity="Medium"
      fallbackPlan="If high-fidelity face assets cannot be loaded, the game uses a grid of abstract 'emoticon' style SVGs. The core visual search mechanic is preserved."
      difficultyExamples={{
        level1: "Find the one 'happy' face among 8 'neutral' faces.",
        level8: "Find the one face showing 'contempt' among 24 faces showing a mix of neutral and 'subtle polite smiles' (distractors)."
      }}
    />
  );
}
