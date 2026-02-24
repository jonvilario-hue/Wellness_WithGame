'use client';

import * as idbStore from './idb-store';
import type { TelemetryEvent, TrialCompletePayload } from './telemetry-events';

const toCSV = (headers: string[], data: Record<string, any>[]): string => {
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
};

export async function exportSessionAsJSON(sessionId: string): Promise<string> {
    const session = await idbStore.initDB().then(db => db.transaction('sessions').objectStore('sessions').get(sessionId));
    const events = await idbStore.getEventsForSession(sessionId);
    
    const trials = events
        .filter((e): e is TelemetryEvent & { type: 'trial_complete' } => e.type === 'trial_complete')
        .sort((a, b) => a.seq - b.seq)
        .map(e => e.payload);

    const exportData = {
        meta: {
            sessionId: session.sessionId,
            participantId: 'local_user', // Placeholder
            prngSeed: session.replayInputs.seed,
            buildVersion: session.replayInputs.buildVersion,
            exportedAt: new Date().toISOString(),
        },
        trials: trials,
    };
    
    return JSON.stringify(exportData, null, 2);
}

export async function exportSessionAsCSV(sessionId: string): Promise<string> {
    const session = await idbStore.initDB().then(db => db.transaction('sessions').objectStore('sessions').get(sessionId));
    const events = await idbStore.getEventsForSession(sessionId);
    
    const trials = events
        .filter((e): e is TelemetryEvent & { type: 'trial_complete' } => e.type === 'trial_complete')
        .sort((a, b) => a.seq - b.seq)
        .map(e => e.payload);
        
    if (trials.length === 0) {
        return "No trial data for this session.";
    }

    const meta = {
        sessionId: session.sessionId,
        participantId: 'local_user',
        prngSeed: session.replayInputs.seed,
        buildVersion: session.replayInputs.buildVersion,
    };
    
    // Flatten data for CSV
    const flattenedData = trials.map(trial => ({
        ...meta,
        ...trial,
        stimulusParams: JSON.stringify(trial.stimulusParams), // Flatten object
    }));

    const headers = Object.keys(flattenedData[0]);
    return toCSV(headers, flattenedData);
}

export async function exportAllSessionsAsJSON(): Promise<string> {
    return idbStore.exportAllData();
}
