
'use client';

import { GameStub } from '../game-stub';

export function RuleSwitcher() {
  return (
    <GameStub 
      name="Rule Switcher"
      chcFactor="Executive Function (EF) / Logic"
      description="You see a block of abstract instructions. The rule for evaluation switches randomly between two competing demands, such as 'Does it contain a loop symbol?' and 'Is the final output value greater than 20?'. You must inhibit the old rule and apply the new one."
      techStack={['DOM']}
      complexity="Low"
      fallbackPlan="Not required. This is a simple DOM-based game."
       difficultyExamples={{
        level1: "The rule switches every 10 trials.",
        level8: "The rule switches every 2-3 trials, and the rules themselves are more conceptually similar (e.g., 'Is output > 20?' vs 'Is output an even number?')."
      }}
    />
  );
}
