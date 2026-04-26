/**
 * SOUL STRIKE — canonical robot data (v0.2, 2026-04-15).
 *
 * Tunable: base stats, slot layouts, names, passive text. Slot x / y
 * coordinates live in a virtual 192x220 space and are projected onto the
 * Build scene's blueprint panel at runtime.
 *
 * v0.2: slot counts expanded ~1.5x per blueprint so the Build phase has
 * enough room for meaningful loadout decisions.
 */

import type { RobotsRegistry } from './schema';

export const ROBOTS = {
  // ============================================================
  // INDRA — balanced archetype (9 slots, RIGHT ARM ONLY)
  // Massive right arm gauntlet is the sole prosthetic.
  // ============================================================
  robot_knight: {
    id: 'robot_knight',
    name: 'INDRA',
    archetype: 'balanced',
    description: 'Right-arm gauntlet frame. Balanced Machine, piloted by a former soldier.',
    baseHp: 120,
    baseDamageReductionPct: 0.05,
    baseAttackSpeedMultiplier: 1.0,
    passiveText: '+5% damage reduction baseline. Strike to live.',
    blueprintAssetKey: 'blueprint_indra',
    battleAssetKey: 'battle_indra',
    buffSlots: 3,
    slots: [
      // Right arm gauntlet — shoulder to fist (top to bottom, 32-unit vertical spacing)
      { id: 'knight_shoulder',    slotType: 'arm_r', accepts: 'charger',  x: 96,  y: 24  },
      { id: 'knight_upper_arm',   slotType: 'arm_r', accepts: 'implant',  x: 96,  y: 56  },
      { id: 'knight_elbow',       slotType: 'arm_r', accepts: 'booster',  x: 96,  y: 88  },
      { id: 'knight_forearm_in',  slotType: 'arm_r', accepts: 'module',   x: 74,  y: 120 },
      { id: 'knight_forearm_out', slotType: 'arm_r', accepts: 'module',   x: 118, y: 120 },
      { id: 'knight_wrist',       slotType: 'arm_r', accepts: 'booster',  x: 96,  y: 152 },
      { id: 'knight_knuckle_a',   slotType: 'arm_r', accepts: 'module',   x: 74,  y: 184 },
      { id: 'knight_knuckle_b',   slotType: 'arm_r', accepts: 'module',   x: 118, y: 184 },
      { id: 'knight_palm_core',   slotType: 'arm_r', accepts: 'soul',     x: 96,  y: 216 }
    ]
  },

  // ============================================================
  // GOLIATH-414 — heavy archetype (15 slots, full body exoframe)
  // Entire exoframe is the prosthetic.
  // ============================================================
  robot_goliath: {
    id: 'robot_goliath',
    name: 'GOLIATH-414',
    archetype: 'heavy',
    description: 'Massive full-body frame. The pilot is a child curled inside its hollow chest.',
    baseHp: 150,
    baseDamageReductionPct: 0.10,
    baseAttackSpeedMultiplier: 0.80,
    passiveText: 'Damage taken -10% / attack speed -20%.',
    blueprintAssetKey: 'blueprint_goliath',
    battleAssetKey: 'battle_goliath',
    buffSlots: 3,
    slots: [
      // Head
      { id: 'goliath_head',    slotType: 'head',   accepts: 'implant',  x: 96,  y: 24  },
      // Chest (massive — lots of armor + engine)
      { id: 'goliath_chest_a', slotType: 'chest',  accepts: 'implant',  x: 62,  y: 56  },
      { id: 'goliath_chest_b', slotType: 'chest',  accepts: 'charger',  x: 96,  y: 56  },
      { id: 'goliath_chest_c', slotType: 'chest',  accepts: 'implant',  x: 130, y: 56  },
      { id: 'goliath_chest_d', slotType: 'chest',  accepts: 'charger',  x: 96,  y: 88  },
      { id: 'goliath_chest_e', slotType: 'chest',  accepts: 'implant',  x: 96,  y: 120 },
      // Arms (one weapon each)
      { id: 'goliath_arm_ra',  slotType: 'arm_r',  accepts: 'module',   x: 164, y: 68  },
      { id: 'goliath_arm_rb',  slotType: 'arm_r',  accepts: 'implant',  x: 164, y: 100 },
      { id: 'goliath_arm_la',  slotType: 'arm_l',  accepts: 'module',   x: 28,  y: 68  },
      { id: 'goliath_arm_lb',  slotType: 'arm_l',  accepts: 'implant',  x: 28,  y: 100 },
      // Legs (heavy plating)
      { id: 'goliath_leg_la',  slotType: 'legs_l', accepts: 'implant',  x: 66,  y: 152 },
      { id: 'goliath_leg_lb',  slotType: 'legs_l', accepts: 'booster',  x: 66,  y: 184 },
      { id: 'goliath_leg_ra',  slotType: 'legs_r', accepts: 'implant',  x: 126, y: 152 },
      { id: 'goliath_leg_rb',  slotType: 'legs_r', accepts: 'booster',  x: 126, y: 184 },
      // Back (engine room)
      { id: 'goliath_back',    slotType: 'back',   accepts: 'soul',     x: 28,  y: 152 }
    ]
  },

  // ============================================================
  // LILITH — speed archetype (7 slots, LEFT LEG ONLY)
  // Mechanical kick leg is the sole prosthetic.
  // ============================================================
  robot_striker: {
    id: 'robot_striker',
    name: 'LILITH',
    archetype: 'speed',
    description: 'Left-leg kick frame, scavenger-built. Speed Machine, piloted by an off-grid runner.',
    baseHp: 70,
    baseDamageReductionPct: -0.10,
    baseAttackSpeedMultiplier: 1.30,
    passiveText: 'Attack speed +30% / damage taken +10%. 10% evasion.',
    baseEvasion: 0.1,
    blueprintAssetKey: 'blueprint_striker',
    battleAssetKey: 'battle_striker',
    buffSlots: 2,
    slots: [
      // Left leg — hip to toe (top to bottom)
      { id: 'striker_hip',          slotType: 'legs_l', accepts: 'charger', x: 96,  y: 24  },
      { id: 'striker_upper_thigh',  slotType: 'legs_l', accepts: 'implant', x: 96,  y: 56  },
      { id: 'striker_knee',         slotType: 'legs_l', accepts: 'booster', x: 96,  y: 88  },
      { id: 'striker_shin_blade',   slotType: 'legs_l', accepts: 'module',  x: 96,  y: 120 },
      { id: 'striker_ankle',        slotType: 'legs_l', accepts: 'module',  x: 96,  y: 152 },
      { id: 'striker_toe_edge',     slotType: 'legs_l', accepts: 'module',  x: 96,  y: 184 },
      { id: 'striker_calf_jet',     slotType: 'legs_l', accepts: 'booster', x: 96,  y: 216 }
    ]
  },

  // ============================================================
  // MUMEI — tech archetype (11 slots, FULL BODY soul manifestation)
  // Soul tendrils attach across the boy's body.
  // ============================================================
  robot_oracle: {
    id: 'robot_oracle',
    name: 'MUMEI',
    archetype: 'tech',
    description: 'The boy is ordinary. The Machine on his back is anything but.',
    baseHp: 80,
    baseDamageReductionPct: 0,
    baseAttackSpeedMultiplier: 0.85,
    passiveText: 'Special effects +50% / weapon cooldown +15%.',
    blueprintAssetKey: 'blueprint_oracle',
    battleAssetKey: 'battle_oracle',
    buffSlots: 3,
    slots: [
      // Soul tendrils across the body (top to bottom, spread out)
      { id: 'oracle_crown',       slotType: 'head',   accepts: 'soul',     x: 96,  y: 24  },
      { id: 'oracle_left_eye',    slotType: 'head',   accepts: 'soul',     x: 72,  y: 56  },
      { id: 'oracle_right_eye',   slotType: 'head',   accepts: 'soul',     x: 120, y: 56  },
      { id: 'oracle_heart',       slotType: 'chest',  accepts: 'soul',     x: 96,  y: 88  },
      { id: 'oracle_spine',       slotType: 'back',   accepts: 'implant',  x: 96,  y: 120 },
      { id: 'oracle_left_hand',   slotType: 'arm_l',  accepts: 'soul',     x: 48,  y: 104 },
      { id: 'oracle_right_hand',  slotType: 'arm_r',  accepts: 'module',   x: 144, y: 104 },
      { id: 'oracle_core',        slotType: 'chest',  accepts: 'charger',  x: 96,  y: 152 },
      { id: 'oracle_left_knee',   slotType: 'legs_l', accepts: 'booster',  x: 72,  y: 184 },
      { id: 'oracle_right_knee',  slotType: 'legs_r', accepts: 'booster',  x: 120, y: 184 },
      { id: 'oracle_root',        slotType: 'back',   accepts: 'soul',     x: 96,  y: 216 }
    ]
  }
} as const satisfies RobotsRegistry;

export type RobotKey = keyof typeof ROBOTS;

export const ALL_ROBOT_KEYS: readonly RobotKey[] = Object.keys(ROBOTS) as readonly RobotKey[];
