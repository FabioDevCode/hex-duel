/**
 * Deterministic seeded PRNG (mulberry32). Same seed -> same sequence,
 * so the bonus schedule and positions are reproducible (D-197).
 * Pure: no dependency on Colyseus, Three.js or browser APIs.
 */
export type SeededRandom = () => number;

export const mulberry32 = (seed: number): SeededRandom => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Draws an integer in [min, max] (inclusive). */
export const drawInt = (rng: SeededRandom, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

/** Draws `count` distinct integers in [min, max] (inclusive), unordered. */
export const drawDistinctInts = (rng: SeededRandom, min: number, max: number, count: number): number[] => {
  const pool: number[] = [];
  for (let value = min; value <= max; value++) pool.push(value);
  const drawn: number[] = [];
  const take = Math.min(count, pool.length);
  for (let i = 0; i < take; i++) {
    const index = drawInt(rng, 0, pool.length - 1);
    drawn.push(pool[index]!);
    pool.splice(index, 1);
  }
  return drawn;
};

/** Fisher-Yates shuffle driven by the seeded rng. */
export const shuffle = <T>(rng: SeededRandom, items: readonly T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const index = drawInt(rng, 0, i);
    const tmp = copy[i]!;
    copy[i] = copy[index]!;
    copy[index] = tmp;
  }
  return copy;
};

/** Derives a stable sub-seed from the game seed and a string identity. */
export const deriveSeed = (seed: number, identity: string): number => {
  let hash = seed >>> 0;
  for (let i = 0; i < identity.length; i++) {
    hash = (Math.imul(hash, 31) + identity.charCodeAt(i)) >>> 0;
  }
  return hash;
};
