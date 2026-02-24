
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

  public nextInt(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed;
  }

  public nextFloat(): number {
    return this.nextInt() / this.m;
  }

  public nextIntRange(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min)) + min;
  }

  public shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length;
    let randomIndex;

    const newArray = [...array];

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
   * @returns The current seed value.
   */
  public getState(): number {
    return this.seed;
  }

  /**
   * Sets the internal state of the PRNG to a specific value.
   * @param seed The seed value to restore.
   */
  public setState(seed: number): void {
    this.seed = seed;
  }
}
