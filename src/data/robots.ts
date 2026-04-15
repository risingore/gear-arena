/**
 * GEAR ARENA — canonical robot data (v0.1, 2026-04-15).
 *
 * Heika is free to edit base stats, slot layouts, names, and passive text.
 * Slot x / y coordinates live in a virtual 192x220 space and are projected
 * onto the Build scene's blueprint panel at runtime. Kima is allowed to
 * nudge those coordinates during implementation — see `docs/data-ownership.md`.
 * All other values require explicit approval from Heika.
 *
 * Asset key fields point to placeholder keys until Day 7 replaces them with
 * Grok-generated images.
 */

import type { RobotsRegistry } from './schema';

export const ROBOTS = {
  // ============================================================
  // KNIGHT-01 — balanced archetype (2x3 layout, 6 slots)
  // ============================================================
  robot_knight: {
    id: 'robot_knight',
    name: 'KNIGHT-01',
    archetype: 'balanced',
    description: 'Standard mass-production frame. Head, chest, arms, legs.',
    baseHp: 100,
    baseDamageReductionPct: 0,
    baseAttackSpeedMultiplier: 1.0,
    passiveText: 'No passive — straightforward power.',
    blueprintAssetKey: 'blueprint_knight',
    battleAssetKey: 'battle_knight',
    slots: [
      { id: 'knight_head',  slotType: 'head',   accepts: 'armor',  x: 96,  y: 40  },
      { id: 'knight_chest', slotType: 'chest',  accepts: 'engine', x: 96,  y: 90  },
      { id: 'knight_arm_l', slotType: 'arm_l',  accepts: 'weapon', x: 54,  y: 95  },
      { id: 'knight_arm_r', slotType: 'arm_r',  accepts: 'weapon', x: 138, y: 95  },
      { id: 'knight_leg_l', slotType: 'legs_l', accepts: 'gear',   x: 80,  y: 170 },
      { id: 'knight_leg_r', slotType: 'legs_r', accepts: 'gear',   x: 112, y: 170 }
    ]
  },

  // ============================================================
  // GOLIATH-02 — heavy archetype (8 slots, armor + leg focus)
  // ============================================================
  robot_goliath: {
    id: 'robot_goliath',
    name: 'GOLIATH-02',
    archetype: 'heavy',
    description: 'Heavily armored siege frame. Dense slot layout on legs.',
    baseHp: 150,
    baseDamageReductionPct: 0.10,
    baseAttackSpeedMultiplier: 0.80,
    passiveText: 'Damage taken -10% / attack speed -20%.',
    blueprintAssetKey: 'blueprint_goliath',
    battleAssetKey: 'battle_goliath',
    slots: [
      { id: 'goliath_head',    slotType: 'head',   accepts: 'armor',  x: 96,  y: 36  },
      { id: 'goliath_chest_a', slotType: 'chest',  accepts: 'armor',  x: 96,  y: 82  },
      { id: 'goliath_chest_b', slotType: 'chest',  accepts: 'engine', x: 96,  y: 118 },
      { id: 'goliath_arm_r',   slotType: 'arm_r',  accepts: 'weapon', x: 152, y: 100 },
      { id: 'goliath_leg_la',  slotType: 'legs_l', accepts: 'armor',  x: 76,  y: 160 },
      { id: 'goliath_leg_lb',  slotType: 'legs_l', accepts: 'gear',   x: 76,  y: 192 },
      { id: 'goliath_leg_ra',  slotType: 'legs_r', accepts: 'armor',  x: 116, y: 160 },
      { id: 'goliath_leg_rb',  slotType: 'legs_r', accepts: 'gear',   x: 116, y: 192 }
    ]
  },

  // ============================================================
  // STRIKER-03 — speed archetype (4 slots, no head)
  // ============================================================
  robot_striker: {
    id: 'robot_striker',
    name: 'STRIKER-03',
    archetype: 'speed',
    description: 'Lean strike frame. Headless, dual weapons, gear leg.',
    baseHp: 70,
    baseDamageReductionPct: -0.10,
    baseAttackSpeedMultiplier: 1.30,
    passiveText: 'Attack speed +30% / damage taken +10%.',
    blueprintAssetKey: 'blueprint_striker',
    battleAssetKey: 'battle_striker',
    slots: [
      { id: 'striker_chest', slotType: 'chest',  accepts: 'engine', x: 96,  y: 80  },
      { id: 'striker_arm_l', slotType: 'arm_l',  accepts: 'weapon', x: 52,  y: 90  },
      { id: 'striker_arm_r', slotType: 'arm_r',  accepts: 'weapon', x: 140, y: 90  },
      { id: 'striker_leg',   slotType: 'legs_l', accepts: 'gear',   x: 96,  y: 168 }
    ]
  },

  // ============================================================
  // ORACLE-04 — tech archetype (6 slots, 3 back specials)
  // ============================================================
  robot_oracle: {
    id: 'robot_oracle',
    name: 'ORACLE-04',
    archetype: 'tech',
    description: 'Synergy-driven tech frame. Three special slots on the back.',
    baseHp: 80,
    baseDamageReductionPct: 0,
    baseAttackSpeedMultiplier: 0.85,
    passiveText: 'Special effects +50% / weapon cooldown +15%.',
    blueprintAssetKey: 'blueprint_oracle',
    battleAssetKey: 'battle_oracle',
    slots: [
      { id: 'oracle_head',    slotType: 'head',   accepts: 'armor',   x: 96,  y: 40  },
      { id: 'oracle_chest',   slotType: 'chest',  accepts: 'engine',  x: 96,  y: 94  },
      { id: 'oracle_arm_r',   slotType: 'arm_r',  accepts: 'weapon',  x: 140, y: 94  },
      { id: 'oracle_back_a',  slotType: 'back',   accepts: 'special', x: 40,  y: 70  },
      { id: 'oracle_back_b',  slotType: 'back',   accepts: 'special', x: 40,  y: 100 },
      { id: 'oracle_back_c',  slotType: 'back',   accepts: 'special', x: 40,  y: 130 }
    ]
  }
} as const satisfies RobotsRegistry;

export type RobotKey = keyof typeof ROBOTS;

export const ALL_ROBOT_KEYS: readonly RobotKey[] = Object.keys(ROBOTS) as readonly RobotKey[];
