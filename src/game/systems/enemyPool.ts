/**
 * Enemy pool and round generation.
 *
 * Each run generates a fresh lineup of 10 (+1 conditional) enemies by
 * pulling from the canonical enemy catalogue. Normal enemies get ±10%
 * stat variance so no two runs feel identical.
 *
 * Round template:
 *   R1-R3:  normal (tier-sorted, low to mid)
 *   R4:     mid-boss (random from 5)
 *   R5-R6:  normal (mid to high)
 *   R7:     mid-boss (random from remaining 4)
 *   R8-R9:  normal (high to max)
 *   R10:    big boss (random from 3)
 *   R11:    super boss (only if unlocked)
 */

import {
  NORMAL_ENEMIES,
  MID_BOSSES,
  BIG_BOSSES,
  type EnemyDef
} from '@/data/enemies';
import type { EnemyData } from '@/data/schema';

/** Stat variance range for normal enemies (±10%). */
const VARIANCE = 0.10;

/**
 * Simple seeded PRNG (mulberry32).
 * Returns a function that produces deterministic values in [0, 1).
 */
const createSeededRandom = (seed: number): (() => number) => {
  let s = seed | 0;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Returns a deterministic seed derived from today's UTC date.
 * Same seed for all players on the same calendar day.
 */
export const getDailySeed = (): number => {
  const now = new Date();
  const dateStr = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i += 1) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return hash;
};

/** Random function used by generation helpers; swapped when seed is provided. */
let rng = Math.random;

const vary = (base: number, pct: number): number => {
  const factor = 1 + (rng() * 2 - 1) * pct;
  return Math.max(1, Math.round(base * factor));
};

const varyPct = (base: number, pct: number): number => {
  const factor = 1 + (rng() * 2 - 1) * pct;
  return Math.max(0, +(base * factor).toFixed(3));
};

const pickRandom = <T>(arr: readonly T[]): T =>
  arr[Math.floor(rng() * arr.length)]!;

const defToEnemy = (def: EnemyDef, applyVariance: boolean): EnemyData => ({
  name: def.name,
  hp: applyVariance ? vary(def.baseHp, VARIANCE) : def.baseHp,
  damage: applyVariance ? vary(def.baseDamage, VARIANCE) : def.baseDamage,
  cooldownSec: applyVariance
    ? +(def.baseCooldownSec * (1 + (rng() * 2 - 1) * VARIANCE)).toFixed(2)
    : def.baseCooldownSec,
  damageReductionPct: applyVariance
    ? varyPct(def.baseDamageReductionPct, VARIANCE)
    : def.baseDamageReductionPct,
  assetKey: def.assetKey
});

export interface GeneratedRound {
  readonly index: number;
  readonly enemy: EnemyData;
  readonly enemyId: string;
  readonly goldReward: number;
  readonly isBoss: boolean;
  readonly isSuperBoss: boolean;
}

/**
 * Generate the full 10-round (or 11-round) enemy lineup for a single run.
 *
 * @param superBossUnlocked Whether the super boss has been earned
 *   (all 4 robots cleared + all normal/mid/big enemies defeated).
 */
export function generateRunEnemies(_superBossUnlocked: boolean, seed?: number): GeneratedRound[] {
  // Install seeded or default RNG for the duration of generation.
  const prevRng = rng;
  rng = seed !== undefined ? createSeededRandom(seed) : Math.random;
  const rounds: GeneratedRound[] = [];

  // 5-round structure: R1-R2 normal, R3 mid-boss, R4 normal(hard), R5 big boss.
  // Designed for 3-minute runs so jam judges can complete the full loop.
  const sortedNormals = [...NORMAL_ENEMIES].sort((a, b) => a.tier - b.tier);
  const easyPool = sortedNormals.filter((e) => e.tier <= 5);
  const hardPool = sortedNormals.filter((e) => e.tier >= 6);

  // R1: easy normal
  const r1Def = pickRandom(easyPool);
  rounds.push({ index: 1, enemy: defToEnemy(r1Def, true), enemyId: r1Def.id, goldReward: 8, isBoss: false, isSuperBoss: false });

  // R2: easy-mid normal
  const r2Def = pickRandom(easyPool);
  rounds.push({ index: 2, enemy: defToEnemy(r2Def, true), enemyId: r2Def.id, goldReward: 10, isBoss: false, isSuperBoss: false });

  // R3: mid-boss (skill reward)
  const r3Def = pickRandom(MID_BOSSES);
  rounds.push({ index: 3, enemy: defToEnemy(r3Def, false), enemyId: r3Def.id, goldReward: 14, isBoss: true, isSuperBoss: false });

  // R4: hard normal
  const r4Def = pickRandom(hardPool);
  rounds.push({ index: 4, enemy: defToEnemy(r4Def, true), enemyId: r4Def.id, goldReward: 12, isBoss: false, isSuperBoss: false });

  // R5: big boss (final)
  const r5Def = pickRandom(BIG_BOSSES);
  rounds.push({ index: 5, enemy: defToEnemy(r5Def, false), enemyId: r5Def.id, goldReward: 0, isBoss: true, isSuperBoss: false });

  // Restore previous RNG to avoid polluting non-generation code.
  rng = prevRng;

  return rounds;
}

/** Total rounds in a standard run. */
export const STANDARD_ROUND_COUNT = 5;
