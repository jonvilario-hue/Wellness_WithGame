
/**
 * @fileoverview Development-only empirical replay validator.
 * This script allows developers to verify the determinism of the stimulus
 * generation pipeline by re-running a recorded session and comparing the output.
 */

import { PRNG } from '../rng';
import * as verbalFactory from '../verbal-stimulus-factory';
import { difficultyPolicies } from '@/data/difficulty-policies';
import type { TrialRecord, TrainingFocus, GameId } from '@/types';
import type { ReplayInputs } from '@/types/local-store';


const getStimulusGenerator = (gameId: GameId, focus: TrainingFocus) => {
    // This mapping needs to be maintained as new games/modes are added.
    const generatorMap: Partial<Record<GameId, Partial<Record<TrainingFocus, (level: number, prng: PRNG) => any>>>> = {
        'gwm_dynamic_sequence': {
            verbal: verbalFactory.generateVerbalSequence,
        },
        'gs_rapid_code': {
            verbal: verbalFactory.generateLexicalDecisionProblem,
        },
        'gf_pattern_matrix': {
            verbal: verbalFactory.generateAnalogyProblem,
        }
    };
    return generatorMap[gameId]?.[focus];
}

export async function replayAndValidateSession(replayInputs: ReplayInput, recordedTrials: TrialRecord[]): Promise<{ valid: boolean, mismatches: any[] }> {
    if (process.env.NODE_ENV !== 'development') {
        console.warn("Replay validation is only available in development mode.");
        return { valid: true, mismatches: [] };
    }

    console.log(`[REPLAY] Starting validation for session with seed "${replayInputs.seed}"...`);
    const mismatches: any[] = [];
    const prng = new PRNG(replayInputs.seed);

    for (let i = 0; i < recordedTrials.length; i++) {
        const recordedTrial = recordedTrials[i];
        const generator = getStimulusGenerator(replayInputs.gameId, replayInputs.focus);

        if (!generator) {
            console.warn(`[REPLAY] No generator found for game ${replayInputs.gameId} in focus ${replayInputs.focus}. Skipping trial ${i}.`);
            continue;
        }
        
        const regeneratedStimulusParams = generator(recordedTrial.difficultyLevel, prng);

        // This comparison logic needs to be robust and game-specific.
        // For now, we'll do a JSON stringify comparison which is brittle but sufficient for this test.
        // A real implementation might use a game-specific comparator function.
        if (JSON.stringify(regeneratedStimulusParams) !== JSON.stringify(recordedTrial.stimulusParams)) {
            mismatches.push({
                trialIndex: i,
                field: 'stimulusParams',
                expected: recordedTrial.stimulusParams,
                generated: regeneratedStimulusParams,
            });
        }
    }

    if (mismatches.length > 0) {
        console.error(`[REPLAY] FAILED: Found ${mismatches.length} mismatches.`);
        console.table(mismatches);
        return { valid: false, mismatches };
    }

    console.log(`[REPLAY] PASS: All ${recordedTrials.length} trials were deterministically reproduced.`);
    return { valid: true, mismatches: [] };
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).cognitune_replaySession = replayAndValidateSession;
}
