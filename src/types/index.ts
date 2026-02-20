

export type TrainingFocus = 'neutral' | 'math' | 'music' | 'verbal';
export type CHCDomain = 'Gf' | 'Gc' | 'Gwm' | 'Gs' | 'Gv' | 'Ga' | 'Glr' | 'EF';

export type GameId = 
  | 'gf_pattern_matrix'
  | 'gc_verbal_inference'
  | 'gwm_dynamic_sequence'
  | 'gs_rapid_code'
  | 'gv_visual_lab'
  | 'ga_auditory_lab'
  | 'glr_fluency_storm'
  | 'ef_focus_switch';

export const chcDomains: { 
  key: CHCDomain; 
  id: GameId;
  name: string; 
  description: string; 
  gameTitle: string;
  tasks: string[];
  supportsMath: boolean;
  supportsMusic: boolean;
}[] = [
  { key: 'Gf', id: 'gf_pattern_matrix', name: '(Gf) Fluid Reasoning', description: 'Solve new problems', gameTitle: 'Pattern Matrix', tasks: ['pattern_matrix'], supportsMath: true, supportsMusic: true },
  { key: 'Gc', id: 'gc_verbal_inference', name: '(Gc) Crystallized Intelligence', description: 'Use learned knowledge', gameTitle: 'Verbal Inference Builder', tasks: ['verbal_inference'], supportsMath: true, supportsMusic: true },
  { key: 'Gwm', id: 'gwm_dynamic_sequence', name: '(Gwm) Working Memory', description: 'Use and hold information', gameTitle: 'Dynamic Sequence', tasks: ['sequence_transform'], supportsMath: true, supportsMusic: true },
  { key: 'Gs', id: 'gs_rapid_code', name: '(Gs) Processing Speed', description: 'Work fast and accurately', gameTitle: 'Rapid Code Match', tasks: ['code_match'], supportsMath: true, supportsMusic: true },
  { key: 'Gv', id: 'gv_visual_lab', name: '(Gv) Visual Processing', description: 'Visualize and rotate objects', gameTitle: 'Visual Processing Lab', tasks: ['mental_rotation', 'balance_puzzle'], supportsMath: true, supportsMusic: true },
  { key: 'Ga', id: 'ga_auditory_lab', name: '(Ga) Auditory Processing', description: 'Analyze and distinguish sounds', gameTitle: 'Auditory Processing Lab', tasks: ['gap_detection', 'frequency_discrimination', 'figure_ground', 'rhythm_discrimination'], supportsMath: true, supportsMusic: true },
  { key: 'Glr', id: 'glr_fluency_storm', name: '(Glr) Long-Term Retrieval', description: 'Store and retrieve information', gameTitle: 'Glr Retrieval Trainer', tasks: ['associative_chain', 'spaced_retrieval', 'category_sprint'], supportsMath: true, supportsMusic: true },
  { key: 'EF', id: 'ef_focus_switch', name: '(EF) Executive Function', description: 'Focus, switch, control tasks', gameTitle: 'Focus Switch Reactor', tasks: ['focus_switch'], supportsMath: true, supportsMusic: true },
];

export type Tier = 0 | 1 | 2 | 3;

export interface TrialResult {
  correct: boolean;
  reactionTimeMs: number;
}

export interface AdaptiveState {
  gameId: GameId;
  lastFocus: TrainingFocus;
  tier: Tier;
  levelFloor: number;
  levelCeiling: number;
  currentLevel: number;
  uncertainty: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  recentTrials: { timestamp: number; level: number; correct: boolean; reactionTimeMs: number }[];
  smoothedAccuracy: number;
  smoothedRT: number | null;
  sessionCount: number;
  lastSessionAt: number;
  levelHistory: { sessionDate: number; startLevel: number; endLevel: number; avgAccuracy: number; avgRT: number }[];
}

export type MechanicConfig = {
    [key: string]: any;
};

export type ContentConfig = {
    [key: string]: any;
};

export type LevelDefinition = {
    mechanic_config: MechanicConfig;
    content_config: Record<TrainingFocus, ContentConfig>;
};

export interface DifficultyPolicy {
  gameId: GameId;
  sessionLength: number;
  windowSize: number;
  targetAccuracyHigh: number;
  targetAccuracyLow: number;
  levelMap: Record<number, LevelDefinition>;
}

    