
import type { TrialRecord } from '@/types';

const CURRENT_SCHEMA_VERSION = 2;

/**
 * Normalizes a telemetry record to the latest schema version.
 * This ensures that analytics pipelines can handle data from older app versions
 * without crashing on missing fields.
 * @param record The trial record to normalize.
 * @returns A trial record conforming to the latest schema.
 */
export const normalizeTelemetryRecord = (record: any): TrialRecord => {
    if (!record.schemaVersion || record.schemaVersion < CURRENT_SCHEMA_VERSION) {
        return {
            ...record, // Spread the old record
            schemaVersion: CURRENT_SCHEMA_VERSION,
            wasFallback: record.wasFallback ?? false,
            pausedDurationMs: record.pausedDurationMs ?? 0,
            legacy: true, // Mark that this record was migrated
        };
    }
    return record as TrialRecord;
};

/**
 * Development-only test function to verify the normalizer.
 */
function testNormalizer() {
    if (process.env.NODE_ENV !== 'development') return;

    console.log("--- Running Telemetry Normalizer Test ---");

    const preMigrationRecord = {
        id: 'old-trial-123',
        sessionId: 'old-session-abc',
        gameId: 'gwm_dynamic_sequence',
        trialIndex: 5,
        correct: true,
        rtMs: 1234,
        timestamp: Date.now(),
        difficultyLevel: 3,
        stimulusParams: { sequence: 'ABC' },
    };

    const normalized = normalizeTelemetryRecord(preMigrationRecord);

    let pass = true;
    if (normalized.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        console.error(`[FAIL] schemaVersion was not updated. Expected ${CURRENT_SCHEMA_VERSION}, got ${normalized.schemaVersion}`);
        pass = false;
    }
    if (normalized.legacy !== true) {
        console.error(`[FAIL] legacy flag was not set.`);
        pass = false;
    }
    if (normalized.pausedDurationMs !== 0) {
        console.error(`[FAIL] pausedDurationMs was not defaulted correctly.`);
        pass = false;
    }
    if (normalized.id !== 'old-trial-123') {
        console.error(`[FAIL] Original data was lost during normalization.`);
        pass = false;
    }
    
    if (pass) {
        console.log("--- [PASS] Telemetry normalizer correctly migrated legacy record. ---");
    } else {
        console.error("--- [FAIL] Telemetry normalizer failed. ---");
    }
}


if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).testTelemetryNormalizer = testNormalizer;
}
