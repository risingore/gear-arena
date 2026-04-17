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
import { BALANCE } from '@/data/balance';


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
  hp: applyVariance ? vary(def.baseHp, BALANCE.normalEnemyVariance) : def.baseHp,
  damage: applyVariance ? vary(def.baseDamage, BALANCE.normalEnemyVariance) : def.baseDamage,
  cooldownSec: applyVariance
    ? +(def.baseCooldownSec * (1 + (rng() * 2 - 1) * BALANCE.normalEnemyVariance)).toFixed(2)
    : def.baseCooldownSec,
  damageReductionPct: applyVariance
    ? varyPct(def.baseDamageReductionPct, BALANCE.normalEnemyVariance)
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
 * Generate enemy lineup.
 * @param shortRun true = 5 rounds (KNIGHT first clear), false = 10 rounds (standard)
 */
export function generateRunEnemies(_superBossUnlocked: boolean, seed?: number, shortRun = false): GeneratedRound[] {
  const prevRng = rng;
  rng = seed !== undefined ? createSeededRandom(seed) : Math.random;
  const rounds: GeneratedRound[] = [];

  const sortedNormals = [...NORMAL_ENEMIES].sort((a, b) => a.tier - b.tier);
  const easyPool = sortedNormals.filter((e) => e.tier <= BALANCE.easyTierMax);
  const midPool = sortedNormals.filter((e) => e.tier >= BALANCE.midTierMin && e.tier <= BALANCE.midTierMax);
  const hardPool = sortedNormals.filter((e) => e.tier >= BALANCE.hardTierMin);

  if (shortRun) {
    // 5-round intro run: R1-R2 normal, R3 mid-boss, R4 hard, R5 big boss
    rounds.push({ index: 1, enemy: defToEnemy(pickRandom(easyPool), true), enemyId: pickRandom(easyPool).id, goldReward: 8, isBoss: false, isSuperBoss: false });
    rounds.push({ index: 2, enemy: defToEnemy(pickRandom(easyPool), true), enemyId: pickRandom(easyPool).id, goldReward: 10, isBoss: false, isSuperBoss: false });
    const mb = pickRandom(MID_BOSSES);
    rounds.push({ index: 3, enemy: defToEnemy(mb, false), enemyId: mb.id, goldReward: 14, isBoss: true, isSuperBoss: false });
    rounds.push({ index: 4, enemy: defToEnemy(pickRandom(hardPool), true), enemyId: pickRandom(hardPool).id, goldReward: 12, isBoss: false, isSuperBoss: false });
    const bb = pickRandom(BIG_BOSSES);
    rounds.push({ index: 5, enemy: defToEnemy(bb, false), enemyId: bb.id, goldReward: 0, isBoss: true, isSuperBoss: false });
  } else {
    // Full 10-round run: R1-R3 easy, R4 mid-boss, R5-R6 mid, R7 mid-boss, R8-R9 hard, R10 big boss
    for (let i = 1; i <= 3; i += 1) {
      const e = pickRandom(easyPool);
      rounds.push({ index: i, enemy: defToEnemy(e, true), enemyId: e.id, goldReward: 6 + i, isBoss: false, isSuperBoss: false });
    }
    const mb1 = pickRandom(MID_BOSSES);
    rounds.push({ index: 4, enemy: defToEnemy(mb1, false), enemyId: mb1.id, goldReward: 12, isBoss: true, isSuperBoss: false });
    for (let i = 5; i <= 6; i += 1) {
      const e = pickRandom(midPool);
      rounds.push({ index: i, enemy: defToEnemy(e, true), enemyId: e.id, goldReward: 9 + i, isBoss: false, isSuperBoss: false });
    }
    const mb2 = pickRandom(MID_BOSSES);
    rounds.push({ index: 7, enemy: defToEnemy(mb2, false), enemyId: mb2.id, goldReward: 14, isBoss: true, isSuperBoss: false });
    for (let i = 8; i <= 9; i += 1) {
      const e = pickRandom(hardPool);
      rounds.push({ index: i, enemy: defToEnemy(e, true), enemyId: e.id, goldReward: 11 + i, isBoss: false, isSuperBoss: false });
    }
    const bb = pickRandom(BIG_BOSSES);
    rounds.push({ index: 10, enemy: defToEnemy(bb, false), enemyId: bb.id, goldReward: 0, isBoss: true, isSuperBoss: false });
  }

  // Restore previous RNG to avoid polluting non-generation code.
  rng = prevRng;

  return rounds;
}

/** Total rounds in a standard run. */
export const STANDARD_ROUND_COUNT = 5;
