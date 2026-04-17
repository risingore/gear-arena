/**
 * GEAR ARENA — canonical robot data (v0.2, 2026-04-15).
 *
 * Heika is free to edit base stats, slot layouts, names, and passive text.
 * Slot x / y coordinates live in a virtual 192x220 space and are projected
 * onto the Build scene's blueprint panel at runtime. Kima is allowed to
 * nudge those coordinates during implementation — see `docs/data-ownership.md`.
 * All other values require explicit approval from Heika.
 *
 * Asset key fields point to placeholder keys until Day 7 replaces them with
 * Grok-generated images.
 *
 * v0.2: slot counts expanded ~1.5x per blueprint so the Build phase has
 * enough room for meaningful loadout decisions.
 */

import type { RobotsRegistry } from './schema';

export const ROBOTS = {
  // ============================================================
  // KNIGHT-01 — balanced archetype (9 slots: head, chest x2,
  // dual arm pairs, dual leg singles)
  // ============================================================
  robot_knight: {
    id: 'robot_knight',
    name: 'KNIGHT-01',
    archetype: 'balanced',
    description: 'Right arm carries a massive mechanical weapon. Balanced cyborg fighter.',
    baseHp: 100,
    baseDamageReductionPct: 0,
    baseAttackSpeedMultiplier: 1.0,
    passiveText: 'No passive — raw striking power.',
    blueprintAssetKey: 'blueprint_knight',
    battleAssetKey: 'battle_knight',
    buffSlots: 2,
    slots: [
      // Head
      { id: 'knight_head',     slotType: 'head',   accepts: 'implant',   x: 96,  y: 22  },
      // Chest
      { id: 'knight_chest_a',  slotType: 'chest',  accepts: 'charger',  x: 80,  y: 62  },
      { id: 'knight_chest_b',  slotType: 'chest',  accepts: 'implant',   x: 112, y: 62  },
      { id: 'knight_chest_c',  slotType: 'chest',  accepts: 'booster',    x: 96,  y: 92  },
      // Right arm (main weapon arm)
      { id: 'knight_arm_ra',   slotType: 'arm_r',  accepts: 'module',  x: 152, y: 56  },
      { id: 'knight_arm_rb',   slotType: 'arm_r',  accepts: 'module',  x: 162, y: 86  },
      { id: 'knight_arm_rc',   slotType: 'arm_r',  accepts: 'booster',    x: 162, y: 116 },
      // Left arm (defense)
      { id: 'knight_arm_la',   slotType: 'arm_l',  accepts: 'implant',   x: 40,  y: 56  },
      { id: 'knight_arm_lb',   slotType: 'arm_l',  accepts: 'booster',    x: 30,  y: 86  },
      // Legs
      { id: 'knight_leg_la',   slotType: 'legs_l', accepts: 'implant',   x: 74,  y: 148 },
      { id: 'knight_leg_lb',   slotType: 'legs_l', accepts: 'booster',    x: 74,  y: 178 },
      { id: 'knight_leg_ra',   slotType: 'legs_r', accepts: 'implant',   x: 118, y: 148 },
      // Back
      { id: 'knight_back',     slotType: 'back',   accepts: 'soul', x: 96,  y: 130 }
    ]
  },

  // ============================================================
  // GOLIATH-02 — heavy archetype (12 slots, armor + leg dominant)
  // ============================================================
  robot_goliath: {
    id: 'robot_goliath',
    name: 'GOLIATH-02',
    archetype: 'heavy',
    description: 'Massive build with reinforced body. Charges through enemies.',
    baseHp: 150,
    baseDamageReductionPct: 0.10,
    baseAttackSpeedMultiplier: 0.80,
    passiveText: 'Damage taken -10% / attack speed -20%.',
    blueprintAssetKey: 'blueprint_goliath',
    battleAssetKey: 'battle_goliath',
    buffSlots: 3,
    slots: [
      // Head
      { id: 'goliath_head',    slotType: 'head',   accepts: 'implant',   x: 96,  y: 20  },
      // Chest (massive — lots of armor + engine)
      { id: 'goliath_chest_a', slotType: 'chest',  accepts: 'implant',   x: 72,  y: 56  },
      { id: 'goliath_chest_b', slotType: 'chest',  accepts: 'charger',  x: 96,  y: 56  },
      { id: 'goliath_chest_c', slotType: 'chest',  accepts: 'implant',   x: 120, y: 56  },
      { id: 'goliath_chest_d', slotType: 'chest',  accepts: 'charger',  x: 96,  y: 86  },
      { id: 'goliath_chest_e', slotType: 'chest',  accepts: 'implant',   x: 96,  y: 116 },
      // Arms (one weapon each)
      { id: 'goliath_arm_ra',  slotType: 'arm_r',  accepts: 'module',  x: 160, y: 68  },
      { id: 'goliath_arm_rb',  slotType: 'arm_r',  accepts: 'implant',   x: 160, y: 98  },
      { id: 'goliath_arm_la',  slotType: 'arm_l',  accepts: 'module',  x: 32,  y: 68  },
      { id: 'goliath_arm_lb',  slotType: 'arm_l',  accepts: 'implant',   x: 32,  y: 98  },
      // Legs (heavy plating)
      { id: 'goliath_leg_la',  slotType: 'legs_l', accepts: 'implant',   x: 70,  y: 148 },
      { id: 'goliath_leg_lb',  slotType: 'legs_l', accepts: 'implant',   x: 70,  y: 178 },
      { id: 'goliath_leg_ra',  slotType: 'legs_r', accepts: 'implant',   x: 122, y: 148 },
      { id: 'goliath_leg_rb',  slotType: 'legs_r', accepts: 'implant',   x: 122, y: 178 },
      // Back (engine room)
      { id: 'goliath_back_a',  slotType: 'back',   accepts: 'charger',  x: 36,  y: 136 },
      { id: 'goliath_back_b',  slotType: 'back',   accepts: 'soul', x: 36,  y: 166 }
    ]
  },

  // ============================================================
  // STRIKER-03 — speed archetype (7 slots, headless, dual weapons)
  // ============================================================
  robot_striker: {
    id: 'robot_striker',
    name: 'STRIKER-03',
    archetype: 'speed',
    description: 'Left leg houses a devastating mechanical kick weapon. Speed fighter.',
    baseHp: 70,
    baseDamageReductionPct: -0.10,
    baseAttackSpeedMultiplier: 1.30,
    passiveText: 'Attack speed +30% / damage taken +10%. 10% evasion.',
    baseEvasion: 0.1,
    blueprintAssetKey: 'blueprint_striker',
    battleAssetKey: 'battle_striker',
    buffSlots: 2,
    slots: [
      // No head (headless design)
      // Chest (light)
      { id: 'striker_chest_a', slotType: 'chest',  accepts: 'charger',  x: 96,  y: 48  },
      { id: 'striker_chest_b', slotType: 'chest',  accepts: 'implant',   x: 96,  y: 78  },
      // Arms (dual weapons)
      { id: 'striker_arm_la',  slotType: 'arm_l',  accepts: 'module',  x: 44,  y: 52  },
      { id: 'striker_arm_lb',  slotType: 'arm_l',  accepts: 'module',  x: 32,  y: 82  },
      { id: 'striker_arm_ra',  slotType: 'arm_r',  accepts: 'module',  x: 148, y: 52  },
      { id: 'striker_arm_rb',  slotType: 'arm_r',  accepts: 'booster',    x: 160, y: 82  },
      // Left leg (main weapon — mechanical kick)
      { id: 'striker_leg_la',  slotType: 'legs_l', accepts: 'module',  x: 74,  y: 136 },
      { id: 'striker_leg_lb',  slotType: 'legs_l', accepts: 'booster',    x: 74,  y: 166 },
      { id: 'striker_leg_lc',  slotType: 'legs_l', accepts: 'booster',    x: 74,  y: 196 },
      // Right leg (normal)
      { id: 'striker_leg_ra',  slotType: 'legs_r', accepts: 'implant',   x: 118, y: 136 },
      // Back
      { id: 'striker_back_a',  slotType: 'back',   accepts: 'soul', x: 96,  y: 110 },
      { id: 'striker_back_b',  slotType: 'back',   accepts: 'booster',    x: 118, y: 196 }
    ]
  },

  // ============================================================
  // ORACLE-04 — tech archetype (10 slots, special-heavy backpack)
  // ============================================================
  robot_oracle: {
    id: 'robot_oracle',
    name: 'ORACLE-04',
    archetype: 'tech',
    description: 'An ordinary boy. The machine on his back is anything but.',
    baseHp: 80,
    baseDamageReductionPct: 0,
    baseAttackSpeedMultiplier: 0.85,
    passiveText: 'Special effects +50% / weapon cooldown +15%.',
    blueprintAssetKey: 'blueprint_oracle',
    battleAssetKey: 'battle_oracle',
    buffSlots: 3,
    slots: [
      // Head (visor)
      { id: 'oracle_head',     slotType: 'head',   accepts: 'booster',    x: 100, y: 22  },
      // Chest
      { id: 'oracle_chest_a',  slotType: 'chest',  accepts: 'charger',  x: 84,  y: 62  },
      { id: 'oracle_chest_b',  slotType: 'chest',  accepts: 'implant',   x: 116, y: 62  },
      // Right arm (weapon)
      { id: 'oracle_arm_ra',   slotType: 'arm_r',  accepts: 'module',  x: 156, y: 62  },
      { id: 'oracle_arm_rb',   slotType: 'arm_r',  accepts: 'booster',    x: 156, y: 92  },
      // Left arm
      { id: 'oracle_arm_la',   slotType: 'arm_l',  accepts: 'module',  x: 44,  y: 92  },
      // Back (massive special array — UMA tentacles)
      { id: 'oracle_back_a',   slotType: 'back',   accepts: 'soul', x: 30,  y: 42  },
      { id: 'oracle_back_b',   slotType: 'back',   accepts: 'soul', x: 30,  y: 72  },
      { id: 'oracle_back_c',   slotType: 'back',   accepts: 'soul', x: 30,  y: 102 },
      { id: 'oracle_back_d',   slotType: 'back',   accepts: 'soul', x: 30,  y: 132 },
      { id: 'oracle_back_e',   slotType: 'back',   accepts: 'booster',    x: 30,  y: 162 },
      // Legs
      { id: 'oracle_leg_l',    slotType: 'legs_l', accepts: 'implant',   x: 84,  y: 148 },
      { id: 'oracle_leg_ra',   slotType: 'legs_r', accepts: 'implant',   x: 116, y: 148 },
      { id: 'oracle_leg_rb',   slotType: 'legs_r', accepts: 'booster',    x: 116, y: 178 }
    ]
  }
} as const satisfies RobotsRegistry;

export type RobotKey = keyof typeof ROBOTS;

export const ALL_ROBOT_KEYS: readonly RobotKey[] = Object.keys(ROBOTS) as readonly RobotKey[];
