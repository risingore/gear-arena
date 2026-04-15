/**
 * GEAR ARENA — canonical parts data (v0.1, 2026-04-15).
 *
 * Heika (the designer) is free to edit numbers, names, descriptions, and
 * `allowedSlots` entries in this file. Kima (the engineer) must NOT overwrite
 * these values without explicit instruction; bumps to the schema happen first
 * in `schema.ts`, then Heika is notified.
 *
 * Save this file and Vite HMR pushes the change into the running game within
 * seconds. Type errors are flagged by VS Code inline on save.
 *
 * See `docs/parts-spec.md` for the human-readable design notes.
 */

import type { PartsRegistry } from './schema';

export const PARTS = {
  // ============================================================
  // Weapons x3
  // ============================================================
  weapon_blade: {
    id: 'weapon_blade',
    name: 'Chainblade',
    description: 'Lightweight melee blade. Fast hit rate.',
    category: 'weapon',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 3,
    cooldownSec: 1.2,
    damage: 8,
    range: 'melee'
  },
  weapon_cannon: {
    id: 'weapon_cannon',
    name: 'Rivet Cannon',
    description: 'Long-range heavy hitter. Slow to cycle.',
    category: 'weapon',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 5,
    cooldownSec: 2.0,
    damage: 18,
    range: 'long'
  },
  weapon_laser: {
    id: 'weapon_laser',
    name: 'Pulse Laser',
    description: 'Piercing mid-range laser.',
    category: 'weapon',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 7,
    cooldownSec: 1.5,
    damage: 12,
    range: 'mid'
  },

  // ============================================================
  // Armor x3
  // ============================================================
  armor_plate: {
    id: 'armor_plate',
    name: 'Steel Plate',
    description: 'Flat -2 damage taken. Forgiving for new pilots.',
    category: 'armor',
    allowedSlots: ['head', 'chest', 'legs_l', 'legs_r'],
    price: 3,
    damageReduction: 2,
    damageReductionPct: 0,
    bonusHp: 0
  },
  armor_mesh: {
    id: 'armor_mesh',
    name: 'Composite Mesh',
    description: '15% incoming damage reduction.',
    category: 'armor',
    allowedSlots: ['chest', 'legs_l', 'legs_r'],
    price: 5,
    damageReduction: 0,
    damageReductionPct: 0.15,
    bonusHp: 0
  },
  armor_shield: {
    id: 'armor_shield',
    name: 'Kinetic Shield',
    description: '+15 max HP and 5% damage reduction.',
    category: 'armor',
    allowedSlots: ['chest'],
    price: 7,
    damageReduction: 0,
    damageReductionPct: 0.05,
    bonusHp: 15
  },

  // ============================================================
  // Engines x3
  // ============================================================
  engine_basic: {
    id: 'engine_basic',
    name: 'Basic Engine',
    description: '+20 max HP.',
    category: 'engine',
    allowedSlots: ['chest', 'back'],
    price: 4,
    bonusHp: 20,
    bonusDamage: 0,
    bonusDamageReductionPct: 0
  },
  engine_turbo: {
    id: 'engine_turbo',
    name: 'Turbo Engine',
    description: '+10 max HP and +2 to every weapon.',
    category: 'engine',
    allowedSlots: ['chest', 'back'],
    price: 6,
    bonusHp: 10,
    bonusDamage: 2,
    bonusDamageReductionPct: 0
  },
  engine_core: {
    id: 'engine_core',
    name: 'Reactor Core',
    description: '+40 max HP and 5% damage reduction.',
    category: 'engine',
    allowedSlots: ['chest'],
    price: 8,
    bonusHp: 40,
    bonusDamage: 0,
    bonusDamageReductionPct: 0.05
  },

  // ============================================================
  // Gears x3
  // ============================================================
  gear_small: {
    id: 'gear_small',
    name: 'Small Gear',
    description: '-10% cooldown on every weapon.',
    category: 'gear',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 3,
    cooldownMultiplier: 0.9,
    hpPenalty: 0
  },
  gear_heavy: {
    id: 'gear_heavy',
    name: 'Heavy Gear',
    description: '-20% cooldown, -5 max HP.',
    category: 'gear',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 5,
    cooldownMultiplier: 0.8,
    hpPenalty: 5
  },
  gear_chrono: {
    id: 'gear_chrono',
    name: 'Chrono Gear',
    description: '-8% cooldown. Stacks for Gear Sync.',
    category: 'gear',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 7,
    cooldownMultiplier: 0.92,
    hpPenalty: 0
  },

  // ============================================================
  // Specials x3
  // ============================================================
  spec_overdrive: {
    id: 'spec_overdrive',
    name: 'Overdrive Chip',
    description: '+50% attack speed below 30% HP.',
    category: 'special',
    allowedSlots: ['back'],
    price: 6,
    effectKind: 'overdrive',
    magnitude: 0.5
  },
  spec_repair: {
    id: 'spec_repair',
    name: 'Repair Kit',
    description: 'Heal 3 HP every 5 seconds.',
    category: 'special',
    allowedSlots: ['back'],
    price: 5,
    effectKind: 'repair',
    magnitude: 3
  },
  spec_synergy: {
    id: 'spec_synergy',
    name: 'Gear Sync',
    description: '+3 damage per equipped gear.',
    category: 'special',
    allowedSlots: ['back'],
    price: 8,
    effectKind: 'synergy_gear',
    magnitude: 3
  }
} as const satisfies PartsRegistry;

export type PartKey = keyof typeof PARTS;

export const ALL_PART_KEYS: readonly PartKey[] = Object.keys(PARTS) as readonly PartKey[];
