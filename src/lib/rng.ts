
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

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = this.nextIntRange(0, currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }
}

// Development-only validation function
export function validateDeterminism(seed: string, gameId: string, tier: number, trialCount: number): boolean {
    if (process.env.NODE_ENV !== 'development') return true;

    console.log(`Running determinism check for game ${gameId}, tier ${tier} with seed "${seed}"...`);
    
    // This function depends on the existence of a global factory or game-specific factories.
    // As the factory logic is being created in `verbal-stimulus-factory.ts`, we'll assume
    // a function `generateTrial` exists there for this validation.
    // We will need to import it dynamically or pass it in.
    
    // Placeholder - actual implementation requires access to the stimulus factory.
    // For now, this just validates the PRNG itself.
    const prng1 = new PRNG(seed);
    const prng2 = new PRNG(seed);

    for (let i = 0; i < trialCount; i++) {
        const val1 = prng1.nextFloat();
        const val2 = prng2.nextFloat();
        if (val1 !== val2) {
            console.error(`Determinism FAIL at trial ${i}: ${val1} !== ${val2}`);
            return false;
        }
    }

    console.log(`Determinism PASS: All ${trialCount} generated values were identical.`);
    return true;
}

// Attach to window for console access in dev mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).validateDeterminism = validateDeterminism;
    (window as any).PRNG = PRNG;
}
