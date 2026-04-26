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

/**
 * @param difficultyMult Round-based scaling applied to HP and damage.
 *   Default 1.0 keeps the def's base stats. Big-boss should pass 1.0;
 *   normal enemies and mid-bosses pass `1 + (round - 1) * BALANCE.roundDifficultyPerRound`.
 */
const defToEnemy = (def: EnemyDef, applyVariance: boolean, difficultyMult: number = 1.0): EnemyData => {
  const hpScaled = def.baseHp * difficultyMult;
  const dmgScaled = def.baseDamage * difficultyMult;
  return {
    name: def.name,
    hp: applyVariance ? vary(hpScaled, BALANCE.normalEnemyVariance) : Math.round(hpScaled),
    damage: applyVariance ? vary(dmgScaled, BALANCE.normalEnemyVariance) : Math.round(dmgScaled),
    cooldownSec: applyVariance
      ? +(def.baseCooldownSec * (1 + (rng() * 2 - 1) * BALANCE.normalEnemyVariance)).toFixed(2)
      : def.baseCooldownSec,
    damageReductionPct: applyVariance
      ? varyPct(def.baseDamageReductionPct, BALANCE.normalEnemyVariance)
      : def.baseDamageReductionPct,
    assetKey: def.assetKey
  };
};

/** Round-based difficulty multiplier for normal enemies and mid-bosses.
 *  EXPONENTIAL: pow(BALANCE.roundDifficultyGrowth, round - 1).
 *  Big-boss (final round) is exempt and always passes 1.0. */
const roundDiff = (round: number): number =>
  Math.pow(BALANCE.roundDifficultyGrowth, round - 1);

export interface GeneratedRound {
  readonly index: number;
  readonly enemy: EnemyData;
  readonly enemyId: string;
  readonly goldReward: number;
  readonly isBoss: boolean;
  readonly isSuperBoss: boolean;
}

/**
 * Run mode for enemy generation. Mirrors `RunState.endingMode` — both
 * the in-fiction ending flavor and the round structure key off this.
 */
export type RunMode = 'easy' | 'hard';

/**
 * Generate enemy lineup for a run.
 *
 * Easy (5 rounds):
 *   R1-R2: normal (easy tier)
 *   R3-R4: normal (hard tier)
 *   R5:    mid-boss
 *
 * Hard (10 rounds):
 *   R1-R3: normal (easy tier)
 *   R4:    mid-boss
 *   R5-R6: normal (mid tier)
 *   R7:    mid-boss
 *   R8-R9: normal (hard tier)
 *   R10:   big boss
 *
 * Both modes filter pools through the INDRA-only jam allow-list so we
 * never spawn an enemy whose sprite isn't shipped in this build, falling
 * back to the full pool when the jam subset is empty.
 *
 * @param mode 'easy' (5 rounds) or 'hard' (10 rounds)
 * @param bossOnly true = debug mode, 3 rounds (mid-boss, mid-boss, big-boss)
 */
export function generateRunEnemies(
  _superBossUnlocked: boolean,
  seed?: number,
  mode: RunMode = 'hard',
  bossOnly = false,
): GeneratedRound[] {
  const prevRng = rng;
  rng = seed !== undefined ? createSeededRandom(seed) : Math.random;
  const rounds: GeneratedRound[] = [];

  const sortedNormals = [...NORMAL_ENEMIES].sort((a, b) => a.tier - b.tier);
  const easyPool = sortedNormals.filter((e) => e.tier <= BALANCE.easyTierMax);
  const midPool = sortedNormals.filter((e) => e.tier >= BALANCE.midTierMin && e.tier <= BALANCE.midTierMax);
  const hardPool = sortedNormals.filter((e) => e.tier >= BALANCE.hardTierMin);

  // Jam scope: only INDRA-ready enemies have sprites in Preloader. Both
  // Easy and Hard filter through the same allow-list so the build never
  // tries to render an unshipped sprite.
  const JAM_NORMAL_IDS = new Set<string>([
    'enemy_mob1', 'enemy_mob2', 'enemy_mob3', 'enemy_mob4', 'enemy_mob5',
    'enemy_mob6', 'enemy_mob7', 'enemy_mob8', 'enemy_mob9', 'enemy_mob10',
    'enemy_mob11', 'enemy_mob13', 'enemy_mob14',
  ]);
  const JAM_MIDBOSS_IDS = new Set<string>(['midboss_bakeneko', 'midboss_nopperabo', 'midboss_karakasa']);
  const JAM_BIGBOSS_IDS = new Set<string>(['boss_yuki_onna']);
  const jamEasyPool = easyPool.filter((e) => JAM_NORMAL_IDS.has(e.id));
  const jamMidPool = midPool.filter((e) => JAM_NORMAL_IDS.has(e.id));
  const jamHardPool = hardPool.filter((e) => JAM_NORMAL_IDS.has(e.id));
  const jamMidBosses = MID_BOSSES.filter((e) => JAM_MIDBOSS_IDS.has(e.id));
  const jamBigBosses = BIG_BOSSES.filter((e) => JAM_BIGBOSS_IDS.has(e.id));
  // Fall back to the full pool when the jam subset is empty, so the run
  // never lands on `pickRandom([])`. Mid-tier jam pool is empty for now;
  // it falls through to the full mid pool (or easy if mid is empty too).
  const eP = jamEasyPool.length > 0 ? jamEasyPool : easyPool;
  const mP =
    jamMidPool.length > 0
      ? jamMidPool
      : midPool.length > 0
        ? midPool
        : easyPool;
  const hP = jamHardPool.length > 0 ? jamHardPool : hardPool;
  const mbP = jamMidBosses.length > 0 ? jamMidBosses : MID_BOSSES;
  const bbP = jamBigBosses.length > 0 ? jamBigBosses : BIG_BOSSES;

  if (bossOnly) {
    // Debug: skip normal enemies entirely. Mid-boss -> mid-boss -> big-boss -> ending.
    const mb1 = pickRandom(mbP);
    rounds.push({ index: 1, enemy: defToEnemy(mb1, false, roundDiff(1)), enemyId: mb1.id, goldReward: 1200, isBoss: true, isSuperBoss: false });
    const mb2 = pickRandom(mbP);
    rounds.push({ index: 2, enemy: defToEnemy(mb2, false, roundDiff(2)), enemyId: mb2.id, goldReward: 1400, isBoss: true, isSuperBoss: false });
    const bb = pickRandom(bbP);
    rounds.push({ index: 3, enemy: defToEnemy(bb, false, 1.0), enemyId: bb.id, goldReward: 0, isBoss: true, isSuperBoss: false });
    rng = prevRng;
    return rounds;
  }

  if (mode === 'easy') {
    // Easy: 5 rounds, no big-boss climax — INDRA's introductory fall.
    // Tuned to be clearable on a normal first attempt without SANCTUM buffs.
    // R1-R2 easy pool, R3-R4 mid pool (was hard — too steep for Easy), R5 mid-boss.
    // roundDiff(N) ramps HP/damage by +5%/round so progression feels real.
    // Per-round gold rewards are 1.5× the original Hard-style ramp so an
    // Easy run lands ~6600g of post-battle gold (8100g including the 1500g
    // starting purse) — comfortably enough to ★1-fill the loadout and
    // ★3-merge a slot or two before the R5 mid-boss climax.
    const r1 = pickRandom(eP);
    rounds.push({ index: 1, enemy: defToEnemy(r1, true, roundDiff(1)), enemyId: r1.id, goldReward: 1200, isBoss: false, isSuperBoss: false });
    const r2 = pickRandom(eP);
    rounds.push({ index: 2, enemy: defToEnemy(r2, true, roundDiff(2)), enemyId: r2.id, goldReward: 1500, isBoss: false, isSuperBoss: false });
    const r3 = pickRandom(mP);
    rounds.push({ index: 3, enemy: defToEnemy(r3, true, roundDiff(3)), enemyId: r3.id, goldReward: 1800, isBoss: false, isSuperBoss: false });
    const r4 = pickRandom(mP);
    rounds.push({ index: 4, enemy: defToEnemy(r4, true, roundDiff(4)), enemyId: r4.id, goldReward: 2100, isBoss: false, isSuperBoss: false });
    const mb = pickRandom(mbP);
    rounds.push({ index: 5, enemy: defToEnemy(mb, false, roundDiff(5)), enemyId: mb.id, goldReward: 0, isBoss: true,  isSuperBoss: false });
  } else {
    // Hard: 10 rounds, full Episode 0 arc — R10 big-boss climax.
    // roundDiff(N) ramps HP/damage by +5%/round (R1=1.00× → R10=1.45×) for
    // normal enemies and mid-bosses. Big-boss (R10) is exempt — already tuned.
    for (let i = 1; i <= 3; i += 1) {
      const e = pickRandom(eP);
      rounds.push({ index: i, enemy: defToEnemy(e, true, roundDiff(i)), enemyId: e.id, goldReward: (6 + i) * 100, isBoss: false, isSuperBoss: false });
    }
    const mb1 = pickRandom(mbP);
    rounds.push({ index: 4, enemy: defToEnemy(mb1, false, roundDiff(4)), enemyId: mb1.id, goldReward: 1200, isBoss: true, isSuperBoss: false });
    for (let i = 5; i <= 6; i += 1) {
      const e = pickRandom(mP);
      rounds.push({ index: i, enemy: defToEnemy(e, true, roundDiff(i)), enemyId: e.id, goldReward: (9 + i) * 100, isBoss: false, isSuperBoss: false });
    }
    const mb2 = pickRandom(mbP);
    rounds.push({ index: 7, enemy: defToEnemy(mb2, false, roundDiff(7)), enemyId: mb2.id, goldReward: 1400, isBoss: true, isSuperBoss: false });
    for (let i = 8; i <= 9; i += 1) {
      const e = pickRandom(hP);
      rounds.push({ index: i, enemy: defToEnemy(e, true, roundDiff(i)), enemyId: e.id, goldReward: (11 + i) * 100, isBoss: false, isSuperBoss: false });
    }
    const bb = pickRandom(bbP);
    rounds.push({ index: 10, enemy: defToEnemy(bb, false, 1.0), enemyId: bb.id, goldReward: 0, isBoss: true, isSuperBoss: false });
  }

  // Restore previous RNG to avoid polluting non-generation code.
  rng = prevRng;

  return rounds;
}

/** Total rounds in a standard run. */
export const STANDARD_ROUND_COUNT = 5;
