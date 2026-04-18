/**
 * SOUL STRIKE — ultimate button prediction effects.
 *
 * Each prediction has a trust level (how likely it means a real hit)
 * and separate weights for hit vs miss scenarios.
 *
 * Heika is free to edit weights and add new predictions.
 * Visual implementation lives in Battle.ts spawnPrediction.
 */

export interface PredictionDef {
  readonly id: string;
  readonly name: string;
  /** If true, this prediction ONLY appears when the result is a hit. */
  readonly hitOnly: boolean;
  /** Trust level shown to player (0-100%). */
  readonly trustPct: number;
  /** Weight when the result is a hit (higher = more likely to be chosen). */
  readonly weightOnHit: number;
  /** Weight when the result is a miss (0 = never appears on miss). */
  readonly weightOnMiss: number;
}

export const PREDICTIONS: readonly PredictionDef[] = [
  { id: 'rainbow_btn', name: 'Rainbow',     hitOnly: true,  trustPct: 100, weightOnHit: 10, weightOnMiss: 0 },
  { id: 'fish',        name: 'Fish School',  hitOnly: false, trustPct: 80,  weightOnHit: 25, weightOnMiss: 15 },
  { id: 'red_flash',   name: 'Red Flash',    hitOnly: false, trustPct: 60,  weightOnHit: 20, weightOnMiss: 15 },
  { id: 'exclaim',     name: 'Exclamation',  hitOnly: false, trustPct: 40,  weightOnHit: 25, weightOnMiss: 20 },
  { id: 'lightning',   name: 'Lightning',      hitOnly: false, trustPct: 70,  weightOnHit: 20, weightOnMiss: 10 },
  { id: 'mandala',     name: 'Mandala Flash',  hitOnly: true,  trustPct: 90,  weightOnHit: 8,  weightOnMiss: 0 },
  { id: 'glitch',      name: 'Screen Glitch',  hitOnly: false, trustPct: 30,  weightOnHit: 15, weightOnMiss: 25 },
  { id: 'none',        name: 'None',           hitOnly: false, trustPct: 0,   weightOnHit: 20, weightOnMiss: 50 },
];

/** Pick a prediction based on whether the result is a hit or miss. */
export const rollPrediction = (isHit: boolean): PredictionDef => {
  const pool = PREDICTIONS.filter((p) => !p.hitOnly || isHit);
  const weights = pool.map((p) => isHit ? p.weightOnHit : p.weightOnMiss);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
};
