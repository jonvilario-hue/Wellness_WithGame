'use client';

import { GameStub } from '../game-stub';

export function RuleSwitcher() {
  return (
    <GameStub 
      name="Rule Switcher"
      chcFactor="Executive Function (EF) / Logic"
      description="You see an instruction block (e.g., 'VAR A = 5; VAR B = 10'). The rule for evaluation switches randomly between two competing demands, such as 'Does it have a loop?' and 'Is the output > 20?'. You must inhibit the old rule and apply the new one."
      techStack={['DOM']}
      complexity="Low"
      fallbackPlan="Not required. This is a simple DOM-based game."
    />
  );
}
