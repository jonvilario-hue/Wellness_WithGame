// This file defines the canonical, type-safe structure for all telemetry events.
// It serves as the single source of truth for analytics.

import type { GameId, TrainingFocus } from '@/types';

// --- Base Event Structure ---
export interface BaseEvent {
    eventId: string; // Unique ID for this specific event
    sessionId: string;
    timestamp: number; // Unix timestamp (ms)
    schemaVersion: 2;
}

// --- Event-Specific Payloads ---

export interface SessionStartPayload {
    gameId: GameId;
    focus: TrainingFocus;
    prngSeed: string;
    buildVersion: string;
    difficultyConfig: any; // A snapshot of the policy
    samplerConfig: any | null;
}

export interface SessionCompletePayload {
    gameId: GameId;
    finalSeq: number; // The sequence number of the last event
    durationMs: number;
    // ... potentially add summary stats later
}

export interface SessionResumePayload {
    gameId: GameId;
    resumedAtSeq: number;
}

export interface TrialCompletePayload {
    id: string; // For backward compatibility with old TrialRecord
    sessionId: string;
    gameId: GameId;
    trialIndex: number;
    seq: number;
    difficultyLevel: number;
    stimulusParams: Record<string, any>;
    stimulusOnsetTs: number;
    responseTs: number;
    rtMs: number;
    correct: boolean;
    responseType: string;
    pausedDurationMs: number;
    wasFallback: boolean;
    legacy?: boolean;
}

export interface ErrorEventPayload {
    error: string;
    stack?: string;
    gameId?: GameId;
    trialIndex?: number;
}

export interface WriteFailurePayload {
    reason: string;
    eventCount: number; // How many events were in the buffer
}

export interface WriteDropPayload {
    reason: string;
    droppedEventId: string; // The ID of the event that was dropped
    bufferSize: number;
}

export interface StorageUnavailablePayload {
    checkFailed: string; // e.g., "indexedDB.open"
}


// --- Discriminated Union ---
export type TelemetryEvent =
    | (BaseEvent & { type: 'session_start', payload: SessionStartPayload })
    | (BaseEvent & { type: 'session_complete', payload: SessionCompletePayload })
    | (BaseEvent & { type: 'session_resume', payload: SessionResumePayload })
    | (BaseEvent & { type: 'trial_complete', payload: TrialCompletePayload, seq: number })
    | (BaseEvent & { type: 'error', payload: ErrorEventPayload })
    | (BaseEvent & { type: 'write_failure', payload: WriteFailurePayload })
    | (BaseEvent & { type: 'write_drop', payload: WriteDropPayload })
    | (BaseEvent & { type: 'storage_unavailable', payload: StorageUnavailablePayload });
