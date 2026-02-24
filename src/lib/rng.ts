
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
  public nextInt(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed;
  }

  /**
   * Generates a pseudo-random float between 0 (inclusive) and 1 (exclusive).
   * This is a deterministic replacement for Math.random().
   * @returns A float between 0 and 1.
   */
  public nextFloat(): number {
    return this.nextInt() / this.m;
  }

  /**
   * Generates a pseudo-random integer within a specified range.
   * @param min - The minimum value (inclusive).
   * @param max - The maximum value (exclusive).
   * @returns An integer in the range [min, max).
   */
  public nextIntRange(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min)) + min;
  }

  /**
   * Shuffles an array in place using the Fisher-Yates algorithm and the seeded PRNG.
   * This provides a deterministic shuffle.
   * @param array - The array to be shuffled.
   * @returns A new array with the shuffled elements.
   */
  public shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length;
    let randomIndex;

    const newArray = [...array]; // Work on a copy

    while (currentIndex !== 0) {
      randomIndex = this.nextIntRange(0, currentIndex);
      currentIndex--;

      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex], newArray[currentIndex]];
    }

    return newArray;
  }

  /**
   * Returns the current internal state of the PRNG.
   * @returns The current seed.
   */
  public getState(): number {
    return this.seed;
  }

  /**
   * Sets the internal state of the PRNG.
   * @param seed - The seed to restore.
   */
  public setState(seed: number): void {
    this.seed = seed;
  }
}
