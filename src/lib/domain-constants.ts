
import {
  BrainCircuit,
  BookOpenText,
  MemoryStick,
  Zap,
  View,
  Ear,
  Archive,
  Goal,
  type LucideIcon,
} from 'lucide-react';
import type { CHCDomain, TrainingFocus, GameId } from '@/types';

// Centralized metadata for each CHC domain.
// This ensures consistency for titles, icons, descriptions, and colors across the app.
export const DOMAIN_META: Record<
  CHCDomain,
  {
    name: string;
    description: string;
    gameTitle: string;
    id: GameId;
    icon: LucideIcon;
    color: string; // Tailwind color class for the icon background tint
  }
> = {
  Gf: {
    name: '(Gf) Fluid Reasoning',
    description: 'Solve new problems',
    gameTitle: 'Pattern Matrix',
    id: 'gf_pattern_matrix',
    icon: BrainCircuit,
    color: 'bg-blue-500/10 text-blue-500',
  },
  Gc: {
    name: '(Gc) Crystallized Intelligence',
    description: 'Use learned knowledge',
    gameTitle: 'Verbal Inference Builder',
    id: 'gc_verbal_inference',
    icon: BookOpenText,
    color: 'bg-purple-500/10 text-purple-500',
  },
  Gwm: {
    name: '(Gwm) Working Memory',
    description: 'Use and hold information',
    gameTitle: 'Dynamic Sequence',
    id: 'gwm_dynamic_sequence',
    icon: MemoryStick,
    color: 'bg-yellow-500/10 text-yellow-500',
  },
  Gs: {
    name: '(Gs) Processing Speed',
    description: 'Work fast and accurately',
    gameTitle: 'Rapid Code Match',
    id: 'gs_rapid_code',
    icon: Zap,
    color: 'bg-orange-500/10 text-orange-500',
  },
  Gv: {
    name: '(Gv) Visual Processing',
    description: 'Visualize and manipulate',
    gameTitle: 'Visual Lab',
    id: 'gv_visual_lab',
    icon: View,
    color: 'bg-teal-500/10 text-teal-500',
  },
  Ga: {
    name: '(Ga) Auditory Processing',
    description: 'Analyze and distinguish sounds',
    gameTitle: 'Auditory Processing Lab',
    id: 'ga_auditory_lab',
    icon: Ear,
    color: 'bg-pink-500/10 text-pink-500',
  },
  Glr: {
    name: '(Glr) Long-Term Retrieval',
    description: 'Store and retrieve information',
    gameTitle: 'Retrieval Trainer',
    id: 'glr_fluency_storm',
    icon: Archive,
    color: 'bg-indigo-500/10 text-indigo-500',
  },
  EF: {
    name: '(EF) Executive Function',
    description: 'Focus, switch, and control',
    gameTitle: 'Focus Switch Reactor',
    id: 'ef_focus_switch',
    icon: Goal,
    color: 'bg-green-500/10 text-green-500',
  },
};

export const chcDomains = Object.entries(DOMAIN_META).map(([key, value]) => ({
  key: key as CHCDomain,
  ...value,
}));


// Centralized map of incompatibilities between training modes and CHC domains.
// This is the single source of truth for the locking mechanism.
// As per the latest requirement, all games must be playable in all modes, so this map is now empty.
export const MODE_INCOMPATIBILITY_MAP: Partial<
  Record<TrainingFocus, Partial<Record<CHCDomain, string>>>
> = {};
