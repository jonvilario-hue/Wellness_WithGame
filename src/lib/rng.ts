
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
   * This provides a deterministic shuffle, unlike Array.sort(() => Math.random() - 0.5).
   * @param array - The array to be shuffled.
   * @returns A new array with the shuffled elements.
   */
  public shuffle<T>(array: T[]): T[] {
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

/**
 * A session-scoped utility to sample items from a list of categories
 * in a shuffled round-robin fashion, ensuring all categories are visited
 * before any are repeated. This is a selectable strategy for stimulus generation.
 */
export class CategorySampler {
    private categories: string[];
    private prng: PRNG;
    private shuffledCategories: string[] = [];
    private currentIndex = 0;

    constructor(categories: string[], prng: PRNG) {
        this.categories = categories;
        this.prng = prng;
        this.reshuffle();
    }

    private reshuffle() {
        this.shuffledCategories = this.prng.shuffle(this.categories);
        this.currentIndex = 0;
    }

    public next(): string {
        if (this.currentIndex >= this.shuffledCategories.length) {
            this.reshuffle();
        }
        const category = this.shuffledCategories[this.currentIndex];
        this.currentIndex++;
        return category;
    }
}
