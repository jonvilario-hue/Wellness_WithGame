

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
    color: 'bg-amber-500/10 text-amber-500',
  },
  Gwm: {
    name: '(Gwm) Working Memory',
    description: 'Use and hold information',
    gameTitle: 'Dynamic Sequence',
    id: 'gwm_dynamic_sequence',
    icon: MemoryStick,
    color: 'bg-cyan-500/10 text-cyan-500',
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
    gameTitle: 'Visual Processing Lab',
    id: 'gv_visual_lab',
    icon: View,
    color: 'bg-lime-500/10 text-lime-500',
  },
  Ga: {
    name: '(Ga) Auditory Processing',
    description: 'Analyze and distinguish sounds',
    gameTitle: 'Auditory Processing Lab',
    id: 'ga_auditory_lab',
    icon: Ear,
    color: 'bg-violet-500/10 text-violet-500',
  },
  Glr: {
    name: '(Glr) Long-Term Retrieval',
    description: 'Store and retrieve information',
    gameTitle: 'Retrieval Trainer',
    id: 'glr_fluency_storm',
    icon: Archive,
    color: 'bg-emerald-500/10 text-emerald-500',
  },
  EF: {
    name: '(EF) Executive Function',
    description: 'Focus, switch, and control',
    gameTitle: 'Focus Switch Reactor',
    id: 'ef_focus_switch',
    icon: Goal,
    color: 'bg-rose-500/10 text-rose-500',
  },
};

export const chcDomains = Object.entries(DOMAIN_META).map(([key, value]) => ({
  key: key as CHCDomain,
  ...value,
  supportsMath: ['Gf', 'Gwm', 'Gs', 'Gv', 'Gc', 'Ga', 'Glr', 'EF'].includes(key),
  supportsMusic: ['Gf', 'Gwm', 'Gs', 'Gv', 'Gc', 'Ga', 'Glr', 'EF'].includes(key),
  supportsVerbal: ['Gf', 'Gwm', 'Gs', 'Gv', 'Gc', 'Ga', 'Glr', 'EF'].includes(key),
  supportsSpatial: ['Gf', 'Gwm', 'Gs', 'Gv', 'Gc', 'Glr', 'EF'].includes(key),
  supportsEq: ['Gf', 'Gwm', 'Gs', 'Gv', 'Gc', 'Glr', 'EF'].includes(key),
  supportsLogic: ['Gf', 'Gwm', 'Gs', 'Gv', 'Gc', 'Glr', 'EF'].includes(key),
}));


// Centralized map of incompatibilities between training modes and CHC domains.
// This is the single source of truth for the locking mechanism.
// As per the latest requirement, all games must be playable in all modes, so this map is now empty.
export const MODE_INCOMPATIBILITY_MAP: Partial<
  Record<TrainingFocus, Partial<Record<CHCDomain, string>>>
> = {};
