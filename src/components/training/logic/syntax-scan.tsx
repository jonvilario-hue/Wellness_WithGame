
'use client';

import { GameStub } from '../game-stub';

export function SyntaxScan() {
  return (
    <GameStub 
      name="Syntax Scan (Deprecated)"
      chcFactor="Processing Speed (Gs) / Logic"
      description="This game mode has been replaced by 'Boolean Blitz' to better target rapid decision speed over visual search. This component is now a placeholder."
      techStack={['DOM']}
      complexity="Low"
      fallbackPlan="N/A"
    />
  );
}
