
'use client';

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

// This type has been deprecated in favor of the more specific TelemetryEvent types
// in `src/lib/telemetry-events.ts`. It is kept for historical reference during migration.
export interface TrialRecord {
  id: string; 
  sessionId: string;
  gameId: GameId;
  schemaVersion: 2;
  seq: number; 
  trialIndex: number;
  condition?: string;
  stimulusParams: Record<string, any>;
  stimulusOnsetTs: number;
  responseTs: number;
  rtMs: number;
  correct: boolean;
  responseType: string;
  difficultyLevel: number;
  deviceInfo?: any;
  timestamp: number;
  pausedDurationMs?: number;
  wasFallback?: boolean;
  legacy?: boolean;
}


// --- Difficulty & Adaptive Engine Types ---
export type Tier = 0 | 1 | 2 | 3;
export type TierSelection = Tier | 4; // 4 represents "Automatic"

export interface TrialResult {
  correct: boolean;
  reactionTimeMs: number;
  telemetry?: Record<string, any>;
  stimulusOnsetTs?: number; 
  responseTs?: number;
}

export interface AdaptiveState {
  gameId: GameId;
  lastFocus: TrainingFocus;
  tier: TierSelection; 
  levelFloor: number;
  levelCeiling: number;
  currentLevel: number;
  uncertainty: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  recentTrials: { timestamp: number; level: number; correct: boolean; reactionTimeMs: number; telemetry?: Record<string, any> }[];
  smoothedAccuracy: number;
  smoothedRT: number | null;
  sessionCount: number;
  lastSessionAt: number;
  levelHistory: { sessionDate: number; startLevel: number; endLevel: number; avgAccuracy: number; avgRT: number }[];
}


// --- Universal Difficulty Policy Schema ---
export type MechanicConfig = {
    [key: string]: any;
};
export type ContentParams = {
    [key: string]: any;
};
export type ContentConfig = {
    sub_variant?: string; 
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

// --- Renderer Props Interface (Phase 1 Refactor) ---
export interface BaseRendererProps<TGameState, TGameEvent> {
  gameState: TGameState;
  onEvent: (event: TGameEvent) => void;
  feedback: { message: string, type: string } | null;
  adaptiveState: AdaptiveState;
  currentTrialIndex: number;
  sessionLength: number;
}
