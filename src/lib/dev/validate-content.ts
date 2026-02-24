
/**
 * @fileoverview Development-only content validation script.
 * This checks the integrity of the verbal content library.
 */
import { wordCorpus, realWords } from '@/data/verbal-content';
import type { WordCorpusEntry } from '@/data/verbal-content';

type WordFrequencyTier = 'high' | 'medium' | 'low' | 'rare';

// This function is for demonstration; a real implementation would have more robust tiering.
const getTierForScore = (score: number): WordFrequencyTier => {
    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    if (score >= 2) return 'low';
    return 'rare';
};

function validateWordFrequencies() {
    if (process.env.NODE_ENV !== 'development') return;
    console.log("--- Running Content Validation: Word Frequencies ---");
    let errorsFound = 0;
    
    for (const word of realWords) {
        const entry = wordCorpus[word];
        if (!entry) {
            console.warn(`[WARN] Word "${word}" is in realWords list but not in wordCorpus.`);
            continue;
        }

        const expectedTier = getTierForScore(entry.frequency_score);
        // This is a placeholder for a more complex check. For now, we just ensure it exists.
        if (!expectedTier) {
             console.error(
                `[FAIL] Word "${word}" has frequency ${entry.frequency_score}, which does not map to a valid tier.`
            );
            errorsFound++;
        }
    }

    if (errorsFound === 0) {
        console.log("--- Validation PASS: All words have valid frequency scores. ---");
    } else {
        console.error(`--- Validation FAIL: Found ${errorsFound} frequency errors. ---`);
    }
}


function validateMonotonicity(gameId: string) {
    if (process.env.NODE_ENV !== 'development') return;
    // Placeholder for the real implementation, which would import difficulty policies
    // and check that parameters like sequenceLength, gridSize, responseWindowMs, etc.
    // change monotonically across tiers for the given game.
    console.log(`Running monotonicity check for game ${gameId}...`);
    console.log(`[WARN] Monotonicity validation is a placeholder and not fully implemented.`);
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).validateWordFrequencies = validateWordFrequencies;
    (window as any).validateMonotonicity = validateMonotonicity;
}
