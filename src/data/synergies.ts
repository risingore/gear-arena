/**
 * SOUL STRIKE — canonical synergy data (v0.2, 2026-04-16).
 *
 * Tunable — edit triggers and effects without
 * approval.
 *
 * v0.2: category rename (module/implant/charger/booster/soul).
 */

import type { SynergiesRegistry } from './schema';

export const SYNERGIES = {
  syn_gear_sync: {
    id: 'syn_gear_sync',
    name: 'Booster Sync',
    description: 'Equip 3+ boosters to gain an extra -15% module cooldown.',
    trigger: { kind: 'booster_count', threshold: 3 },
    effect: { kind: 'cooldown_mult', multiplier: 0.85 }
  },
  syn_turbo_laser: {
    id: 'syn_turbo_laser',
    name: 'Turbo Combo',
    description: 'Equip Overclocked Heart + Nerve Hijacker for -15% module cooldown.',
    trigger: { kind: 'category_pair', a: 'charger', b: 'module' },
    effect: { kind: 'cooldown_mult', multiplier: 0.85 }
  },
  syn_dual_wield: {
    id: 'syn_dual_wield',
    name: 'Dual Wield',
    description: 'Equip 2+ modules for +10% damage to all modules.',
    trigger: { kind: 'module_count', threshold: 2 },
    effect: { kind: 'damage_pct', multiplier: 0.10 }
  },
  syn_heavy_armor: {
    id: 'syn_heavy_armor',
    name: 'Heavy Implant',
    description: 'Equip 2+ implants for +20 max HP.',
    trigger: { kind: 'implant_count', threshold: 2 },
    effect: { kind: 'hp_bonus', amount: 20 }
  },
  syn_special_amp: {
    id: 'syn_special_amp',
    name: 'Soul Amp',
    description: 'Equip 2+ souls for +50% soul magnitude.',
    trigger: { kind: 'soul_count', threshold: 2 },
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
