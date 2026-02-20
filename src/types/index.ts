// This file is the single source of truth for all shared types in the application.

// --- Core Cognitive & Domain Types ---
export type TrainingFocus = 'neutral' | 'math' | 'music' | 'verbal' | 'spatial' | 'eq' | 'logic';
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
  supportsMath: boolean;
  supportsMusic: boolean;
  supportsVerbal: boolean;
  supportsSpatial: boolean;
  supportsEq: boolean;
  supportsLogic: boolean;
}[] = [
  { key: 'Gf', id: 'gf_pattern_matrix', name: '(Gf) Fluid Reasoning', description: 'Solve new problems', gameTitle: 'Pattern Matrix', supportsMath: true, supportsMusic: true, supportsVerbal: true, supportsSpatial: true, supportsEq: true, supportsLogic: true },
  { key: 'Gc', id: 'gc_verbal_inference', name: '(Gc) Crystallized Intelligence', description: 'Use learned knowledge', gameTitle: 'Verbal Inference Builder', supportsMath: true, supportsMusic: true, supportsVerbal: true, supportsSpatial: true, supportsEq: true, supportsLogic: true },
  { key: 'Gwm', id: 'gwm_dynamic_sequence', name: '(Gwm) Working Memory', description: 'Use and hold information', gameTitle: 'Dynamic Sequence', supportsMath: true, supportsMusic: true, supportsVerbal: true, supportsSpatial: true, supportsEq: true, supportsLogic: true },
  { key: 'Gs', id: 'gs_rapid_code', name: '(Gs) Processing Speed', description: 'Work fast and accurately', gameTitle: 'Rapid Code Match', supportsMath: true, supportsMusic: true, supportsVerbal: true, supportsSpatial: true, supportsEq: true, supportsLogic: true },
  { key: 'Gv', id: 'gv_visual_lab', name: '(Gv) Visual Processing', description: 'Visualize and manipulate objects', gameTitle: 'Visual Processing Lab', supportsMath: true, supportsMusic: true, supportsVerbal: true, supportsSpatial: true, supportsEq: true, supportsLogic: true },
  { key: 'Ga', id: 'ga_auditory_lab', name: '(Ga) Auditory Processing', description: 'Analyze and distinguish sounds', gameTitle: 'Auditory Processing Lab', supportsMath: true, supportsMusic: true, supportsVerbal: true, supportsSpatial: true, supportsEq: true, supportsLogic: true },
  { key: 'Glr', id: 'glr_fluency_storm', name: '(Glr) Long-Term Retrieval', description: 'Store and retrieve information', gameTitle: 'Retrieval Trainer', supportsMath: true, supportsMusic: true, supportsVerbal: true, supportsSpatial: true, supportsEq: true, supportsLogic: true },
  { key: 'EF', id: 'ef_focus_switch', name: '(EF) Executive Function', description: 'Focus, switch, and control tasks', gameTitle: 'Focus Switch Reactor', supportsMath: true, supportsMusic: true, supportsVerbal: true, supportsSpatial: true, supportsEq: true, supportsLogic: true },
];

// --- Difficulty & Adaptive Engine Types ---
export type Tier = 0 | 1 | 2 | 3;
export type TierSelection = Tier | 4; // 4 represents "Automatic"

export interface TrialResult {
  correct: boolean;
  reactionTimeMs: number;
  // Optional metrics for specific games
  value?: any; // The user's response value
  omissions?: number; // For WM, number of missed items
  intrusions?: number; // For WM, number of incorrect items added
}

export interface AdaptiveState {
  gameId: GameId;
  lastFocus: TrainingFocus;
  tier: TierSelection; // Allow "Automatic" tier
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


// --- Universal Difficulty Policy Schema ---

// Defines parameters for the "container" of the task
export type MechanicConfig = {
    [key: string]: any;
    responseWindowMs?: number; // Time to respond
    timeLimit?: number; // Total time for the task
    sequenceLength?: number; // For WM tasks
    gridSize?: number; // For matrix/grid tasks
    distractorCount?: number; // Number of incorrect options
    switchInterval?: number; // For EF tasks
    noiseLevel?: number; // For Ga tasks (e.g., SNR)
};

// Defines parameters for the "content" of the task
export type ContentParams = {
    [key: string]: any;
};

export type ContentConfig = {
    sub_variant?: string; // e.g., 'lexical_decision' or 'homophone_hunter' for Gs
    params?: ContentParams;
};

export type LevelDefinition = {
    mechanic_config: MechanicConfig;
    content_config: Partial<Record<TrainingFocus, ContentConfig>>;
};

export interface DifficultyPolicy {
  gameId: GameId;
  sessionLength: number;
  windowSize: number;
  targetAccuracyHigh: number;
  targetAccuracyLow: number;
  levelMap: Record<number, LevelDefinition>;
}
