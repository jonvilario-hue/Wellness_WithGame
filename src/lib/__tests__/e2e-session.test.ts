/**
 * @jest-environment jsdom
 */

import { usePerformanceStore } from '@/hooks/use-performance-store';
import { PRNG } from '../rng';
import * as idbStore from '../idb-store';
import { difficultyPolicies } from '@/data/difficulty-policies';

// Mock the idb-store to use an in-memory map
jest.mock('../idb-store', () => {
    const originalModule = jest.requireActual('../idb-store');
    const inMemoryStore = new Map<string, any>();
    return {
        ...originalModule,
        initDB: jest.fn().mockResolvedValue(true),
        logEvent: jest.fn().mockImplementation(event => {
            inMemoryStore.set(event.eventId, event);
            return Promise.resolve();
        }),
        getEventsForSession: jest.fn().mockImplementation(sessionId => {
            const events = Array.from(inMemoryStore.values()).filter(e => e.sessionId === sessionId);
            return Promise.resolve(events);
        }),
        startOrUpdateSession: jest.fn().mockImplementation(session => {
            inMemoryStore.set(session.sessionId, session);
            return Promise.resolve();
        }),
    };
});

describe('E2E Session Smoke Test', () => {
    it('should correctly run a full session lifecycle', async () => {
        const { getState, setState } = usePerformanceStore;
        
        // Reset store before test
        setState({
            gameStates: {},
            globalTier: 4,
            isHydrated: true,
            storageAvailable: true,
            failedWrites: [],
            activeSession: null,
        });

        const seed = 'e2e-test-seed';
        const buildVersion = 'v-test';
        const gameQueue: any[] = ['gwm_dynamic_sequence', 'gs_rapid_code', 'gf_pattern_matrix'];

        // --- 1. Initialize Session ---
        const { startNewGameSession, logEvent, completeCurrentGameSession } = getState();
        startNewGameSession({
            gameId: gameQueue[0],
            focus: 'neutral',
            prngSeed: seed,
            buildVersion: buildVersion,
            difficultyConfig: difficultyPolicies.gwm_dynamic_sequence,
            gameQueue: gameQueue
        });

        let sessionState = getState().activeSession;
        expect(sessionState).not.toBeNull();
        const sessionId = sessionState!.sessionId;

        // --- 3.4.1 & 3.4.2 Game Queue Validation ---
        const prng = new PRNG(seed);
        const expectedQueue = prng.shuffle(gameQueue);
        expect(sessionState?.gameQueue).toEqual(expectedQueue);

        // --- 2. Simulate Trials ---
        for (let i = 0; i < 15; i++) {
            logEvent({
                type: 'trial_complete',
                payload: {
                    gameId: sessionState!.gameId,
                    trialIndex: i,
                    difficultyLevel: 1,
                    correct: true,
                    rtMs: 500,
                } as any
            });
            sessionState = getState().activeSession;
        }

        // --- 3. Complete Session ---
        completeCurrentGameSession();
        
        const finalEvents = await idbStore.getEventsForSession(sessionId);
        
        // --- 4. Assertions ---
        const trialEvents = finalEvents.filter(e => e.type === 'trial_complete');
        expect(trialEvents).toHaveLength(15);
        
        // Assert monotonic sequence
        for(let i = 0; i < trialEvents.length; i++) {
            expect(trialEvents[i].seq).toBe(i + 1); // seq starts at 1 after session_start
        }

        // Assert shared session data
        trialEvents.forEach(trial => {
            expect(trial.sessionId).toBe(sessionId);
        });
        
        const sessionStartEvent = finalEvents.find(e => e.type === 'session_start');
        expect(sessionStartEvent).toBeDefined();
        expect(sessionStartEvent!.payload.prngSeed).toBe(seed);
        expect(sessionStartEvent!.payload.buildVersion).toBe(buildVersion);

        expect(getState().failedWrites).toHaveLength(0);
        
    });
});
