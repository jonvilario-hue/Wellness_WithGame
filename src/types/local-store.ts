
import type { TrialRecord, AdaptiveState, GameId, TrainingFocus } from './index';

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
    // A snapshot of the difficulty policy for this session
    difficultyConfig: any; 
    samplerConfig?: any;
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
