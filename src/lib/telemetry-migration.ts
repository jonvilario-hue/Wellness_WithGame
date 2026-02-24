import type { TelemetryEvent, TrialCompletePayload } from './telemetry-events';

const CURRENT_SCHEMA_VERSION = 2;

/**
 * Fix 3: Implements a telemetry normalizer for backward compatibility.
 * This ensures that analytics pipelines can handle data from older app versions
 * without crashing on missing fields.
 * @param record The trial or session record to normalize.
 * @returns A record conforming to the latest schema.
 */
export const normalizeTelemetryRecord = (record: any): TelemetryEvent => {
    // This is a simplified check. A real implementation would be more robust.
    if (!record.schemaVersion || record.schemaVersion < CURRENT_SCHEMA_VERSION) {
        
        // Assume it's an old TrialRecord and convert it to a trial_complete event
        const trialPayload: TrialCompletePayload = {
            id: record.id || `${record.sessionId}-${record.trialIndex}`,
            sessionId: record.sessionId,
            gameId: record.gameId,
            trialIndex: record.trialIndex || -1,
            seq: record.trialIndex || -1,
            difficultyLevel: record.difficultyLevel,
            stimulusParams: record.stimulusParams || {},
            stimulusOnsetTs: record.stimulusOnsetTs || 0,
            responseTs: record.responseTs || 0,
            rtMs: record.rtMs || 0,
            correct: record.correct,
            responseType: record.responseType || 'unknown',
            pausedDurationMs: record.pausedDurationMs ?? 0,
            wasFallback: record.wasFallback ?? false,
            legacy: true,
        };
        
        return {
            type: 'trial_complete',
            eventId: trialPayload.id,
            sessionId: trialPayload.sessionId,
            timestamp: record.timestamp || 0,
            schemaVersion: CURRENT_SCHEMA_VERSION,
            payload: trialPayload,
        };
    }
    return record as TelemetryEvent;
};
