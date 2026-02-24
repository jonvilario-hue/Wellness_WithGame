import type { GameId, TrainingFocus, DifficultyPolicy } from './index';
import type { TelemetryEvent } from '@/lib/telemetry-events';

export interface LatencyInfo {
    baseLatency: number;
    outputLatency: number;
    sampleRate: number;
}

export interface ReplayInputs {
    seed: string;
    buildVersion: string;
    gameId: GameId;
    focus: TrainingFocus;
    difficultyConfig: Partial<DifficultyPolicy>; 
    samplerConfig: Record<string, unknown> | null;
}

export interface SessionRecord {
  sessionId: string;
  gameId: GameId;
  mode: string;
  deviceInfo: LatencyInfo;
  startTimestamp: number;
  endTimestamp?: number;
  summary?: SessionSummary;
  replayInputs: ReplayInputs;
  sessionComplete: boolean;
}

export interface SessionSummary {
  totalTrials: number;
  correctTrials: number;
  accuracy: number;
  meanRtMs: number;
  medianRtMs: number;
  difficultyLevel: number;
  nextDifficultyLevel: number;
}

export type ProfileRecord = {
  id: string; // Composite key, e.g., "gwm_dynamic_sequence/music"
  state: AdaptiveState;
}

// Kept for migration reference, but TelemetryEvent is now the primary type.
export type TrialRecord = TelemetryEvent & { type: 'trial_complete' };
