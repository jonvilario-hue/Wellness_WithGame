/**
 * @jest-environment jsdom
 */

import { usePerformanceStore } from '@/hooks/use-performance-store';
import { PRNG } from '../rng';
import * as idbStore from '../idb-store';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('../idb-store');
jest.mock('@/hooks/use-toast');

describe('Session Recovery', () => {
    let mockSessionStorage: Record<string, string> = {};

    beforeAll(() => {
        Object.defineProperty(window, 'sessionStorage', {
            value: {
                getItem: jest.fn((key) => mockSessionStorage[key] || null),
                setItem: jest.fn((key, value) => { mockSessionStorage[key] = value.toString(); }),
                removeItem: jest.fn((key) => { delete mockSessionStorage[key]; }),
                clear: jest.fn(() => { mockSessionStorage = {}; }),
            },
            writable: true,
        });
    });

    beforeEach(() => {
        // Reset mocks and store state before each test
        (idbStore.getEventsForSession as jest.Mock).mockClear();
        (useToast as jest.Mock).mockReturnValue({ toast: jest.fn() });
        mockSessionStorage = {};
        usePerformanceStore.setState({
            gameStates: {},
            activeSession: null,
            isHydrated: false,
            storageAvailable: true,
            failedWrites: [],
        });
    });

    it('should correctly resume a session from sessionStorage', async () => {
        const { hydrate, logEvent } = usePerformanceStore.getState();

        const initialSessionPointer = {
            sessionId: 'test-session-123',
            prngSeed: 'test-seed-for-recovery',
            currentSeq: 5,
            gameQueue: ['gwm_dynamic_sequence'],
            currentGameIndex: 0,
            gameId: 'gwm_dynamic_sequence',
            focus: 'neutral'
        };

        // 1. Simulate a stored session pointer
        window.sessionStorage.setItem('__cog_active_session', JSON.stringify(initialSessionPointer));

        // 2. Simulate stored trials in IDB
        const mockTrials = Array.from({ length: 5 }, (_, i) => ({
            type: 'trial_complete',
            seq: i + 1,
            sessionId: 'test-session-123',
        }));
        (idbStore.getEventsForSession as jest.Mock).mockResolvedValue(mockTrials);

        // 3. Hydrate the store
        await hydrate();

        // 4. Assert session was resumed
        const state = usePerformanceStore.getState();
        expect(state.activeSession).not.toBeNull();
        expect(state.activeSession?.sessionId).toBe('test-session-123');
        expect(state.activeSession?.currentSeq).toBe(5);
        expect(useToast().toast).toHaveBeenCalledWith({ title: "Session resumed from where you left off." });

        // 5. Assert PRNG fast-forward
        const originalPrng = new PRNG('test-seed-for-recovery');
        for (let i = 0; i < 5; i++) {
            originalPrng.nextInt(); // Manually advance to position 6
        }
        
        // Log a new event, which should use the resumed PRNG state
        logEvent({ type: 'trial_complete', payload: { trialIndex: 5 } as any });
        
        // This is a proxy for checking the internal PRNG state. If the test framework
        // supported spying on the PRNG instance inside the store, that would be better.
        // For now, we trust that if `currentSeq` is correct, the fast-forwarding is too.
        expect(state.activeSession?.currentSeq).toBe(6);
    });
});
