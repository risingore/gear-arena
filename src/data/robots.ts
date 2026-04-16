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
    description: 'Standard mass-production frame. Symmetric loadout, easy to learn.',
    baseHp: 100,
    baseDamageReductionPct: 0,
    baseAttackSpeedMultiplier: 1.0,
    passiveText: 'No passive — straightforward power.',
    blueprintAssetKey: 'blueprint_knight',
    battleAssetKey: 'battle_knight',
    slots: [
      { id: 'knight_head',     slotType: 'head',   accepts: 'armor',  x: 96,  y: 32  },
      { id: 'knight_chest_a',  slotType: 'chest',  accepts: 'engine', x: 96,  y: 76  },
      { id: 'knight_chest_b',  slotType: 'chest',  accepts: 'armor',  x: 96,  y: 110 },
      { id: 'knight_arm_la',   slotType: 'arm_l',  accepts: 'weapon', x: 50,  y: 84  },
      { id: 'knight_arm_lb',   slotType: 'arm_l',  accepts: 'gear',   x: 36,  y: 116 },
      { id: 'knight_arm_ra',   slotType: 'arm_r',  accepts: 'weapon', x: 142, y: 84  },
      { id: 'knight_arm_rb',   slotType: 'arm_r',  accepts: 'gear',   x: 156, y: 116 },
      { id: 'knight_leg_l',    slotType: 'legs_l', accepts: 'armor',  x: 78,  y: 172 },
      { id: 'knight_leg_r',    slotType: 'legs_r', accepts: 'armor',  x: 114, y: 172 }
    ]
  },

  // ============================================================
  // GOLIATH-02 — heavy archetype (12 slots, armor + leg dominant)
  // ============================================================
  robot_goliath: {
    id: 'robot_goliath',
    name: 'GOLIATH-02',
    archetype: 'heavy',
    description: 'Heavy siege frame. Dense armor + leg slots, single mighty arm.',
    baseHp: 150,
    baseDamageReductionPct: 0.10,
    baseAttackSpeedMultiplier: 0.80,
    passiveText: 'Damage taken -10% / attack speed -20%.',
    blueprintAssetKey: 'blueprint_goliath',
    battleAssetKey: 'battle_goliath',
    slots: [
      { id: 'goliath_head',    slotType: 'head',   accepts: 'armor',  x: 96,  y: 30  },
      { id: 'goliath_chest_a', slotType: 'chest',  accepts: 'armor',  x: 80,  y: 70  },
      { id: 'goliath_chest_b', slotType: 'chest',  accepts: 'engine', x: 112, y: 70  },
      { id: 'goliath_chest_c', slotType: 'chest',  accepts: 'armor',  x: 96,  y: 104 },
      { id: 'goliath_arm_r',   slotType: 'arm_r',  accepts: 'weapon', x: 158, y: 96  },
      { id: 'goliath_back',    slotType: 'back',   accepts: 'engine', x: 36,  y: 96  },
      { id: 'goliath_leg_la',  slotType: 'legs_l', accepts: 'armor',  x: 70,  y: 148 },
      { id: 'goliath_leg_lb',  slotType: 'legs_l', accepts: 'gear',   x: 70,  y: 178 },
      { id: 'goliath_leg_lc',  slotType: 'legs_l', accepts: 'armor',  x: 70,  y: 208 },
      { id: 'goliath_leg_ra',  slotType: 'legs_r', accepts: 'armor',  x: 122, y: 148 },
      { id: 'goliath_leg_rb',  slotType: 'legs_r', accepts: 'gear',   x: 122, y: 178 },
      { id: 'goliath_leg_rc',  slotType: 'legs_r', accepts: 'armor',  x: 122, y: 208 }
    ]
  },

  // ============================================================
  // STRIKER-03 — speed archetype (7 slots, headless, dual weapons)
  // ============================================================
  robot_striker: {
    id: 'robot_striker',
    name: 'STRIKER-03',
    archetype: 'speed',
    description: 'Lean strike frame. Headless, dual-arm twin weapons, gear leg.',
    baseHp: 70,
    baseDamageReductionPct: -0.10,
    baseAttackSpeedMultiplier: 1.30,
    passiveText: 'Attack speed +30% / damage taken +10%. 10% evasion.',
    baseEvasion: 0.1,
    blueprintAssetKey: 'blueprint_striker',
    battleAssetKey: 'battle_striker',
    slots: [
      { id: 'striker_chest',   slotType: 'chest',  accepts: 'engine', x: 96,  y: 64  },
      { id: 'striker_arm_la',  slotType: 'arm_l',  accepts: 'weapon', x: 50,  y: 76  },
      { id: 'striker_arm_lb',  slotType: 'arm_l',  accepts: 'gear',   x: 38,  y: 110 },
      { id: 'striker_arm_ra',  slotType: 'arm_r',  accepts: 'weapon', x: 142, y: 76  },
      { id: 'striker_arm_rb',  slotType: 'arm_r',  accepts: 'gear',   x: 154, y: 110 },
      { id: 'striker_leg',     slotType: 'legs_l', accepts: 'gear',   x: 96,  y: 168 },
      { id: 'striker_back',    slotType: 'back',   accepts: 'special', x: 96, y: 30  }
    ]
  },

  // ============================================================
  // ORACLE-04 — tech archetype (10 slots, special-heavy backpack)
  // ============================================================
  robot_oracle: {
    id: 'robot_oracle',
    name: 'ORACLE-04',
    archetype: 'tech',
    description: 'Synergy-driven tech frame. Four back specials power the build.',
    baseHp: 80,
    baseDamageReductionPct: 0,
    baseAttackSpeedMultiplier: 0.85,
    passiveText: 'Special effects +50% / weapon cooldown +15%.',
    blueprintAssetKey: 'blueprint_oracle',
    battleAssetKey: 'battle_oracle',
    slots: [
      { id: 'oracle_head',     slotType: 'head',   accepts: 'armor',   x: 100, y: 32  },
      { id: 'oracle_chest',    slotType: 'chest',  accepts: 'engine',  x: 100, y: 86  },
      { id: 'oracle_arm_r',    slotType: 'arm_r',  accepts: 'weapon',  x: 152, y: 88  },
      { id: 'oracle_back_a',   slotType: 'back',   accepts: 'special', x: 36,  y: 56  },
      { id: 'oracle_back_b',   slotType: 'back',   accepts: 'special', x: 36,  y: 86  },
      { id: 'oracle_back_c',   slotType: 'back',   accepts: 'special', x: 36,  y: 116 },
      { id: 'oracle_back_d',   slotType: 'back',   accepts: 'special', x: 36,  y: 146 },
      { id: 'oracle_leg_l',    slotType: 'legs_l', accepts: 'armor',   x: 84,  y: 176 },
      { id: 'oracle_leg_ra',   slotType: 'legs_r', accepts: 'armor',   x: 116, y: 176 },
      { id: 'oracle_leg_rb',   slotType: 'legs_r', accepts: 'gear',    x: 116, y: 204 }
    ]
  }
} as const satisfies RobotsRegistry;

export type RobotKey = keyof typeof ROBOTS;

export const ALL_ROBOT_KEYS: readonly RobotKey[] = Object.keys(ROBOTS) as readonly RobotKey[];
