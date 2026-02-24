/**
 * @jest-environment jsdom
 */

import { exportSessionAsJSON, exportSessionAsCSV } from '../export';
import * as idbStore from '../idb-store';

// Mock idb-store
jest.mock('../idb-store', () => ({
    initDB: jest.fn().mockResolvedValue({
        transaction: () => ({
            objectStore: () => ({
                get: jest.fn().mockResolvedValue({
                    sessionId: 'test-session',
                    replayInputs: { seed: 'test-seed', buildVersion: 'v-test' },
                }),
            }),
        }),
    }),
    getEventsForSession: jest.fn(),
}));

const mockEvents = [
    { type: 'trial_complete', sessionId: 'test-session', seq: 2, payload: { id: 't2', rtMs: 600, correct: false } },
    { type: 'trial_complete', sessionId: 'test-session', seq: 1, payload: { id: 't1', rtMs: 500, correct: true } },
    { type: 'session_start', sessionId: 'test-session', seq: 0 },
];

describe('Data Export Pipeline', () => {

    beforeEach(() => {
        (idbStore.getEventsForSession as jest.Mock).mockResolvedValue(mockEvents);
    });

    it('exportSessionAsJSON should return sorted, structured JSON', async () => {
        const jsonString = await exportSessionAsJSON('test-session');
        const data = JSON.parse(jsonString);

        expect(data.meta.sessionId).toBe('test-session');
        expect(data.meta.prngSeed).toBe('test-seed');
        expect(data.trials).toHaveLength(2);
        
        // Assert sorting by seq
        expect(data.trials[0].id).toBe('t1');
        expect(data.trials[1].id).toBe('t2');
        
        expect(data.trials[0].correct).toBe(true);
    });

    it('exportSessionAsCSV should return flattened, sorted CSV', async () => {
        const csvString = await exportSessionAsCSV('test-session');
        
        const rows = csvString.split('\n');
        const headers = rows[0].split(',');

        expect(rows).toHaveLength(3); // Header + 2 data rows
        expect(headers).toContain('"sessionId"');
        expect(headers).toContain('"buildVersion"');
        expect(headers).toContain('"correct"');

        const row1 = rows[1].split(',');
        const row2 = rows[2].split(',');

        // Find indices
        const idIndex = headers.indexOf('"id"');
        const correctIndex = headers.indexOf('"correct"');

        // Assert sorting
        expect(row1[idIndex]).toBe('"t1"');
        expect(row2[idIndex]).toBe('"t2"');
        
        // Assert data
        expect(row1[correctIndex]).toBe('"true"');
        expect(row2[correctIndex]).toBe('"false"');
    });

});
