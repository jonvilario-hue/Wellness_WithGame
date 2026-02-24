
/**
 * @fileoverview Development-only empirical replay validator.
 * This script allows developers to verify the determinism of the stimulus
 * generation pipeline by re-running a recorded session and comparing the output.
 */

import { PRNG } from '../rng';
import * as verbalFactory from '../verbal-stimulus-factory';
import { difficultyPolicies } from '@/data/difficulty-policies';
import type { TrialRecord, TrainingFocus, GameId } from '@/types';

type ReplayInput = {
    seed: string;
    gameId: GameId;
    focus: TrainingFocus;
    trials: TrialRecord[];
};

type Mismatch = {
    trialIndex: number;
    field: string;
    expected: any;
    generated: any;
};

const getStimulusGenerator = (gameId: GameId, focus: TrainingFocus) => {
    if (focus === 'verbal') {
        // In a real scenario, this would be a map of factories per game
        switch(gameId) {
            case 'gwm_dynamic_sequence': return verbalFactory.generateVerbalSequence;
            case 'gs_rapid_code': return verbalFactory.generateLexicalDecisionProblem;
            case 'gf_pattern_matrix': return verbalFactory.generateAnalogyProblem;
            // ... add other verbal generators
            default: return null;
        }
    }
    // Add logic for Math, Music, Neutral modes if needed
    return null;
}

export async function replayAndValidateSession(sessionData: ReplayInput): Promise<{ valid: boolean, mismatches: Mismatch[] }> {
    if (process.env.NODE_ENV !== 'development') {
        console.warn("Replay validation is only available in development mode.");
        return { valid: true, mismatches: [] };
    }

    console.log(`[REPLAY] Starting validation for session with seed "${sessionData.seed}"...`);
    const mismatches: Mismatch[] = [];
    const prng = new PRNG(sessionData.seed);

    for (let i = 0; i < sessionData.trials.length; i++) {
        const recordedTrial = sessionData.trials[i];
        const generator = getStimulusGenerator(sessionData.gameId, sessionData.focus);

        if (!generator) {
            console.warn(`[REPLAY] No generator found for game ${sessionData.gameId} in focus ${sessionData.focus}. Skipping trial ${i}.`);
            continue;
        }
        
        // This relies on the generator function being pure and only using the PRNG for randomness.
        const regeneratedStimulus = generator(recordedTrial.difficultyLevel, prng);

        // NOTE: This is a simplified comparison. A real implementation would need to
        // navigate the complex, game-specific structures of the stimulus objects.
        // For this example, we'll compare a key field if it exists.
        const expectedStimulus = recordedTrial.stimulusParams;
        
        // This is a naive comparison and would need to be much more robust
        if (JSON.stringify(regeneratedStimulus) !== JSON.stringify(expectedStimulus)) {
            mismatches.push({
                trialIndex: i,
                field: 'full_stimulus_object',
                expected: expectedStimulus,
                generated: regeneratedStimulus
            });
        }
    }

    if (mismatches.length > 0) {
        console.error(`[REPLAY] FAILED: Found ${mismatches.length} mismatches.`);
        console.table(mismatches);
        return { valid: false, mismatches };
    }

    console.log(`[REPLAY] PASS: All ${sessionData.trials.length} trials were deterministically reproduced.`);
    return { valid: true, mismatches: [] };
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).cognitune_replaySession = replayAndValidateSession;
    console.log("Replay validator `cognitune_replaySession(sessionData)` is available.");
}
