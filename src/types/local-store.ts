
import type { GameId, TrainingFocus, DifficultyPolicy, AdaptiveState } from './index';
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
  trialCount: number;
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

export interface CachedAsset {
    url: string;
    data: any; // Storing decoded AudioBuffer might not be possible across all browsers, storing ArrayBuffer is safer
    cachedAt: number;
}

    