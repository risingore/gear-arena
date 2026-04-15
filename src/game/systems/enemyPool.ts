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
  SUPER_BOSS,
  type EnemyDef
} from '@/data/enemies';
import type { EnemyData } from '@/data/schema';

/** Stat variance range for normal enemies (±10%). */
const VARIANCE = 0.10;

const vary = (base: number, pct: number): number => {
  const factor = 1 + (Math.random() * 2 - 1) * pct;
  return Math.max(1, Math.round(base * factor));
};

const varyPct = (base: number, pct: number): number => {
  const factor = 1 + (Math.random() * 2 - 1) * pct;
  return Math.max(0, +(base * factor).toFixed(3));
};

const pickRandom = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!;

const pickAndRemove = <T>(arr: T[]): T => {
  const idx = Math.floor(Math.random() * arr.length);
  return arr.splice(idx, 1)[0]!;
};

const defToEnemy = (def: EnemyDef, applyVariance: boolean): EnemyData => ({
  name: def.name,
  hp: applyVariance ? vary(def.baseHp, VARIANCE) : def.baseHp,
  damage: applyVariance ? vary(def.baseDamage, VARIANCE) : def.baseDamage,
  cooldownSec: applyVariance
    ? +(def.baseCooldownSec * (1 + (Math.random() * 2 - 1) * VARIANCE)).toFixed(2)
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
export function generateRunEnemies(superBossUnlocked: boolean): GeneratedRound[] {
  const rounds: GeneratedRound[] = [];

  // ---- Normal enemy pool: shuffle by tier and pick 6 for the 6 normal rounds ----
  // Sort base enemies by tier, then pick one per pair of tiers, with variance.
  const sortedNormals = [...NORMAL_ENEMIES].sort((a, b) => a.tier - b.tier);

  // Rounds 1-3: pick from tier 1-4 (easy)
  const easyPool = sortedNormals.filter((e) => e.tier <= 4);
  // Rounds 5-6: pick from tier 4-7 (mid)
  const midPool = sortedNormals.filter((e) => e.tier >= 4 && e.tier <= 7);
  // Rounds 8-9: pick from tier 7-10 (hard)
  const hardPool = sortedNormals.filter((e) => e.tier >= 7);

  // R1
  const r1Def = pickRandom(easyPool);
  rounds.push({ index: 1, enemy: defToEnemy(r1Def, true), enemyId: r1Def.id, goldReward: 7,  isBoss: false, isSuperBoss: false });
  // R2
  const r2Def = pickRandom(easyPool);
  rounds.push({ index: 2, enemy: defToEnemy(r2Def, true), enemyId: r2Def.id, goldReward: 8,  isBoss: false, isSuperBoss: false });
  // R3
  const r3Def = pickRandom(easyPool);
  rounds.push({ index: 3, enemy: defToEnemy(r3Def, true), enemyId: r3Def.id, goldReward: 9,  isBoss: false, isSuperBoss: false });

  // R4: mid-boss
  const midBossPool = [...MID_BOSSES];
  const r4Def = pickAndRemove(midBossPool);
  rounds.push({ index: 4, enemy: defToEnemy(r4Def, false), enemyId: r4Def.id, goldReward: 12, isBoss: true, isSuperBoss: false });

  // R5
  const r5Def = pickRandom(midPool);
  rounds.push({ index: 5, enemy: defToEnemy(r5Def, true), enemyId: r5Def.id, goldReward: 10, isBoss: false, isSuperBoss: false });
  // R6
  const r6Def = pickRandom(midPool);
  rounds.push({ index: 6, enemy: defToEnemy(r6Def, true), enemyId: r6Def.id, goldReward: 11, isBoss: false, isSuperBoss: false });

  // R7: mid-boss (from remaining pool)
  const r7Def = pickAndRemove(midBossPool);
  rounds.push({ index: 7, enemy: defToEnemy(r7Def, false), enemyId: r7Def.id, goldReward: 14, isBoss: true, isSuperBoss: false });

  // R8
  const r8Def = pickRandom(hardPool);
  rounds.push({ index: 8, enemy: defToEnemy(r8Def, true), enemyId: r8Def.id, goldReward: 13, isBoss: false, isSuperBoss: false });
  // R9
  const r9Def = pickRandom(hardPool);
  rounds.push({ index: 9, enemy: defToEnemy(r9Def, true), enemyId: r9Def.id, goldReward: 15, isBoss: false, isSuperBoss: false });

  // R10: big boss
  const r10Def = pickRandom(BIG_BOSSES);
  rounds.push({ index: 10, enemy: defToEnemy(r10Def, false), enemyId: r10Def.id, goldReward: 0, isBoss: true, isSuperBoss: false });

  // R11: super boss (conditional)
  if (superBossUnlocked) {
    rounds.push({ index: 11, enemy: defToEnemy(SUPER_BOSS, false), enemyId: SUPER_BOSS.id, goldReward: 0, isBoss: true, isSuperBoss: true });
  }

  return rounds;
}

/** Total rounds in a standard run (excluding the conditional super boss). */
export const STANDARD_ROUND_COUNT = 10;
