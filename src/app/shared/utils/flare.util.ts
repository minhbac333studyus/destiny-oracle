export interface FlareData {
  id: number;
  variant: number;   // 1-5 different flare styles
  top: string;
  left: string;
  delay: string;
  scale: number;
}

/** Deterministic pseudo-random per seed so positions are stable across CD cycles */
export function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Generate deterministic flare positions.
 * @param count   Number of flares to produce
 * @param offset  Optional numeric offset so each card gets unique positions (e.g. from a card-ID hash)
 * @param scaleRange  Max additional scale above 0.6 base (default 0.9)
 */
export function generateFlares(count: number, offset = 0, scaleRange = 0.9): FlareData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    variant: (i % 5) + 1,
    top:   `${Math.floor(pseudoRandom(offset + i * 3 + 1) * 78 + 6)}%`,
    left:  `${Math.floor(pseudoRandom(offset + i * 7 + 3) * 78 + 6)}%`,
    delay: `${(pseudoRandom(offset + i * 11 + 5) * 2.8).toFixed(1)}s`,
    scale: 0.6 + pseudoRandom(offset + i * 13 + 7) * scaleRange,
  }));
}

/** Turn a string ID into a numeric offset so each card gets unique flare positions */
export function cardIdHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  }
  return Math.abs(h) % 1000;
}
