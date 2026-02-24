
import type { TrialRecord } from './index';

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

export interface GameProfile {
  gameId: string;
  currentDifficulty: number;
  rollingAccuracy: number;
  rollingMeanRt: number;
  lastPlayedTimestamp: number;
  sessionsCompleted: number;
}
