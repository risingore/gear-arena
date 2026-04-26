/**
 * SOUL STRIKE — canonical parts data (v0.4, 2026-04-16).
 *
 * Tunable — edit numbers, names, descriptions, and allowedSlots.
 *
 * v0.4: cyberpunk rename — 5 categories (module/implant/charger/booster/soul)
 * × 5 each. All stat numbers, prices, and effects are preserved exactly.
 */

import type { PartsRegistry } from './schema';

export const PARTS = {
  // ============================================================
  // Modules x5 (was Weapons)
  // ============================================================
  weapon_blade: {
    id: 'weapon_blade',
    name: 'Phantom Limb',
    description: "Lost arm's memory strikes through the ultimate.",
    category: 'module',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 3,
    rarity: 'common',
    cooldownSec: 1.2,
    damage: 8,
    range: 'melee'
  },
  weapon_cannon: {
    id: 'weapon_cannon',
    name: 'Junk Pile Driver',
    description: 'Compressed scrap fired at terminal velocity.',
    category: 'module',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 5,
    rarity: 'rare',
    cooldownSec: 2.0,
    damage: 18,
    range: 'long'
  },
  weapon_laser: {
    id: 'weapon_laser',
    name: 'Nerve Hijacker',
    description: 'Seizes enemy control circuits. Chance to freeze.',
    category: 'module',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 7,
    rarity: 'rare',
    cooldownSec: 1.5,
    damage: 12,
    range: 'mid',
    statusEffect: { kind: 'freeze', chance: 0.2, magnitude: 0.3, durationSec: 2 }
  },
  weapon_railgun: {
    id: 'weapon_railgun',
    name: 'ATMAN Breaker',
    description: 'Forbidden tech. Extreme damage, slow charge.',
    category: 'module',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 8,
    rarity: 'epic',
    cooldownSec: 3.5,
    damage: 35,
    range: 'long'
  },
  weapon_flamethrower: {
    id: 'weapon_flamethrower',
    name: 'Rage Burner',
    description: 'Channeled fury ignites everything nearby.',
    category: 'module',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 6,
    rarity: 'rare',
    cooldownSec: 0.7,
    damage: 5,
    range: 'melee',
    statusEffect: { kind: 'burn', chance: 0.3, magnitude: 3, durationSec: 3 }
  },

  // ============================================================
  // Implants x5 (was Armor)
  // ============================================================
  armor_plate: {
    id: 'armor_plate',
    name: 'Blackmarket Plating',
    description: 'Flat damage reduction. No questions asked.',
    category: 'implant',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r'],
    price: 3,
    rarity: 'common',
    damageReduction: 2,
    damageReductionPct: 0,
    bonusHp: 0
  },
  armor_mesh: {
    id: 'armor_mesh',
    name: 'Scar Tissue Mesh',
    description: '15% damage reduction. Your scars are your armor.',
    category: 'implant',
    allowedSlots: ['chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r'],
    price: 5,
    rarity: 'rare',
    damageReduction: 0,
    damageReductionPct: 0.15,
    bonusHp: 0
  },
  armor_shield: {
    id: 'armor_shield',
    name: 'Stolen Aegis',
    description: 'Blocks first hit. Stolen from corporate elite.',
    category: 'implant',
    allowedSlots: ['chest', 'arm_l', 'arm_r'],
    price: 7,
    rarity: 'rare',
    damageReduction: 0,
    damageReductionPct: 0.05,
    bonusHp: 15
  },
  armor_reactive: {
    id: 'armor_reactive',
    name: "Dead Man's Vest",
    description: "DR+4 but HP-10. A fallen comrade's last gift.",
    category: 'implant',
    allowedSlots: ['chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r'],
    price: 4,
    rarity: 'rare',
    damageReduction: 4,
    damageReductionPct: 0,
    bonusHp: -10
  },
  armor_fortress: {
    id: 'armor_fortress',
    name: 'Jury-Rigged Exoframe',
    description: 'HP+30, DR 10%. Held together with wire and will.',
    category: 'implant',
    allowedSlots: ['chest'],
    price: 8,
    rarity: 'epic',
    damageReduction: 0,
    damageReductionPct: 0.10,
    bonusHp: 30
  },

  // ============================================================
  // Chargers x5 (was Engines)
  // ============================================================
  engine_basic: {
    id: 'engine_basic',
    name: 'Salvage Reactor',
    description: 'Pulls power from scrap. HP+20.',
    category: 'charger',
    allowedSlots: ['chest', 'back'],
    price: 4,
    rarity: 'common',
    bonusHp: 20,
    bonusDamage: 0,
    bonusDamageReductionPct: 0
  },
  engine_turbo: {
    id: 'engine_turbo',
    name: 'Overclocked Heart',
    description: 'Pushed past limits. HP+10, DMG+2.',
    category: 'charger',
    allowedSlots: ['chest', 'back'],
    price: 6,
    rarity: 'rare',
    bonusHp: 10,
    bonusDamage: 2,
    bonusDamageReductionPct: 0
  },
  engine_core: {
    id: 'engine_core',
    name: 'Stolen Core',
    description: 'Corporate power plant. HP+40, DR 5%.',
    category: 'charger',
    allowedSlots: ['chest'],
    price: 8,
    rarity: 'epic',
    bonusHp: 40,
    bonusDamage: 0,
    bonusDamageReductionPct: 0.05
  },
  engine_striker: {
    id: 'engine_striker',
    name: 'Adrenaline Pump',
    description: 'Pure chemical boost. DMG+5.',
    category: 'charger',
    allowedSlots: ['chest', 'back'],
    price: 7,
    rarity: 'epic',
    bonusHp: 0,
    bonusDamage: 5,
    bonusDamageReductionPct: 0
  },
  engine_regen: {
    id: 'engine_regen',
    name: 'Parasite Cell',
    description: 'Feeds on damage. HP+15, DR 3%.',
    category: 'charger',
    allowedSlots: ['back'],
    price: 5,
    rarity: 'rare',
    bonusHp: 15,
    bonusDamage: 0,
    bonusDamageReductionPct: 0.03
  },

  // ============================================================
  // Boosters x5 (was Gears)
  // ============================================================
  gear_small: {
    id: 'gear_small',
    name: 'Feedback Loop',
    description: 'Recycles combat data. -10% cooldown.',
    category: 'booster',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 3,
    rarity: 'common',
    cooldownMultiplier: 0.9,
    hpPenalty: 0
  },
  gear_heavy: {
    id: 'gear_heavy',
    name: 'Rage Amplifier',
    description: 'Converts anger to power. -20% CD, HP-5.',
    category: 'booster',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 5,
    rarity: 'rare',
    cooldownMultiplier: 0.8,
    hpPenalty: 5
  },
  gear_chrono: {
    id: 'gear_chrono',
    name: 'Chrono Splice',
    description: 'Time-shifted circuits. -8% cooldown.',
    category: 'booster',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 7,
    rarity: 'rare',
    cooldownMultiplier: 0.92,
    hpPenalty: 0
  },
  gear_micro: {
    id: 'gear_micro',
    name: 'Junk Capacitor',
    description: 'Cheap but works. -5% cooldown.',
    category: 'booster',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 2,
    rarity: 'common',
    cooldownMultiplier: 0.95,
    hpPenalty: 0
  },
  gear_overclock: {
    id: 'gear_overclock',
    name: 'Overdrive Injector',
    description: '-25% CD, HP-10. Glass cannon.',
    category: 'booster',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 6,
    rarity: 'epic',
    cooldownMultiplier: 0.75,
    hpPenalty: 10
  },

  // ============================================================
  // Souls x5 (was Specials)
  // ============================================================
  spec_overdrive: {
    id: 'spec_overdrive',
    name: 'Mandala Chip',
    description: 'Soul resonance amplifies at low HP. +50% speed below 30%.',
    category: 'soul',
    allowedSlots: ['back'],
    price: 6,
    rarity: 'rare',
    effectKind: 'overdrive',
    magnitude: 0.5
  },
  spec_repair: {
    id: 'spec_repair',
    name: 'Karma Circuit',
    description: 'The cycle heals. 3 HP every 5 seconds.',
    category: 'soul',
    allowedSlots: ['back'],
    price: 5,
    rarity: 'rare',
    effectKind: 'repair',
    magnitude: 3
  },
  spec_synergy: {
    id: 'spec_synergy',
    name: 'Samsara Link',
    description: 'Each booster echoes through the soul. +3 DMG per booster.',
    category: 'soul',
    allowedSlots: ['back'],
    price: 8,
    rarity: 'rare',
    effectKind: 'synergy_booster',
    magnitude: 3
  },
  spec_laststand: {
    id: 'spec_laststand',
    name: 'Last Wish',
    description: 'One chance to defy death. Survive lethal hit at 1 HP.',
    category: 'soul',
    allowedSlots: ['back'],
    price: 8,
    rarity: 'epic',
    effectKind: 'overdrive',
    magnitude: 0.8
  },
  spec_vampiric: {
    id: 'spec_vampiric',
    name: 'Soul Drain',
    description: 'Every strike feeds the spirit. Heal 2 HP on hit.',
    category: 'soul',
    allowedSlots: ['back'],
    price: 7,
    rarity: 'epic',
    effectKind: 'repair',
    magnitude: 2
  }
} as const satisfies PartsRegistry;

export type PartKey = keyof typeof PARTS;

export const ALL_PART_KEYS: readonly PartKey[] = Object.keys(PARTS) as readonly PartKey[];
