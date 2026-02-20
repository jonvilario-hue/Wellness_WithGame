'use client';

import { GameStub } from '../game-stub';

export function GateSpeed() {
  return (
    <GameStub 
      name="Gate Speed"
      chcFactor="Processing Speed (Gs) / Logic"
      description="A simple Boolean expression is flashed on screen (e.g., '[T] AND [F]'). Rapidly tap the 'TRUE' or 'FALSE' button to evaluate the expression under extreme time pressure."
      techStack={['SVG']}
      complexity="Low"
      fallbackPlan="Not required. This game uses basic DOM elements and SVGs that are universally supported."
    />
  );
}
