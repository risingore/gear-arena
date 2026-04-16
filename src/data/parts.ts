/**
 * GEAR ARENA — canonical parts data (v0.3, 2026-04-16).
 *
 * Heika is free to edit numbers, names, descriptions, and allowedSlots.
 * Kima must NOT overwrite without explicit instruction.
 *
 * v0.3: expanded from 15 to 25 parts (5 categories × 5 each) to give
 * the Build phase enough variety for meaningful decisions across 10 rounds.
 */

import type { PartsRegistry } from './schema';

export const PARTS = {
  // ============================================================
  // Weapons x5
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
  weapon_railgun: {
    id: 'weapon_railgun',
    name: 'Railgun',
    description: 'Extreme damage, very slow. One-shot potential.',
    category: 'weapon',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 9,
    cooldownSec: 3.5,
    damage: 35,
    range: 'long'
  },
  weapon_flamethrower: {
    id: 'weapon_flamethrower',
    name: 'Flamethrower',
    description: 'Rapid close-range burn. Low per-hit but fast.',
    category: 'weapon',
    allowedSlots: ['arm_l', 'arm_r'],
    price: 6,
    cooldownSec: 0.7,
    damage: 5,
    range: 'melee'
  },

  // ============================================================
  // Armor x5
  // ============================================================
  armor_plate: {
    id: 'armor_plate',
    name: 'Steel Plate',
    description: 'Flat -2 damage taken. Forgiving for new pilots.',
    category: 'armor',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r'],
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
    allowedSlots: ['chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r'],
    price: 5,
    damageReduction: 0,
    damageReductionPct: 0.15,
    bonusHp: 0
  },
  armor_shield: {
    id: 'armor_shield',
    name: 'Kinetic Shield',
    description: 'Blocks the first hit completely, then +5% DR.',
    category: 'armor',
    allowedSlots: ['chest', 'arm_l', 'arm_r'],
    price: 7,
    damageReduction: 0,
    damageReductionPct: 0.05,
    bonusHp: 15
  },
  armor_reactive: {
    id: 'armor_reactive',
    name: 'Reactive Plating',
    description: 'Flat -4 damage taken but -10 max HP.',
    category: 'armor',
    allowedSlots: ['chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r'],
    price: 4,
    damageReduction: 4,
    damageReductionPct: 0,
    bonusHp: -10
  },
  armor_fortress: {
    id: 'armor_fortress',
    name: 'Fortress Frame',
    description: '+30 max HP and 10% DR. Heavy but durable.',
    category: 'armor',
    allowedSlots: ['chest'],
    price: 8,
    damageReduction: 0,
    damageReductionPct: 0.10,
    bonusHp: 30
  },

  // ============================================================
  // Engines x5
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
  engine_striker: {
    id: 'engine_striker',
    name: 'Striker Core',
    description: '+5 damage to all weapons. No HP bonus.',
    category: 'engine',
    allowedSlots: ['chest', 'back'],
    price: 7,
    bonusHp: 0,
    bonusDamage: 5,
    bonusDamageReductionPct: 0
  },
  engine_regen: {
    id: 'engine_regen',
    name: 'Regen Cell',
    description: '+15 max HP and 3% damage reduction.',
    category: 'engine',
    allowedSlots: ['back'],
    price: 5,
    bonusHp: 15,
    bonusDamage: 0,
    bonusDamageReductionPct: 0.03
  },

  // ============================================================
  // Gears x5
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
  gear_micro: {
    id: 'gear_micro',
    name: 'Micro Gear',
    description: '-5% cooldown. Cheap filler.',
    category: 'gear',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 2,
    cooldownMultiplier: 0.95,
    hpPenalty: 0
  },
  gear_overclock: {
    id: 'gear_overclock',
    name: 'Overclock Gear',
    description: '-25% cooldown, -10 max HP. Glass cannon.',
    category: 'gear',
    allowedSlots: ['head', 'chest', 'arm_l', 'arm_r', 'legs_l', 'legs_r', 'back'],
    price: 6,
    cooldownMultiplier: 0.75,
    hpPenalty: 10
  },

  // ============================================================
  // Specials x5
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
  },
  spec_laststand: {
    id: 'spec_laststand',
    name: 'Last Stand Module',
    description: 'Survive one lethal hit with 1 HP (once per battle).',
    category: 'special',
    allowedSlots: ['back'],
    price: 9,
    effectKind: 'overdrive',
    magnitude: 0.8
  },
  spec_vampiric: {
    id: 'spec_vampiric',
    name: 'Vampiric Core',
    description: 'Heal 2 HP on every weapon hit.',
    category: 'special',
    allowedSlots: ['back'],
    price: 7,
    effectKind: 'repair',
    magnitude: 2
  }
} as const satisfies PartsRegistry;

export type PartKey = keyof typeof PARTS;

export const ALL_PART_KEYS: readonly PartKey[] = Object.keys(PARTS) as readonly PartKey[];
