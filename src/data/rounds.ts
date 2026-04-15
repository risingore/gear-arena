/**
 * GEAR ARENA — canonical round data (v0.1, 2026-04-15).
 *
 * Heika is free to edit enemy HP, damage, cooldown, and gold rewards.
 * Kima must not rewrite these values without explicit approval.
 *
 * Difficulty curve: rounds 1-2 are forgiving, round 3 spikes, round 5 is the
 * Leviathan boss.
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
      name: 'Leviathan',
      hp: 200,
      damage: 16,
      cooldownSec: 1.4,
      damageReductionPct: 0.15,
      assetKey: 'enemy_leviathan'
    },
    goldReward: 0,
    isBoss: true
  }
} as const satisfies RoundsRegistry;

export type RoundKey = keyof typeof ROUNDS;

export const ALL_ROUND_KEYS: readonly RoundKey[] = Object.keys(ROUNDS) as readonly RoundKey[];

export const TOTAL_ROUNDS = ALL_ROUND_KEYS.length;
