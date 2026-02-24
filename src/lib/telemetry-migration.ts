
import type { TrialRecord, SessionRecord } from '@/types';

const CURRENT_SCHEMA_VERSION = 2;

/**
 * Fix 3: Implements a telemetry normalizer for backward compatibility.
 * This ensures that analytics pipelines can handle data from older app versions
 * without crashing on missing fields.
 * @param record The trial or session record to normalize.
 * @returns A record conforming to the latest schema.
 */
export const normalizeTelemetryRecord = (record: any): TrialRecord | SessionRecord => {
    // Check if it's a TrialRecord
    if (record && typeof record.trialIndex !== 'undefined') {
        const trial = record as Partial<TrialRecord>;
        if (!trial.schemaVersion || trial.schemaVersion < CURRENT_SCHEMA_VERSION) {
            return {
                ...trial,
                id: trial.id || `${trial.sessionId}-${trial.trialIndex}`,
                schemaVersion: CURRENT_SCHEMA_VERSION,
                seq: trial.trialIndex || -1, // Use trialIndex as a fallback for seq
                wasFallback: trial.wasFallback ?? false,
                pausedDurationMs: trial.pausedDurationMs ?? 0,
                legacy: true,
            } as TrialRecord;
        }
        return trial as TrialRecord;
    }
    
    // Assume it's a SessionRecord
    if (record && typeof record.sessionId !== 'undefined') {
        const session = record as Partial<SessionRecord>;
         if (!session.replayInputs) {
             session.replayInputs = {
                 seed: 'unknown',
                 buildVersion: 'pre-migration',
                 gameId: session.gameId,
                 focus: session.mode,
                 difficultyConfig: {},
                 samplerConfig: null
             }
         }
        return session as SessionRecord;
    }

    return record; // Return as-is if type is unknown
};
