/**
 * SOUL STRIKE — ultimate abilities (v0.1, 2026-04-16).
 *
 * Each robot and boss has a unique ultimate that fires automatically
 * when the gauge fills. Gauge fills by taking damage.
 * One use per battle.
 */

export type UltimateEffect =
  | { readonly kind: 'multi_strike'; readonly damageMultiplier: number }
  | { readonly kind: 'fortress'; readonly healPct: number; readonly drBoost: number; readonly durationSec: number }
  | { readonly kind: 'speed_burst'; readonly speedMultiplier: number; readonly durationSec: number }
  | { readonly kind: 'system_hack'; readonly damage: number; readonly disableSec: number };

export interface UltimateDef {
  readonly id: string;
  readonly name: string;
  /** Damage required to fill gauge (as fraction of maxHp). */
  readonly gaugeFillRatio: number;
  readonly effect: UltimateEffect;
  /** Tier 2 (awakened) name — shown when all part slots are filled. */
  readonly awakenedName?: string;
  /** Tier 2 bonus effect kind. */
  readonly awakenedBonus?: 'armor_break' | 'heal' | 'extra_strikes' | 'disable_weapons';
  /** Tier 2 bonus magnitude (heal %, extra strike count, disable seconds). */
  readonly awakenedMagnitude?: number;
}

/** Machine ultimates keyed by machine ID. */
export const ROBOT_ULTIMATES: Record<string, UltimateDef> = {
  robot_knight: {
    id: 'ult_iron_fist',
    name: 'Iron Fist',
    gaugeFillRatio: 0.4,
    effect: { kind: 'multi_strike', damageMultiplier: 2 },
    awakenedName: 'Vajra Strike',
    awakenedBonus: 'armor_break',
    awakenedMagnitude: 1
  },
  robot_goliath: {
    id: 'ult_bulldoze',
    name: 'Bulldoze',
    gaugeFillRatio: 0.35,
    effect: { kind: 'multi_strike', damageMultiplier: 3 },
    awakenedName: 'Compassion Engine',
    awakenedBonus: 'heal',
    awakenedMagnitude: 0.3
  },
  robot_striker: {
    id: 'ult_thunder_kick',
    name: 'Thunder Kick',
    gaugeFillRatio: 0.45,
    effect: { kind: 'multi_strike', damageMultiplier: 2 },
    awakenedName: 'Rakshasa Dance',
    awakenedBonus: 'extra_strikes',
    awakenedMagnitude: 3
  },
  robot_oracle: {
    id: 'ult_void_echo',
    name: 'Void Echo',
    gaugeFillRatio: 0.4,
    effect: { kind: 'system_hack', damage: 40, disableSec: 2 },
    awakenedName: 'Nirvana',
    awakenedBonus: 'disable_weapons',
    awakenedMagnitude: 3
  }
};

/** Enemy ultimates by enemy category.
 *
 * Tuning intent (Hard mode, INDRA fully equipped, ~25-40s boss fight):
 *   - midBoss fires ~1 ULT per fight: high gaugeFillRatio + low chargeRate.
 *     Roughly: needs ~70% maxHp damage equivalent or ~17s of time before firing.
 *   - bigBoss fires 3-5 ULTs per fight: low gaugeFillRatio + boosted chargeRate
 *     (set on the combatant in Battle.ts when wiring big-boss).
 *     Roughly: ULT every ~7-10s.
 *
 * The gauge fills both from time (BALANCE.ultimateGaugeFillPerSec) and from
 * damage taken (combat.ts dealDamage). Lowering gaugeFillRatio makes the
 * ULT cycle shorter; raising ultimateChargeRate accelerates both sources.
 */
export const ENEMY_ULTIMATES: Record<string, UltimateDef> = {
  // --- Category-level fallbacks (used when a boss has no individual ULT) ---
  midBoss: {
    id: 'ult_boss_rage',
    name: 'Boss Rage',
    gaugeFillRatio: 0.7,
    effect: { kind: 'multi_strike', damageMultiplier: 2.5 }
  },
  bigBoss: {
    id: 'ult_titan_strike',
    name: 'Titan Strike',
    gaugeFillRatio: 0.22,
    effect: { kind: 'multi_strike', damageMultiplier: 2.2 }
  },
  super: {
    id: 'ult_extinction',
    name: 'Extinction Protocol',
    gaugeFillRatio: 0.3,
    effect: { kind: 'system_hack', damage: 80, disableSec: 3 }
  },

  // --- Episode 0 mid-boss individual ULTs ---
  midboss_bakeneko: {
    id: 'ult_phantom_stride',
    name: 'Phantom Stride',
    gaugeFillRatio: 0.7,
    effect: { kind: 'multi_strike', damageMultiplier: 2.5 }
  },
  midboss_nopperabo: {
    id: 'ult_mirror_veil',
    name: 'Mirror Veil',
    gaugeFillRatio: 0.65,
    effect: { kind: 'fortress', healPct: 0.15, drBoost: 0.4, durationSec: 4 }
  },
  midboss_karakasa: {
    id: 'ult_twirl_breaker',
    name: 'Twirl Breaker',
    gaugeFillRatio: 0.7,
    effect: { kind: 'multi_strike', damageMultiplier: 2.0 }
  },

  // --- Episode 1 reserve mid-boss ULTs ---
  midboss_iron_sentinel: {
    id: 'ult_crimson_cleave',
    name: 'Crimson Cleave',
    gaugeFillRatio: 0.75,
    effect: { kind: 'multi_strike', damageMultiplier: 2.7 }
  },
  midboss_volt_charger: {
    id: 'ult_thundercrash',
    name: 'Thundercrash',
    gaugeFillRatio: 0.6,
    effect: { kind: 'multi_strike', damageMultiplier: 2.3 }
  },
  midboss_shield_golem: {
    id: 'ult_calcified_tide',
    name: 'Calcified Tide',
    gaugeFillRatio: 0.7,
    effect: { kind: 'fortress', healPct: 0.2, drBoost: 0.5, durationSec: 5 }
  },
  midboss_flame_mantis: {
    id: 'ult_silken_web',
    name: 'Silken Web',
    gaugeFillRatio: 0.65,
    effect: { kind: 'multi_strike', damageMultiplier: 2.5 }
  },
  midboss_frost_walker: {
    id: 'ult_frost_lance',
    name: 'Frost Lance',
    gaugeFillRatio: 0.7,
    effect: { kind: 'multi_strike', damageMultiplier: 2.5 }
  },

  // --- Episode 0 big-boss (Hard final) individual ULT ---
  // Successor of the prior generic "Whiteout" — same identity, named explicitly.
  boss_yuki_onna: {
    id: 'ult_glacial_lullaby',
    name: 'Glacial Lullaby',
    gaugeFillRatio: 0.22,
    effect: { kind: 'multi_strike', damageMultiplier: 5.5 }
  },

  // --- Episode 1 reserve big-boss ULTs ---
  boss_leviathan: {
    id: 'ult_crimson_banquet',
    name: 'Crimson Banquet',
    gaugeFillRatio: 0.22,
    effect: { kind: 'multi_strike', damageMultiplier: 2.4 }
  },
  boss_colossus: {
    id: 'ult_nine_tail_pyre',
    name: 'Nine-Tail Pyre',
    gaugeFillRatio: 0.22,
    effect: { kind: 'multi_strike', damageMultiplier: 2.6 }
  },
  boss_storm_kaiser: {
    id: 'ult_chimera_howl',
    name: 'Chimera Howl',
    gaugeFillRatio: 0.22,
    effect: { kind: 'multi_strike', damageMultiplier: 2.8 }
  }
};
