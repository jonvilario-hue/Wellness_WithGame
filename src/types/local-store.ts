import type { TrialRecord, AdaptiveState } from './index';

export interface LatencyInfo {
    baseLatency: number;
    outputLatency: number;
    sampleRate: number;
}

export interface SessionRecord {
  sessionId: string;
  gameId: string;
  mode: string;
  deviceInfo: LatencyInfo;
  startTimestamp: number;
  endTimestamp?: number;
  summary?: SessionSummary;
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

// GameProfile is now replaced by the more detailed AdaptiveState for persistence.
// This ensures all adaptive parameters are saved, not just a summary.
export type ProfileRecord = {
  id: string; // Composite key, e.g., "gwm_dynamic_sequence/music"
  state: AdaptiveState;
}
