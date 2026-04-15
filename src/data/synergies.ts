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
    description: 'Equip Turbo Engine + Pulse Laser for +1 laser pierce.',
    trigger: { kind: 'category_pair', a: 'engine', b: 'weapon' },
    effect: { kind: 'pierce_plus', amount: 1 }
  }
} as const satisfies SynergiesRegistry;

export type SynergyKey = keyof typeof SYNERGIES;

export const ALL_SYNERGY_KEYS: readonly SynergyKey[] = Object.keys(SYNERGIES) as readonly SynergyKey[];
