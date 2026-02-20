'use client';

import { GameStub } from '../game-stub';

export function AuditoryDebugger() {
  return (
    <GameStub 
      name="Auditory Debugger"
      chcFactor="Auditory Processing (Ga) / Logic"
      description="An auditory sequence of tones is played, representing an algorithm's steps. One step is 'buggy' (e.g., wrong tone, wrong rhythm). You must discriminate the 'buggy' auditory event that violates the stated rule."
      techStack={['Web Audio API', 'Tone.js']}
      complexity="High"
      fallbackPlan="If audio synthesis fails, the game presents the sequence visually as a series of animated icons with one 'buggy' icon, turning it into a visual sequential scanning task."
    />
  );
}
