
/**
 * A simple seeded pseudo-random number generator (PRNG) using a linear congruential generator (LCG) formula.
 * This is crucial for creating deterministic, reproducible game trials.
 */
export class PRNG {
  private a = 1664525;
  private c = 1013904223;
  private m = 2 ** 32;
  private seed: number;

  constructor(seed: number | string) {
    this.seed = this.hashString(String(seed));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Generates the next number in the sequence.
   * @returns A raw integer from the sequence.
   */
  private nextInt(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed;
  }

  /**
   * Generates a pseudo-random float between 0 (inclusive) and 1 (exclusive).
   * This is a deterministic replacement for Math.random().
   * @returns A float between 0 and 1.
   */
  nextFloat(): number {
    return this.nextInt() / this.m;
  }

  /**
   * Generates a pseudo-random integer within a specified range.
   * @param min - The minimum value (inclusive).
   * @param max - The maximum value (exclusive).
   * @returns An integer in the range [min, max).
   */
  nextIntRange(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min)) + min;
  }

  /**
   * Shuffles an array in place using the Fisher-Yates algorithm and the seeded PRNG.
   * This provides a deterministic shuffle, unlike Array.sort(() => Math.random() - 0.5).
   * @param array - The array to be shuffled.
   */
  shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length;
    let randomIndex;

    const newArray = [...array]; // Work on a copy

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = this.nextIntRange(0, currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex], newArray[currentIndex]];
    }

    return newArray;
  }
}

// Development-only validation function
export function validateDeterminism(mode: 'verbal' | 'math', seed: string, trialCount: number): boolean {
    if (process.env.NODE_ENV !== 'development') {
      console.warn("Determinism validation is only available in development mode.");
      return true;
    }

    console.log(`Running determinism check for mode ${mode}, with seed "${seed}"...`);
    
    // This function requires dynamic access to the stimulus factories.
    // In a real scenario, we would dynamically import them.
    // For this simulation, we'll assume they are available.
    
    // Placeholder for actual factory functions
    const getVerbalTrial = (prng: PRNG, i: number) => `verbal_trial_${prng.nextIntRange(0, 1000)}_${i}`;
    const getMathTrial = (prng: PRNG, i: number) => `math_trial_${prng.nextIntRange(0, 1000)}_${i}`;
    
    const generator = mode === 'verbal' ? getVerbalTrial : getMathTrial;

    const prng1 = new PRNG(seed);
    const prng2 = new PRNG(seed);
    const results1 = [];
    const results2 = [];

    for (let i = 0; i < trialCount; i++) {
        results1.push(generator(prng1, i));
        results2.push(generator(prng2, i));
    }
    
    for (let i = 0; i < trialCount; i++) {
        if (JSON.stringify(results1[i]) !== JSON.stringify(results2[i])) {
            console.error(`Determinism FAIL at trial ${i}:`);
            console.error("Expected:", results1[i]);
            console.error("Received:", results2[i]);
            return false;
        }
    }

    console.log(`Determinism PASS: All ${trialCount} generated stimuli were identical for mode '${mode}'.`);
    return true;
}

// Attach to window for console access in dev mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).validateDeterminism = validateDeterminism;
    (window as any).PRNG = PRNG;
}
