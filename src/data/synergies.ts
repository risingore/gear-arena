/**
 * GEAR ARENA — canonical synergy data (v0.1, 2026-04-15).
 *
 * Heika is free to edit triggers and effects. Kima must not rewrite without
 * approval.
 *
 * Implementation priority: 1-2 synergies during Day 5, more if time allows.
 */

import type { SynergiesRegistry } from './schema';

export const SYNERGIES = {
  syn_gear_sync: {
    id: 'syn_gear_sync',
    name: 'Gear Sync',
    description: 'Equip 3+ gears to gain an extra -15% weapon cooldown.',
    trigger: { kind: 'gear_count', threshold: 3 },
    effect: { kind: 'cooldown_mult', multiplier: 0.85 }
  },
  syn_turbo_laser: {
    id: 'syn_turbo_laser',
    name: 'Turbo Combo',
    description: 'Equip Turbo Engine + Pulse Laser for -15% weapon cooldown.',
    trigger: { kind: 'category_pair', a: 'engine', b: 'weapon' },
    effect: { kind: 'cooldown_mult', multiplier: 0.85 }
  },
  syn_dual_wield: {
    id: 'syn_dual_wield',
    name: 'Dual Wield',
    description: 'Equip 2+ weapons for +10% damage to all weapons.',
    trigger: { kind: 'weapon_count', threshold: 2 },
    effect: { kind: 'damage_pct', multiplier: 0.10 }
  },
  syn_heavy_armor: {
    id: 'syn_heavy_armor',
    name: 'Heavy Armor',
    description: 'Equip 2+ armor pieces for +20 max HP.',
    trigger: { kind: 'armor_count', threshold: 2 },
    effect: { kind: 'hp_bonus', amount: 20 }
  },
  syn_special_amp: {
    id: 'syn_special_amp',
    name: 'Special Amp',
    description: 'Equip 2+ specials for +50% special magnitude.',
    trigger: { kind: 'special_count', threshold: 2 },
    effect: { kind: 'magnitude_mult', multiplier: 1.5 }
  },
  syn_full_kit: {
    id: 'syn_full_kit',
    name: 'Full Kit',
    description: 'All 5 part categories equipped: -10% all cooldowns.',
    trigger: { kind: 'all_categories' },
    effect: { kind: 'cooldown_mult', multiplier: 0.90 }
  }
} as const satisfies SynergiesRegistry;

export type SynergyKey = keyof typeof SYNERGIES;

export const ALL_SYNERGY_KEYS: readonly SynergyKey[] = Object.keys(SYNERGIES) as readonly SynergyKey[];
