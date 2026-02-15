
import type { CHCDomain } from '@/types';

type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

const difficultyReasoning: Record<DifficultyLevel, (skill: number) => string> = {
  Easy: (skill) => `Your skill level is ${skill}. We recommend starting with 'Easy' to build a solid foundation and confidence.`,
  Medium: (skill) => `With a skill level of ${skill}, 'Medium' is the perfect challenge to help you grow without being overwhelming.`,
  Hard: (skill) => `You're at a skill level of ${skill}! 'Hard' will push your limits and help you achieve new breakthroughs.`,
};

export const getDifficultyReasoning = (level: DifficultyLevel, skill: number): string => {
  return difficultyReasoning[level](skill);
};


// --- Weak Area Targeting Templates ---
type WeakAreaTemplateType = 'insufficientData' | 'focusArea';

const weakAreaTemplates: Record<WeakAreaTemplateType, Record<string, { reason: string }>> = {
  insufficientData: {
    default: {
      reason: "I need a little more data to find your weak spots. Try completing a few more different training sessions!",
    }
  },
  focusArea: {
    Gf: { reason: "Improving your Fluid Reasoning helps you connect ideas and solve novel problems more effectively." },
    Gc: { reason: "Strengthening your Crystallized Intelligence expands your knowledge and verbal communication skills." },
    Gwm: { reason: "A stronger Working Memory is key for multitasking and holding information in your mind." },
    Gs: { reason: "Boosting your Processing Speed helps you think and react faster in everyday situations." },
    Gv: { reason: "Training your Visual Processing sharpens your ability to understand and manipulate visual information." },
    Ga: { reason: "Enhancing Auditory Processing helps you better distinguish and remember sounds." },
    Glr: { reason: "A robust Long-Term Retrieval system makes it easier to recall facts and memories." },
    EF: { reason: "Improving your Executive Function enhances your focus, planning, and self-control." },
    default: { reason: "Focusing on this area is a great opportunity for a breakthrough." },
  }
};

export const getWeakAreaTemplate = (type: WeakAreaTemplateType, domain?: CHCDomain) => {
    if (type === 'focusArea' && domain && weakAreaTemplates.focusArea[domain]) {
        return weakAreaTemplates.focusArea[domain];
    }
    return weakAreaTemplates[type].default;
}


// --- Training Recommendation Templates ---

type RecommendationType = 'performanceInsight' | 'momentumStarter' | 'weakArea';
type TemplateVariables = {
    domain?: CHCDomain;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
};

const recommendationTemplates: Record<RecommendationType, Record<string, (vars: TemplateVariables) => { title: string; description: string }>> = {
  performanceInsight: {
    EF: (vars) => ({
      title: `Train Executive Function`,
      description: `You tend to exhibit stronger Executive Function in the ${vars.timeOfDay}. It's a great time to train your focus!`,
    }),
  },
  momentumStarter: {
    default: (vars) => ({
      title: `Build Momentum: ${vars.domain}`,
      description: `Getting back into it? Start with a strength. Training ${vars.domain} is a great way to build confidence and kickstart a streak.`,
    }),
  },
  weakArea: {
    default: (vars) => ({
      title: `Growth Area: ${vars.domain}`,
      description: `Ready for a challenge? Focusing on your weakest area, ${vars.domain}, is the fastest way to achieve a breakthrough.`,
    }),
  }
};

export const getRecommendationTemplate = (type: RecommendationType, domain: CHCDomain, vars: TemplateVariables) => {
    const templatesForType = recommendationTemplates[type];
    if (domain in templatesForType) {
        return templatesForType[domain](vars);
    }
    return templatesForType.default(vars);
}
