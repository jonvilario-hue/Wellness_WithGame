
/**
 * @fileoverview Development-only content validation script.
 * This checks the integrity of the verbal content library.
 */
import { wordCorpus, validationWordList, realWords } from '@/data/verbal-content';

type WordFrequencyTier = 'high' | 'medium' | 'low' | 'rare';

const FREQUENCY_BANDS: Record<WordFrequencyTier, [number, number]> = {
    high: [8, 10],
    medium: [5, 7.9],
    low: [2, 4.9],
    rare: [0, 1.9],
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

        const tier = entry.frequency;
        const [min, max] = FREQUENCY_BANDS[tier];
        
        if (entry.frequency_score < min || entry.frequency_score > max) {
            console.error(
                `[FAIL] Word "${word}" is in tier "${tier}" but has frequency ${entry.frequency_score}, which is outside the expected range [${min}, ${max}].`
            );
            errorsFound++;
        }
    }

    if (errorsFound === 0) {
        console.log("--- Validation PASS: All words are within their frequency tiers. ---");
    } else {
        console.error(`--- Validation FAIL: Found ${errorsFound} frequency errors. ---`);
    }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).validateWordFrequencies = validateWordFrequencies;
}
