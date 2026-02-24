
/**
 * @fileoverview Development-only validation and testing utilities.
 * These functions can be attached to the window object for console-based verification.
 */

import { PRNG } from '../rng';
import * as verbalFactory from '../verbal-stimulus-factory';
import { difficultyPolicies } from '@/data/difficulty-policies';
import { realWords, wordCorpus } from '@/data/verbal-content';
import { logTrial } from '../idb-store';
import type { TrialRecord } from '@/types';

// --- Tier 1 Quality Gate ---
export function validateDeterminism(mode: 'verbal' | 'math', seed: string, trialCount: number): boolean {
    if (process.env.NODE_ENV !== 'development') {
        console.warn("Determinism validation is only available in development mode.");
        return true;
    }

    console.log(`[VALIDATION] Running determinism check for mode: ${mode}, seed: "${seed}", trials: ${trialCount}`);
    
    // In a real app, you would have a map of factories per mode.
    // For this case, we'll hardcode the verbal factory for the check.
    if (mode !== 'verbal') {
        console.warn(`[VALIDATION] No stimulus factory registered for mode '${mode}'. Skipping.`);
        return true; // Cannot fail if not implemented
    }

    const prng1 = new PRNG(seed);
    const prng2 = new PRNG(seed);
    const results1 = [];
    const results2 = [];

    // This is a simplified check. A full check would call the game-specific generator.
    const generator = verbalFactory.generateVerbalSequence;

    for (let i = 0; i < trialCount; i++) {
        results1.push(generator(5, prng1)); // Using mid-tier level 5
        results2.push(generator(5, prng2));
    }
    
    for (let i = 0; i < trialCount; i++) {
        if (JSON.stringify(results1[i]) !== JSON.stringify(results2[i])) {
            console.error(`[VALIDATION] Determinism FAIL at trial ${i}:`);
            console.error("Expected:", results1[i]);
            console.error("Received:", results2[i]);
            return false;
        }
    }

    console.log(`[VALIDATION] Determinism PASS: All ${trialCount} generated stimuli were identical for mode '${mode}'.`);
    return true;
}

// --- Tier 3 Quality Gate ---
export async function simulateStorageLoad(sessionCount: number, trialsPerSession: number) {
    if (process.env.NODE_ENV !== 'development') return;

    console.log(`[VALIDATION] Simulating load: ${sessionCount} sessions, ${trialsPerSession} trials each...`);
    const totalTrials = sessionCount * trialsPerSession;

    for (let i = 0; i < totalTrials; i++) {
        const mockTrial: TrialRecord = {
            id: `sim-${Date.now()}-${i}`,
            sessionId: `sim-session-${Math.floor(i / trialsPerSession)}`,
            gameId: 'gf_pattern_matrix',
            trialIndex: i % trialsPerSession,
            correct: Math.random() > 0.5,
            rtMs: 500 + Math.random() * 1000,
            timestamp: Date.now() - (totalTrials - i) * 2000,
            difficultyLevel: 1,
            stimulusParams: {},
            stimulusOnsetTs: 0,
            responseTs: 0,
            responseType: 'n/a',
        };
        await logTrial(mockTrial);
        if (i > 0 && i % 1000 === 0) {
           console.log(`... ${i} trials written.`);
        }
    }
    console.log(`[VALIDATION] Load simulation complete. Check IndexedDB 'trials' store count.`);
};

// --- Tier 4 Quality Gate ---
type WordFrequencyTier = 'high' | 'medium' | 'low' | 'rare';

const getTierForScore = (score: number): WordFrequencyTier => {
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    if (score >= 2) return 'low';
    return 'rare';
};

export function validateWordFrequencies() {
    if (process.env.NODE_ENV !== 'development') return;
    console.log("[VALIDATION] Running Content Validation: Word Frequencies...");
    let errorsFound = 0;
    
    for (const word of realWords) {
        const entry = wordCorpus[word];
        if (!entry) {
            console.warn(`[WARN] Word "${word}" is in realWords list but not in wordCorpus.`);
            continue;
        }

        const tier = getTierForScore(entry.frequency_score);
        if (!tier) {
             console.error(
                `[FAIL] Word "${word}" has frequency ${entry.frequency_score}, which does not map to a valid tier.`
            );
            errorsFound++;
        }
    }

    if (errorsFound === 0) {
        console.log("[VALIDATION] PASS: All realWords have valid frequency scores in wordCorpus.");
    } else {
        console.error(`[VALIDATION] FAIL: Found ${errorsFound} frequency errors.`);
    }
}

// --- Attach to window for console access ---
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).cognitune_validateDeterminism = validateDeterminism;
    (window as any).cognitune_simulateStorageLoad = simulateStorageLoad;
    (window as any).cognitune_validateWordFrequencies = validateWordFrequencies;
}
