
/**
 * @fileoverview Development-only test harness to verify PRNG invariance under fault conditions.
 * This script can be run from the browser console to validate determinism.
 */

import { PRNG } from '../rng';
import type { GameId, TrainingFocus } from '@/types';

// This function assumes that game-specific stimulus generators are exposed on the window object
// in development mode, e.g., `window.generateGwmVerbalStimulus`.
async function runDeterminismFaultTest(gameId: GameId, mode: TrainingFocus, seed: string) {
    if (process.env.NODE_ENV !== 'development') {
        console.log("This test harness is only available in development mode.");
        return;
    }

    console.log(`--- Running Cross-Tier Fault Test ---`);
    console.log(`Game: ${gameId}, Mode: ${mode}, Seed: "${seed}"`);

    const generator = (window as any).stimulusGenerators?.[gameId]?.[mode];

    if (!generator) {
        console.error(`Generator for ${gameId}/${mode} not found on window.stimulusGenerators. Skipping test.`);
        return;
    }

    const trialCount = 100;
    const faultTrialIndex = 37;

    // 1. Baseline run
    const prng1 = new PRNG(seed);
    const baselineTrials = [];
    for (let i = 0; i < trialCount; i++) {
        baselineTrials.push(generator(5, prng1)); // Assume mid-tier level 5
    }
    console.log("Baseline run complete.");

    // 2. Faulted run
    const prng2 = new PRNG(seed);
    const faultedTrials = [];
    let prngStateAtFault: number;
    for (let i = 0; i < trialCount; i++) {
        let stimulus;
        if (i === faultTrialIndex) {
            // Simulate a validation failure that triggers the fallback path.
            // The fallback path must correctly checkpoint and restore PRNG state.
            const prngStateBefore = prng2.getState();
            
            // Generate fallback with a temporary PRNG to avoid altering the main one.
            const tempPrng = new PRNG(prngStateBefore);
            stimulus = generator(1, tempPrng); // Generate Tier 1 fallback
            
            // To ensure the main PRNG advances correctly, we still run the intended generation
            // but discard its result.
            generator(5, prng2);
             console.log(`Trial ${i}: Injected fault, used fallback stimulus.`);
        } else {
            stimulus = generator(5, prng2);
        }
        faultedTrials.push(stimulus);
    }
    console.log("Faulted run complete.");

    // 3. Compare results
    let mismatches = 0;
    for (let i = 0; i < trialCount; i++) {
        // We expect trial 37 to be different.
        if (i === faultTrialIndex) {
            if (JSON.stringify(baselineTrials[i]) === JSON.stringify(faultedTrials[i])) {
                console.error(`[FAIL] Trial ${i}: Fallback stimulus was identical to baseline. Fault was not injected correctly.`);
                mismatches++;
            }
            continue;
        }
        
        if (JSON.stringify(baselineTrials[i]) !== JSON.stringify(faultedTrials[i])) {
            console.error(`[FAIL] PRNG Desync at trial ${i} after fault.`);
            console.log("Expected:", baselineTrials[i]);
            console.log("Got:", faultedTrials[i]);
            mismatches++;
        }
    }

    if (mismatches === 0) {
        console.log(`--- [PASS] PRNG state remained synchronized for all trials after the fault. ---`);
    } else {
        console.error(`--- [FAIL] Found ${mismatches} divergences after the fault trial. ---`);
    }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).runDeterminismFaultTest = runDeterminismFaultTest;
    // Expose generators for testing
    (window as any).stimulusGenerators = {};
}
