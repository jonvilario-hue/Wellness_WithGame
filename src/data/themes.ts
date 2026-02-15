
import type { LucideIcon } from 'lucide-react';
import { Target, Zap, Waves, MemoryStick, Shield, Sword } from 'lucide-react';
import type { CHCDomain } from '@/types';

export interface Theme {
  key: 'focus' | 'energize' | 'reflect' | 'memory' | 'confidence' | 'challenge';
  name: string;
  icon: LucideIcon;
  idealFor: string;
  chcDomains: CHCDomain[];
  scientificRationale: string;
  colorScheme: {
    background: string; // HSL value string 'H S% L%'
    panels: string;     // HSL value string 'H S% L%'
    textPrimary: string;// HSL value string 'H S% L%'
    textSecondary: string; // HSL value string 'H S% L%'
    accent: string;     // HSL value string 'H S% L%'
    accentForeground: string; // HSL value string 'H S% L%'
    success: string;    // HSL value string 'H S% L%'
    isDark: boolean;
  };
  uxFeatures: string[];
}

export const themes: Theme[] = [
  {
    key: 'focus',
    name: 'Focus Mode',
    icon: Target,
    idealFor: 'Users easily distracted or with low sustained attention.',
    chcDomains: ['EF', 'Gs'],
    scientificRationale: 'Uses a low-arousal, dark background with cool, soft highlights (blue/teal) to minimize cognitive interference and reduce visual strain. This follows the principle of attentional filtering, where reducing irrelevant sensory input enhances focus on the primary task.',
    colorScheme: {
      background: '220 20% 12%',
      panels: '220 15% 18%',
      textPrimary: '210 20% 90%',
      textSecondary: '210 15% 65%',
      accent: '173 58% 50%',
      accentForeground: '220 20% 12%',
      success: '142 71% 45%',
      isDark: true,
    },
    uxFeatures: [
      'Subtle, slow-fade animations to avoid distraction.',
      'Minimalist UI with hidden secondary controls.',
      'Audio feedback is muted or uses low-frequency tones.',
      'Progress bars fill smoothly without strobing effects.'
    ]
  },
  {
    key: 'energize',
    name: 'Energize Mode',
    icon: Zap,
    idealFor: 'Users training processing speed or needing activation.',
    chcDomains: ['Gs', 'Gwm'],
    scientificRationale: 'Employs a high-contrast light theme with bright, warm colors (yellow/orange) to increase arousal and alertness, based on color psychology principles that associate these hues with energy and attention. Quick, sharp feedback enhances the feeling of speed.',
    colorScheme: {
      background: '20 50% 98%',
      panels: '0 0% 100%',
      textPrimary: '20 10% 20%',
      textSecondary: '20 10% 45%',
      accent: '38 92% 55%',
      accentForeground: '0 0% 100%',
      success: '142 71% 45%',
      isDark: false,
    },
    uxFeatures: [
      'Fast, snappy UI transitions and feedback.',
      'Bright, electric green for success confirmations.',
      'Gamified score counters with rapid increments.',
      'High-energy, short sound effects for correct answers.'
    ]
  },
  {
    key: 'reflect',
    name: 'Reflect Mode',
    icon: Waves,
    idealFor: 'Analytical, logic-driven users working on reasoning tasks.',
    chcDomains: ['Gf', 'Gc'],
    scientificRationale: 'A low-stimulation, cool-toned environment supports deliberate, analytical thought (System 2 thinking). The blue and silver palette is calming and associated with clarity and intellect, reducing emotional arousal to favor logical processing.',
    colorScheme: {
      background: '220 20% 95%',
      panels: '0 0% 100%',
      textPrimary: '220 25% 25%',
      textSecondary: '220 15% 50%',
      accent: '215 50% 55%',
      accentForeground: '0 0% 100%',
      success: '142 71% 45%',
      isDark: false,
    },
    uxFeatures: [
      'Generous spacing and clean typography for readability.',
      'No time pressure indicators on logic puzzles.',
      'Feedback is explanatory and delayed to encourage self-correction.',
      'UI elements have sharp, geometric shapes to align with a logical mood.'
    ]
  },
  {
    key: 'memory',
    name: 'Memory Mode',
    icon: MemoryStick,
    idealFor: 'Associative thinkers, language learners, or memory boosters.',
    chcDomains: ['Gwm', 'Glr'],
    scientificRationale: 'Utilizes a palette of purple, lavender, and cyan, colors often linked to creativity and imagination. This encourages associative thinking, which is critical for long-term memory encoding (Glr) and creating rich mental contexts.',
    colorScheme: {
      background: '250 25% 15%',
      panels: '250 20% 22%',
      textPrimary: '250 30% 92%',
      textSecondary: '250 20% 70%',
      accent: '190 70% 60%',
      accentForeground: '250 25% 15%',
      success: '142 71% 45%',
      isDark: true,
    },
    uxFeatures: [
      'Dreamlike, soft-glow effects on UI elements.',
      'Visual mnemonics or icons are paired with concepts.',
      'UI layout encourages spatial relationships between items.',
      'Allows for user-generated tags or notes on memory items.'
    ]
  },
  {
    key: 'confidence',
    name: 'Confidence Mode',
    icon: Shield,
    idealFor: 'Users with low motivation, new to cognitive training, or with low self-confidence.',
    chcDomains: ['EF', 'Gwm'],
    scientificRationale: 'Based on principles of psychological safety and reinforcement theory. Soft, warm, and positive colors (blush, gold, mint) create a non-threatening environment. The focus is on effort and progress, not just performance, to build self-efficacy.',
    colorScheme: {
      background: '30 80% 96%',
      panels: '0 0% 100%',
      textPrimary: '25 35% 30%',
      textSecondary: '25 25% 55%',
      accent: '45 85% 60%',
      accentForeground: '25 35% 30%',
      success: '142 71% 45%',
      isDark: false,
    },
    uxFeatures: [
      'Gentle, affirming feedback messages ("Good effort!", "Nice try!").',
      'Non-comparative progress tracking (focus on personal bests).',
      '"Mistake-forgiveness" mechanic where early errors have lower penalties.',
      'Progress is visualized as growth (e.g., a plant growing).'
    ]
  },
  {
    key: 'challenge',
    name: 'Challenge Mode',
    icon: Sword,
    idealFor: 'High-performing, competitive users who want clear feedback and intensity.',
    chcDomains: ['Gf', 'EF'],
    scientificRationale: 'Designed to induce a state of high focus and intensity (flow state). The high-contrast, jet-black background minimizes all distractions, while sharp, high-energy crimson and amber accents signal importance and achievement, tapping into competitive drive.',
    colorScheme: {
      background: '0 0% 5%',
      panels: '0 0% 10%',
      textPrimary: '0 0% 95%',
      textSecondary: '0 0% 65%',
      accent: '0 84% 60%',
      accentForeground: '0 0% 98%',
      success: '142 71% 45%',
      isDark: true,
    },
    uxFeatures: [
      'High-glow, impactful feedback for correct answers.',
      'Visible leaderboards or performance percentile rankings.',
      'Achievements and stats are prominently displayed.',
      'Crisp, high-impact sound design.'
    ]
  }
];
