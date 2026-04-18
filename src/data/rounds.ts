/**
 * SOUL STRIKE — canonical round data (v0.2, 2026-04-15).
 *
 * Heika is free to edit enemy HP, damage, cooldown, and gold rewards.
 * Kima must not rewrite these values without explicit approval.
 *
 * v0.2 expands the run from 5 rounds to 10. Difficulty curve:
 *   1-2  warm-up
 *   3-4  early spike
 *   5    first mid-boss feel
 *   6-7  mid game
 *   8-9  late game
 *   10   final boss (Shuten Doji)
 */

import type { RoundsRegistry } from './schema';

export const ROUNDS = {
  round_01: {
    id: 'round_01',
    index: 1,
    enemy: {
      name: 'Scrap Drone',
      hp: 30,
      damage: 4,
      cooldownSec: 1.8,
      damageReductionPct: 0,
      assetKey: 'enemy_drone'
    },
    goldReward: 7,
    isBoss: false
  },
  round_02: {
    id: 'round_02',
    index: 2,
    enemy: {
      name: 'Rust Walker',
      hp: 50,
      damage: 6,
      cooldownSec: 1.6,
      damageReductionPct: 0,
      assetKey: 'enemy_walker'
    },
    goldReward: 8,
    isBoss: false
  },
  round_03: {
    id: 'round_03',
    index: 3,
    enemy: {
      name: 'Piston Brute',
      hp: 80,
      damage: 9,
      cooldownSec: 1.5,
      damageReductionPct: 0.05,
      assetKey: 'enemy_brute'
    },
    goldReward: 9,
    isBoss: false
  },
  round_04: {
    id: 'round_04',
    index: 4,
    enemy: {
      name: 'Arc Striker',
      hp: 110,
      damage: 12,
      cooldownSec: 1.3,
      damageReductionPct: 0.10,
      assetKey: 'enemy_striker'
    },
    goldReward: 10,
    isBoss: false
  },
  round_05: {
    id: 'round_05',
    index: 5,
    enemy: {
      name: 'Hover Sentinel',
      hp: 140,
      damage: 14,
      cooldownSec: 1.1,
      damageReductionPct: 0.05,
      assetKey: 'enemy_hover'
    },
    goldReward: 11,
    isBoss: false
  },
  round_06: {
    id: 'round_06',
    index: 6,
    enemy: {
      name: 'Heavy Bipod',
      hp: 180,
      damage: 16,
      cooldownSec: 1.6,
      damageReductionPct: 0.15,
      assetKey: 'enemy_bipod'
    },
    goldReward: 12,
    isBoss: false
  },
  round_07: {
    id: 'round_07',
    index: 7,
    enemy: {
      name: 'Twin Rotor',
      hp: 220,
      damage: 18,
      cooldownSec: 1.0,
      damageReductionPct: 0.10,
      assetKey: 'enemy_rotor'
    },
    goldReward: 13,
    isBoss: false
  },
  round_08: {
    id: 'round_08',
    index: 8,
    enemy: {
      name: 'Plasma Crawler',
      hp: 260,
      damage: 22,
      cooldownSec: 1.4,
      damageReductionPct: 0.15,
      assetKey: 'enemy_crawler'
    },
    goldReward: 14,
    isBoss: false
  },
  round_09: {
    id: 'round_09',
    index: 9,
    enemy: {
      name: 'Apex Walker',
      hp: 320,
      damage: 25,
      cooldownSec: 1.2,
      damageReductionPct: 0.18,
      assetKey: 'enemy_apex'
    },
    goldReward: 15,
    isBoss: false
  },
  round_10: {
    id: 'round_10',
    index: 10,
    enemy: {
      name: 'Shuten Doji',
      hp: 500,
      damage: 32,
      cooldownSec: 1.3,
      damageReductionPct: 0.20,
      assetKey: 'enemy_leviathan'
    },
    goldReward: 0,
    isBoss: true
  }
} as const satisfies RoundsRegistry;

export type RoundKey = keyof typeof ROUNDS;

export const ALL_ROUND_KEYS: readonly RoundKey[] = Object.keys(ROUNDS) as readonly RoundKey[];

export const TOTAL_ROUNDS = ALL_ROUND_KEYS.length;
